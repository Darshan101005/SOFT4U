import { NextRequest, NextResponse } from 'next/server';
import { destroySession, getSessionUser } from '@/lib/session';
import { logActivity } from '@/lib/activity';

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  await destroySession();
  if (user) logActivity({ headers: req.headers, eventType: 'logout', userId: user.id, email: user.email });
  return NextResponse.json({ ok: true });
}
