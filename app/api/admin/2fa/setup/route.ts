import { NextResponse } from 'next/server';
import { beginAdminTotpSetup, requireAdmin } from '@/lib/admin-auth';
import { errorResponse } from '@/lib/api';

/** POST -> { secret, otpauthUrl, qrDataUrl } for the signed-in admin. */
export async function POST() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    return NextResponse.json({ ok: true, ...(await beginAdminTotpSetup(admin.id)) });
  } catch (err) {
    return errorResponse(err);
  }
}
