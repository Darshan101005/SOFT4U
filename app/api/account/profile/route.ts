import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { errorResponse, readJson, requireUser } from '@/lib/api';

export const dynamic = 'force-dynamic';

function clean(v: unknown, max: number): string | undefined {
  if (v === undefined) return undefined;
  const s = String(v ?? '').trim().slice(0, max);
  return s;
}

/** GET -> { user } */
export async function GET() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  return NextResponse.json({ user });
}

/**
 * PATCH { name?, phone?, whatsapp?, telegram? } -> { user }.
 * Phone / WhatsApp / Telegram are contact details only (not verified).
 */
export async function PATCH(req: NextRequest) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  try {
    const body = await readJson(req);
    const name = clean(body.name, 80);
    if (name !== undefined && name.length < 2) return NextResponse.json({ error: 'Enter your full name' }, { status: 400 });
    const phone = clean(body.phone, 24);
    const whatsapp = clean(body.whatsapp, 24);
    const telegram = clean(body.telegram, 40)?.replace(/^@+/, '');
    const phoneRe = /^\+?[0-9 ()-]{7,20}$/;
    if (phone && !phoneRe.test(phone)) return NextResponse.json({ error: 'Enter a valid mobile number' }, { status: 400 });
    if (whatsapp && !phoneRe.test(whatsapp)) return NextResponse.json({ error: 'Enter a valid WhatsApp number with country code' }, { status: 400 });
    if (telegram && !/^[A-Za-z0-9_]{4,32}$/.test(telegram)) return NextResponse.json({ error: 'Enter a valid Telegram username' }, { status: 400 });
    const updates: Record<string, string | undefined> = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone || undefined;
    if (whatsapp !== undefined) updates.whatsapp = whatsapp || undefined;
    if (telegram !== undefined) updates.telegram = telegram || undefined;
    const updated = await db.updateUser(user.id, updates);
    return NextResponse.json({ ok: true, user: updated });
  } catch (err) {
    return errorResponse(err);
  }
}
