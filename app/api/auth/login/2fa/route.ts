import { NextRequest, NextResponse } from 'next/server';
import { completeLogin2fa } from '@/lib/auth';
import { errorResponse, readJson } from '@/lib/api';
import { getPending2faUserId } from '@/lib/session';
import { logActivity } from '@/lib/activity';

/** POST { code } -> { user }. Second sign-in step for accounts with two-factor authentication. */
export async function POST(req: NextRequest) {
  try {
    const userId = await getPending2faUserId();
    if (!userId) return NextResponse.json({ error: 'Your sign-in step expired. Sign in again.', code: 'EXPIRED' }, { status: 401 });
    const body = await readJson(req);
    const user = await completeLogin2fa(userId, String(body.code || ''));
    logActivity({ headers: req.headers, eventType: 'login', userId: user.id, email: user.email });
    return NextResponse.json({ ok: true, user });
  } catch (err) {
    return errorResponse(err);
  }
}
