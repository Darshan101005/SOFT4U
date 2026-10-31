import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api';
import { botLink, botUsername, chatIdsForUser, sendMessage, telegramEnabled } from '@/lib/telegram';
import { createLinkCode, getTelegramLinkForUser, unlinkUser } from '@/lib/telegram-link';

export const dynamic = 'force-dynamic';

/** GET -> { enabled, botUsername, botUrl, linked } for the account Telegram card. */
export async function GET() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  return NextResponse.json({
    enabled: telegramEnabled(),
    botUsername: botUsername(),
    botUrl: botLink(),
    linked: await getTelegramLinkForUser(user.id),
  });
}

/** POST -> { code, expiresAt, deepLink }: a fresh 6-character code (valid 15 minutes, single use). */
export async function POST() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  if (!telegramEnabled()) return NextResponse.json({ error: 'Telegram is not available right now' }, { status: 503 });
  const code = await createLinkCode(user.id);
  return NextResponse.json({ ok: true, ...code, deepLink: botLink(code.code) });
}

/** DELETE -> disconnects every Telegram chat from this account. */
export async function DELETE() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const chats = telegramEnabled() ? await chatIdsForUser(user.id).catch(() => []) : [];
  await unlinkUser(user.id);
  for (const chatId of chats) {
    await sendMessage(chatId, '🔌 This Telegram was disconnected from your account on the website. Use /link to connect again.');
  }
  return NextResponse.json({ ok: true });
}
