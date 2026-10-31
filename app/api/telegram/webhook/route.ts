import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { telegramEnabled, type TgUpdate } from '@/lib/telegram';
import { handleTelegramUpdate } from '@/lib/telegram-bot';
import { registerTelegramAssistant } from '@/lib/telegram-ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Free-text messages are answered by SOFT4U ASSISTANT.
registerTelegramAssistant();

function secretMatches(got: string | null): boolean {
  const expected = (process.env.TELEGRAM_WEBHOOK_SECRET || '').trim();
  if (!expected || !got) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(got.trim());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Telegram webhook. Rejects calls without the secret token set by setWebhook. */
export async function POST(request: NextRequest) {
  if (!secretMatches(request.headers.get('x-telegram-bot-api-secret-token'))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!telegramEnabled()) return NextResponse.json({ ok: true });

  let update: TgUpdate;
  try {
    update = (await request.json()) as TgUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }
  try {
    await handleTelegramUpdate(update);
  } catch (err) {
    console.error('[telegram] webhook handler error:', err instanceof Error ? err.message : err);
  }
  // Always 200 so Telegram does not retry the same update.
  return NextResponse.json({ ok: true });
}
