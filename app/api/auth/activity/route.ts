import { NextRequest, NextResponse } from 'next/server';
import { readJson } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { recordActivity } from '@/lib/activity';

/**
 * POST { clientIpv4?, clientIpv6? } -> logs one "session" row (IP, geo, device)
 * for the signed-in customer. Called once per browser tab by <ActivityLogger />.
 * The user comes from the session cookie, never from the body.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Please sign in' }, { status: 401 });
  const body = await readJson(req);
  await recordActivity({
    headers: req.headers,
    eventType: 'session',
    userId: user.id,
    email: user.email,
    clientIpv4: typeof body.clientIpv4 === 'string' ? body.clientIpv4 : null,
    clientIpv6: typeof body.clientIpv6 === 'string' ? body.clientIpv6 : null,
  });
  return NextResponse.json({ ok: true });
}
