import { db } from '@/lib/db';
import type { Category, LegalSlug, Order, Product, SiteSettings } from '@/lib/db/types';
import { formatPayAmount, getUsdPkrRate, payAmountFor } from '@/lib/fx';
import { formatMoney } from '@/lib/money';
import { usdPriceFor } from '@/lib/pricing';
import { siteConfig } from '@/lib/site-config';
import { deliveredFieldsOf } from '@/lib/delivery-fields';
import { formatDate, formatWithZone } from '@/lib/datetime';
import { getViewerTimeZone } from '@/lib/viewer-timezone';

/** Customer's zone for dates in answers: browser cookie (website), else last known zone (Telegram), else UTC. */
async function customerZone(userId: string): Promise<string> {
  return (await getViewerTimeZone()) || (await db.getUserById(userId))?.timezone || 'UTC';
}

/**
 * SOFT4U ASSISTANT: the store's AI helper for the website chat widget and
 * the Telegram bot.
 *
 * The model never touches the database directly. It can only call the tools
 * below; each tool runs a fixed, parameterised query through `db`. Account
 * tools exist only when a customer is signed in, and they always use the
 * session's user id (never an id, email or order owner taken from the
 * model or the message), so one customer can never see another's data.
 * Delivered credentials are never sent to the model: it gets field labels
 * only and points the customer to the private order page.
 *
 * Provider: Gemini (GEMINI_API_KEY, GEMINI_MODEL) first, then the Neon AI
 * Gateway (OpenAI-compatible, model discovered from /v1/models), then a
 * rule-based answer so the customer always gets something useful.
 */

export const ASSISTANT_NAME = 'SOFT4U ASSISTANT';

export interface AssistantTurn {
  role: 'user' | 'assistant';
  text: string;
}

export interface AssistantContext {
  /** Signed-in customer id from the session or the linked Telegram chat; null for guests. */
  userId: string | null;
  channel: 'web' | 'telegram';
  /** Visitor outside Pakistan while the PKR lock is on: quote USD prices only. */
  usdOnly?: boolean;
}

export interface AssistantReply {
  reply: string;
  provider: 'gemini' | 'gateway' | 'fallback';
}

const MAX_TOOL_ROUNDS = 5;
/** Total time for Gemini attempts; leaves room for the gateway and fallback inside the 30 s function limit. */
const GEMINI_BUDGET_MS = 16000;
const MAX_HISTORY = 10;
const MAX_TEXT = 1500;

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || siteConfig.url).replace(/\/$/, '');
}

/* ------------------------------------------------------------------ */
/* Store data (cached briefly per instance)                            */
/* ------------------------------------------------------------------ */

interface StoreData {
  products: Product[];
  categories: Category[];
  settings: SiteSettings;
  rate: number;
}

let storeCache: { at: number; data: StoreData } | null = null;

async function storeData(): Promise<StoreData> {
  if (storeCache && Date.now() - storeCache.at < 60_000) return storeCache.data;
  const [products, categories, settings, fx] = await Promise.all([
    db.getProducts(true),
    db.getCategories(true),
    db.getSiteSettings(),
    getUsdPkrRate().catch(() => ({ rate: 0 })),
  ]);
  const data = { products, categories, settings, rate: fx.rate };
  storeCache = { at: Date.now(), data };
  return data;
}

function priceLabels(v: Product['variants'][number], d: StoreData, usdOnly = false): { pkr?: string; usd?: string } {
  const pkr = formatMoney(v.price, 'PKR');
  if (!d.settings.usdEnabled || !(d.rate > 0)) return { pkr };
  const usd = formatMoney(usdPriceFor(v, d.rate, d.settings.usdPricing), 'USD');
  return usdOnly ? { usd } : { pkr, usd };
}

/** One price for short lists: PKR, or USD for USD-only visitors. */
function oneLabel(pr: { pkr?: string; usd?: string }): string {
  return pr.pkr || pr.usd || '';
}

function activeVariants(p: Product) {
  return p.variants.filter(v => v.status === 'active');
}

