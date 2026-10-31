import { NextResponse } from 'next/server';
import { beginTotpSetup } from '@/lib/auth';
import { errorResponse, requireUser } from '@/lib/api';

/** POST -> { secret, otpauthUrl, qrDataUrl }. Then confirm with /api/auth/2fa/enable. */
export async function POST() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  try {
    return NextResponse.json({ ok: true, ...(await beginTotpSetup(user.id)) });
  } catch (err) {
    return errorResponse(err);
  }
}
