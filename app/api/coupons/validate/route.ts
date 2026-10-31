import { NextRequest, NextResponse } from 'next/server';
import { errorResponse, readJson } from '@/lib/api';
import { couponProblem, priceCart } from '@/lib/checkout';
import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';
import { allowedCurrency } from '@/lib/currency-pref';

/** GET ?code= -> { coupon } quick check (dates, limit). Checkout re-validates everything. */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.trim();
  if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 });
  const coupon = await db.getCouponByCode(code);
  if (!coupon) return NextResponse.json({ error: 'Invalid or inactive coupon code' }, { status: 404 });
  const problem = couponProblem(coupon);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });
  const { usageCount: _u, usageLimit: _l, perUserLimit: _p, ...publicCoupon } = coupon;
  void _u;
  void _l;
  void _p;
  return NextResponse.json({ coupon: publicCoupon });
}

/**
 * POST { code, items: [{ productId, variantId, quantity }], currency, email? }
 *   -> { code, discount, subtotal, total, currency } priced exactly like checkout.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await readJson(req);
    const user = await getSessionUser();
    const cart = await priceCart({
      lines: Array.isArray(body.items) ? body.items : [],
      currency: await allowedCurrency(body.currency, req.headers),
      couponCode: String(body.code || ''),
      customerId: user?.id,
      email: user?.email || (body.email ? String(body.email) : undefined),
    });
    return NextResponse.json({ ok: true, code: cart.coupon?.code, discount: cart.discount, subtotal: cart.subtotal, total: cart.total, currency: cart.currency });
  } catch (err) {
    return errorResponse(err);
  }
}
