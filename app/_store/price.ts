import { siteConfig } from '@/lib/site-config';

/** Formats an amount in the store currency, e.g. "Rs 1,299" (same output as formatPKR in data/products). */
export function formatPrice(amount: number): string {
  const value = Number.isFinite(amount) ? amount : 0;
  return `${siteConfig.currencySymbol} ${Math.round(value).toLocaleString('en-US')}`;
}
