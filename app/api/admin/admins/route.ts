import { NextRequest, NextResponse } from 'next/server';
import { createAdmin, requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { errorResponse, readJson } from '@/lib/api';

export const dynamic = 'force-dynamic';

/** GET -> { admins } */
export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  return NextResponse.json({ admins: await db.getAdmins() });
}

/** POST { name, email, password } -> { admin } (any admin can add admins). */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const body = await readJson(req);
    const created = await createAdmin({ name: String(body.name || ''), email: String(body.email || ''), password: String(body.password || '') }, admin.id);
    return NextResponse.json({ ok: true, admin: created }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