function stockLabel(v: Product['variants'][number]): string {
  if (v.stockMode === 'preorder') return 'available (manual delivery)';
  return v.stock > 0 ? 'in stock' : 'out of stock';
}

function fromPrice(p: Product, d: StoreData, usdOnly = false) {
  const vs = activeVariants(p);
  if (vs.length === 0) return { pkr: formatMoney(p.price, 'PKR') };
  const cheapest = vs.reduce((a, b) => (b.price < a.price ? b : a));
  return priceLabels(cheapest, d, usdOnly);
}

const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/\+/g, ' plus ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(w => w.length > 1);

const STOPWORDS = new Set(
  'a an and any are can do does for from get give have how i in is it me my of on or please price prices show tell the to what which with you your deal deals plan plans buy cost much need want about there some best cheap'.split(' '),
);

/** Meaningful search words, singular form ("vpns" -> "vpn"). */
function keywords(s: string): string[] {
  return words(s)
    .filter(w => !STOPWORDS.has(w))
    .map(w => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w));
}

function productText(p: Product, cats: Category[]): string {
  const cat = cats.find(c => c.id === p.categoryId);
  return ` ${words(`${p.name} ${p.brand || ''} ${p.slug} ${p.tags.join(' ')} ${cat?.name || ''} ${cat?.slug || ''}`).join(' ')} `;
}

/** Whole-word matches; the product name and brand count double. */
function matchScore(p: Product, ws: string[], cats: Category[]): number {
  const text = productText(p, cats);
  const name = ` ${words(`${p.name} ${p.brand || ''}`).join(' ')} `;
  return ws.reduce((s, w) => s + (name.includes(` ${w} `) ? 2 : text.includes(` ${w} `) || text.includes(` ${w}s `) ? 1 : 0), 0);
}

