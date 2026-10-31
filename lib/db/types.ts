// Shared domain types. Rows are mapped from Postgres (snake_case) to these
// camelCase shapes in lib/db/index.ts. Dates are ISO strings.

// An account is either an admin (admin_users table, opens /admin) or a customer (users table).
export type UserRole = 'ADMIN' | 'CUSTOMER';

export type Currency = 'PKR' | 'USD';

/** Currency a payment account receives (GBP for UK bank accounts). */
export type PayCurrency = Currency | 'GBP';

/** Public customer profile. Secrets (password hash, TOTP secret) never leave lib/auth. */
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  emailVerifiedAt?: string;
  phone?: string;
  whatsapp?: string;
  /** Telegram @username typed by the customer (contact only, not verified). */
  telegram?: string;
  /** True when the customer linked the Telegram bot to this account. */
  telegramLinked?: boolean;
  avatar?: string;
  status: 'active' | 'suspended';
  suspendedReason?: string;
  twoFactorEnabled: boolean;
  lastLoginAt?: string;
  lastSeenAt?: string;
  /** IANA zone from the latest geo lookup (for emails and Telegram). */
  timezone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  status: 'active' | 'paused';
  twoFactorEnabled: boolean;
  telegramLinked?: boolean;
  lastLoginAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  banner?: string;
  parentId?: string | null;
  status: 'active' | 'disabled';
  displayOrder: number;
  featured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export type InventoryType = 'credential' | 'license_key' | 'manual' | 'generated';

/**
 * vault: availability = count of available vault items for the variant
 * manual: availability = admin-entered `stock`
 * preorder: always orderable, shown as "Pre-order / manual delivery"
 */
export type StockMode = 'vault' | 'manual' | 'preorder';

/**
 * auto: USD = PKR / rate
 * percent: auto + usdMarkupPercent %
 * amount: auto + usdMarkupAmount (USD)
 * fixed: usdPrice as entered
 */
export type UsdPricingMode = 'auto' | 'percent' | 'amount' | 'fixed';

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  /** PKR price. */
  price: number;
  compareAtPrice?: number;
  sku: string;
  /** Units available now (computed for vault mode, admin-set for manual mode, 0 for preorder). */
  stock: number;
  stockMode: StockMode;
  description?: string;
  features?: string[];
  deliveryMethod?: string;
  deliveryTime?: string;
  status: 'active' | 'disabled';
  expiryDays?: number;
  usdPricingMode: UsdPricingMode;
  usdPrice?: number;
  usdMarkupPercent?: number;
  usdMarkupAmount?: number;
  displayOrder?: number;
}

