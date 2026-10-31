import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { askAssistant, type AssistantTurn } from '@/lib/ai-assistant';
import { readJson } from '@/lib/api';
import { getSessionUser } from '@/lib/session';
import { clientIp } from '@/lib/request-meta';
import { isLimited, recordAttempt } from '@/lib/rate-limit';
import { siteConfig } from '@/lib/site-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MAX_MESSAGES = 30;
const WINDOW_MINUTES = 10;

/**
 * SOFT4U ASSISTANT chat endpoint. The customer identity comes only from the
 * session cookie; account tools are scoped to that user server-side.
 */
export async function POST(req: NextRequest) {
  const body = await readJson<{ message?: unknown; history?: unknown }>(req);
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  if (message.length > 1500) return NextResponse.json({ error: 'Please keep the message under 1500 characters.' }, { status: 400 });

  try {
    const settings = await db.getSiteSettings();
    if (!settings.aiSupportEnabled) {
      return NextResponse.json({
        reply: `The assistant is offline right now. Our team can help: email ${settings.contactEmail || siteConfig.email} or WhatsApp ${settings.contactWhatsapp || siteConfig.whatsapp}.`,
        provider: 'fallback',
      });
    }

    const user = await getSessionUser();
    const key = `ai:${user ? user.id : clientIp(req) || 'anon'}`;
    if (await isLimited(key, MAX_MESSAGES, WINDOW_MINUTES)) {
      return NextResponse.json({ reply: 'You are sending messages very quickly. Please wait a few minutes and try again.', provider: 'fallback' }, { status: 429 });
    }
    await recordAttempt(key);

    const history = Array.isArray(body.history) ? (body.history as AssistantTurn[]) : [];
    const result = await askAssistant(message, history, { userId: user?.id ?? null, channel: 'web' });
    return NextResponse.json({ ...result, signedIn: Boolean(user) });
  } catch (err) {
    console.error('[ai-support] error:', err instanceof Error ? err.message : err);
    return NextResponse.json({
      reply: `Sorry, I could not answer that just now. Browse the catalogue at /shop, track an order at /track-order, or contact ${siteConfig.email}.`,
      provider: 'fallback',
    });
  }
}
