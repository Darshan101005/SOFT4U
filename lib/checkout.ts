import { db, type CreateOrderInput } from '@/lib/db';
import type { Coupon, Currency, OrderItem } from '@/lib/db/types';
import { getUsdPkrRate } from '@/lib/fx';
import { formatMoney } from '@/lib/money';
import { convertPkr, variantPrice } from '@/lib/pricing';

/**
 * Server-side cart pricing. Never trusts client prices: every line is looked
 * up, stock-checked and priced in the chosen currency, and the coupon is
 * fully validated here.
 */

export class CheckoutError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export interface CartLineInput {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface PricedCart {
  currency: Currency;
  fxRate?: number;
  items: Array<Omit<OrderItem, 'id' | 'orderId'>>;
  subtotal: number;
  discount: number;
  total: number;
  /** Internal reporting: total in PKR at the locked rate. */
  totalPkr: number;
  coupon?: Coupon;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function couponProblem(c: Coupon, now = new Date()): string | null {
  if (!c.enabled) return 'This coupon is not active';
  if (c.startDate && new Date(c.startDate) > now) return 'This coupon is not active yet';
  if (c.expiryDate && new Date(c.expiryDate) < now) return 'This coupon has expired';
  if (c.usageLimit !== undefined && c.usageCount >= c.usageLimit) return 'This coupon has reached its usage limit';
  return null;
}

export async function priceCart(input: {
  lines: CartLineInput[];
  currency: Currency;
  couponCode?: string;
  customerId?: string;
  email?: string;
}): Promise<PricedCart> {
  if (!Array.isArray(input.lines) || input.lines.length === 0) throw new CheckoutError('EMPTY_CART', 'Your cart is empty');
  if (input.lines.length > 20) throw new CheckoutError('TOO_MANY', 'Too many items in one order');
  const settings = await db.getSiteSettings();
  const currency: Currency = input.currency === 'USD' && settings.usdEnabled ? 'USD' : 'PKR';
  const rate = currency === 'USD' ? (await getUsdPkrRate()).rate : 0;

  const items: PricedCart['items'] = [];
  const categoryByProduct = new Map<string, string>();
  for (const line of input.lines) {
    const qty = Math.min(10, Math.max(1, Math.floor(Number(line.quantity) || 1)));
    const product = await db.getProductById(line.productId);
    if (!product || product.status !== 'active') throw new CheckoutError('UNAVAILABLE', 'A product in your cart is no longer available');
    const variant = product.variants.find(v => v.id === line.variantId);
    if (!variant || variant.status !== 'active') throw new CheckoutError('UNAVAILABLE', `The selected plan for ${product.name} is no longer available`);
    if (variant.stockMode !== 'preorder' && variant.stock < qty) {
      throw new CheckoutError('OUT_OF_STOCK', variant.stock > 0 ? `Only ${variant.stock} left of ${product.name} (${variant.name})` : `${product.name} (${variant.name}) is out of stock`);
    }
    categoryByProduct.set(product.id, product.categoryId);
    items.push({
      productId: product.id,
      productName: product.name,
      productImage: product.images[0] || product.logo,
      variantId: variant.id,
      variantName: variant.name,
      price: round2(variantPrice(variant, currency, rate, settings.usdPricing)),
      quantity: qty,
      expiryDays: variant.expiryDays,
    });
  }

  const subtotal = round2(items.reduce((s, i) => s + i.price * i.quantity, 0));
  let discount = 0;
  let coupon: Coupon | undefined;
  if (input.couponCode?.trim()) {
    const c = await db.getCouponByCode(input.couponCode);
    if (!c) throw new CheckoutError('BAD_COUPON', 'This coupon code is not valid');
    const problem = couponProblem(c);
    if (problem) throw new CheckoutError('BAD_COUPON', problem);
    if (c.perUserLimit && input.email) {
      const used = await db.countCouponUsesByCustomer(c.code, input.customerId, input.email);
      if (used >= c.perUserLimit) throw new CheckoutError('BAD_COUPON', 'You have already used this coupon');
    }
    const eligible = items.filter(
      i =>
        (!c.productIds?.length || c.productIds.includes(i.productId)) &&
        (!c.categoryIds?.length || c.categoryIds.includes(categoryByProduct.get(i.productId) || '')),
    );
    const eligibleSubtotal = eligible.reduce((s, i) => s + i.price * i.quantity, 0);
    if (eligibleSubtotal <= 0) throw new CheckoutError('BAD_COUPON', 'This coupon does not apply to the items in your cart');
    const minOrder = c.minOrderAmount ? convertPkr(c.minOrderAmount, currency, rate) : 0;
    if (minOrder && subtotal < minOrder) throw new CheckoutError('BAD_COUPON', `This coupon needs a minimum order of ${formatMoney(minOrder, currency)}`);
    discount = c.type === 'percentage' ? (eligibleSubtotal * c.value) / 100 : convertPkr(c.value, currency, rate);
    if (c.maxDiscount) discount = Math.min(discount, convertPkr(c.maxDiscount, currency, rate));
    discount = round2(Math.min(discount, eligibleSubtotal));
    if (currency === 'PKR') discount = Math.round(discount);
    coupon = c;
  }

  const total = round2(Math.max(0, subtotal - discount));
  return {
    currency,
    fxRate: currency === 'USD' ? rate : undefined,
    items,
    subtotal,
    discount,
    total,
    totalPkr: currency === 'USD' ? Math.round(total * rate) : total,
    coupon,
  };
}

export type { CreateOrderInput };
