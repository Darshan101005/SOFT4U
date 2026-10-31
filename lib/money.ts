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

/** Order total converted to the account currency (GBP), rounded up to 2 decimals. */
export function convertPayAmount(total: number, rate: number): number {
  return Math.ceil(Math.round(total * rate * 1e6) / 1e4) / 100;
}

/** `GBP 7.90` */
export function formatGbp(amount: number): string {
  return `GBP ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const CURRENCY_LABELS: Record<Currency, string> = { PKR: 'PKR', USD: 'USD' };
/** @deprecated use CURRENCY_LABELS */
export const CURRENCY_SYMBOLS = CURRENCY_LABELS;
