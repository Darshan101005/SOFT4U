import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { Currency, PaymentMethod } from '@/lib/db/types';
import { requireAdmin } from '@/lib/admin-auth';
import { errorResponse, readJson } from '@/lib/api';

export const dynamic = 'force-dynamic';

const TYPES: PaymentMethod['type'][] = ['bank', 'easypaisa', 'jazzcash', 'other'];

function clean(b: Record<string, any>, creating: boolean): Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'> | string {
  const s = (v: unknown, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const name = s(b.name, 80);
  if (name.length < 2) return 'Enter the method name';
  const key = s(b.key, 40).toLowerCase().replace(/[^a-z0-9_]/g, '_');
  if (creating && key.length < 2) return 'Enter a short key, e.g. meezan_bank';
  if (!s(b.accountTitle) || !s(b.accountNumber)) return 'Enter the account title and account number customers pay to';
  const logo = s(b.logo, 500);
  if (logo && !/^(https:\/\/|\/)/.test(logo)) return 'The logo must be an uploaded image';
  const currencies = (Array.isArray(b.currencies) ? b.currencies : []).filter((c: string) => c === 'PKR' || c === 'USD') as Currency[];
  if (currencies.length === 0) return 'Pick at least one order currency';
  return {
    key,
    name,
    type: TYPES.includes(b.type) ? b.type : 'other',
    description: s(b.description),
    accountTitle: s(b.accountTitle, 120),
    accountNumber: s(b.accountNumber, 60),
    iban: s(b.iban, 60).toUpperCase().replace(/\s+/g, ''),
    bankName: s(b.bankName, 120),
    branch: s(b.branch, 200),
    instructions: s(b.instructions, 1000),
    logo: logo || undefined,
    currencies,
    enabled: Boolean(b.enabled),
    displayOrder: Math.floor(Number(b.displayOrder) || 0),
  };
}

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  return NextResponse.json({ methods: await db.getPaymentMethods() });
}

/** POST { action: 'create' (method) | 'update' (id, method) | 'toggle' (id, enabled) | 'delete' (id) } */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const body = await readJson(req);
    try {
      if (body.action === 'create' || body.action === 'update') {
        const m = clean(body.method || {}, body.action === 'create');
        if (typeof m === 'string') return NextResponse.json({ error: m }, { status: 400 });
        if (body.action === 'create') return NextResponse.json({ success: true, method: await db.createPaymentMethod(m) }, { status: 201 });
        const { key: _key, ...rest } = m;
        void _key;
        const updated = await db.updatePaymentMethod(String(body.id), rest);
        if (!updated) return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
        return NextResponse.json({ success: true, method: updated });
      }
      if (body.action === 'toggle' && body.id) {
        if (!body.enabled) {
          const enabled = (await db.getPaymentMethods(true)).filter(m => m.id !== body.id);
          if (enabled.length === 0) return NextResponse.json({ error: 'Keep at least one payment method switched on, otherwise customers cannot pay' }, { status: 409 });
        }
        return NextResponse.json({ success: true, method: await db.updatePaymentMethod(String(body.id), { enabled: Boolean(body.enabled) }) });
      }
      if (body.action === 'delete' && body.id) {
        return NextResponse.json({ success: await db.deletePaymentMethod(String(body.id)) });
      }
    } catch (err) {
      if ((err as { code?: string })?.code === '23505') return NextResponse.json({ error: 'That key is already used by another method' }, { status: 409 });
      throw err;
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return errorResponse(err);
  }
}
