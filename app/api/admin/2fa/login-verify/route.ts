import { NextRequest, NextResponse } from 'next/server';
import { adminVerifyLogin2fa } from '@/lib/admin-auth';
import { errorResponse, readJson } from '@/lib/api';
import { logActivity } from '@/lib/activity';

/** POST { code } -> { admin }. Second admin sign-in step (pending cookie from /api/admin/login). */
export async function POST(req: NextRequest) {
  try {
    const body = await readJson(req);
    const admin = await adminVerifyLogin2fa(String(body.code || ''));
    logActivity({ headers: req.headers, eventType: 'admin_login', userId: admin.id, email: admin.email, actorType: 'admin' });
    return NextResponse.json({ ok: true, admin });
  } catch (err) {
    return errorResponse(err);
  }
}
