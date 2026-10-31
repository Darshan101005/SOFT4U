import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api';
import { listSessions, revokeSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** GET -> { sessions } (signed-in devices). */
export async function GET() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  return NextResponse.json({ sessions: await listSessions(user.id) });
}

/** DELETE ?id=<sessionId> -> signs that device out. */
export async function DELETE(req: NextRequest) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const id = req.nextUrl.searchParams.get('id') || '';
  return NextResponse.json({ ok: await revokeSession(user.id, id) });
}
