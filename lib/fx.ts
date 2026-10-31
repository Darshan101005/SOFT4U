import { getPool } from '@/lib/db/pool';

/**
 * Live USD -> PKR rate (PKR per 1 USD).
 * Sources, in order: Frankfurter (same provider eSIM4U uses; v2 covers PKR),
 * open.er-api.com, the last good rate stored in fx_rates, then the admin
 * fallback rate from settings. Cached in memory for an hour per instance.
 */

export interface FxQuote {
  /** PKR per 1 USD. */
  rate: number;
  source: 'frankfurter' | 'er-api' | 'stored' | 'fallback';
  fetchedAt: string;
  /** True when the live sources failed and an older / fallback rate is used. */
  stale: boolean;
}

const CACHE_TTL_MS = 60 * 60 * 1000;
const FAILURE_RETRY_MS = 5 * 60 * 1000;
let cache: { quote: FxQuote; at: number } | null = null;

function sane(rate: unknown): rate is number {
  return typeof rate === 'number' && Number.isFinite(rate) && rate > 50 && rate < 2000;
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.json();
}

async function fromFrankfurter(): Promise<number> {
  const data = await fetchJson('https://api.frankfurter.dev/v2/rates?base=USD&quotes=PKR');
  const rate = Array.isArray(data) ? data[0]?.rate : data?.rate ?? data?.rates?.PKR;
  if (!sane(rate)) throw new Error('frankfurter: no PKR rate');
  return rate;
}

async function fromErApi(): Promise<number> {
  const data = await fetchJson('https://open.er-api.com/v6/latest/USD');
  const rate = data?.rates?.PKR;
  if (!sane(rate)) throw new Error('er-api: no PKR rate');
  return rate;
}

async function storeRate(rate: number, source: string) {
  try {
    await getPool().query(
      `INSERT INTO fx_rates (base, quote, rate, source, fetched_at) VALUES ('USD','PKR',$1,$2,now())
       ON CONFLICT (base, quote) DO UPDATE SET rate = EXCLUDED.rate, source = EXCLUDED.source, fetched_at = now()`,
      [rate, source],
    );
  } catch {
    // non-fatal
  }
}

async function storedRate(): Promise<{ rate: number; fetchedAt: string } | null> {
  try {
    const r = await getPool().query<{ rate: string; fetched_at: Date }>(`SELECT rate, fetched_at FROM fx_rates WHERE base = 'USD' AND quote = 'PKR'`);
    const row = r.rows[0];
    if (!row) return null;
    const rate = Number(row.rate);
    return sane(rate) ? { rate, fetchedAt: new Date(row.fetched_at).toISOString() } : null;
  } catch {
    return null;
  }
}

async function fallbackRate(): Promise<number> {
  try {
    const { db } = await import('@/lib/db');
    const s = await db.getSiteSettings();
    if (sane(s.fallbackUsdRate)) return s.fallbackUsdRate;
  } catch {
    // ignore
  }
  return 280;
}

export async function getUsdPkrRate(): Promise<FxQuote> {
  if (cache && Date.now() - cache.at < (cache.quote.stale ? FAILURE_RETRY_MS : CACHE_TTL_MS)) return cache.quote;

  for (const [source, fn] of [
    ['frankfurter', fromFrankfurter],
    ['er-api', fromErApi],
  ] as const) {
    try {
      const rate = await fn();
      const quote: FxQuote = { rate, source, fetchedAt: new Date().toISOString(), stale: false };
      cache = { quote, at: Date.now() };
      void storeRate(rate, source);
      return quote;
    } catch (err) {
      console.warn('[fx]', err instanceof Error ? err.message : err);
    }
  }

  const stored = await storedRate();
  const quote: FxQuote = stored
    ? { rate: stored.rate, source: 'stored', fetchedAt: stored.fetchedAt, stale: true }
    : { rate: await fallbackRate(), source: 'fallback', fetchedAt: new Date().toISOString(), stale: true };
  cache = { quote, at: Date.now() };
  return quote;
}

export function pkrToUsd(pkr: number, rate: number): number {
  return rate > 0 ? pkr / rate : 0;
}

export function usdToPkr(usd: number, rate: number): number {
  return usd * rate;
}
