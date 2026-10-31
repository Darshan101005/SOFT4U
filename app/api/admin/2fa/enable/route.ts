import { NextRequest, NextResponse } from 'next/server';
import { enableAdminTotp, requireAdmin } from '@/lib/admin-auth';
import { errorResponse, readJson } from '@/lib/api';

/** POST { code } -> turns on 2FA for the signed-in admin. */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const body = await readJson(req);
    await enableAdminTotp(admin.id, String(body.code || ''));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
