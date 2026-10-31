import { NextRequest, NextResponse } from 'next/server';
import { requestPasswordReset } from '@/lib/auth';
import { errorResponse, readJson } from '@/lib/api';

/** POST { email } -> always { ok } (no account enumeration). Emails a code and a reset link if the account exists. */
export async function POST(req: NextRequest) {
  try {
    const body = await readJson(req);
    const result = await requestPasswordReset(String(body.email || ''));
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return errorResponse(err);
  }
}
