import { NextRequest, NextResponse } from 'next/server';
import { readJson } from '@/lib/api';
import { CURRENCY_COOKIE, GEO_CURRENCY_COOKIE, currencyForCountry, getCurrencyFromCookies, requestCountry } from '@/lib/currency-pref';

export const dynamic = 'force-dynamic';

const cookieBase = { httpOnly: false, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/' };

/**
 * GET -> { currency, source: 'manual' | 'geo' | 'default' }.
 * Called by the browser after the page loads. Pakistan -> PKR, elsewhere -> USD;
 * the result is cached in a session cookie. A manual choice is never overridden.
 */
export async function GET(req: NextRequest) {
  const current = await getCurrencyFromCookies();
  if (current.source !== 'default') return NextResponse.json(current, { headers: { 'Cache-Control': 'private, no-store' } });
  let currency: 'PKR' | 'USD' = 'PKR';
  let source: 'geo' | 'default' = 'default';
  try {
    const country = await requestCountry(req.headers);
    if (country) {
      currency = currencyForCountry(country);
      source = 'geo';
    }
  } catch {
    // fall back to PKR
  }
  const res = NextResponse.json({ currency, source }, { headers: { 'Cache-Control': 'private, no-store' } });
  if (source === 'geo') res.cookies.set(GEO_CURRENCY_COOKIE, currency, cookieBase);
  return res;
}

/** POST { currency: 'PKR' | 'USD' } -> remembers the customer's own choice for a year. */
export async function POST(req: NextRequest) {
  const body = await readJson(req);
  const currency = body.currency === 'USD' ? 'USD' : body.currency === 'PKR' ? 'PKR' : null;
  if (!currency) return NextResponse.json({ error: 'currency must be PKR or USD' }, { status: 400 });
  const res = NextResponse.json({ currency, source: 'manual' });
  res.cookies.set(CURRENCY_COOKIE, currency, { ...cookieBase, maxAge: 365 * 24 * 60 * 60 });
  return res;
}
