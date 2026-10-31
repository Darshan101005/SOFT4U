import { NextRequest, NextResponse } from 'next/server';
import { enableTotp } from '@/lib/auth';
import { errorResponse, readJson, requireUser } from '@/lib/api';
import { requestMeta } from '@/lib/request-meta';
import { logActivity } from '@/lib/activity';

/** POST { code } -> turns on 2FA after checking the first authenticator code. */
export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  try {
    const body = await readJson(req);
    await enableTotp(user.id, String(body.code || ''), requestMeta(req));
    logActivity({ headers: req.headers, eventType: '2fa_enabled', userId: user.id, email: user.email });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
