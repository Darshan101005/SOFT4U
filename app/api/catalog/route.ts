import { NextRequest, NextResponse } from 'next/server';
import { parseCatalogQuery } from '@/lib/catalog-query';
import { searchCatalog } from '@/lib/catalog';
import { getCurrencyFromCookies } from '@/lib/currency-pref';
import { errorResponse } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/catalog?<catalog query, see lib/catalog-query.ts>&currency=PKR|USD
 *   -> { products, total, catalogTotal, page, pageSize, currency, facets }
 * Without `currency` the visitor's cookie preference is used (PKR fallback).
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const requested = sp.get('currency');
    const currency = requested === 'USD' || requested === 'PKR' ? requested : (await getCurrencyFromCookies()).currency;
    const result = await searchCatalog(parseCatalogQuery(sp), currency);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (err) {
    return errorResponse(err);
  }
}
