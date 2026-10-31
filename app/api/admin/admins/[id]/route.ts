import { NextRequest, NextResponse } from 'next/server';
import { deleteAdmin, requireAdmin, resetAdminTotp, setAdminPassword, setAdminStatus, updateAdminProfile } from '@/lib/admin-auth';
import { errorResponse, readJson } from '@/lib/api';

type Ctx = { params: Promise<{ id: string }> };

/**
 * PATCH { status?: 'active'|'paused', name?, email?, password?, resetTwoFactor?: true }.
 * Pausing / deleting is refused when it would leave no active admin (409 LAST_ACTIVE_ADMIN).
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;
  try {
    const body = await readJson(req);
    let result = null;
    if (typeof body.name === 'string' || typeof body.email === 'string') {
      result = await updateAdminProfile(id, {
        name: typeof body.name === 'string' ? body.name : undefined,
        email: typeof body.email === 'string' ? body.email : undefined,
      });
    }
    if (typeof body.password === 'string' && body.password) await setAdminPassword(id, body.password);
    if (body.resetTwoFactor === true) await resetAdminTotp(id);
    if (body.status === 'active' || body.status === 'paused') result = await setAdminStatus(id, body.status);
    return NextResponse.json({ ok: true, admin: result, self: id === admin.id });
  } catch (err) {
    return errorResponse(err);
  }
}

/** DELETE -> removes the admin (refused for the last active admin). */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;
  try {
    await deleteAdmin(id);
    return NextResponse.json({ ok: true, selfDeleted: id === admin.id });
  } catch (err) {
    return errorResponse(err);
  }
}
