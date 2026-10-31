import type { PoolClient } from 'pg';
import { getPool, query, queryOne, tx } from './pool';
import { mergeSettings } from './defaults';
import { newId, newOrderNumber, newTicketNumber } from '@/lib/ids';
import { pruneIfDue } from '@/lib/maintenance';
import type {
  ActivityEntry,
  AdminUser,
  Announcement,
  Banner,
  Category,
  Coupon,
  Currency,
  DeliveryChannel,
  FAQ,
  HomepageSection,
  InventoryItem,
  LegalPage,
  MediaAsset,
  NavigationItem,
  Order,
  OrderItem,
  OrderTimelineEvent,
  PaymentMethod,
  PaymentProof,
  Product,
  ProductVariant,
  Review,
  SiteSettings,
  SupportTicket,
  TicketMessage,
  Testimonial,
  User,
} from './types';

export { getPool, query, queryOne, tx } from './pool';

/* ------------------------------------------------------------------ */
/* Row helpers                                                         */
/* ------------------------------------------------------------------ */

type Row = Record<string, any>;

function num(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}
function optNum(v: unknown): number | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
function opt<T>(v: T | null | undefined): T | undefined {
  return v === null || v === undefined ? undefined : v;
}
function iso(v: unknown): string {
  if (!v) return '';
  if (v instanceof Date) return v.toISOString();
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? String(v) : d.toISOString();
}
function optIso(v: unknown): string | undefined {
  return v ? iso(v) : undefined;
}
function arr<T = string>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}
function json(v: unknown): string {
  return JSON.stringify(v ?? null);
}
function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Builds `UPDATE table SET ... WHERE id = $n RETURNING *` from a camelCase
 * partial. Only keys listed in `columns` are written; JSON columns are
 * serialised. Returns null when nothing was updatable.
 */
