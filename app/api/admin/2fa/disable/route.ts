import { NextRequest, NextResponse } from 'next/server';
import { disableAdminTotp, requireAdmin } from '@/lib/admin-auth';
import { errorResponse, readJson } from '@/lib/api';

/** POST { password, code } -> turns off 2FA for the signed-in admin. */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const body = await readJson(req);
    await disableAdminTotp(admin.id, String(body.password || ''), String(body.code || ''));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
