import { NextResponse } from 'next/server';
import { getUsdPkrRate } from '@/lib/fx';
import { db } from '@/lib/db';

/** GET -> { rate (PKR per USD), source, fetchedAt, stale, usdEnabled, usdPricing } for the currency switcher. */
export async function GET() {
  const [quote, settings] = await Promise.all([getUsdPkrRate(), db.getSiteSettings()]);
  return NextResponse.json(
    { ...quote, usdEnabled: settings.usdEnabled, usdPricing: settings.usdPricing },
    { headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600' } },
  );
}