async function updateRow(
  table: string,
  id: string,
  updates: Record<string, unknown>,
  columns: Record<string, string>,
  opts: { jsonCols?: string[]; touch?: boolean; client?: PoolClient } = {},
): Promise<Row | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [key, col] of Object.entries(columns)) {
    if (!(key in updates)) continue;
    const raw = updates[key];
    const blankToNull = raw === '' && /(_id|_date|_at)$/.test(col);
    const value = opts.jsonCols?.includes(col) ? json(raw ?? []) : raw === undefined || blankToNull ? null : raw;
    values.push(value);
    sets.push(`${col} = $${values.length}${opts.jsonCols?.includes(col) ? '::jsonb' : ''}`);
  }
  if (opts.touch !== false) sets.push('updated_at = now()');
  if (sets.length === 0 || (opts.touch !== false && sets.length === 1)) {
    const existing = await (opts.client ?? getPool()).query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
    return existing.rows[0] ?? null;
  }
  values.push(id);
  const res = await (opts.client ?? getPool()).query(
    `UPDATE ${table} SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values,
  );
  return res.rows[0] ?? null;
}

/* ------------------------------------------------------------------ */
/* Mappers                                                             */
/* ------------------------------------------------------------------ */

export function mapUser(r: Row): User {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    role: 'CUSTOMER',
    emailVerified: Boolean(r.email_verified_at),
    emailVerifiedAt: optIso(r.email_verified_at),
    phone: opt(r.phone),
    whatsapp: opt(r.whatsapp),
    telegram: opt(r.telegram_username),
    telegramLinked: r.telegram_linked === undefined ? undefined : Boolean(r.telegram_linked),
    avatar: opt(r.avatar),
    status: r.status,
    suspendedReason: opt(r.suspended_reason),
    twoFactorEnabled: Boolean(r.totp_enabled),
    lastLoginAt: optIso(r.last_login_at),
    lastSeenAt: optIso(r.last_seen_at),
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

export function mapAdmin(r: Row): AdminUser {
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    status: r.status,
    twoFactorEnabled: Boolean(r.totp_enabled),
    telegramLinked: r.telegram_linked === undefined ? undefined : Boolean(r.telegram_linked),
    lastLoginAt: optIso(r.last_login_at),
    createdBy: opt(r.created_by),
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

function mapCategory(r: Row): Category {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: opt(r.description),
    image: opt(r.image),
    icon: opt(r.icon),
    banner: opt(r.banner),
    parentId: r.parent_id ?? null,
    status: r.status,
    displayOrder: num(r.display_order),
    featured: Boolean(r.featured),
    seoTitle: opt(r.seo_title),
    seoDescription: opt(r.seo_description),
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

function mapVariant(r: Row): ProductVariant {
  const mode = (r.stock_mode || 'preorder') as ProductVariant['stockMode'];
  const stock = mode === 'vault' ? num(r.vault_available) : mode === 'manual' ? num(r.stock) : 0;
  return {
    id: r.id,
    productId: r.product_id,
    name: r.name,
    price: num(r.price),
    compareAtPrice: optNum(r.compare_at_price),
    sku: r.sku || '',
    stock,
    stockMode: mode,
    description: opt(r.description),
    features: arr(r.features),
    deliveryMethod: opt(r.delivery_method),
    deliveryTime: opt(r.delivery_time),
    status: r.status,
    expiryDays: optNum(r.expiry_days),
    usdPricingMode: r.usd_pricing_mode || 'auto',
    usdPrice: optNum(r.usd_price),
    usdMarkupPercent: optNum(r.usd_markup_percent),
    usdMarkupAmount: optNum(r.usd_markup_amount),
    displayOrder: num(r.display_order),
  };
}

function mapProduct(r: Row): Product {
  return {
    id: r.id,
    name: r.name,
    brand: opt(r.brand),
    slug: r.slug,
    sku: r.sku || '',
    shortDescription: r.short_description || '',
    longDescription: r.long_description || '',
    images: arr(r.images),
    logo: opt(r.logo),
    categoryId: r.category_id || '',
    tags: arr(r.tags),
    price: num(r.price),
    compareAtPrice: optNum(r.compare_at_price),
    discount: num(r.discount),
    status: r.status,
    featured: Boolean(r.featured),
    bestseller: Boolean(r.bestseller),
    isNew: Boolean(r.is_new),
    trending: Boolean(r.trending),
    badge: opt(r.badge),
    deliveryTime: r.delivery_time || '',
    deliveryMethod: r.delivery_method || '',
    productType: r.product_type || '',
    inventoryModel: r.inventory_model || 'manual',
    features: arr(r.features),
    requirements: arr(r.requirements),
    usageInstructions: r.usage_instructions || '',
    refundInfo: r.refund_info || '',
    seoTitle: opt(r.seo_title),
    seoDescription: opt(r.seo_description),
    relatedProductIds: arr(r.related_product_ids),
    displayOrder: num(r.display_order),
    variants: arr<Row>(r.variants).map(mapVariant),
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

function mapInventory(r: Row): InventoryItem {
  return {
    id: r.id,
    productId: r.product_id,
    variantId: opt(r.variant_id),
    type: r.type,
    data: r.data || {},
    status: r.status,
    orderId: opt(r.order_id),
    orderItemId: opt(r.order_item_id),
    soldAt: optIso(r.sold_at),
    expiresAt: optIso(r.expires_at),
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

function mapOrderItem(r: Row): OrderItem {
  return {
    id: r.id,
    orderId: r.order_id,
    productId: r.product_id,
    productName: r.product_name,
    productImage: opt(r.product_image),
    variantId: r.variant_id,
    variantName: r.variant_name,
    price: num(r.price),
    quantity: num(r.quantity) || 1,
    expiryDays: optNum(r.expiry_days),
    fulfillmentData: r.fulfillment_data || undefined,
    deliveredAt: optIso(r.delivered_at),
  };
}

export function mapProof(r: Row): PaymentProof {
  return {
    id: r.id,
    orderId: r.order_id,
    methodKey: r.method_key,
    transactionId: r.transaction_id,
    senderName: opt(r.sender_name),
    senderAccount: opt(r.sender_account),
    amount: optNum(r.amount),
    imagePublicId: opt(r.image_public_id),
    imageFormat: opt(r.image_format),
    images: (() => {
      const list = arr<{ publicId: string; format: string }>(r.images);
      return list.length ? list : r.image_public_id ? [{ publicId: r.image_public_id, format: r.image_format || 'jpg' }] : [];
    })(),
    paymentDate: opt(r.payment_date),
    status: r.status,
    rejectReason: opt(r.reject_reason),
    reviewedBy: opt(r.reviewed_by),
    reviewedAt: optIso(r.reviewed_at),
    createdAt: iso(r.created_at),
  };
}

export function mapOrder(r: Row): Order {
  return {
    id: r.id,
    orderNumber: r.order_number,
    customerId: opt(r.customer_id),
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    customerPhone: opt(r.customer_phone),
    customerWhatsapp: opt(r.customer_whatsapp),
    customerTelegram: opt(r.customer_telegram),
    currency: (r.currency || 'PKR') as Currency,
    fxRate: optNum(r.fx_rate),
    items: arr<Row>(r.items).map(mapOrderItem),
    subtotal: num(r.subtotal),
    discount: num(r.discount),
    couponCode: opt(r.coupon_code),
    tax: num(r.tax),
    total: num(r.total),
    totalPkr: num(r.total_pkr),
    paymentMethod: r.payment_method || '',
    paymentMethodName: opt(r.payment_method_name),
    paymentStatus: r.payment_status,
    fulfillmentStatus: r.fulfillment_status,
    orderStatus: r.order_status,
    statusReason: opt(r.status_reason),
    deliveryChannels: arr<DeliveryChannel>(r.delivery_channels),
    customerNote: opt(r.customer_note),
    adminNote: opt(r.admin_note),
    paymentProofs: r.proofs === undefined ? undefined : arr<Row>(r.proofs).map(mapProof),
    timeline: arr<OrderTimelineEvent>(r.timeline),
    ip: opt(r.ip),
    userAgent: opt(r.user_agent),
    approvedAt: optIso(r.approved_at),
    approvedBy: opt(r.approved_by),
    rejectedAt: optIso(r.rejected_at),
    deliveredAt: optIso(r.delivered_at),
    deliveredBy: opt(r.delivered_by),
    cancelledAt: optIso(r.cancelled_at),
    refundedAt: optIso(r.refunded_at),
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

function mapCoupon(r: Row): Coupon {
  return {
    id: r.id,
    code: r.code,
    description: opt(r.description),
    type: r.type,
    value: num(r.value),
    minOrderAmount: optNum(r.min_order_amount),
    maxDiscount: optNum(r.max_discount),
    usageLimit: optNum(r.usage_limit),
    usageCount: num(r.usage_count),
    perUserLimit: optNum(r.per_user_limit),
    startDate: optIso(r.start_date),
    expiryDate: optIso(r.expiry_date),
    enabled: Boolean(r.enabled),
    productIds: arr(r.product_ids),
    categoryIds: arr(r.category_ids),
    createdAt: iso(r.created_at),
  };
}

function mapTicketMessage(r: Row): TicketMessage {
  return {
    id: r.id,
    senderId: r.sender_id,
    senderName: r.sender_name,
    senderRole: r.sender_role,
    message: r.message,
    attachments: arr(r.attachments),
    isInternalNote: Boolean(r.is_internal_note),
    timestamp: iso(r.created_at),
  };
}

function mapTicket(r: Row): SupportTicket {
  return {
    id: r.id,
    ticketNumber: r.ticket_number,
    customerId: opt(r.customer_id),
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    subject: r.subject,
    orderId: opt(r.order_id),
    productId: opt(r.product_id),
    category: r.category,
    status: r.status,
    priority: r.priority,
    messages: arr<Row>(r.messages).map(mapTicketMessage),
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

function mapReview(r: Row): Review {
  return {
    id: r.id,
    productId: r.product_id,
    customerId: opt(r.customer_id),
    orderId: opt(r.order_id),
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    rating: num(r.rating),
    title: r.title || '',
    comment: r.comment,
    verifiedPurchase: Boolean(r.verified_purchase),
    status: r.status,
    isFeatured: Boolean(r.is_featured),
    createdAt: iso(r.created_at),
  };
}

function mapAnnouncement(r: Row): Announcement {
  return {
    id: r.id,
    text: r.text,
    link: opt(r.link),
    ctaText: opt(r.cta_text),
    startDate: optIso(r.start_date),
    endDate: optIso(r.end_date),
    priority: num(r.priority),
    enabled: Boolean(r.enabled),
    createdAt: iso(r.created_at),
  };
}

function mapBanner(r: Row): Banner {
  return {
    id: r.id,
    title: r.title,
    subtitle: opt(r.subtitle),
    image: r.image,
    mobileImage: opt(r.mobile_image),
    ctaText: opt(r.cta_text),
    url: opt(r.url),
    startDate: optIso(r.start_date),
    endDate: optIso(r.end_date),
    priority: num(r.priority),
    position: r.position,
    status: r.status,
    createdAt: iso(r.created_at),
  };
}

function mapFaq(r: Row): FAQ {
  return {
    id: r.id,
    question: r.question,
    answer: r.answer,
    category: r.category,
    displayOrder: num(r.display_order),
    status: r.status,
    productId: opt(r.product_id),
    categoryId: opt(r.category_id),
    createdAt: iso(r.created_at),
  };
}

function mapTestimonial(r: Row): Testimonial {
  return {
    id: r.id,
    name: r.name,
    roleOrCompany: opt(r.role_or_company),
    avatar: opt(r.avatar),
    rating: num(r.rating),
    content: r.content,
    featured: Boolean(r.featured),
    displayOrder: num(r.display_order),
    status: r.status,
    createdAt: iso(r.created_at),
  };
}

function mapNav(r: Row): NavigationItem {
  return {
    id: r.id,
    label: r.label,
    url: r.url,
    icon: opt(r.icon),
    parentId: r.parent_id ?? null,
    displayOrder: num(r.display_order),
    visible: Boolean(r.visible),
    targetBlank: Boolean(r.target_blank),
    position: r.position,
  };
}

function mapLegal(r: Row): LegalPage {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    content: r.content || '',
    draftContent: opt(r.draft_content),
    status: r.status,
    lastPublishedAt: iso(r.last_published_at),
    revisions: arr(r.revisions),
    updatedAt: iso(r.updated_at),
  };
}

function mapSection(r: Row): HomepageSection {
  return {
    id: r.id,
    type: r.type,
    name: r.name,
    enabled: Boolean(r.enabled),
    order: num(r.sort_order),
    settings: r.settings || {},
  };
}

export function mapPaymentMethod(r: Row): PaymentMethod {
  return {
    id: r.id,
    key: r.key,
    name: r.name,
    type: r.type,
    description: r.description || '',
    accountTitle: r.account_title || '',
    accountNumber: r.account_number || '',
    iban: r.iban || '',
    bankName: r.bank_name || '',
    branch: r.branch || '',
    instructions: r.instructions || '',
    logo: opt(r.logo),
    currencies: arr<Currency>(r.currencies),
    enabled: Boolean(r.enabled),
    displayOrder: num(r.display_order),
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

function mapMedia(r: Row): MediaAsset {
  return {
    id: r.id,
    publicId: r.public_id,
    url: r.url,
    name: r.name,
    tags: arr(r.tags),
    source: r.source,
    width: optNum(r.width),
    height: optNum(r.height),
    format: opt(r.format),
    createdAt: iso(r.created_at),
  };
}

export function mapActivity(r: Row): ActivityEntry {
  return {
    id: num(r.id),
    userId: opt(r.user_id),
    email: opt(r.email),
    actorType: r.actor_type,
    eventType: r.event_type,
    ipv4: opt(r.ipv4),
    ipv6: opt(r.ipv6),
    country: opt(r.country),
    countryCode: opt(r.country_code),
    region: opt(r.region),
    city: opt(r.city),
    flagEmoji: opt(r.flag_emoji),
    isp: opt(r.isp),
    org: opt(r.org),
    timezoneId: opt(r.timezone_id),
    isVpn: Boolean(r.is_vpn),
    isProxy: Boolean(r.is_proxy),
    isTor: Boolean(r.is_tor),
    isDatacenter: Boolean(r.is_datacenter),
    isMobile: Boolean(r.is_mobile),
    userAgent: opt(r.user_agent),
    device: opt(r.device),
    createdAt: iso(r.created_at),
  };
}

/* ------------------------------------------------------------------ */
/* SQL fragments                                                       */
/* ------------------------------------------------------------------ */

const USER_SELECT = `SELECT u.*, EXISTS (SELECT 1 FROM telegram_users t WHERE t.user_id = u.id) AS telegram_linked FROM users u`;

const PRODUCT_SELECT = `
  SELECT p.*, COALESCE((
    SELECT json_agg(v ORDER BY v.display_order, v.created_at)
      FROM (
        SELECT pv.*, (
          SELECT count(*) FROM inventory_items i WHERE i.variant_id = pv.id AND i.status = 'available'
        )::int AS vault_available
        FROM product_variants pv WHERE pv.product_id = p.id
      ) v
  ), '[]'::json) AS variants
  FROM products p`;

const ORDER_SELECT = `
  SELECT o.*,
    COALESCE((SELECT json_agg(oi ORDER BY oi.position) FROM order_items oi WHERE oi.order_id = o.id), '[]'::json) AS items,
    COALESCE((SELECT json_agg(pp ORDER BY pp.created_at DESC) FROM payment_proofs pp WHERE pp.order_id = o.id), '[]'::json) AS proofs
  FROM orders o`;

const TICKET_SELECT = `
  SELECT t.*, COALESCE((SELECT json_agg(m ORDER BY m.created_at) FROM ticket_messages m WHERE m.ticket_id = t.id), '[]'::json) AS messages
  FROM support_tickets t`;

/* ------------------------------------------------------------------ */
/* Inputs                                                              */
/* ------------------------------------------------------------------ */

export type VariantInput = Omit<ProductVariant, 'id' | 'productId' | 'stock' | 'stockMode' | 'usdPricingMode'> & {
  id?: string;
  productId?: string;
  stock?: number;
  stockMode?: ProductVariant['stockMode'];
  usdPricingMode?: ProductVariant['usdPricingMode'];
};

export type ProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'variants' | 'price' | 'discount'> & {
  id?: string;
  price?: number;
  discount?: number;
  variants: VariantInput[];
};

export interface CreateOrderInput {
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerWhatsapp?: string;
  customerTelegram?: string;
  currency: Currency;
  fxRate?: number;
  items: Array<Omit<OrderItem, 'id' | 'orderId'>>;
  subtotal: number;
  discount: number;
  couponCode?: string;
  tax: number;
  total: number;
  /** Internal reporting: total in PKR at the locked rate. */
  totalPkr: number;
  paymentMethod: string;
  paymentMethodName?: string;
  deliveryChannels?: DeliveryChannel[];
  customerNote?: string;
  ip?: string;
  userAgent?: string;
}

export interface OrderFilter {
  status?: Order['orderStatus'] | Order['orderStatus'][];
  customerId?: string;
  email?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

const PRODUCT_COLUMNS: Record<string, string> = {
  name: 'name',
  brand: 'brand',
  slug: 'slug',
  sku: 'sku',
  shortDescription: 'short_description',
  longDescription: 'long_description',
  images: 'images',
  logo: 'logo',
  categoryId: 'category_id',
  tags: 'tags',
  status: 'status',
  featured: 'featured',
  bestseller: 'bestseller',
  isNew: 'is_new',
  trending: 'trending',
  badge: 'badge',
  deliveryTime: 'delivery_time',
  deliveryMethod: 'delivery_method',
  productType: 'product_type',
  inventoryModel: 'inventory_model',
  features: 'features',
  requirements: 'requirements',
  usageInstructions: 'usage_instructions',
  refundInfo: 'refund_info',
  seoTitle: 'seo_title',
  seoDescription: 'seo_description',
  relatedProductIds: 'related_product_ids',
  displayOrder: 'display_order',
};
const PRODUCT_JSON = ['images', 'tags', 'features', 'requirements', 'related_product_ids'];

async function upsertVariants(client: PoolClient, productId: string, variants: VariantInput[], replace: boolean) {
  const keepIds: string[] = [];
  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    const id = v.id && !v.id.startsWith('new_') ? v.id : newId('var');
    keepIds.push(id);
    await client.query(
      `INSERT INTO product_variants (id, product_id, name, price, compare_at_price, sku, stock, stock_mode, description, features,
         delivery_method, delivery_time, status, expiry_days, usd_pricing_mode, usd_price, usd_markup_percent, usd_markup_amount, display_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, compare_at_price = EXCLUDED.compare_at_price,
         sku = EXCLUDED.sku, stock = EXCLUDED.stock, stock_mode = EXCLUDED.stock_mode, description = EXCLUDED.description,
         features = EXCLUDED.features, delivery_method = EXCLUDED.delivery_method, delivery_time = EXCLUDED.delivery_time,
         status = EXCLUDED.status, expiry_days = EXCLUDED.expiry_days, usd_pricing_mode = EXCLUDED.usd_pricing_mode,
         usd_price = EXCLUDED.usd_price, usd_markup_percent = EXCLUDED.usd_markup_percent, usd_markup_amount = EXCLUDED.usd_markup_amount,
         display_order = EXCLUDED.display_order, updated_at = now()
       WHERE product_variants.product_id = EXCLUDED.product_id`,
      [
        id,
        productId,
        v.name,
        num(v.price),
        v.compareAtPrice ?? null,
        v.sku || '',
        Math.max(0, Math.floor(num(v.stock))),
        v.stockMode || 'preorder',
        v.description ?? null,
        json(v.features || []),
        v.deliveryMethod ?? null,
        v.deliveryTime ?? null,
        v.status || 'active',
        v.expiryDays ?? null,
        v.usdPricingMode || 'auto',
        v.usdPrice ?? null,
        v.usdMarkupPercent ?? null,
        v.usdMarkupAmount ?? null,
        v.displayOrder ?? i,
      ],
    );
  }
  if (replace) {
    await client.query(`DELETE FROM product_variants WHERE product_id = $1 AND NOT (id = ANY($2::text[]))`, [productId, keepIds]);
  }
}

/** Starting price = cheapest active variant; discount from its compare-at price. */
async function refreshProductPrice(client: PoolClient, productId: string) {
  await client.query(
    `UPDATE products p SET
       price = COALESCE(v.price, p.price),
       compare_at_price = v.compare_at_price,
       discount = CASE WHEN v.compare_at_price > v.price AND v.compare_at_price > 0
                       THEN round(((v.compare_at_price - v.price) / v.compare_at_price) * 100)::int ELSE 0 END
     FROM (SELECT price, compare_at_price FROM product_variants WHERE product_id = $1 AND status = 'active'
           ORDER BY price ASC LIMIT 1) v
     WHERE p.id = $1`,
    [productId],
  );
}

/* ------------------------------------------------------------------ */
/* Settings cache                                                      */
/* ------------------------------------------------------------------ */

const SETTINGS_TTL_MS = 60 * 1000;
let settingsCache: { value: SiteSettings; at: number } | null = null;

/* ------------------------------------------------------------------ */
/* Database service API                                                */
/* ------------------------------------------------------------------ */

export const db = {
  /* ---------------- Customers ---------------- */
  getUsers: async (opts: { search?: string; limit?: number } = {}): Promise<User[]> => {
    const params: unknown[] = [];
    let where = '';
    if (opts.search) {
      params.push(`%${opts.search.toLowerCase()}%`);
      where = `WHERE lower(u.email) LIKE $1 OR lower(u.name) LIKE $1 OR u.phone LIKE $1 OR u.whatsapp LIKE $1`;
    }
    params.push(opts.limit ?? 500);
    const rows = await query(`${USER_SELECT} ${where} ORDER BY u.created_at DESC LIMIT $${params.length}`, params);
    return rows.map(mapUser);
  },

  getUserById: async (id: string): Promise<User | null> => {
    const r = await queryOne(`${USER_SELECT} WHERE u.id = $1`, [id]);
    return r ? mapUser(r) : null;
  },

  getUserByEmail: async (email: string): Promise<User | null> => {
    const r = await queryOne(`${USER_SELECT} WHERE lower(u.email) = lower($1)`, [email.trim()]);
    return r ? mapUser(r) : null;
  },

  /** Profile fields a customer (or admin) may change. Email/password/2FA go through lib/auth. */
  updateUser: async (
    id: string,
    updates: Partial<Pick<User, 'name' | 'phone' | 'whatsapp' | 'telegram' | 'avatar' | 'status' | 'suspendedReason'>>,
  ): Promise<User | null> => {
    const r = await updateRow('users', id, updates as Record<string, unknown>, {
      name: 'name',
      phone: 'phone',
      whatsapp: 'whatsapp',
      telegram: 'telegram_username',
      avatar: 'avatar',
      status: 'status',
      suspendedReason: 'suspended_reason',
    });
    if (!r) return null;
    if (updates.status === 'suspended') {
      await query(`DELETE FROM user_sessions WHERE user_id = $1`, [id]);
    }
    return db.getUserById(id);
  },

  deleteUser: async (id: string): Promise<boolean> => {
    const rows = await query(`DELETE FROM users WHERE id = $1 RETURNING id`, [id]);
    return rows.length > 0;
  },

  /** Everything the admin customer page shows: profile, latest session, recent activity, orders, stats. */
  getCustomerOverview: async (id: string) => {
    const user = await db.getUserById(id);
    if (!user) return null;
    const [activity, orders, stats, telegram] = await Promise.all([
      query(`SELECT * FROM activity_log WHERE user_id = $1 ORDER BY created_at DESC LIMIT 25`, [id]),
      db.getOrders({ customerId: id, limit: 50 }),
      queryOne<{ total: number; completed: number; spent_pkr: string }>(
        `SELECT count(*)::int AS total,
                count(*) FILTER (WHERE order_status = 'completed')::int AS completed,
                COALESCE(sum(total_pkr) FILTER (WHERE order_status = 'completed'), 0) AS spent_pkr
           FROM orders WHERE customer_id = $1`,
        [id],
      ),
      queryOne<{ chat_id: string; username: string | null; linked_at: string }>(
        `SELECT chat_id, username, linked_at FROM telegram_users WHERE user_id = $1 ORDER BY linked_at DESC LIMIT 1`,
        [id],
      ),
    ]);
    const entries = activity.map(mapActivity);
    return {
      user,
      lastActivity: entries[0] ?? null,
      activity: entries,
      orders,
      telegram: telegram ? { chatId: telegram.chat_id, username: telegram.username ?? undefined, linkedAt: iso(telegram.linked_at) } : null,
      stats: { totalOrders: stats?.total ?? 0, completedOrders: stats?.completed ?? 0, spentPkr: num(stats?.spent_pkr) },
    };
  },

  /* ---------------- Admins (writes live in lib/admin-auth) ---------------- */
  getAdmins: async (): Promise<AdminUser[]> => {
    const rows = await query(
      `SELECT a.*, EXISTS (SELECT 1 FROM telegram_admins t WHERE t.admin_id = a.id) AS telegram_linked
         FROM admin_users a ORDER BY a.created_at ASC`,
    );
    return rows.map(mapAdmin);
  },

  getAdminById: async (id: string): Promise<AdminUser | null> => {
    const r = await queryOne(
      `SELECT a.*, EXISTS (SELECT 1 FROM telegram_admins t WHERE t.admin_id = a.id) AS telegram_linked
         FROM admin_users a WHERE a.id = $1`,
      [id],
    );
    return r ? mapAdmin(r) : null;
  },

  /* ---------------- Products ---------------- */
  getProducts: async (activeOnly = false): Promise<Product[]> => {
    const rows = await query(
      `${PRODUCT_SELECT} ${activeOnly ? `WHERE p.status = 'active'` : ''} ORDER BY p.display_order ASC, p.created_at ASC`,
    );
    const products = rows.map(mapProduct);
    if (activeOnly) {
      for (const p of products) p.variants = p.variants.filter(v => v.status === 'active');
    }
    return products;
  },

  /** Products in the given id order (active variants only). */
  getProductsByIds: async (ids: string[]): Promise<Product[]> => {
    if (ids.length === 0) return [];
    const rows = await query(`${PRODUCT_SELECT} WHERE p.id = ANY($1::text[])`, [ids]);
    const byId = new Map(rows.map(r => [r.id as string, mapProduct(r)]));
    return ids
      .map(id => byId.get(id))
      .filter((p): p is Product => Boolean(p))
      .map(p => ({ ...p, variants: p.variants.filter(v => v.status === 'active') }));
  },

  getProductsByCategory: async (categoryId: string): Promise<Product[]> => {
    const rows = await query(
      `${PRODUCT_SELECT} WHERE p.status = 'active' AND p.category_id = $1 ORDER BY p.display_order ASC, p.created_at ASC`,
      [categoryId],
    );
    return rows.map(mapProduct).map(p => ({ ...p, variants: p.variants.filter(v => v.status === 'active') }));
  },

  getProductBySlug: async (slug: string): Promise<Product | null> => {
    const r = await queryOne(`${PRODUCT_SELECT} WHERE p.slug = $1`, [slug]);
    return r ? mapProduct(r) : null;
  },

  getProductById: async (id: string): Promise<Product | null> => {
    const r = await queryOne(`${PRODUCT_SELECT} WHERE p.id = $1`, [id]);
    return r ? mapProduct(r) : null;
  },

  createProduct: async (data: ProductInput): Promise<Product> => {
    const id = data.id || newId('prod');
    await tx(async client => {
      await client.query(
        `INSERT INTO products (id, name, slug, sku, short_description, long_description, images, logo, category_id, tags, status,
           featured, bestseller, is_new, trending, badge, delivery_time, delivery_method, product_type, inventory_model, features,
           requirements, usage_instructions, refund_info, seo_title, seo_description, related_product_ids, display_order, brand)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10::jsonb,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21::jsonb,$22::jsonb,$23,$24,$25,$26,$27::jsonb,$28,$29)`,
        [
          id,
          data.name,
          data.slug,
          data.sku || '',
          data.shortDescription || '',
          data.longDescription || '',
          json(data.images || []),
          data.logo ?? null,
          data.categoryId || null,
          json(data.tags || []),
          data.status || 'draft',
          Boolean(data.featured),
          Boolean(data.bestseller),
          Boolean(data.isNew),
          Boolean(data.trending),
          data.badge ?? null,
          data.deliveryTime || '',
          data.deliveryMethod || '',
          data.productType || 'Digital Subscription',
          data.inventoryModel || 'manual',
          json(data.features || []),
          json(data.requirements || []),
          data.usageInstructions || '',
          data.refundInfo || '',
          data.seoTitle ?? null,
          data.seoDescription ?? null,
          json(data.relatedProductIds || []),
          data.displayOrder ?? 0,
          data.brand?.trim() || null,
        ],
      );
      await upsertVariants(client, id, data.variants || [], false);
      await refreshProductPrice(client, id);
    });
    return (await db.getProductById(id))!;
  },

  /** Partial update. When `variants` is given it replaces the variant set (matched by id). */
  updateProduct: async (id: string, updates: Partial<ProductInput>): Promise<Product | null> => {
    const exists = await queryOne(`SELECT id FROM products WHERE id = $1`, [id]);
    if (!exists) return null;
    await tx(async client => {
      await updateRow('products', id, updates as Record<string, unknown>, PRODUCT_COLUMNS, { jsonCols: PRODUCT_JSON, client });
      if (Array.isArray(updates.variants)) await upsertVariants(client, id, updates.variants, true);
      await refreshProductPrice(client, id);
    });
    return db.getProductById(id);
  },

  deleteProduct: async (id: string): Promise<boolean> => {
    const rows = await query(`DELETE FROM products WHERE id = $1 RETURNING id`, [id]);
    return rows.length > 0;
  },

  /* ---------------- Categories ---------------- */
  getCategories: async (activeOnly = false): Promise<Category[]> => {
    const rows = await query(
      `SELECT * FROM categories ${activeOnly ? `WHERE status = 'active'` : ''} ORDER BY display_order ASC, name ASC`,
    );
    return rows.map(mapCategory);
  },

  getCategoryBySlug: async (slug: string): Promise<Category | null> => {
    const r = await queryOne(`SELECT * FROM categories WHERE slug = $1`, [slug]);
    return r ? mapCategory(r) : null;
  },

  getCategoryById: async (id: string): Promise<Category | null> => {
    const r = await queryOne(`SELECT * FROM categories WHERE id = $1`, [id]);
    return r ? mapCategory(r) : null;
  },

  createCategory: async (c: Omit<Category, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Category> => {
    const r = await queryOne(
      `INSERT INTO categories (id, name, slug, description, image, icon, banner, parent_id, status, display_order, featured, seo_title, seo_description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
        c.id || newId('cat'),
        c.name,
        c.slug,
        c.description ?? null,
        c.image ?? null,
        c.icon ?? null,
        c.banner ?? null,
        c.parentId || null,
        c.status || 'active',
        c.displayOrder ?? 0,
        Boolean(c.featured),
        c.seoTitle ?? null,
        c.seoDescription ?? null,
      ],
    );
    return mapCategory(r!);
  },

  updateCategory: async (id: string, updates: Partial<Category>): Promise<Category | null> => {
    const r = await updateRow('categories', id, updates as Record<string, unknown>, {
      name: 'name',
      slug: 'slug',
      description: 'description',
      image: 'image',
      icon: 'icon',
      banner: 'banner',
      parentId: 'parent_id',
      status: 'status',
      displayOrder: 'display_order',
      featured: 'featured',
      seoTitle: 'seo_title',
      seoDescription: 'seo_description',
    });
    return r ? mapCategory(r) : null;
  },

  deleteCategory: async (id: string): Promise<boolean> => {
    const rows = await query(`DELETE FROM categories WHERE id = $1 RETURNING id`, [id]);
    return rows.length > 0;
  },

  /* ---------------- Vault inventory ---------------- */
  getInventory: async (filter: { productId?: string; variantId?: string; status?: InventoryItem['status'] } = {}): Promise<InventoryItem[]> => {
    const where: string[] = [];
    const params: unknown[] = [];
    if (filter.productId) {
      params.push(filter.productId);
      where.push(`product_id = $${params.length}`);
    }
    if (filter.variantId) {
      params.push(filter.variantId);
      where.push(`variant_id = $${params.length}`);
    }
    if (filter.status) {
      params.push(filter.status);
      where.push(`status = $${params.length}`);
    }
    const rows = await query(
      `SELECT * FROM inventory_items ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at DESC LIMIT 2000`,
      params,
    );
    return rows.map(mapInventory);
  },

  /** Oldest-first available vault items for a variant (falls back to product-level items with no variant). */
  getAvailableInventory: async (productId: string, variantId: string | undefined, limit: number): Promise<InventoryItem[]> => {
    const rows = await query(
      `SELECT * FROM inventory_items
        WHERE product_id = $1 AND status = 'available' AND (variant_id = $2 OR variant_id IS NULL)
          AND (expires_at IS NULL OR expires_at > now())
        ORDER BY (variant_id IS NULL) ASC, created_at ASC LIMIT $3`,
      [productId, variantId ?? null, Math.max(1, limit)],
    );
    return rows.map(mapInventory);
  },

  addInventoryItem: async (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<InventoryItem> => {
    const r = await queryOne(
      `INSERT INTO inventory_items (id, product_id, variant_id, type, data, status, expires_at)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7) RETURNING *`,
      [newId('inv'), item.productId, item.variantId || null, item.type, json(item.data || {}), item.status || 'available', item.expiresAt ?? null],
    );
    return mapInventory(r!);
  },

  addInventoryItems: async (items: Array<Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>>): Promise<number> => {
    let count = 0;
    await tx(async client => {
      for (const item of items) {
        await client.query(
          `INSERT INTO inventory_items (id, product_id, variant_id, type, data, status, expires_at) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7)`,
          [newId('inv'), item.productId, item.variantId || null, item.type, json(item.data || {}), item.status || 'available', item.expiresAt ?? null],
        );
        count++;
      }
    });
    return count;
  },

  updateInventoryItem: async (id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | null> => {
    const r = await updateRow(
      'inventory_items',
      id,
      updates as Record<string, unknown>,
      {
        productId: 'product_id',
        variantId: 'variant_id',
        type: 'type',
        data: 'data',
        status: 'status',
        orderId: 'order_id',
        orderItemId: 'order_item_id',
        soldAt: 'sold_at',
        expiresAt: 'expires_at',
      },
      { jsonCols: ['data'] },
    );
    return r ? mapInventory(r) : null;
  },

  deleteInventoryItem: async (id: string): Promise<boolean> => {
    const rows = await query(`DELETE FROM inventory_items WHERE id = $1 AND status <> 'sold' RETURNING id`, [id]);
    return rows.length > 0;
  },

  /* ---------------- Orders ---------------- */
  getOrders: async (filter: OrderFilter = {}): Promise<Order[]> => {
    pruneIfDue().catch(() => {});
    const where: string[] = [];
    const params: unknown[] = [];
    if (filter.status) {
      params.push(Array.isArray(filter.status) ? filter.status : [filter.status]);
      where.push(`o.order_status = ANY($${params.length}::text[])`);
    }
    if (filter.customerId) {
      params.push(filter.customerId);
      where.push(`o.customer_id = $${params.length}`);
    }
    if (filter.email) {
      params.push(filter.email.trim());
      where.push(`lower(o.customer_email) = lower($${params.length})`);
    }
    if (filter.search) {
      params.push(`%${filter.search.trim().toLowerCase()}%`);
      where.push(
        `(lower(o.order_number) LIKE $${params.length} OR lower(o.customer_email) LIKE $${params.length} OR lower(o.customer_name) LIKE $${params.length} OR o.customer_whatsapp LIKE $${params.length})`,
      );
    }
    params.push(filter.limit ?? 500);
    const limitIdx = params.length;
    params.push(filter.offset ?? 0);
    const rows = await query(
      `${ORDER_SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY o.created_at DESC LIMIT $${limitIdx} OFFSET $${params.length}`,
      params,
    );
    return rows.map(mapOrder);
  },

  getOrderById: async (id: string): Promise<Order | null> => {
    const r = await queryOne(`${ORDER_SELECT} WHERE o.id = $1`, [id]);
    return r ? mapOrder(r) : null;
  },

  /** Lookup by the customer-facing order number (case-insensitive). */
  getOrderByNumber: async (orderNumber: string): Promise<Order | null> => {
    const clean = orderNumber.trim().toUpperCase();
    if (!clean) return null;
    const r = await queryOne(`${ORDER_SELECT} WHERE upper(o.order_number) = $1`, [clean]);
    return r ? mapOrder(r) : null;
  },

  getOrderCounts: async (): Promise<Record<Order['orderStatus'], number>> => {
    const rows = await query<{ order_status: Order['orderStatus']; n: number }>(
      `SELECT order_status, count(*)::int AS n FROM orders GROUP BY order_status`,
    );
    const out = { pending: 0, under_review: 0, processing: 0, completed: 0, rejected: 0, cancelled: 0, refunded: 0 };
    for (const r of rows) out[r.order_status] = r.n;
    return out;
  },

  /** Creates a `pending` order awaiting payment proof. Prices must already be server-verified. */
  createOrder: async (input: CreateOrderInput): Promise<Order> => {
    const id = newId('ord');
    const orderNumber = newOrderNumber();
    const timeline: OrderTimelineEvent[] = [
      {
        status: 'Order placed',
        note: `Awaiting payment via ${input.paymentMethodName || input.paymentMethod}`,
        timestamp: nowIso(),
      },
    ];
    await tx(async client => {
      await client.query(
        `INSERT INTO orders (id, order_number, customer_id, customer_name, customer_email, customer_phone, customer_whatsapp, customer_telegram,
           currency, fx_rate, subtotal, discount, coupon_code, tax, total, total_pkr, payment_method, payment_method_name,
           payment_status, fulfillment_status, order_status, delivery_channels, customer_note, timeline, ip, user_agent)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'pending','unfulfilled','pending',$19::jsonb,$20,$21::jsonb,$22,$23)`,
        [
          id,
          orderNumber,
          input.customerId || null,
          input.customerName,
          input.customerEmail.trim(),
          input.customerPhone || null,
          input.customerWhatsapp || null,
          input.customerTelegram || null,
          input.currency,
          input.fxRate ?? null,
          input.subtotal,
          input.discount,
          input.couponCode || null,
          input.tax,
          input.total,
          input.totalPkr,
          input.paymentMethod,
          input.paymentMethodName || input.paymentMethod,
          json(input.deliveryChannels || ['email']),
          input.customerNote || null,
          json(timeline),
          input.ip || null,
          input.userAgent || null,
        ],
      );
      for (let i = 0; i < input.items.length; i++) {
        const it = input.items[i];
        await client.query(
          `INSERT INTO order_items (id, order_id, product_id, product_name, product_image, variant_id, variant_name, price, quantity, expiry_days, position)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [newId('oi'), id, it.productId, it.productName, it.productImage || null, it.variantId, it.variantName, it.price, it.quantity, it.expiryDays ?? null, i],
        );
      }
    });
    return (await db.getOrderById(id))!;
  },

  /** Admin-editable order fields (status changes go through lib/order-lifecycle). */
  updateOrder: async (
    id: string,
    updates: Partial<
      Pick<Order, 'customerName' | 'customerEmail' | 'customerPhone' | 'customerWhatsapp' | 'customerTelegram' | 'adminNote' | 'deliveryChannels'>
    >,
  ): Promise<Order | null> => {
    const r = await updateRow(
      'orders',
      id,
      updates as Record<string, unknown>,
      {
        customerName: 'customer_name',
        customerEmail: 'customer_email',
        customerPhone: 'customer_phone',
        customerWhatsapp: 'customer_whatsapp',
        customerTelegram: 'customer_telegram',
        adminNote: 'admin_note',
        deliveryChannels: 'delivery_channels',
      },
      { jsonCols: ['delivery_channels'] },
    );
    return r ? db.getOrderById(id) : null;
  },

  addOrderTimeline: async (id: string, event: Omit<OrderTimelineEvent, 'timestamp'>): Promise<void> => {
    await query(`UPDATE orders SET timeline = timeline || $2::jsonb, updated_at = now() WHERE id = $1`, [
      id,
      json([{ ...event, timestamp: nowIso() }]),
    ]);
  },

  getPaymentProofs: async (orderId: string): Promise<PaymentProof[]> => {
    const rows = await query(`SELECT * FROM payment_proofs WHERE order_id = $1 ORDER BY created_at DESC`, [orderId]);
    return rows.map(mapProof);
  },

  /* ---------------- Coupons ---------------- */
  getCoupons: async (): Promise<Coupon[]> => {
    const rows = await query(`SELECT * FROM coupons ORDER BY created_at DESC`);
    return rows.map(mapCoupon);
  },

  /** Enabled coupon by code (date window and usage limit are checked by the caller via isCouponUsable). */
  getCouponByCode: async (code: string): Promise<Coupon | null> => {
    const r = await queryOne(`SELECT * FROM coupons WHERE upper(code) = upper($1) AND enabled = true`, [code.trim()]);
    return r ? mapCoupon(r) : null;
  },

  createCoupon: async (c: Omit<Coupon, 'id' | 'createdAt' | 'usageCount'>): Promise<Coupon> => {
    const r = await queryOne(
      `INSERT INTO coupons (id, code, description, type, value, min_order_amount, max_discount, usage_limit, per_user_limit,
         start_date, expiry_date, enabled, product_ids, category_ids)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::jsonb) RETURNING *`,
      [
        newId('coup'),
        c.code.trim().toUpperCase(),
        c.description ?? null,
        c.type,
        c.value,
        c.minOrderAmount ?? null,
        c.maxDiscount ?? null,
        c.usageLimit ?? null,
        c.perUserLimit ?? null,
        c.startDate || null,
        c.expiryDate || null,
        c.enabled !== false,
        json(c.productIds || []),
        json(c.categoryIds || []),
      ],
    );
    return mapCoupon(r!);
  },

  updateCoupon: async (id: string, updates: Partial<Coupon>): Promise<Coupon | null> => {
    const u = { ...updates } as Record<string, unknown>;
    if (typeof u.code === 'string') u.code = (u.code as string).trim().toUpperCase();
    const r = await updateRow(
      'coupons',
      id,
      u,
      {
        code: 'code',
        description: 'description',
        type: 'type',
        value: 'value',
        minOrderAmount: 'min_order_amount',
        maxDiscount: 'max_discount',
        usageLimit: 'usage_limit',
        usageCount: 'usage_count',
        perUserLimit: 'per_user_limit',
        startDate: 'start_date',
        expiryDate: 'expiry_date',
        enabled: 'enabled',
        productIds: 'product_ids',
        categoryIds: 'category_ids',
      },
      { jsonCols: ['product_ids', 'category_ids'], touch: false },
    );
    return r ? mapCoupon(r) : null;
  },

  /** Atomically takes one use; false when the limit is reached. */
  claimCouponUse: async (id: string): Promise<boolean> => {
    const rows = await query(
      `UPDATE coupons SET usage_count = usage_count + 1 WHERE id = $1 AND (usage_limit IS NULL OR usage_count < usage_limit) RETURNING id`,
      [id],
    );
    return rows.length > 0;
  },

  releaseCouponUse: async (code: string): Promise<void> => {
    await query(`UPDATE coupons SET usage_count = GREATEST(usage_count - 1, 0) WHERE upper(code) = upper($1)`, [code]);
  },

  countCouponUsesByCustomer: async (code: string, customerId: string | undefined, email: string): Promise<number> => {
    const r = await queryOne<{ n: number }>(
      `SELECT count(*)::int AS n FROM orders
        WHERE upper(coupon_code) = upper($1) AND order_status NOT IN ('cancelled', 'rejected')
          AND (customer_id = $2 OR lower(customer_email) = lower($3))`,
      [code, customerId ?? null, email],
    );
    return r?.n ?? 0;
  },

  deleteCoupon: async (id: string): Promise<boolean> => {
    const rows = await query(`DELETE FROM coupons WHERE id = $1 RETURNING id`, [id]);
    return rows.length > 0;
  },

  /* ---------------- Support tickets ---------------- */
  getTickets: async (filter: { customerId?: string; email?: string; status?: SupportTicket['status'] } = {}): Promise<SupportTicket[]> => {
    const where: string[] = [];
    const params: unknown[] = [];
    if (filter.customerId) {
      params.push(filter.customerId);
      where.push(`t.customer_id = $${params.length}`);
    }
    if (filter.email) {
      params.push(filter.email);
      where.push(`lower(t.customer_email) = lower($${params.length})`);
    }
    if (filter.status) {
      params.push(filter.status);
      where.push(`t.status = $${params.length}`);
    }
    const rows = await query(
      `${TICKET_SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY t.updated_at DESC LIMIT 500`,
      params,
    );
    return rows.map(mapTicket);
  },

  getTicketById: async (id: string): Promise<SupportTicket | null> => {
    const r = await queryOne(`${TICKET_SELECT} WHERE t.id = $1 OR upper(t.ticket_number) = upper($1)`, [id]);
    return r ? mapTicket(r) : null;
  },

  createTicket: async (
    t: Omit<SupportTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'messages'> & {
      messages?: Array<Pick<TicketMessage, 'senderId' | 'senderName' | 'senderRole' | 'message'> & { attachments?: string[] }>;
    },
  ): Promise<SupportTicket> => {
    const id = newId('tkt');
    await tx(async client => {
      await client.query(
        `INSERT INTO support_tickets (id, ticket_number, customer_id, customer_name, customer_email, subject, order_id, product_id, category, status, priority)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          id,
          newTicketNumber(),
          t.customerId || null,
          t.customerName,
          t.customerEmail,
          t.subject,
          t.orderId || null,
          t.productId || null,
          t.category || 'General Support',
          t.status || 'open',
          t.priority || 'medium',
        ],
      );
      for (const m of t.messages || []) {
        await client.query(
          `INSERT INTO ticket_messages (id, ticket_id, sender_id, sender_name, sender_role, message, attachments, is_internal_note)
           VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,false)`,
          [newId('msg'), id, m.senderId, m.senderName, m.senderRole, m.message, json(m.attachments || [])],
        );
      }
    });
    return (await db.getTicketById(id))!;
  },

  addTicketMessage: async (
    ticketId: string,
    m: { senderId: string; senderName: string; senderRole: TicketMessage['senderRole']; message: string; isInternalNote?: boolean; attachments?: string[] },
  ): Promise<SupportTicket | null> => {
    const ticket = await queryOne<{ id: string }>(`SELECT id FROM support_tickets WHERE id = $1 OR upper(ticket_number) = upper($1)`, [ticketId]);
    if (!ticket) return null;
    await tx(async client => {
      await client.query(
        `INSERT INTO ticket_messages (id, ticket_id, sender_id, sender_name, sender_role, message, attachments, is_internal_note)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8)`,
        [newId('msg'), ticket.id, m.senderId, m.senderName, m.senderRole, m.message, json(m.attachments || []), Boolean(m.isInternalNote)],
      );
      if (!m.isInternalNote) {
        await client.query(`UPDATE support_tickets SET status = $2, updated_at = now() WHERE id = $1`, [
          ticket.id,
          m.senderRole === 'ADMIN' ? 'waiting_customer' : 'open',
        ]);
      } else {
        await client.query(`UPDATE support_tickets SET updated_at = now() WHERE id = $1`, [ticket.id]);
      }
    });
    return db.getTicketById(ticket.id);
  },

  updateTicketStatus: async (id: string, status: SupportTicket['status']): Promise<SupportTicket | null> => {
    const rows = await query(
      `UPDATE support_tickets SET status = $2, updated_at = now() WHERE id = $1 OR upper(ticket_number) = upper($1) RETURNING id`,
      [id, status],
    );
    return rows[0] ? db.getTicketById(rows[0].id) : null;
  },

  /* ---------------- Reviews ---------------- */
  /** With a productId: approved reviews for that product. Without: every review (admin). */
  getReviews: async (productId?: string): Promise<Review[]> => {
    const rows = productId
      ? await query(`SELECT * FROM reviews WHERE product_id = $1 AND status = 'approved' ORDER BY created_at DESC`, [productId])
      : await query(`SELECT * FROM reviews ORDER BY created_at DESC LIMIT 1000`);
    return rows.map(mapReview);
  },

  /** Approved review counts + averages per product (for cards). */
  getRatingSummaries: async (): Promise<Record<string, { average: number; count: number }>> => {
    const rows = await query<{ product_id: string; avg: string; n: number }>(
      `SELECT product_id, avg(rating) AS avg, count(*)::int AS n FROM reviews WHERE status = 'approved' GROUP BY product_id`,
    );
    const out: Record<string, { average: number; count: number }> = {};
    for (const r of rows) out[r.product_id] = { average: Math.round(num(r.avg) * 10) / 10, count: r.n };
    return out;
  },

  createReview: async (r: Omit<Review, 'id' | 'createdAt'>): Promise<Review> => {
    const row = await queryOne(
      `INSERT INTO reviews (id, product_id, customer_id, order_id, customer_name, customer_email, rating, title, comment, verified_purchase, status, is_featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        newId('rev'),
        r.productId,
        r.customerId || null,
        r.orderId || null,
        r.customerName,
        r.customerEmail,
        Math.min(5, Math.max(1, Math.round(r.rating))),
        r.title || '',
        r.comment,
        Boolean(r.verifiedPurchase),
        r.status || 'pending',
        Boolean(r.isFeatured),
      ],
    );
    return mapReview(row!);
  },

  updateReviewStatus: async (id: string, status: Review['status']): Promise<Review | null> => {
    const r = await queryOne(`UPDATE reviews SET status = $2 WHERE id = $1 RETURNING *`, [id, status]);
    return r ? mapReview(r) : null;
  },

  updateReview: async (id: string, updates: Partial<Pick<Review, 'status' | 'isFeatured' | 'title' | 'comment'>>): Promise<Review | null> => {
    const r = await updateRow(
      'reviews',
      id,
      updates as Record<string, unknown>,
      { status: 'status', isFeatured: 'is_featured', title: 'title', comment: 'comment' },
      { touch: false },
    );
    return r ? mapReview(r) : null;
  },

  deleteReview: async (id: string): Promise<boolean> => {
    const rows = await query(`DELETE FROM reviews WHERE id = $1 RETURNING id`, [id]);
    return rows.length > 0;
  },

  /* ---------------- Legal pages ---------------- */
  getLegalPages: async (): Promise<LegalPage[]> => {
    const rows = await query(`SELECT * FROM legal_pages ORDER BY title ASC`);
    return rows.map(mapLegal);
  },

  getLegalPageBySlug: async (slug: string): Promise<LegalPage | null> => {
    const r = await queryOne(`SELECT * FROM legal_pages WHERE slug = $1`, [slug]);
    return r ? mapLegal(r) : null;
  },

  updateLegalPage: async (slug: string, updates: Partial<LegalPage>): Promise<LegalPage | null> => {
    const page = await queryOne<{ id: string }>(`SELECT id FROM legal_pages WHERE slug = $1`, [slug]);
    if (!page) return null;
    const r = await updateRow(
      'legal_pages',
      page.id,
      updates as Record<string, unknown>,
      { title: 'title', content: 'content', draftContent: 'draft_content', status: 'status' },
    );
    return r ? mapLegal(r) : null;
  },

  publishLegalPage: async (slug: string, newContent: string, note?: string): Promise<LegalPage | null> => {
    const current = await db.getLegalPageBySlug(slug);
    if (!current) return null;
    const version = (current.revisions[0]?.version ?? current.revisions.length) + 1;
    const revisions = [
      { version, content: current.content, publishedAt: nowIso(), note: note || `Revision v${version}` },
      ...current.revisions,
    ].slice(0, 30);
    const r = await queryOne(
      `UPDATE legal_pages SET content = $2, draft_content = NULL, status = 'published', last_published_at = now(),
         revisions = $3::jsonb, updated_at = now() WHERE slug = $1 RETURNING *`,
      [slug, newContent, json(revisions)],
    );
    return r ? mapLegal(r) : null;
  },

  /* ---------------- Homepage sections ---------------- */
  getHomepageSections: async (): Promise<HomepageSection[]> => {
    const rows = await query(`SELECT * FROM homepage_sections ORDER BY sort_order ASC`);
    return rows.map(mapSection);
  },

  updateHomepageSection: async (id: string, updates: Partial<HomepageSection>): Promise<HomepageSection | null> => {
    const r = await updateRow(
      'homepage_sections',
      id,
      updates as Record<string, unknown>,
      { type: 'type', name: 'name', enabled: 'enabled', order: 'sort_order', settings: 'settings' },
      { jsonCols: ['settings'], touch: false },
    );
    return r ? mapSection(r) : null;
  },

  reorderHomepageSections: async (orderedIds: string[]): Promise<HomepageSection[]> => {
    await tx(async client => {
      for (let i = 0; i < orderedIds.length; i++) {
        await client.query(`UPDATE homepage_sections SET sort_order = $2 WHERE id = $1`, [orderedIds[i], i + 1]);
      }
    });
    return db.getHomepageSections();
  },

  addHomepageSection: async (s: Omit<HomepageSection, 'id'>): Promise<HomepageSection> => {
    const r = await queryOne(
      `INSERT INTO homepage_sections (id, type, name, enabled, sort_order, settings) VALUES ($1,$2,$3,$4,$5,$6::jsonb) RETURNING *`,
      [newId('sec'), s.type, s.name, s.enabled !== false, s.order ?? 99, json(s.settings || {})],
    );
    return mapSection(r!);
  },

  deleteHomepageSection: async (id: string): Promise<boolean> => {
    const rows = await query(`DELETE FROM homepage_sections WHERE id = $1 RETURNING id`, [id]);
    return rows.length > 0;
  },

  /* ---------------- Navigation ---------------- */
  getNavigation: async (position?: NavigationItem['position']): Promise<NavigationItem[]> => {
    const rows = position
      ? await query(`SELECT * FROM navigation_items WHERE position = $1 ORDER BY display_order ASC`, [position])
      : await query(`SELECT * FROM navigation_items ORDER BY position ASC, display_order ASC`);
    return rows.map(mapNav);
  },

  addNavigationItem: async (n: Omit<NavigationItem, 'id'>): Promise<NavigationItem> => {
    const r = await queryOne(
      `INSERT INTO navigation_items (id, label, url, icon, parent_id, display_order, visible, target_blank, position)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [newId('nav'), n.label, n.url, n.icon ?? null, n.parentId || null, n.displayOrder ?? 0, n.visible !== false, Boolean(n.targetBlank), n.position],
    );
    return mapNav(r!);
  },

  updateNavigationItem: async (id: string, updates: Partial<NavigationItem>): Promise<NavigationItem | null> => {
    const r = await updateRow(
      'navigation_items',
      id,
      updates as Record<string, unknown>,
      {
        label: 'label',
        url: 'url',
        icon: 'icon',
        parentId: 'parent_id',
        displayOrder: 'display_order',
        visible: 'visible',
        targetBlank: 'target_blank',
        position: 'position',
      },
      { touch: false },
    );
    return r ? mapNav(r) : null;
  },

  deleteNavigationItem: async (id: string): Promise<boolean> => {
    const rows = await query(`DELETE FROM navigation_items WHERE id = $1 RETURNING id`, [id]);
    return rows.length > 0;
  },

  /* ---------------- Announcements ---------------- */
  /** activeOnly: enabled and inside the optional start/end window. */
  getAnnouncements: async (activeOnly = false): Promise<Announcement[]> => {
    const rows = await query(
      `SELECT * FROM announcements ${
        activeOnly ? `WHERE enabled = true AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date > now())` : ''
      } ORDER BY priority ASC, created_at DESC`,
    );
    return rows.map(mapAnnouncement);
  },

  createAnnouncement: async (a: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement> => {
    const r = await queryOne(
      `INSERT INTO announcements (id, text, link, cta_text, start_date, end_date, priority, enabled) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [newId('ann'), a.text, a.link || null, a.ctaText || null, a.startDate || null, a.endDate || null, a.priority ?? 1, a.enabled !== false],
    );
    return mapAnnouncement(r!);
  },

  updateAnnouncement: async (id: string, updates: Partial<Announcement>): Promise<Announcement | null> => {
    const r = await updateRow(
      'announcements',
      id,
      updates as Record<string, unknown>,
      { text: 'text', link: 'link', ctaText: 'cta_text', startDate: 'start_date', endDate: 'end_date', priority: 'priority', enabled: 'enabled' },
      { touch: false },
    );
    return r ? mapAnnouncement(r) : null;
  },

  deleteAnnouncement: async (id: string): Promise<boolean> => {
    const rows = await query(`DELETE FROM announcements WHERE id = $1 RETURNING id`, [id]);
    return rows.length > 0;
  },

  /* ---------------- Banners ---------------- */
  getBanners: async (activeOnly = false): Promise<Banner[]> => {
    const rows = await query(
      `SELECT * FROM banners ${
        activeOnly ? `WHERE status = 'active' AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date > now())` : ''
      } ORDER BY priority ASC, created_at DESC`,
    );
    return rows.map(mapBanner);
  },

  createBanner: async (b: Omit<Banner, 'id' | 'createdAt'>): Promise<Banner> => {
    const r = await queryOne(
      `INSERT INTO banners (id, title, subtitle, image, mobile_image, cta_text, url, start_date, end_date, priority, position, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        newId('ban'),
        b.title,
        b.subtitle || null,
        b.image,
        b.mobileImage || null,
        b.ctaText || null,
        b.url || null,
        b.startDate || null,
        b.endDate || null,
        b.priority ?? 1,
        b.position || 'home',
        b.status || 'active',
      ],
    );
    return mapBanner(r!);
  },

  updateBanner: async (id: string, updates: Partial<Banner>): Promise<Banner | null> => {
    const r = await updateRow(
      'banners',
      id,
      updates as Record<string, unknown>,
      {
        title: 'title',
        subtitle: 'subtitle',
        image: 'image',
        mobileImage: 'mobile_image',
        ctaText: 'cta_text',
        url: 'url',
        startDate: 'start_date',
        endDate: 'end_date',
        priority: 'priority',
        position: 'position',
        status: 'status',
      },
      { touch: false },
    );
    return r ? mapBanner(r) : null;
  },

  deleteBanner: async (id: string): Promise<boolean> => {
    const rows = await query(`DELETE FROM banners WHERE id = $1 RETURNING id`, [id]);
    return rows.length > 0;
  },

  /* ---------------- FAQs ---------------- */
  getFAQs: async (activeOnly = false): Promise<FAQ[]> => {
    const rows = await query(`SELECT * FROM faqs ${activeOnly ? `WHERE status = 'active'` : ''} ORDER BY display_order ASC, created_at ASC`);
    return rows.map(mapFaq);
  },

  createFAQ: async (f: Omit<FAQ, 'id' | 'createdAt'>): Promise<FAQ> => {
    const r = await queryOne(
      `INSERT INTO faqs (id, question, answer, category, display_order, status, product_id, category_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [newId('faq'), f.question, f.answer, f.category || 'General', f.displayOrder ?? 0, f.status || 'active', f.productId || null, f.categoryId || null],
    );
    return mapFaq(r!);
  },

  updateFAQ: async (id: string, updates: Partial<FAQ>): Promise<FAQ | null> => {
    const r = await updateRow(
      'faqs',
      id,
      updates as Record<string, unknown>,
      {
        question: 'question',
        answer: 'answer',
        category: 'category',
        displayOrder: 'display_order',
        status: 'status',
        productId: 'product_id',
        categoryId: 'category_id',
      },
      { touch: false },
    );
    return r ? mapFaq(r) : null;
  },

  deleteFAQ: async (id: string): Promise<boolean> => {
    const rows = await query(`DELETE FROM faqs WHERE id = $1 RETURNING id`, [id]);
    return rows.length > 0;
  },

  /* ---------------- Testimonials ---------------- */
  getTestimonials: async (activeOnly = false): Promise<Testimonial[]> => {
    const rows = await query(
      `SELECT * FROM testimonials ${activeOnly ? `WHERE status = 'active'` : ''} ORDER BY display_order ASC, created_at ASC`,
    );
    return rows.map(mapTestimonial);
  },

  createTestimonial: async (t: Omit<Testimonial, 'id' | 'createdAt'>): Promise<Testimonial> => {
    const r = await queryOne(
      `INSERT INTO testimonials (id, name, role_or_company, avatar, rating, content, featured, display_order, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [newId('test'), t.name, t.roleOrCompany || null, t.avatar || null, t.rating ?? 5, t.content, Boolean(t.featured), t.displayOrder ?? 0, t.status || 'active'],
    );
    return mapTestimonial(r!);
  },

  updateTestimonial: async (id: string, updates: Partial<Testimonial>): Promise<Testimonial | null> => {
    const r = await updateRow(
      'testimonials',
      id,
      updates as Record<string, unknown>,
      {
        name: 'name',
        roleOrCompany: 'role_or_company',
        avatar: 'avatar',
        rating: 'rating',
        content: 'content',
        featured: 'featured',
        displayOrder: 'display_order',
        status: 'status',
      },
      { touch: false },
    );
    return r ? mapTestimonial(r) : null;
  },

  deleteTestimonial: async (id: string): Promise<boolean> => {
    const rows = await query(`DELETE FROM testimonials WHERE id = $1 RETURNING id`, [id]);
    return rows.length > 0;
  },

  /* ---------------- Payment methods (manual verification) ---------------- */
  getPaymentMethods: async (enabledOnly = false): Promise<PaymentMethod[]> => {
    const rows = await query(`SELECT * FROM payment_methods ${enabledOnly ? 'WHERE enabled = true' : ''} ORDER BY display_order ASC, name ASC`);
    return rows.map(mapPaymentMethod);
  },

  getPaymentMethodByKey: async (key: string): Promise<PaymentMethod | null> => {
    const r = await queryOne(`SELECT * FROM payment_methods WHERE key = $1`, [key]);
    return r ? mapPaymentMethod(r) : null;
  },

  createPaymentMethod: async (m: Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>): Promise<PaymentMethod> => {
    const r = await queryOne(
      `INSERT INTO payment_methods (id, key, name, type, description, account_title, account_number, iban, bank_name, instructions, logo, currencies, enabled, display_order, branch)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14,$15) RETURNING *`,
      [
        newId('pm'),
        m.key,
        m.name,
        m.type || 'other',
        m.description || '',
        m.accountTitle || '',
        m.accountNumber || '',
        m.iban || '',
        m.bankName || '',
        m.instructions || '',
        m.logo || null,
        json(m.currencies?.length ? m.currencies : ['PKR', 'USD']),
        Boolean(m.enabled),
        m.displayOrder ?? 0,
        m.branch || '',
      ],
    );
    return mapPaymentMethod(r!);
  },

  updatePaymentMethod: async (id: string, updates: Partial<PaymentMethod>): Promise<PaymentMethod | null> => {
    const r = await updateRow(
      'payment_methods',
      id,
      updates as Record<string, unknown>,
      {
        name: 'name',
        type: 'type',
        description: 'description',
        accountTitle: 'account_title',
        accountNumber: 'account_number',
        iban: 'iban',
        bankName: 'bank_name',
        branch: 'branch',
        instructions: 'instructions',
        logo: 'logo',
        currencies: 'currencies',
        enabled: 'enabled',
        displayOrder: 'display_order',
      },
      { jsonCols: ['currencies'] },
    );
    return r ? mapPaymentMethod(r) : null;
  },

  deletePaymentMethod: async (id: string): Promise<boolean> => {
    const rows = await query(`DELETE FROM payment_methods WHERE id = $1 RETURNING id`, [id]);
    return rows.length > 0;
  },

  /** @deprecated alias of getPaymentMethods */
  getPaymentGateways: async (enabledOnly = false): Promise<PaymentMethod[]> => db.getPaymentMethods(enabledOnly),
  /** @deprecated alias of updatePaymentMethod */
  updatePaymentGateway: async (id: string, updates: Partial<PaymentMethod>): Promise<PaymentMethod | null> =>
    db.updatePaymentMethod(id, updates),

  /* ---------------- Site settings (cached 60s per instance) ---------------- */
  getSiteSettings: async (): Promise<SiteSettings> => {
    if (settingsCache && Date.now() - settingsCache.at < SETTINGS_TTL_MS) return settingsCache.value;
    const r = await queryOne<{ data: Partial<SiteSettings> }>(`SELECT data FROM site_settings WHERE id = 1`);
    const value = mergeSettings(r?.data);
    settingsCache = { value, at: Date.now() };
    return value;
  },

  updateSiteSettings: async (updates: Partial<SiteSettings>): Promise<SiteSettings> => {
    const current = await db.getSiteSettings();
    const next = mergeSettings({
      ...current,
      ...updates,
      usdPricing: { ...current.usdPricing, ...(updates.usdPricing || {}) },
      branding: { ...current.branding, ...(updates.branding || {}) },
      socialLinks: { ...current.socialLinks, ...(updates.socialLinks || {}) },
      seoDefaults: { ...current.seoDefaults, ...(updates.seoDefaults || {}) },
    });
    await query(
      `INSERT INTO site_settings (id, data, updated_at) VALUES (1, $1::jsonb, now())
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
      [json(next)],
    );
    settingsCache = { value: next, at: Date.now() };
    return next;
  },

  /* ---------------- Media library ---------------- */
  getMediaLibrary: async (search?: string, limit = 200): Promise<MediaAsset[]> => {
    const rows = search
      ? await query(
          `SELECT * FROM media_library WHERE lower(name) LIKE $1 OR tags::text ILIKE $1 ORDER BY name ASC LIMIT $2`,
          [`%${search.trim().toLowerCase()}%`, limit],
        )
      : await query(`SELECT * FROM media_library ORDER BY created_at DESC LIMIT $1`, [limit]);
    return rows.map(mapMedia);
  },

  addMediaAsset: async (m: Omit<MediaAsset, 'id' | 'createdAt'>): Promise<MediaAsset> => {
    const r = await queryOne(
      `INSERT INTO media_library (id, public_id, url, name, tags, source, width, height, format)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9)
       ON CONFLICT (public_id) DO UPDATE SET url = EXCLUDED.url, name = EXCLUDED.name, tags = EXCLUDED.tags,
         width = EXCLUDED.width, height = EXCLUDED.height, format = EXCLUDED.format
       RETURNING *`,
      [newId('med'), m.publicId, m.url, m.name, json(m.tags || []), m.source, m.width ?? null, m.height ?? null, m.format ?? null],
    );
    return mapMedia(r!);
  },

  deleteMediaAsset: async (id: string): Promise<MediaAsset | null> => {
    const r = await queryOne(`DELETE FROM media_library WHERE id = $1 RETURNING *`, [id]);
    return r ? mapMedia(r) : null;
  },

  /* ---------------- Activity ---------------- */
  getActivity: async (filter: { userId?: string; limit?: number } = {}): Promise<ActivityEntry[]> => {
    const rows = filter.userId
      ? await query(`SELECT * FROM activity_log WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`, [filter.userId, filter.limit ?? 50])
      : await query(`SELECT * FROM activity_log ORDER BY created_at DESC LIMIT $1`, [filter.limit ?? 100]);
    return rows.map(mapActivity);
  },

  /* ---------------- Analytics (real figures only) ---------------- */
  getAnalyticsSummary: async () => {
    const [totals, monthly, recentOrders, counts] = await Promise.all([
      queryOne<Row>(
        `SELECT
           count(*)::int AS total_orders,
           count(*) FILTER (WHERE order_status = 'completed')::int AS completed_orders,
           COALESCE(sum(total_pkr) FILTER (WHERE order_status = 'completed'), 0) AS revenue_pkr,
           count(*) FILTER (WHERE order_status IN ('pending', 'under_review'))::int AS awaiting_review,
           count(*) FILTER (WHERE order_status = 'processing')::int AS awaiting_delivery,
           (SELECT count(*) FROM products WHERE status = 'active')::int AS active_products,
           (SELECT count(*) FROM users)::int AS total_customers,
           (SELECT count(*) FROM support_tickets WHERE status IN ('open', 'pending'))::int AS open_tickets,
           (SELECT count(*) FROM inventory_items WHERE status = 'available')::int AS available_inventory
         FROM orders`,
      ),
      query<Row>(
        `SELECT to_char(date_trunc('month', created_at), 'Mon') AS month,
                date_trunc('month', created_at) AS m,
                COALESCE(sum(total_pkr) FILTER (WHERE order_status = 'completed'), 0) AS revenue,
                count(*)::int AS orders
           FROM orders
          WHERE created_at >= date_trunc('month', now()) - interval '5 months'
          GROUP BY 1, 2 ORDER BY 2 ASC`,
      ),
      db.getOrders({ limit: 5 }),
      db.getOrderCounts(),
    ]);
    const revenue = num(totals?.revenue_pkr);
    const completed = num(totals?.completed_orders);
    return {
      totalRevenue: revenue,
      totalOrders: num(totals?.total_orders),
      completedOrders: completed,
      avgOrderValue: completed > 0 ? revenue / completed : 0,
      awaitingReview: num(totals?.awaiting_review),
      awaitingDelivery: num(totals?.awaiting_delivery),
      activeProducts: num(totals?.active_products),
      totalCustomers: num(totals?.total_customers),
      openTickets: num(totals?.open_tickets),
      availableInventory: num(totals?.available_inventory),
      monthlyData: monthly.map(m => ({ month: String(m.month), revenue: num(m.revenue), orders: num(m.orders) })),
      statusCounts: counts,
      recentOrders,
    };
  },
};

export type Db = typeof db;
