import { getPool } from '@/lib/db/pool';
import type { Currency, PayCurrency, PaymentMethod } from '@/lib/db/types';
import { convertPayAmount, formatGbp } from '@/lib/money';

/**
 * Live USD -> PKR rate (PKR per 1 USD), plus USD -> GBP for UK bank transfers.
 * Sources, in order: Frankfurter (same provider eSIM4U uses; v2 covers PKR),
 * open.er-api.com, the last good rate stored in fx_rates, then a fallback
 * (the admin fallback rate from settings for PKR). Cached in memory for an
 * hour per instance and only fetched when a page needs it.
 */

export interface FxQuote {
  /** Units of the quote currency per 1 USD. */
  rate: number;
  source: 'frankfurter' | 'er-api' | 'stored' | 'fallback';
  fetchedAt: string;
  /** True when the live sources failed and an older / fallback rate is used. */
  stale: boolean;
}

type QuoteCode = 'PKR' | 'GBP';

const CACHE_TTL_MS = 60 * 60 * 1000;
const FAILURE_RETRY_MS = 5 * 60 * 1000;
const cache = new Map<QuoteCode, { quote: FxQuote; at: number }>();

const SANE: Record<QuoteCode, [number, number]> = { PKR: [50, 2000], GBP: [0.3, 2] };

function sane(rate: unknown, code: QuoteCode): rate is number {
  const [min, max] = SANE[code];
  return typeof rate === 'number' && Number.isFinite(rate) && rate > min && rate < max;
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.json();
}

async function fromFrankfurter(code: QuoteCode): Promise<number> {
  const data = await fetchJson(`https://api.frankfurter.dev/v2/rates?base=USD&quotes=${code}`);
  const rate = Array.isArray(data) ? data[0]?.rate : data?.rate ?? data?.rates?.[code];
  if (!sane(rate, code)) throw new Error(`frankfurter: no ${code} rate`);
  return rate;
}

async function fromErApi(code: QuoteCode): Promise<number> {
  const data = await fetchJson('https://open.er-api.com/v6/latest/USD');
  const rate = data?.rates?.[code];
  if (!sane(rate, code)) throw new Error(`er-api: no ${code} rate`);
  return rate;
}

async function storeRate(code: QuoteCode, rate: number, source: string) {
  try {
    await getPool().query(
      `INSERT INTO fx_rates (base, quote, rate, source, fetched_at) VALUES ('USD',$3,$1,$2,now())
       ON CONFLICT (base, quote) DO UPDATE SET rate = EXCLUDED.rate, source = EXCLUDED.source, fetched_at = now()`,
      [rate, source, code],
    );
  } catch {
    // non-fatal
  }
}

async function storedRate(code: QuoteCode): Promise<{ rate: number; fetchedAt: string } | null> {
  try {
    const r = await getPool().query<{ rate: string; fetched_at: Date }>(`SELECT rate, fetched_at FROM fx_rates WHERE base = 'USD' AND quote = $1`, [code]);
    const row = r.rows[0];
    if (!row) return null;
    const rate = Number(row.rate);
    return sane(rate, code) ? { rate, fetchedAt: new Date(row.fetched_at).toISOString() } : null;
  } catch {
    return null;
  }
}

async function fallbackRate(code: QuoteCode): Promise<number> {
  if (code === 'GBP') return 0.79;
  try {
    const { db } = await import('@/lib/db');
    const s = await db.getSiteSettings();
    if (sane(s.fallbackUsdRate, 'PKR')) return s.fallbackUsdRate;
  } catch {
    // ignore
  }
  return 280;
}

async function getUsdRate(code: QuoteCode): Promise<FxQuote> {
  const hit = cache.get(code);
  if (hit && Date.now() - hit.at < (hit.quote.stale ? FAILURE_RETRY_MS : CACHE_TTL_MS)) return hit.quote;

  for (const [source, fn] of [
    ['frankfurter', fromFrankfurter],
    ['er-api', fromErApi],
  ] as const) {
    try {
      const rate = await fn(code);
      const quote: FxQuote = { rate, source, fetchedAt: new Date().toISOString(), stale: false };
      cache.set(code, { quote, at: Date.now() });
      void storeRate(code, rate, source);
      return quote;
    } catch (err) {
      console.warn('[fx]', err instanceof Error ? err.message : err);
    }
  }

  const stored = await storedRate(code);
  const quote: FxQuote = stored
    ? { rate: stored.rate, source: 'stored', fetchedAt: stored.fetchedAt, stale: true }
    : { rate: await fallbackRate(code), source: 'fallback', fetchedAt: new Date().toISOString(), stale: true };
  cache.set(code, { quote, at: Date.now() });
  return quote;
}

export function getUsdPkrRate(): Promise<FxQuote> {
  return getUsdRate('PKR');
}

/** GBP per 1 USD. */
export function getUsdGbpRate(): Promise<FxQuote> {
  return getUsdRate('GBP');
}

export function pkrToUsd(pkr: number, rate: number): number {
  return rate > 0 ? pkr / rate : 0;
}

export function usdToPkr(usd: number, rate: number): number {
  return usd * rate;
}

/**
 * True when the account receives a currency the store does not price in (GBP),
 * so the customer needs a converted "amount to send".
 */
export function needsPayConversion(payCurrency: PayCurrency | undefined): payCurrency is 'GBP' {
  // Orders are priced in PKR or USD only, so a GBP account always needs conversion.
  return payCurrency === 'GBP';
}

/** GBP per 1 unit of the order currency (live, cached). */
export async function payRateFor(orderCurrency: Currency): Promise<number> {
  const gbp = (await getUsdGbpRate()).rate;
  if (orderCurrency === 'USD') return gbp;
  const pkr = (await getUsdPkrRate()).rate;
  return pkr > 0 ? gbp / pkr : 0;
}

export interface PayAmount {
  currency: 'GBP';
  amount: number;
  /** GBP per 1 unit of the order currency. */
  rate: number;
}

/**
 * Amount to send for a method whose account currency differs from the order
 * currency (Monzo / GBP). Uses the amount locked on the order when present.
 * Null for PKR / USD accounts (the customer pays the order total as is).
 */
export async function payAmountFor(
  method: Pick<PaymentMethod, 'payCurrency'> | null | undefined,
  order: { total: number; currency: Currency; payCurrency?: PayCurrency; payAmount?: number; payFxRate?: number },
): Promise<PayAmount | null> {
  if (!method || !needsPayConversion(method.payCurrency)) return null;
  if (order.payCurrency === 'GBP' && order.payAmount && order.payFxRate) return { currency: 'GBP', amount: order.payAmount, rate: order.payFxRate };
  try {
    const rate = await payRateFor(order.currency);
    return rate > 0 ? { currency: 'GBP', amount: convertPayAmount(order.total, rate), rate } : null;
  } catch {
    return null;
  }
}

export function formatPayAmount(p: PayAmount): string {
  return formatGbp(p.amount);
}
