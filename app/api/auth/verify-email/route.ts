import { NextRequest, NextResponse } from 'next/server';
import { verifySignup } from '@/lib/auth';
import { errorResponse, readJson } from '@/lib/api';
import { requestMeta } from '@/lib/request-meta';
import { logActivity } from '@/lib/activity';

/** POST { email, code } -> { user }. Activates the account and signs the user in. */
export async function POST(req: NextRequest) {
  try {
    const body = await readJson(req);
    const user = await verifySignup(String(body.email || ''), String(body.code || ''), requestMeta(req));
    logActivity({ headers: req.headers, eventType: 'email_verified', userId: user.id, email: user.email });
    return NextResponse.json({ ok: true, user });
  } catch (err) {
    return errorResponse(err);
  }
}
