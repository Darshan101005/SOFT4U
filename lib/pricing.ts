import type { Currency, ProductVariant, UsdPricingDefaults } from '@/lib/db/types';

/**
 * Client-safe price maths. PKR is the base price on every variant; the USD
 * price is derived per variant:
 *   auto    -> PKR / live rate, no margin by default (a store-wide markup can be set in settings.usdPricing)
 *   percent -> PKR / rate + usdMarkupPercent %
 *   amount  -> PKR / rate + usdMarkupAmount USD
 *   fixed   -> usdPrice exactly (e.g. Hotstar PKR 399 sold at USD 10)
 * The server recomputes every price at checkout; never trust a client total.
 */

export const DEFAULT_USD_PRICING: UsdPricingDefaults = { mode: 'auto', percent: 0, amount: 0, roundTo: 0.01 };

function roundUp(value: number, step: number): number {
  const s = step > 0 ? step : 0.01;
  return Math.round(Math.ceil(value / s - 1e-9) * s * 100) / 100;
}

type PricedVariant = Pick<ProductVariant, 'price' | 'compareAtPrice' | 'usdPricingMode' | 'usdPrice' | 'usdMarkupPercent' | 'usdMarkupAmount'>;

export function usdPriceFor(v: PricedVariant, rate: number, defaults: UsdPricingDefaults = DEFAULT_USD_PRICING): number {
  const base = rate > 0 ? v.price / rate : 0;
  let usd: number;
  switch (v.usdPricingMode) {
    case 'fixed':
      usd = v.usdPrice && v.usdPrice > 0 ? v.usdPrice : base;
      break;
    case 'percent':
      usd = base * (1 + (v.usdMarkupPercent || 0) / 100);
      break;
    case 'amount':
      usd = base + (v.usdMarkupAmount || 0);
      break;
    default:
      usd = defaults.mode === 'percent' ? base * (1 + (defaults.percent || 0) / 100) : defaults.mode === 'amount' ? base + (defaults.amount || 0) : base;
  }
  return roundUp(Math.max(usd, 0), defaults.roundTo);
}

/** Compare-at price in USD keeps the same discount ratio as the PKR prices. */
export function usdCompareAtFor(v: PricedVariant, rate: number, defaults: UsdPricingDefaults = DEFAULT_USD_PRICING): number | undefined {
  if (!v.compareAtPrice || v.compareAtPrice <= v.price || v.price <= 0) return undefined;
  const usd = usdPriceFor(v, rate, defaults);
  return roundUp((usd * v.compareAtPrice) / v.price, defaults.roundTo);
}

/** Unit price of a variant in the requested currency. */
export function variantPrice(v: PricedVariant, currency: Currency, rate: number, defaults?: UsdPricingDefaults): number {
  return currency === 'USD' ? usdPriceFor(v, rate, defaults) : v.price;
}

export function variantCompareAt(v: PricedVariant, currency: Currency, rate: number, defaults?: UsdPricingDefaults): number | undefined {
  if (currency === 'USD') return usdCompareAtFor(v, rate, defaults);
  return v.compareAtPrice && v.compareAtPrice > v.price ? v.compareAtPrice : undefined;
}

/** Converts a PKR amount (e.g. a fixed coupon) into the order currency. */
export function convertPkr(amountPkr: number, currency: Currency, rate: number): number {
  if (currency === 'PKR') return amountPkr;
  return rate > 0 ? Math.round((amountPkr / rate) * 100) / 100 : 0;
}
