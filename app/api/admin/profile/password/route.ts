import { NextRequest, NextResponse } from 'next/server';
import { changeAdminPassword, requireAdmin } from '@/lib/admin-auth';
import { errorResponse, readJson } from '@/lib/api';

/** POST { currentPassword, password } -> changes own password; other sessions are signed out. */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const body = await readJson(req);
    if (body.confirmPassword !== undefined && body.confirmPassword !== body.password) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
    }
    await changeAdminPassword(admin.id, String(body.currentPassword || ''), String(body.password || ''));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
