import { NextRequest, NextResponse } from 'next/server';
import { resendCode } from '@/lib/auth';
import { errorResponse, readJson } from '@/lib/api';

/** POST { email, purpose: 'signup' | 'password_reset' } -> { resendInSeconds }. 429 with retryAfterSeconds on cooldown. */
export async function POST(req: NextRequest) {
  try {
    const body = await readJson(req);
    const purpose = body.purpose === 'password_reset' ? 'password_reset' : 'signup';
    const result = await resendCode(String(body.email || ''), purpose);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return errorResponse(err);
  }
}
