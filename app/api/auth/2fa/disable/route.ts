import { NextRequest, NextResponse } from 'next/server';
import { disableTotp } from '@/lib/auth';
import { errorResponse, readJson, requireUser } from '@/lib/api';
import { requestMeta } from '@/lib/request-meta';
import { logActivity } from '@/lib/activity';

/** POST { password, code } -> turns off 2FA. */
export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  try {
    const body = await readJson(req);
    await disableTotp(user.id, String(body.password || ''), String(body.code || ''), requestMeta(req));
    logActivity({ headers: req.headers, eventType: '2fa_disabled', userId: user.id, email: user.email });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