function matchingProducts(term: string, d: StoreData): Product[] {
  const ws = keywords(term);
  if (!ws.length) return [];
  return d.products
    .map(p => ({ p, score: matchScore(p, ws, d.categories) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(x => x.p);
}

function findProduct(term: string, d: StoreData): Product | null {
  const t = term.trim().toLowerCase();
  if (!t) return null;
  const exact = d.products.find(p => p.slug === t || p.name.toLowerCase() === t);
  return exact ?? matchingProducts(t, d)[0] ?? null;
}

const STATUS_TEXT: Record<Order['orderStatus'], string> = {
  pending: 'Awaiting payment',
  under_review: 'Payment under review',
  processing: 'Payment approved, preparing delivery',
  completed: 'Delivered',
  rejected: 'Payment rejected (you can upload a new payment proof)',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

const LEGAL: Record<string, LegalSlug> = {
  terms: 'terms',
  privacy: 'privacy',
  refund: 'refund-policy',
  cookies: 'cookie-policy',
  delivery: 'delivery-policy',
};

function plainText(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`|]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/* ------------------------------------------------------------------ */
/* Tools                                                               */
/* ------------------------------------------------------------------ */

interface ToolDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  account?: boolean;
  run: (args: Record<string, unknown>, ctx: AssistantContext) => Promise<unknown>;
}

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.slice(0, max) : '');
const obj = (properties: Record<string, unknown>, required: string[] = []) => ({ type: 'object', properties, required });

const TOOLS: ToolDef[] = [
  {
    name: 'search_products',
    description: 'Search the products the store sells right now. Returns names, starting prices in PKR and USD, delivery time and page links. Call with no query to list everything.',
    parameters: obj({
      query: { type: 'string', description: 'Product, brand or need, e.g. "netflix", "vpn", "video editing". Optional.' },
      category: { type: 'string', description: 'Category name or slug. Optional.' },
    }),
    run: async (args, ctx) => {
      const d = await storeData();
      const q = str(args.query);
      const catTerm = str(args.category).toLowerCase();
      const cat = catTerm ? d.categories.find(c => c.slug === catTerm || c.name.toLowerCase().includes(catTerm)) : undefined;
      const inCategory = d.products.filter(p => !cat || p.categoryId === cat.id);
      const ws = keywords(q);
      const ranked = ws.length
        ? inCategory
            .map(p => ({ p, score: matchScore(p, ws, d.categories) }))
            .filter(x => x.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(x => x.p)
        : inCategory;
      const list = ranked
        .slice(0, 12)
        .map(p => ({
          name: p.name,
          brand: p.brand,
          category: d.categories.find(c => c.id === p.categoryId)?.name,
          from_price: fromPrice(p, d, ctx.usdOnly),
          plans: activeVariants(p).map(v => v.name),
          delivery_time: p.deliveryTime,
          url: `${baseUrl()}/products/${p.slug}`,
        }));
      return { count: list.length, total_products_in_store: d.products.length, products: list };
    },
  },
  {
    name: 'get_product_details',
    description: 'Full details of one product: every plan with its PKR and USD price, stock, delivery, features, requirements and refund terms.',
    parameters: obj({ product: { type: 'string', description: 'Product name or slug, e.g. "Netflix Premium".' } }, ['product']),
    run: async (args, ctx) => {
      const d = await storeData();
      const p = findProduct(str(args.product), d);
      if (!p) return { found: false, hint: 'No matching product. Use search_products to see what is available.' };
      return {
        found: true,
        name: p.name,
        brand: p.brand,
        description: p.shortDescription,
        category: d.categories.find(c => c.id === p.categoryId)?.name,
        plans: activeVariants(p).map(v => ({
          plan: v.name,
          price: priceLabels(v, d, ctx.usdOnly),
          compare_at: !ctx.usdOnly && v.compareAtPrice && v.compareAtPrice > v.price ? formatMoney(v.compareAtPrice, 'PKR') : undefined,
          availability: stockLabel(v),
          delivery_time: v.deliveryTime || p.deliveryTime,
        })),
        delivery_method: p.deliveryMethod,
        features: p.features.slice(0, 8),
        requirements: p.requirements.slice(0, 6),
        refund_info: p.refundInfo?.slice(0, 500),
        url: `${baseUrl()}/products/${p.slug}`,
      };
    },
  },
  {
    name: 'list_categories',
    description: 'The product categories with how many products each has.',
    parameters: obj({}),
    run: async () => {
      const d = await storeData();
      return d.categories.map(c => ({
        name: c.name,
        description: c.description,
        products: d.products.filter(p => p.categoryId === c.id).length,
        url: `${baseUrl()}/categories/${c.slug}`,
      }));
    },
  },
  {
    name: 'get_faqs',
    description: 'Frequently asked questions and answers (ordering, payment, delivery, warranty, refunds, accounts).',
    parameters: obj({ topic: { type: 'string', description: 'Optional keyword to filter, e.g. "refund", "delivery".' } }),
    run: async args => {
      const faqs = await db.getFAQs(true);
      const ws = words(str(args.topic));
      const hits = ws.length ? faqs.filter(f => ws.some(w => `${f.question} ${f.answer} ${f.category}`.toLowerCase().includes(w))) : faqs;
      return (hits.length ? hits : faqs).slice(0, 10).map(f => ({ q: f.question, a: f.answer }));
    },
  },
  {
    name: 'get_policy',
    description: 'Text of a store policy page.',
    parameters: obj({ policy: { type: 'string', enum: Object.keys(LEGAL), description: 'Which policy.' } }, ['policy']),
    run: async args => {
      const slug = LEGAL[str(args.policy)] || 'terms';
      const page = (await db.getLegalPages()).find(l => l.slug === slug && l.status === 'published');
      if (!page) return { found: false };
      return { title: page.title, text: plainText(page.content).slice(0, 2500), url: `${baseUrl()}/${slug}` };
    },
  },
  {
    name: 'get_store_info',
    description: 'Contact details, business hours, how ordering and delivery work, and the accepted payment methods with their account details.',
    parameters: obj({}),
    run: async (_args, ctx) => {
      const d = await storeData();
      const s = d.settings;
      const methods = await db.getPaymentMethods(true);
      return {
        store: s.siteName || siteConfig.name,
        website: baseUrl(),
        email: s.contactEmail || siteConfig.email,
        whatsapp: s.contactWhatsapp || siteConfig.whatsapp,
        phone: s.contactPhone || siteConfig.phone,
        business_hours: s.businessHours || siteConfig.hours,
        currencies: ctx.usdOnly && s.usdEnabled ? ['USD'] : s.usdEnabled ? ['PKR', 'USD'] : ['PKR'],
        how_to_order: [
          'Choose a product and plan, add it to the cart and check out (an account is recommended so orders and deliveries stay in one place).',
          'Pay the exact order total in the order currency to one of the payment accounts.',
          'Upload a screenshot of the payment and enter the transaction ID (at checkout or later on the order page).',
          'Our team checks the payment by hand, then delivers the access by email, on the order page and on Telegram if connected.',
        ],
        payment_methods: methods.map(m => ({
          name: m.name,
          account_title: m.accountTitle,
          account_number: m.accountNumber,
          sort_code: m.sortCode || undefined,
          iban: m.iban || undefined,
          bank: m.bankName || undefined,
          currencies: m.currencies,
          receives: m.payCurrency,
          note: m.payCurrency === 'GBP' ? 'UK bank transfer: send the order total converted to GBP; the exact GBP amount is shown at checkout and on the order page.' : undefined,
        })),
        track_order_url: `${baseUrl()}/track-order`,
        contact_url: `${baseUrl()}/contact`,
        telegram_bot: process.env.TELEGRAM_BOT_USERNAME ? `https://t.me/${process.env.TELEGRAM_BOT_USERNAME.replace(/^@/, '')}` : undefined,
      };
    },
  },
  {
    name: 'get_my_profile',
    description: "The signed-in customer's own profile and order totals.",
    parameters: obj({}),
    account: true,
    run: async (_args, ctx) => {
      const user = ctx.userId ? await db.getUserById(ctx.userId) : null;
      if (!user) return { signed_in: false };
      const orders = await db.getOrders({ customerId: user.id, limit: 100 });
      return {
        name: user.name,
        email: user.email,
        phone: user.phone,
        whatsapp: user.whatsapp,
        telegram_username: user.telegram,
        telegram_bot_connected: Boolean(user.telegramLinked),
        two_factor_enabled: user.twoFactorEnabled,
        member_since: formatDate(user.createdAt, (await getViewerTimeZone()) || user.timezone || 'UTC'),
        orders_total: orders.length,
        orders_delivered: orders.filter(o => o.orderStatus === 'completed').length,
        account_url: `${baseUrl()}/account`,
      };
    },
  },
  {
    name: 'list_my_orders',
    description: "The signed-in customer's own recent orders with status and total.",
    parameters: obj({ status: { type: 'string', enum: Object.keys(STATUS_TEXT), description: 'Optional status filter.' } }),
    account: true,
    run: async (args, ctx) => {
      if (!ctx.userId) return { signed_in: false };
      const status = str(args.status) as Order['orderStatus'];
      const [orders, zone] = await Promise.all([
        db.getOrders({ customerId: ctx.userId, status: STATUS_TEXT[status] ? status : undefined, limit: 15 }),
        customerZone(ctx.userId),
      ]);
      return orders.map(o => ({
        order_id: o.orderNumber,
        date: formatWithZone(o.createdAt, zone),
        status: STATUS_TEXT[o.orderStatus] || o.orderStatus,
        total: formatMoney(o.total, o.currency),
        items: o.items.map(i => `${i.productName} (${i.variantName}) x${i.quantity}`),
        url: `${baseUrl()}/account/orders/${encodeURIComponent(o.orderNumber)}`,
      }));
    },
  },
  {
    name: 'get_my_order',
    description:
      "One of the signed-in customer's own orders: status, history, payment instructions if unpaid, and which access details were delivered (labels only; the values are shown on the private order page).",
    parameters: obj({ order_id: { type: 'string', description: 'Order ID like S4U-XXXXXXXXXX.' } }, ['order_id']),
    account: true,
    run: async (args, ctx) => {
      if (!ctx.userId) return { signed_in: false };
      const number = str(args.order_id, 40).trim().toUpperCase();
      const order = number ? await db.getOrderByNumber(number) : null;
      // Same answer for "missing" and "someone else's order".
      if (!order || order.customerId !== ctx.userId) return { found: false };
      const unpaid = ['pending', 'rejected'].includes(order.orderStatus);
      const method = unpaid ? await db.getPaymentMethodByKey(order.paymentMethod) : null;
      const send = method ? await payAmountFor(method, order) : null;
      const zone = await customerZone(ctx.userId);
      return {
        found: true,
        order_id: order.orderNumber,
        date: formatWithZone(order.createdAt, zone),
        status: STATUS_TEXT[order.orderStatus] || order.orderStatus,
        reason: order.statusReason,
        total: formatMoney(order.total, order.currency),
        payment_method: order.paymentMethodName || order.paymentMethod,
        items: order.items.map(i => ({
          product: `${i.productName} (${i.variantName})`,
          quantity: i.quantity,
          delivered: Boolean(i.deliveredAt || order.orderStatus === 'completed'),
          delivered_fields: deliveredFieldsOf(i).map(f => f.label),
        })),
        history: order.timeline.slice(-6).map(t => ({ when: formatWithZone(t.timestamp, zone), note: t.note || t.status })),
        how_to_pay: method
          ? {
              amount_to_transfer: formatMoney(order.total, order.currency),
              amount_to_send: send ? formatPayAmount(send) : undefined,
              account: {
                name: method.name,
                account_title: method.accountTitle,
                account_number: method.accountNumber,
                sort_code: method.sortCode || undefined,
                iban: method.iban || undefined,
                bank: method.bankName || undefined,
              },
              then: 'Upload the payment screenshot and enter the transaction ID on the order page.',
            }
          : undefined,
        order_url: `${baseUrl()}/account/orders/${encodeURIComponent(order.orderNumber)}`,
      };
    },
  },
];

function toolsFor(ctx: AssistantContext): ToolDef[] {
  return TOOLS.filter(t => !t.account || ctx.userId);
}

async function runTool(name: string, args: Record<string, unknown> | undefined, ctx: AssistantContext): Promise<unknown> {
  const tool = toolsFor(ctx).find(t => t.name === name);
  if (!tool) return { error: 'This tool is not available. Account details need the customer to be signed in.' };
  try {
    return await tool.run(args || {}, ctx);
  } catch (err) {
    console.error(`[ai] tool ${name} failed:`, err instanceof Error ? err.message : err);
    return { error: 'Lookup failed, try again later.' };
  }
}

/* ------------------------------------------------------------------ */
/* Prompt                                                              */
/* ------------------------------------------------------------------ */

async function systemPrompt(ctx: AssistantContext): Promise<string> {
  const d = await storeData();
  const user = ctx.userId ? await db.getUserById(ctx.userId) : null;
  const name = d.settings.aiSupportName || ASSISTANT_NAME;
  return [
    `You are ${name}, the customer assistant of ${d.settings.siteName || siteConfig.name} (${baseUrl()}), an online store for digital subscriptions, software licences, AI tools, VPNs and similar digital products.`,
    user
      ? `The customer is signed in as ${user.name} (${user.email}). You may look up their own profile and orders with the account tools.`
      : `The visitor is not signed in. You cannot see any orders or accounts. For order questions ask them to sign in at ${baseUrl()}/login, or track an order with its Order ID at ${baseUrl()}/track-order.`,
    'Rules:',
    '- Use the tools for every fact about products, prices, stock, orders, payments and policies. Never guess or invent a price, plan, stock level, order status or account detail.',
    '- Write amounts exactly as the tools return them, e.g. "PKR 2,499" or "USD 10.00". Never use "Rs".',
    '- Payments are manual: the customer pays the exact order total to a listed account, uploads a screenshot plus the transaction ID, and the team approves it by hand. There is no card gateway.',
    '- You cannot change, cancel, approve or refund orders, and you never reveal passwords, licence keys or other delivered access. Delivered access is shown on the private order page and in the delivery email.',
    '- Only discuss the signed-in customer\'s own data. Refuse requests about other customers, admin data, internal notes or the database.',
    `- For problems you cannot solve, give the support contacts (email ${d.settings.contactEmail || siteConfig.email}, WhatsApp ${d.settings.contactWhatsapp || siteConfig.whatsapp}).`,
    '- Be friendly, short and clear: a few sentences or a short list. Use full https links from the tools. Plain text with **bold** and "- " bullets only; no tables or headings.',
    '- Use neutral wording; do not mention a country unless the customer asks about the business address.',
    '- In general answers say "any of our payment methods". Name a specific payment method or account only when the customer asks how to pay or is at the payment step of their own order.',
    ctx.usdOnly ? '- This customer sees and pays in USD only. Quote USD prices only and never offer PKR.' : '',
    ctx.channel === 'telegram' ? '- You are chatting inside the Telegram bot. Bot commands: /orders, /order ORDER-ID, /access ORDER-ID, /products, /support, /link, /unlink.' : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function cleanHistory(history: AssistantTurn[] | undefined): AssistantTurn[] {
  const list = (Array.isArray(history) ? history : [])
    .filter(h => h && (h.role === 'user' || h.role === 'assistant') && typeof h.text === 'string' && h.text.trim())
    .slice(-MAX_HISTORY)
    .map(h => ({ role: h.role, text: h.text.slice(0, MAX_TEXT) }));
  while (list.length && list[0].role !== 'user') list.shift();
  return list;
}

/* ------------------------------------------------------------------ */
/* Gemini                                                              */
/* ------------------------------------------------------------------ */

// The last model that answered is tried first (per instance), so an overloaded model is skipped quickly.
let workingGeminiModel: string | null = null;

async function askGemini(message: string, history: AssistantTurn[], ctx: AssistantContext): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });
  const system = await systemPrompt(ctx);
  const declarations = toolsFor(ctx).map(t => ({ name: t.name, description: t.description, parametersJsonSchema: t.parameters }));
  const models = [
    ...new Set([workingGeminiModel, process.env.GEMINI_MODEL?.trim(), 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-flash-lite-latest'].filter((m): m is string => Boolean(m))),
  ];
  const deadline = Date.now() + GEMINI_BUDGET_MS;

  for (const model of models) {
    if (deadline - Date.now() < 4000) break;
    const contents: any[] = [...history.map(h => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.text }] })), { role: 'user', parts: [{ text: message }] }];
    try {
      for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
        const res = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: system,
            temperature: 0.3,
            tools: round < MAX_TOOL_ROUNDS ? [{ functionDeclarations: declarations }] : undefined,
            abortSignal: AbortSignal.timeout(Math.max(3000, Math.min(9000, deadline - Date.now()))),
          },
        });
        workingGeminiModel = model;
        const calls = res.functionCalls;
        if (calls && calls.length) {
          contents.push(res.candidates?.[0]?.content ?? { role: 'model', parts: calls.map(c => ({ functionCall: c })) });
          const parts = [];
          for (const c of calls) {
            const result = await runTool(c.name || '', c.args, ctx);
            parts.push({ functionResponse: { id: c.id, name: c.name, response: { result } } });
          }
          contents.push({ role: 'user', parts });
          continue;
        }
        const text = res.text?.trim();
        return text || null;
      }
      return null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Retired model, overload (503), quota (429) or timeout: try the next model while time remains.
      if (/not.?found|404|no longer available|not supported/i.test(msg)) {
        if (workingGeminiModel === model) workingGeminiModel = null;
      } else {
        console.warn(`[ai] gemini ${model}:`, msg.slice(0, 200));
        if (workingGeminiModel === model) workingGeminiModel = null;
      }
      if (/api key|permission|unauthenticated|401|403/i.test(msg)) return null;
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Neon AI Gateway (OpenAI-compatible)                                 */
/* ------------------------------------------------------------------ */

