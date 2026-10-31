import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { botLink, botUsername, telegramEnabled } from '@/lib/telegram';
import { createAdminLinkCode, unlinkAdmin } from '@/lib/telegram-link';

/** POST -> { code, deepLink } to connect this admin's Telegram for order alerts. */
export async function POST() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  if (!telegramEnabled()) return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN is not set' }, { status: 503 });
  const code = await createAdminLinkCode(admin.id);
  return NextResponse.json({ ok: true, ...code, botUsername: botUsername(), deepLink: botLink(code.code) });
}

/** DELETE -> stops Telegram alerts for this admin. */
export async function DELETE() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  await unlinkAdmin(admin.id);
  return NextResponse.json({ ok: true });
}
