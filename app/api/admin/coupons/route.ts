import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { Coupon } from '@/lib/db/types';
import { requireAdmin } from '@/lib/admin-auth';
import { errorResponse, readJson } from '@/lib/api';

export const dynamic = 'force-dynamic';

type CouponInput = Omit<Coupon, 'id' | 'createdAt' | 'usageCount'>;

function clean(body: Record<string, any>): CouponInput | string {
  const code = String(body.code || '').trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) return 'Code must be 3-32 letters, numbers, dashes or underscores';
  const type = body.type === 'fixed' ? 'fixed' : 'percentage';
  const value = Number(body.value);
  if (!(value > 0)) return 'Enter a discount value';
  if (type === 'percentage' && value > 100) return 'A percentage cannot be more than 100';
  const optNum = (v: unknown) => (v === '' || v === null || v === undefined || !Number.isFinite(Number(v)) || Number(v) <= 0 ? undefined : Number(v));
  const optDate = (v: unknown) => (typeof v === 'string' && v.trim() ? new Date(v).toISOString() : undefined);
  const startDate = optDate(body.startDate);
  const expiryDate = optDate(body.expiryDate);
  if (startDate && expiryDate && expiryDate <= startDate) return 'The end date must be after the start date';
  return {
    code,
    description: String(body.description || '').trim().slice(0, 200) || undefined,
    type,
    value,
    minOrderAmount: optNum(body.minOrderAmount),
    maxDiscount: optNum(body.maxDiscount),
    usageLimit: optNum(body.usageLimit) ? Math.floor(Number(body.usageLimit)) : undefined,
    perUserLimit: optNum(body.perUserLimit) ? Math.floor(Number(body.perUserLimit)) : undefined,
    startDate,
    expiryDate,
    enabled: body.enabled !== false,
    productIds: Array.isArray(body.productIds) ? body.productIds.map(String) : [],
    categoryIds: Array.isArray(body.categoryIds) ? body.categoryIds.map(String) : [],
  };
}

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  return NextResponse.json({ coupons: await db.getCoupons() });
}

/** POST { action: 'create' (coupon) | 'update' (id, coupon) | 'toggle' (id, enabled) | 'delete' (id) }. Fixed amounts are PKR (converted for USD orders). */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const body = await readJson(req);
    try {
      if (body.action === 'create' || body.action === 'update') {
        const c = clean(body.coupon || {});
        if (typeof c === 'string') return NextResponse.json({ error: c }, { status: 400 });
        if (body.action === 'create') return NextResponse.json({ success: true, coupon: await db.createCoupon(c) }, { status: 201 });
        const updated = await db.updateCoupon(String(body.id), c);
        if (!updated) return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
        return NextResponse.json({ success: true, coupon: updated });
      }
      if (body.action === 'toggle' && body.id) {
        return NextResponse.json({ success: true, coupon: await db.updateCoupon(String(body.id), { enabled: Boolean(body.enabled) }) });
      }
      if (body.action === 'delete' && body.id) {
        return NextResponse.json({ success: await db.deleteCoupon(String(body.id)) });
      }
    } catch (err) {
      if ((err as { code?: string })?.code === '23505') return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 409 });
      throw err;
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return errorResponse(err);
  }
}
