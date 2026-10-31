import type { Currency } from '@/lib/db/types';

/**
 * Client-safe money formatting. The currency is always written as its code:
 * `PKR 1,899` and `USD 5.49` (never "Rs", "Rs." or "₨").
 */
export function formatMoney(amount: number, currency: Currency = 'PKR'): string {
  const n = Number.isFinite(amount) ? amount : 0;
  if (currency === 'USD') {
    return `USD ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `PKR ${Math.round(n).toLocaleString('en-US')}`;
}

export const CURRENCY_LABELS: Record<Currency, string> = { PKR: 'PKR', USD: 'USD' };
/** @deprecated use CURRENCY_LABELS */
export const CURRENCY_SYMBOLS = CURRENCY_LABELS;