export interface Product {
  id: string;
  name: string;
  /** Brand / vendor, e.g. Netflix, Microsoft, Adobe (catalogue brand filter). */
  brand?: string;
  slug: string;
  sku: string;
  shortDescription: string;
  longDescription: string;
  images: string[];
  logo?: string;
  categoryId: string;
  tags: string[];
  /** Starting PKR price (lowest active variant). */
  price: number;
  compareAtPrice?: number;
  discount: number;
  status: 'active' | 'draft' | 'disabled' | 'archived';
  featured: boolean;
  bestseller: boolean;
  isNew: boolean;
  trending: boolean;
  badge?: string;
  deliveryTime: string;
  deliveryMethod: string;
  productType: string;
  inventoryModel: InventoryType;
  features: string[];
  requirements: string[];
  usageInstructions: string;
  refundInfo: string;
  seoTitle?: string;
  seoDescription?: string;
  relatedProductIds?: string[];
  displayOrder?: number;
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

/** A labelled value sent to the customer on delivery, e.g. { label: 'Email', value: 'x@y.com' }. */
export interface DeliveryField {
  label: string;
  value: string;
}

export interface InventoryItem {
  id: string;
  productId: string;
  variantId?: string;
  type: InventoryType;
  data: {
    email?: string;
    password?: string;
    licenseKey?: string;
    pin?: string;
    profileName?: string;
    notes?: string;
    /** Free-form extra fields. */
    fields?: DeliveryField[];
  };
  status: 'available' | 'reserved' | 'sold' | 'disabled' | 'expired';
  orderId?: string;
  orderItemId?: string;
  soldAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemFulfillment {
  /** Key/value pairs the admin delivered (the main delivery format). */
  fields?: DeliveryField[];
  credentials?: Array<{ email?: string; password?: string; pin?: string; profile?: string }>;
  licenseKeys?: string[];
  instructions?: string;
  inventoryItemIds?: string[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage?: string;
  variantId: string;
  variantName: string;
  /** Unit price in the order currency. */
  price: number;
  quantity: number;
  expiryDays?: number;
  fulfillmentData?: OrderItemFulfillment;
  deliveredAt?: string;
}

export interface OrderTimelineEvent {
  status: string;
  note: string;
  timestamp: string;
  actor?: string;
}

export type OrderStatus =
  | 'pending'
  | 'under_review'
  | 'processing'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'pending' | 'submitted' | 'paid' | 'failed' | 'rejected' | 'refunded' | 'partially_refunded';

export type DeliveryChannel = 'email' | 'telegram' | 'whatsapp' | 'account';

export interface PaymentProof {
  id: string;
  orderId: string;
  methodKey: string;
  transactionId: string;
  senderName?: string;
  senderAccount?: string;
  amount?: number;
  /** First screenshot (Cloudinary authenticated public id); resolve with getPrivateImageUrl(). */
  imagePublicId?: string;
  imageFormat?: string;
  /** Every screenshot (1-3). View via /api/admin/payment-proofs/<id>?i=<index>. */
  images: Array<{ publicId: string; format: string }>;
  /** Payment date typed by the customer (optional). */
  paymentDate?: string;
  status: 'submitted' | 'accepted' | 'rejected';
  rejectReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerWhatsapp?: string;
  customerTelegram?: string;
  currency: Currency;
  /** PKR per 1 USD locked at checkout (USD orders; internal only). */
  fxRate?: number;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  tax: number;
  total: number;
  /** Total expressed in PKR (for reporting). */
  totalPkr: number;
  /** payment_methods.key */
  paymentMethod: string;
  paymentMethodName?: string;
  /** Set when the account currency differs from the order currency (GBP): locked when the proof is submitted. */
  payCurrency?: PayCurrency;
  payAmount?: number;
  /** Units of payCurrency per 1 unit of the order currency. */
  payFxRate?: number;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: 'unfulfilled' | 'fulfilled' | 'partially_fulfilled';
  orderStatus: OrderStatus;
  /** Why the order is in its current state (rejection reason, expiry, ...). */
  statusReason?: string;
  deliveryChannels: DeliveryChannel[];
  customerNote?: string;
  adminNote?: string;
  paymentProofs?: PaymentProof[];
  timeline: OrderTimelineEvent[];
  ip?: string;
  userAgent?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  deliveredAt?: string;
  deliveredBy?: string;
  cancelledAt?: string;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  /** fixed values are PKR; converted for USD orders. */
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  perUserLimit?: number;
  startDate?: string;
  expiryDate?: string;
  enabled: boolean;
  productIds?: string[];
  categoryIds?: string[];
  createdAt: string;
}

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  message: string;
  attachments?: string[];
  isInternalNote: boolean;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  orderId?: string;
  productId?: string;
  category: string;
  status: 'open' | 'pending' | 'waiting_customer' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  customerId?: string;
  orderId?: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  status: 'approved' | 'pending' | 'hidden' | 'rejected';
  isFeatured: boolean;
  createdAt: string;
}

export interface Announcement {
  id: string;
  text: string;
  link?: string;
  ctaText?: string;
  startDate?: string;
  endDate?: string;
  priority: number;
  enabled: boolean;
  createdAt: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  mobileImage?: string;
  ctaText?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  priority: number;
  position: string;
  status: 'active' | 'disabled';
  createdAt: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  displayOrder: number;
  status: 'active' | 'disabled';
  productId?: string;
  categoryId?: string;
  createdAt: string;
}

export interface Testimonial {
  id: string;
  name: string;
  roleOrCompany?: string;
  avatar?: string;
  rating: number;
  content: string;
  featured: boolean;
  displayOrder: number;
  status: 'active' | 'disabled';
  createdAt: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  url: string;
  icon?: string;
  parentId?: string | null;
  displayOrder: number;
  visible: boolean;
  targetBlank: boolean;
  position: 'header' | 'footer' | 'mobile';
}

export interface LegalPageRevision {
  version: number;
  content: string;
  publishedAt: string;
  note?: string;
}

export type LegalSlug =
  | 'terms'
  | 'privacy'
  | 'refund-policy'
  | 'cookie-policy'
  | 'delivery-policy'
  | 'disclaimer'
  | 'shipping-policy';

export interface LegalPage {
  id: string;
  slug: LegalSlug;
  title: string;
  /** Markdown. */
  content: string;
  draftContent?: string;
  status: 'draft' | 'published';
  lastPublishedAt: string;
  revisions: LegalPageRevision[];
  updatedAt: string;
}

export interface HomepageSection {
  id: string;
  type:
    | 'hero'
    | 'trust_bar'
    | 'categories'
    | 'featured_products'
    | 'bestsellers'
    | 'new_arrivals'
    | 'all_products'
    | 'banner'
    | 'benefits'
    | 'how_it_works'
    | 'testimonials'
    | 'reviews'
    | 'faq'
    | 'cta'
    | 'newsletter';
  name: string;
  enabled: boolean;
  order: number;
  settings: Record<string, any>;
}

/** Manual payment account (bank transfer, Easypaisa, JazzCash, ...). */
export interface PaymentMethod {
  id: string;
  key: string;
  name: string;
  type: 'bank' | 'easypaisa' | 'jazzcash' | 'other';
  description: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  bankName: string;
  branch: string;
  /** UK sort code, e.g. 04-00-03 (UK bank accounts only). */
  sortCode: string;
  /** Currency the account receives. PKR accounts take the order total as is. */
  payCurrency: PayCurrency;
  instructions: string;
  /** Brand logo shown on the checkout radio card (admin-replaceable). */
  logo?: string;
  /** Order currencies this method can be chosen for. The customer pays the order total in the order currency. */
  currencies: Currency[];
  enabled: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** @deprecated use PaymentMethod. Kept as an alias for older admin screens. */
export type PaymentGateway = PaymentMethod;

export interface UsdPricingDefaults {
  /** Applied to variants whose usdPricingMode is 'auto' when set to percent/amount. */
  mode: 'auto' | 'percent' | 'amount';
  percent: number;
  amount: number;
  /** Round USD prices up to this step (e.g. 0.01, 0.5, 1). */
  roundTo: number;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  description: string;
  logoUrl?: string;
  faviconUrl?: string;
  contactEmail: string;
  contactPhone: string;
  contactWhatsapp: string;
  contactTelegram: string;
  contactAddress: string;
  businessHours: string;
  /** IANA zone for reports (dashboard months, admin alerts). Default Asia/Karachi. */
  storeTimezone: string;
  currencySymbol: string;
  currencyCode: string;
  /** Show the PKR / USD switcher and accept USD orders. */
  usdEnabled: boolean;
  /** Used when every live FX source and the stored rate are unavailable. */
  fallbackUsdRate: number;
  usdPricing: UsdPricingDefaults;
  taxRate: number;

