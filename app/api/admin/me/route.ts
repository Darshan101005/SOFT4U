import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

/** GET -> { admin } for the signed-in admin. */
export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  return NextResponse.json({ admin });
}
