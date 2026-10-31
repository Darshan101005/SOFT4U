import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { adminResetCustomerTotp } from '@/lib/auth';
import { db, queryOne } from '@/lib/db';
import { errorResponse, readJson } from '@/lib/api';
import { unlinkUser } from '@/lib/telegram-link';
import { formatPersonName } from '@/lib/format-name';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET -> { user, lastActivity, activity[], orders[], telegram, stats, location }
 * location: coordinates + postal code of the latest activity row (for the map card).
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;
  const overview = await db.getCustomerOverview(id);
  if (!overview) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  const loc = overview.lastActivity
    ? await queryOne<{ latitude: number | null; longitude: number | null; postal: string | null; continent: string | null; calling_code: string | null; vpn_service: string | null }>(
        `SELECT latitude, longitude, postal, continent, calling_code, vpn_service FROM activity_log WHERE id = $1`,
        [overview.lastActivity.id],
      )
    : null;
  return NextResponse.json({
    ...overview,
    location: loc
      ? {
          latitude: loc.latitude !== null ? Number(loc.latitude) : null,
          longitude: loc.longitude !== null ? Number(loc.longitude) : null,
          postal: loc.postal,
          continent: loc.continent,
          callingCode: loc.calling_code,
          vpnService: loc.vpn_service,
        }
      : null,
  });
}

/** PATCH { name?, phone?, whatsapp?, telegram? } -> edits the customer's profile (email changes go through the customer). */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;
  try {
    const body = await readJson(req);
    const s = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : undefined);
    const rawName = s(body.name, 80);
    const name = rawName === undefined ? undefined : formatPersonName(rawName);
    if (name !== undefined && name.length < 2) return NextResponse.json({ error: 'Enter a name' }, { status: 400 });
    // Only send keys that were provided: updateRow writes NULL for keys present with undefined.
    const patch: Record<string, string> = {};
    if (name !== undefined) patch.name = name;
    const phone = s(body.phone, 30);
    if (phone !== undefined) patch.phone = phone;
    const whatsapp = s(body.whatsapp, 30);
    if (whatsapp !== undefined) patch.whatsapp = whatsapp;
    const telegram = s(body.telegram, 64);
    if (telegram !== undefined) patch.telegram = telegram.replace(/^@/, '');
    const updated = await db.updateUser(id, patch);
    if (!updated) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    return NextResponse.json({ ok: true, user: updated });
  } catch (err) {
    return errorResponse(err);
  }
}

/** POST { action: 'suspend'|'block' (reason?) | 'activate'|'unblock' | 'reset_2fa' | 'unlink_telegram' } */
export async function POST(req: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;
  try {
    const body = await readJson(req);
    switch (body.action) {
      case 'suspend':
      case 'block': {
        const user = await db.updateUser(id, { status: 'suspended', suspendedReason: String(body.reason || '').trim().slice(0, 300) || 'Blocked by admin' });
        // Blocking also disconnects Telegram, so the bot stops showing their orders and access.
        if (user) await unlinkUser(id);
        return NextResponse.json({ ok: true, user });
      }
      case 'activate':
      case 'unblock':
        return NextResponse.json({ ok: true, user: await db.updateUser(id, { status: 'active', suspendedReason: '' }) });
      case 'reset_2fa':
        await adminResetCustomerTotp(id);
        return NextResponse.json({ ok: true });
      case 'unlink_telegram':
        await unlinkUser(id);
        return NextResponse.json({ ok: true });
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err) {
    return errorResponse(err);
  }
}

/** DELETE -> deletes the customer account (orders stay, unlinked). */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;
  return NextResponse.json({ ok: await db.deleteUser(id) });
}