  /** Extra emails that receive the new-order alert (admins always do). */
  orderAlertEmails: string[];
  maintenanceMode: boolean;
  maintenanceMessage: string;
  guestCheckoutEnabled: boolean;
  requirePhone: boolean;
  requireWhatsapp: boolean;
  branding: {
    primaryColor: string;
    backgroundColor: string;
    charcoalColor: string;
    borderRadius: string;
  };
  socialLinks: {
    twitter?: string;
    telegram?: string;
    whatsapp?: string;
    discord?: string;
    youtube?: string;
    instagram?: string;
    facebook?: string;
    tiktok?: string;
  };
  seoDefaults: {
    title: string;
    description: string;
    ogImage?: string;
    keywords?: string;
    googleSiteVerification?: string;
  };
  aiSupportEnabled: boolean;
  aiSupportName: string;
  aiWelcomeMessage: string;
}

export interface MediaAsset {
  id: string;
  publicId: string;
  url: string;
  name: string;
  tags: string[];
  source: 'upload' | 'url' | 'library';
  width?: number;
  height?: number;
  format?: string;
  createdAt: string;
}

export interface ActivityEntry {
  id: number;
  userId?: string;
  email?: string;
  actorType: 'customer' | 'admin' | 'guest';
  eventType: string;
  ipv4?: string;
  ipv6?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  flagEmoji?: string;
  isp?: string;
  org?: string;
  timezoneId?: string;
  isVpn: boolean;
  isProxy: boolean;
  isTor: boolean;
  isDatacenter: boolean;
  isMobile: boolean;
  userAgent?: string;
  device?: string;
  createdAt: string;
}
