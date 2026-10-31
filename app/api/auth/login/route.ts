import { NextRequest, NextResponse } from 'next/server';
import { AuthError, login } from '@/lib/auth';
import { errorResponse, readJson } from '@/lib/api';
import { requestMeta } from '@/lib/request-meta';
import { logActivity } from '@/lib/activity';

/**
 * POST { email, password } ->
 *   { status: 'ok', user }                                  signed in
 *   { status: 'two_factor_required' }                       POST /api/auth/login/2fa next
 *   { status: 'verification_required', email, resendInSeconds }  code sent, verify via /api/auth/verify-email
 */
export async function POST(req: NextRequest) {
  const body = await readJson(req);
  const email = String(body.email || '');
  try {
    const result = await login(email, String(body.password || ''), requestMeta(req));
    if (result.status === 'ok') {
      logActivity({ headers: req.headers, eventType: 'login', userId: result.user.id, email: result.user.email });
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof AuthError && err.code === 'INVALID_CREDENTIALS') {
      logActivity({ headers: req.headers, eventType: 'login_failed', email, actorType: 'guest' });
    }
    return errorResponse(err);
  }
}
