import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.json({ error: 'Code is required' }, { status: 400 });
  }

  const coupon = await db.getCouponByCode(code);
  if (!coupon) {
    return NextResponse.json({ error: 'Invalid or inactive coupon code' }, { status: 404 });
  }

  if (coupon.expiryDate && new Date(coupon.expiryDate).getTime() < Date.now()) {
    return NextResponse.json({ error: 'This coupon code has expired' }, { status: 400 });
  }

  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 });
  }

  return NextResponse.json({ coupon });
}
