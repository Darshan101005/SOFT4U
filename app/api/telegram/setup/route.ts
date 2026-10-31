import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { setupTelegramWebhook, tgCall, telegramEnabled } from '@/lib/telegram';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET: current webhook + bot info. */
export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  if (!telegramEnabled()) return NextResponse.json({ enabled: false });
  const [info, me] = await Promise.all([tgCall('getWebhookInfo'), tgCall('getMe')]);
  return NextResponse.json({ enabled: true, webhook: info.result, bot: me.result });
}

/** POST: registers the webhook at https://soft4u.top/api/telegram/webhook with the secret token. */
export async function POST() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const result = await setupTelegramWebhook();
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
