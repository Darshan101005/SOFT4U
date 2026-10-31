import { askAssistant, type AssistantTurn } from '@/lib/ai-assistant';
import { db } from '@/lib/db';
import { isLimited, recordAttempt } from '@/lib/rate-limit';
import { esc } from '@/lib/telegram';
import { setFreeTextHandler } from '@/lib/telegram-bot';
import { getState, setState } from '@/lib/telegram-link';

/**
 * Connects SOFT4U ASSISTANT (lib/ai-assistant) to the Telegram bot's free
 * text. The customer identity is the account linked to the chat, so the
 * account tools only ever see that customer's data. A short conversation
 * history is kept in telegram_state (mode 'ai') and cleared by any command.
 */

const HISTORY_TURNS = 8;
const MAX_PER_10_MIN = 20;

/** Markdown-ish model output to Telegram HTML (bold, code, links, bullets). */
export function toTelegramHtml(text: string): string {
  let out = esc(text.trim());
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, label: string, url: string) => `<a href="${url.replace(/"/g, '&quot;')}">${label}</a>`);
  out = out.replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>');
  out = out.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  out = out.replace(/^\s*[-*]\s+/gm, '• ');
  out = out.replace(/^#{1,6}\s*(.+)$/gm, '<b>$1</b>');
  return out.length > 3900 ? `${out.slice(0, 3900)}…` : out;
}

export function registerTelegramAssistant(): void {
  setFreeTextHandler(async ({ chatId, text, userId }) => {
    const settings = await db.getSiteSettings().catch(() => null);
    if (settings && !settings.aiSupportEnabled) return null;
    const key = `ai-tg:${chatId}`;
    if (await isLimited(key, MAX_PER_10_MIN, 10)) return 'You are sending messages very quickly. Please wait a few minutes, or use /help for the menu.';
    await recordAttempt(key);

    const state = await getState(chatId);
    const history: AssistantTurn[] = state?.mode === 'ai' && Array.isArray(state.data.history) ? (state.data.history as AssistantTurn[]) : [];
    const { reply } = await askAssistant(text, history, { userId, channel: 'telegram' });
    const next = [...history, { role: 'user' as const, text }, { role: 'assistant' as const, text: reply }].slice(-HISTORY_TURNS);
    await setState(chatId, 'ai', { history: next }).catch(() => undefined);
    return toTelegramHtml(reply);
  });
}