let gatewayModel: { id: string | null; at: number } | null = null;

function gatewayBase(): string | null {
  const base = process.env.NEON_AI_GATEWAY_BASE_URL?.trim();
  return base && process.env.NEON_AI_GATEWAY_TOKEN ? base.replace(/\/+$/, '').replace(/\/v1$/, '') : null;
}

/** Picks a usable chat model with tool support from /v1/models (cached 10 minutes). */
async function discoverGatewayModel(base: string): Promise<string | null> {
  if (gatewayModel && Date.now() - gatewayModel.at < 10 * 60_000) return gatewayModel.id;
  let id: string | null = null;
  try {
    const res = await fetch(`${base}/v1/models`, {
      headers: { Authorization: `Bearer ${process.env.NEON_AI_GATEWAY_TOKEN}` },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (res.ok) {
      const data = (await res.json()) as { data?: Array<Record<string, any>> };
      const usable = (data.data || []).filter(
        m =>
          m.enabled !== false &&
          !m.unavailable_reason &&
          (!m.dialects || m.dialects.includes('chat_completions')) &&
          (!m.supported_parameters || m.supported_parameters.includes('tools')),
      );
      const pick = (re: RegExp) => usable.find(m => re.test(String(m.id)));
      id = (pick(/flash(?!.*lite)/) || pick(/mini|haiku|lite|nano/) || usable[0])?.id ?? null;
    }
  } catch (err) {
    console.warn('[ai] gateway model discovery failed:', err instanceof Error ? err.message : err);
  }
  gatewayModel = { id, at: Date.now() };
  return id;
}

async function askGateway(message: string, history: AssistantTurn[], ctx: AssistantContext): Promise<string | null> {
  const base = gatewayBase();
  if (!base) return null;
  const model = await discoverGatewayModel(base);
  if (!model) return null;
  const tools = toolsFor(ctx).map(t => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.parameters } }));
  const messages: any[] = [
    { role: 'system', content: await systemPrompt(ctx) },
    ...history.map(h => ({ role: h.role, content: h.text })),
    { role: 'user', content: message },
  ];
  try {
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const res = await fetch(`${base}/v1/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.NEON_AI_GATEWAY_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, temperature: 0.3, ...(round < MAX_TOOL_ROUNDS ? { tools, tool_choice: 'auto' } : {}) }),
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        console.error('[ai] gateway error:', res.status, (await res.text()).slice(0, 200));
        if (res.status === 404 || res.status === 403) gatewayModel = null;
        return null;
      }
      const data = (await res.json()) as any;
      const msg = data?.choices?.[0]?.message;
      if (!msg) return null;
      const calls = Array.isArray(msg.tool_calls) ? msg.tool_calls : [];
      if (calls.length) {
        messages.push({ role: 'assistant', content: msg.content ?? null, tool_calls: calls });
        for (const c of calls) {
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(c.function?.arguments || '{}');
          } catch {
            args = {};
          }
          const result = await runTool(String(c.function?.name || ''), args, ctx);
          messages.push({ role: 'tool', tool_call_id: c.id, content: JSON.stringify(result) });
        }
        continue;
      }
      const text = typeof msg.content === 'string' ? msg.content.trim() : '';
      return text || null;
    }
  } catch (err) {
    console.error('[ai] gateway error:', err instanceof Error ? err.message : err);
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Rule-based fallback                                                 */
/* ------------------------------------------------------------------ */

async function fallbackReply(message: string, ctx: AssistantContext): Promise<string> {
  const d = await storeData().catch(() => null);
  const contact = `Email ${d?.settings.contactEmail || siteConfig.email} or WhatsApp ${d?.settings.contactWhatsapp || siteConfig.whatsapp}.`;
  const text = message.toLowerCase();
  const aboutPaying = /\b(pay|paying|bank|easypaisa|jazzcash|transfer|iban|proof|screenshot)\b/.test(text);
  if (/\b(orders?|status|deliver(ed|y)?|track|paid)\b/.test(text) && !(aboutPaying && /\bhow\b/.test(text))) {
    if (ctx.userId) {
      const orders = await db.getOrders({ customerId: ctx.userId, limit: 5 }).catch(() => []);
      if (orders.length) {
        const lines = orders.map(o => `- ${o.orderNumber}: ${STATUS_TEXT[o.orderStatus] || o.orderStatus} (${formatMoney(o.total, o.currency)})`);
        return `Your recent orders:\n${lines.join('\n')}\n\nOpen any order at ${baseUrl()}/account/orders. Need help? ${contact}`;
      }
      return `You have no orders yet. Browse the catalogue at ${baseUrl()}/shop. Need help? ${contact}`;
    }
    return `Sign in at ${baseUrl()}/login to see your orders, or track one with its Order ID at ${baseUrl()}/track-order. Need help? ${contact}`;
  }
  if (aboutPaying || /\bpayment\b/.test(text)) {
    const methods = await db.getPaymentMethods(true).catch(() => []);
    const list = methods.map(m => `- ${m.name}: ${m.accountTitle}, ${m.accountNumber}${m.sortCode ? `, sort code ${m.sortCode}` : ''}${m.payCurrency === 'GBP' ? ' (send the GBP amount shown at checkout)' : ''}`).join('\n');
    return `Payments are checked by hand:\n1. Place your order. The total is shown at checkout.\n2. Transfer exactly that amount to one of these accounts:\n${list || '- shown at checkout'}\n3. Upload the payment screenshot and enter the transaction ID at checkout or on your order page.\n\nOur team approves it and delivers your access. Questions? ${contact}`;
  }
  if (/refund|replace|warranty|return/.test(text)) {
    return `Refund and replacement rules are here: ${baseUrl()}/refund-policy. If your access stops working during the plan, contact us and we will fix or replace it: ${contact}`;
  }
  if (d && d.products.length) {
    const hits = matchingProducts(message, d);
    const kw = keywords(message);
    if (hits.length === 1 || (hits.length > 1 && matchScore(hits[0], kw, d.categories) > matchScore(hits[1], kw, d.categories))) {
      const p = hits[0];
      const plans = activeVariants(p)
        .map(v => {
          const pr = priceLabels(v, d, ctx.usdOnly);
          return `- ${v.name}: ${[pr.pkr, pr.usd].filter(Boolean).join(' / ')}`;
        })
        .join('\n');
      return `**${p.name}**\n${plans}\n\nDetails and ordering: ${baseUrl()}/products/${p.slug}`;
    }
    if (hits.length > 1) {
      const lines = hits.slice(0, 8).map(p => `- ${p.name} from ${oneLabel(fromPrice(p, d, ctx.usdOnly))}: ${baseUrl()}/products/${p.slug}`);
      return `Here is what matches:\n${lines.join('\n')}`;
    }
    const sample = d.products
      .slice(0, 8)
      .map(p => `- ${p.name} from ${oneLabel(fromPrice(p, d, ctx.usdOnly))}`)
      .join('\n');
    return `Here is some of what is available now:\n${sample}\n\nSee everything at ${baseUrl()}/shop. For anything else: ${contact}`;
  }
  return `Thanks for your message. Browse the catalogue at ${baseUrl()}/shop or track an order at ${baseUrl()}/track-order. Our team can help too: ${contact}`;
}

/* ------------------------------------------------------------------ */
/* Entry point                                                         */
/* ------------------------------------------------------------------ */

export async function askAssistant(message: string, history: AssistantTurn[] | undefined, ctx: AssistantContext): Promise<AssistantReply> {
  const text = (message || '').trim().slice(0, MAX_TEXT);
  if (!text) return { reply: 'Please type a question.', provider: 'fallback' };
  const past = cleanHistory(history);
  const gemini = await askGemini(text, past, ctx).catch(() => null);
  if (gemini) return { reply: gemini, provider: 'gemini' };
  const gateway = await askGateway(text, past, ctx).catch(() => null);
  if (gateway) return { reply: gateway, provider: 'gateway' };
  return { reply: await fallbackReply(text, ctx), provider: 'fallback' };
}
