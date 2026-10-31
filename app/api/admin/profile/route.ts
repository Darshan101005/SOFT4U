import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, updateAdminProfile } from '@/lib/admin-auth';
import { errorResponse, readJson } from '@/lib/api';

/** PATCH { name?, email? } -> { admin } (own profile). */
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const body = await readJson(req);
    const updated = await updateAdminProfile(admin.id, {
      name: typeof body.name === 'string' ? body.name : undefined,
      email: typeof body.email === 'string' ? body.email : undefined,
    });
    return NextResponse.json({ ok: true, admin: updated });
  } catch (err) {
    return errorResponse(err);
  }
}
