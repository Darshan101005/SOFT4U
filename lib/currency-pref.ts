import https from 'https';
import { cookies, headers } from 'next/headers';
import type { Currency } from '@/lib/db/types';
import { clientIp } from '@/lib/request-meta';

/**
 * Display currency: Pakistan visitors see PKR, everyone else USD.
 *  1. A manual choice (cookie `soft4u_currency`, 1 year) always wins.
 *  2. Otherwise the geo result cached in `soft4u_geo_currency` (session cookie).
 *  3. Otherwise detect from the IP country: Vercel's x-vercel-ip-country header
 *     when present, else ipwho.is (same source as lib/activity), 2.5 s timeout.
 *  4. Any failure falls back to PKR. Rendering never waits on detection:
 *     pages read the cookies only; the browser calls GET /api/currency after load.
 */

export const CURRENCY_COOKIE = 'soft4u_currency';
export const GEO_CURRENCY_COOKIE = 'soft4u_geo_currency';

function valid(v: string | undefined | null): Currency | null {
  return v === 'PKR' || v === 'USD' ? v : null;
}

/**
 * Cookie and edge-header read for server components (no network). On Vercel the
 * x-vercel-ip-country header resolves first-time visitors during the first render,
 * so the first paint already shows the right currency.
 */
export async function getCurrencyFromCookies(): Promise<{ currency: Currency; source: 'manual' | 'geo' | 'default' }> {
  const store = await cookies();
  const manual = valid(store.get(CURRENCY_COOKIE)?.value);
  if (manual) return { currency: manual, source: 'manual' };
  const geo = valid(store.get(GEO_CURRENCY_COOKIE)?.value);
  if (geo) return { currency: geo, source: 'geo' };
  const edgeCountry = (await headers()).get('x-vercel-ip-country');
  if (edgeCountry && /^[A-Z]{2}$/i.test(edgeCountry)) return { currency: currencyForCountry(edgeCountry.toUpperCase()), source: 'geo' };
  return { currency: 'PKR', source: 'default' };
}

const geoCache = new Map<string, { country: string | null; at: number }>();
const GEO_TTL_MS = 6 * 60 * 60 * 1000;

function lookupCountry(ip: string): Promise<string | null> {
  return new Promise(resolve => {
    const req = https.get(
      `https://ipwho.is/${encodeURIComponent(ip)}?fields=success,country_code`,
      { headers: { Accept: 'application/json', 'User-Agent': 'soft4u/1.0' }, timeout: 2500 },
      res => {
        let body = '';
        res.on('data', chunk => (body += chunk));
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            resolve(data?.success === false ? null : typeof data?.country_code === 'string' ? data.country_code : null);
          } catch {
            resolve(null);
          }
        });
      },
    );
    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}

/** Country code for the request (null when unknown). */
export async function requestCountry(headers: Headers): Promise<string | null> {
  const vercel = headers.get('x-vercel-ip-country');
  if (vercel && /^[A-Z]{2}$/i.test(vercel)) return vercel.toUpperCase();
  const ip = clientIp(headers);
  if (!ip) return null;
  const hit = geoCache.get(ip);
  if (hit && Date.now() - hit.at < GEO_TTL_MS) return hit.country;
  const country = await lookupCountry(ip);
  geoCache.set(ip, { country, at: Date.now() });
  if (geoCache.size > 5000) geoCache.clear();
  return country;
}

export function currencyForCountry(country: string | null): Currency {
  if (!country) return 'PKR';
  return country === 'PK' ? 'PKR' : 'USD';
}
