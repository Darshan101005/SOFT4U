import { NextRequest, NextResponse } from 'next/server';
import { signUp } from '@/lib/auth';
import { errorResponse, readJson } from '@/lib/api';
import { requestMeta } from '@/lib/request-meta';
import { logActivity } from '@/lib/activity';

/** POST { name, email, password, confirmPassword } -> { email, resendInSeconds }. Sends the 6-digit code. */
export async function POST(req: NextRequest) {
  try {
    const body = await readJson(req);
    const result = await signUp(
      { name: String(body.name || ''), email: String(body.email || ''), password: String(body.password || ''), confirmPassword: String(body.confirmPassword ?? '') },
      requestMeta(req),
    );
    logActivity({ headers: req.headers, eventType: 'signup', email: result.email, actorType: 'guest' });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return errorResponse(err);
  }
}
