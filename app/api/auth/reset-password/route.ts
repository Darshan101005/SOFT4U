import { NextRequest, NextResponse } from 'next/server';
import { resetPassword } from '@/lib/auth';
import { errorResponse, readJson } from '@/lib/api';
import { peekLinkToken } from '@/lib/otp';
import { logActivity } from '@/lib/activity';

/** GET ?token= -> { valid, email } so the reset form can show which account it is for. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || '';
  const email = await peekLinkToken(token, 'password_reset');
  return NextResponse.json({ valid: Boolean(email), email });
}

/** POST { email, code, password, confirmPassword } or { token, password, confirmPassword }. Signs out every session. */
export async function POST(req: NextRequest) {
  try {
    const body = await readJson(req);
    const proof = body.token ? { token: String(body.token) } : { email: String(body.email || ''), code: String(body.code || '') };
    const result = await resetPassword(proof, String(body.password || ''), body.confirmPassword === undefined ? undefined : String(body.confirmPassword));
    logActivity({ headers: req.headers, eventType: 'password_reset', email: result.email, actorType: 'guest' });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
