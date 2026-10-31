import type { Currency, Product, ProductVariant, UsdPricingDefaults } from '@/lib/db/types';
import { formatMoney } from '@/lib/money';
import { DEFAULT_USD_PRICING, variantCompareAt, variantPrice } from '@/lib/pricing';

/**
 * Client-safe storefront price helpers. Server pages build a `Pricing` from
 * the visitor's currency cookie and the live rate (see app/_store/storefront.ts)
 * and pass it to client components as a plain prop. Checkout always reprices
 * on the server, so these numbers are for display only.
 */
export interface Pricing {
  currency: Currency;
  /** PKR per 1 USD. */
  rate: number;
  usdPricing: UsdPricingDefaults;
  /** False hides the PKR / USD switcher and forces PKR. */
  usdEnabled: boolean;
  /** False when the visitor's currency is not known yet (no cookie, no edge country); prices render as skeletons until the browser detects it. */
  resolved: boolean;
  /** True for visitors outside Pakistan while the PKR lock is on: USD only, no switcher. */
  usdOnly: boolean;
}

export const PKR_PRICING: Pricing = { currency: 'PKR', rate: 1, usdPricing: DEFAULT_USD_PRICING, usdEnabled: false, resolved: true, usdOnly: false };

/** Formats an amount, e.g. "PKR 1,299" or "USD 4.99". */
export function formatPrice(amount: number, currency: Currency = 'PKR'): string {
  return formatMoney(amount, currency);
}

export function priceOf(v: ProductVariant, p: Pricing): number {
  return variantPrice(v, p.currency, p.rate, p.usdPricing);
}

export function compareAtOf(v: ProductVariant, p: Pricing): number | undefined {
  return variantCompareAt(v, p.currency, p.rate, p.usdPricing);
}

export function activeVariants(product: Product): ProductVariant[] {
  return (product.variants || []).filter(v => v.status === 'active');
}

/** Cheapest active variant in the display currency (null when the product has none). */
export function cheapestVariant(product: Product, p: Pricing): ProductVariant | null {
  const list = activeVariants(product);
  if (list.length === 0) return null;
  return list.reduce((best, v) => (priceOf(v, p) < priceOf(best, p) ? v : best), list[0]);
}

export function fromPrice(product: Product, p: Pricing): { price: number; compareAt?: number; variant: ProductVariant | null } {
  const v = cheapestVariant(product, p);
  if (!v) return { price: p.currency === 'PKR' ? product.price : 0, variant: null };
  return { price: priceOf(v, p), compareAt: compareAtOf(v, p), variant: v };
}

export function discountPercent(price: number, compareAt?: number): number {
  if (!compareAt || compareAt <= price || compareAt <= 0) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export type StockState = { kind: 'preorder' | 'in_stock' | 'out'; count: number; label: string };

export function variantStock(v: ProductVariant): StockState {
  if (v.stockMode === 'preorder') return { kind: 'preorder', count: 0, label: 'Pre-order / manual delivery' };
  if (v.stock > 0) return { kind: 'in_stock', count: v.stock, label: `${v.stock} available` };
  return { kind: 'out', count: 0, label: 'Out of stock' };
}

/** Product-level stock: any orderable pre-order variant counts as available. */
export function productStock(product: Product): StockState {
  const list = activeVariants(product);
  if (list.some(v => v.stockMode === 'preorder')) {
    const counted = list.filter(v => v.stockMode !== 'preorder').reduce((s, v) => s + v.stock, 0);
    return counted > 0 ? { kind: 'in_stock', count: counted, label: `${counted} available` } : { kind: 'preorder', count: 0, label: 'Pre-order / manual delivery' };
  }
  const total = list.reduce((s, v) => s + Math.max(0, v.stock), 0);
  return total > 0 ? { kind: 'in_stock', count: total, label: `${total} available` } : { kind: 'out', count: 0, label: 'Out of stock' };
}

export function isOrderable(v: ProductVariant): boolean {
  return v.status === 'active' && (v.stockMode === 'preorder' || v.stock > 0);
}

/** Highest quantity a customer may pick for one line (checkout caps at 10). */
export function maxQuantity(v: ProductVariant): number {
  if (v.stockMode === 'preorder') return 10;
  return Math.max(0, Math.min(10, v.stock));
}

export function isInstant(product: Product, v?: ProductVariant | null): boolean {
  const t = `${v?.deliveryTime || ''} ${product.deliveryTime || ''}`.toLowerCase();
  return t.includes('instant');
}
