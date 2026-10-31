import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET ?currency=PKR|USD -> { methods } enabled payment accounts for checkout
 * (eSIM4U /api/bank-details equivalent; public because guest checkout exists).
 * receiveCurrency is the currency the account receives (PKR, or GBP for the UK account).
 */
export async function GET(req: NextRequest) {
  const currency = req.nextUrl.searchParams.get('currency') === 'USD' ? 'USD' : 'PKR';
  const methods = (await db.getPaymentMethods(true))
    .filter(m => m.currencies.includes(currency))
    .map(m => ({
      key: m.key,
      name: m.name,
      type: m.type,
      description: m.description,
      accountTitle: m.accountTitle,
      accountNumber: m.accountNumber,
      iban: m.iban,
      bankName: m.bankName,
      branch: m.branch,
      sortCode: m.sortCode,
      instructions: m.instructions,
      logo: m.logo,
      receiveCurrency: m.payCurrency,
    }));
  return NextResponse.json({ methods }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } });
}
