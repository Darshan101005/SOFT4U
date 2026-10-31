import { NextRequest, NextResponse } from 'next/server';
import { adminLogin } from '@/lib/admin-auth';
import { AuthError } from '@/lib/auth';
import { errorResponse, readJson } from '@/lib/api';
import { logActivity } from '@/lib/activity';

/** POST { email, password } -> { status: 'ok', admin } | { status: 'two_factor_required' } (then /api/admin/2fa/login-verify). */
export async function POST(req: NextRequest) {
  const body = await readJson(req);
  const email = String(body.email || '');
  try {
    const result = await adminLogin(email, String(body.password || ''));
    if (result.status === 'ok') {
      logActivity({ headers: req.headers, eventType: 'admin_login', userId: result.admin.id, email: result.admin.email, actorType: 'admin' });
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof AuthError && err.code === 'INVALID_CREDENTIALS') {
      logActivity({ headers: req.headers, eventType: 'admin_login_failed', email, actorType: 'admin' });
    }
    return errorResponse(err);
  }
}
