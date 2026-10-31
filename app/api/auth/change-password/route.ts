import { NextRequest, NextResponse } from 'next/server';
import { changePassword } from '@/lib/auth';
import { errorResponse, readJson, requireUser } from '@/lib/api';
import { logActivity } from '@/lib/activity';

/** POST { currentPassword, password, confirmPassword }. Other sessions are signed out. */
export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  try {
    const body = await readJson(req);
    await changePassword(user.id, String(body.currentPassword || ''), String(body.password || ''), body.confirmPassword === undefined ? undefined : String(body.confirmPassword));
    logActivity({ headers: req.headers, eventType: 'password_change', userId: user.id, email: user.email });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
