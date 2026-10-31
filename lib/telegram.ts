import { getPool } from '@/lib/db/pool';
import type { DeliveryField, Order } from '@/lib/db/types';
import { formatMoney } from '@/lib/money';
import { siteConfig } from '@/lib/site-config';

/**
 * Telegram Bot API client for the SOFT4U ASSISTANT bot. The bot runs on the
 * same Next.js backend through a webhook (no polling process). Everything is
 * a no-op until TELEGRAM_BOT_TOKEN is set; calls never throw.
 */

const API = 'https://api.telegram.org';

export const BOT_NAME = 'SOFT4U ASSISTANT';

export function telegramEnabled(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

export function botUsername(): string | null {
  return (process.env.TELEGRAM_BOT_USERNAME || '').replace(/^@/, '') || null;
}

/** t.me deep link; with a code the bot links the account on /start. */
export function botLink(startCode?: string): string | null {
  const u = botUsername();
  if (!u) return null;
  return startCode ? `https://t.me/${u}?start=${encodeURIComponent(startCode)}` : `https://t.me/${u}`;
}

export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || siteConfig.url).replace(/\/$/, '');
}

/** Public HTTPS webhook URL (always the production domain, never localhost). */
export function webhookUrl(): string {
  return `${siteConfig.url}/api/telegram/webhook`;
}

/* ---------------- Types ---------------- */

export interface TgUser {
  id: number;
  is_bot: boolean;
  first_name?: string;
  last_name?: string;
  username?: string;
}
export interface TgChat {
  id: number;
  type: string;
}
export interface TgMessage {
  message_id: number;
  from?: TgUser;
  chat: TgChat;
  date: number;
  text?: string;
  caption?: string;
}
export interface TgCallbackQuery {
  id: string;
  from: TgUser;
  message?: TgMessage;
  data?: string;
}
export interface TgUpdate {
  update_id: number;
  message?: TgMessage;
  edited_message?: TgMessage;
  callback_query?: TgCallbackQuery;
}
export interface InlineButton {
  text: string;
  callback_data?: string;
  url?: string;
}
export type InlineKeyboard = InlineButton[][];

interface TgResponse<T = unknown> {
  ok: boolean;
  result?: T;
  description?: string;
}

/* ---------------- Core ---------------- */

export async function tgCall<T = unknown>(method: string, payload: Record<string, unknown> = {}): Promise<TgResponse<T>> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, description: 'TELEGRAM_BOT_TOKEN not set' };
  try {
    const res = await fetch(`${API}/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });
    const data = (await res.json()) as TgResponse<T>;
    if (!data.ok) console.error(`[telegram] ${method} failed:`, data.description);
    return data;
  } catch (err) {
    console.error(`[telegram] ${method} error:`, err instanceof Error ? err.message : err);
    return { ok: false, description: err instanceof Error ? err.message : 'request failed' };
  }
}

/** Escapes text for Telegram HTML parse mode. */
export function esc(text: unknown): string {
  return String(text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function sendMessage(chatId: number | string, text: string, opts: { keyboard?: InlineKeyboard; replyMarkup?: Record<string, unknown> } = {}) {
  return tgCall('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: opts.replyMarkup ?? (opts.keyboard ? { inline_keyboard: opts.keyboard } : undefined),
  });
}

export async function editMessageText(chatId: number | string, messageId: number, text: string, keyboard?: InlineKeyboard) {
  return tgCall('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: keyboard ? { inline_keyboard: keyboard } : undefined,
  });
}

export async function answerCallbackQuery(id: string, text?: string) {
  return tgCall('answerCallbackQuery', { callback_query_id: id, text });
}

export async function deleteMessage(chatId: number | string, messageId: number) {
  return tgCall('deleteMessage', { chat_id: chatId, message_id: messageId });
}

export async function sendChatAction(chatId: number | string, action = 'typing') {
  return tgCall('sendChatAction', { chat_id: chatId, action });
}

export const BOT_COMMANDS = [
  { command: 'start', description: 'Main menu' },
  { command: 'orders', description: 'My recent orders' },
  { command: 'order', description: 'Order status: /order S4U-XXXXXXXXXX' },
  { command: 'access', description: 'Delivered access: /access S4U-XXXXXXXXXX' },
  { command: 'products', description: 'Available products and prices' },
  { command: 'support', description: 'Contact support or open a ticket' },
  { command: 'link', description: 'Connect your Soft4u account' },
  { command: 'unlink', description: 'Disconnect this Telegram' },
  { command: 'help', description: 'How to use the bot' },
];

/**
 * Registers the webhook (production URL + secret token), the command list and
 * the bot description. Run from `bun run telegram:setup` or the admin action.
 */
export async function setupTelegramWebhook(): Promise<{ ok: boolean; url: string; details: Record<string, string | boolean | undefined> }> {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!telegramEnabled()) return { ok: false, url: webhookUrl(), details: { error: 'TELEGRAM_BOT_TOKEN not set' } };
  if (!secret) return { ok: false, url: webhookUrl(), details: { error: 'TELEGRAM_WEBHOOK_SECRET not set' } };
  const url = webhookUrl();
  const hook = await tgCall('setWebhook', {
    url,
    secret_token: secret,
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: true,
  });
  const commands = await tgCall('setMyCommands', { commands: BOT_COMMANDS });
  const desc = await tgCall('setMyDescription', {
    description: `${BOT_NAME} for ${siteConfig.name}: check products and prices, track your orders and receive your delivered access here.`,
  });
  const short = await tgCall('setMyShortDescription', { short_description: `${siteConfig.name} orders, deliveries and support` });
  const name = await tgCall('setMyName', { name: BOT_NAME });
  return {
    ok: hook.ok && commands.ok,
    url,
    details: { setWebhook: hook.ok, webhookInfo: hook.description, commands: commands.ok, description: desc.ok, shortDescription: short.ok, name: name.ok },
  };
}

/* ---------------- Notifications ---------------- */

export async function chatIdsForUser(userId: string): Promise<string[]> {
  const r = await getPool().query<{ chat_id: string }>(`SELECT chat_id FROM telegram_users WHERE user_id = $1`, [userId]);
  return r.rows.map(x => x.chat_id);
}

export async function adminChatIds(): Promise<string[]> {
  const r = await getPool().query<{ chat_id: string }>(
    `SELECT t.chat_id FROM telegram_admins t JOIN admin_users a ON a.id = t.admin_id WHERE a.status = 'active'`,
  );
  return r.rows.map(x => x.chat_id);
}

/** Sends delivered access details to every chat linked to the customer. Returns how many chats received it. */
export async function sendDeliveryToTelegram(
  userId: string,
  order: Order,
  items: Array<{ productName: string; variantName: string; fields: DeliveryField[]; instructions?: string }>,
  note?: string,
): Promise<number> {
  if (!telegramEnabled()) return 0;
  const chats = await chatIdsForUser(userId).catch(() => []);
  if (chats.length === 0) return 0;
  const lines: string[] = [`🎉 <b>Your order is delivered</b>`, `Order: <code>${esc(order.orderNumber)}</code>`, ''];
  for (const it of items) {
    lines.push(`<b>${esc(it.productName)}</b> (${esc(it.variantName)})`);
    for (const f of it.fields) lines.push(`${esc(f.label)}: <code>${esc(f.value)}</code>`);
    if (it.instructions) lines.push(`<i>${esc(it.instructions)}</i>`);
    lines.push('');
  }
  if (note) lines.push(`📝 ${esc(note)}`, '');
  lines.push('🔒 Keep these details private. Do not change the account email, password or profile unless the product page allows it.');
  let sent = 0;
  for (const chatId of chats) {
    const res = await sendMessage(chatId, lines.join('\n'), {
      keyboard: [[{ text: 'View order', url: `${appUrl()}/account/orders/${encodeURIComponent(order.orderNumber)}` }]],
    });
    if (res.ok) sent++;
  }
  return sent;
}

/**
 * Order status update to the customer's linked chats (best-effort; used by
 * lib/order-lifecycle on approve / reject / refund). When the text names an
 * order (S4U-…), a "View order" button is added.
 */
export async function notifyCustomerTelegram(userId: string, text: string, keyboard?: InlineKeyboard): Promise<number> {
  if (!telegramEnabled()) return 0;
  const number = text.match(/S4U-[A-Z0-9]{10}/)?.[0];
  const buttons = keyboard ?? (number ? [[{ text: 'View order', url: `${appUrl()}/account/orders/${encodeURIComponent(number)}` }]] : undefined);
  let sent = 0;
  for (const chatId of await chatIdsForUser(userId).catch(() => [])) {
    if ((await sendMessage(chatId, text, { keyboard: buttons })).ok) sent++;
  }
  return sent;
}

/** True when the customer has at least one linked Telegram chat and the bot is configured. */
export async function customerHasTelegram(userId: string): Promise<boolean> {
  if (!telegramEnabled()) return false;
  return (await chatIdsForUser(userId).catch(() => [])).length > 0;
}

/** New order / payment proof alert to every admin who linked Telegram. */
export async function notifyAdminsTelegram(order: Order, stage: 'placed' | 'proof_submitted'): Promise<void> {
  if (!telegramEnabled()) return;
  const chats = await adminChatIds().catch(() => []);
  if (chats.length === 0) return;
  const title = stage === 'placed' ? '🛒 <b>New order</b>' : '💳 <b>Payment proof submitted</b>';
  const items = order.items.map(i => `• ${esc(i.productName)} (${esc(i.variantName)}) × ${i.quantity}`).join('\n');
  const text = `${title}\n<code>${esc(order.orderNumber)}</code> · ${esc(formatMoney(order.total, order.currency))}\n${esc(order.customerName)} · ${esc(order.customerEmail)}${
    order.customerWhatsapp ? `\nWhatsApp: ${esc(order.customerWhatsapp)}` : ''
  }\nPayment: ${esc(order.paymentMethodName || order.paymentMethod)}\n\n${items}`;
  for (const chatId of chats) {
    await sendMessage(chatId, text, { keyboard: [[{ text: 'Open in admin', url: `${appUrl()}/admin/orders/${encodeURIComponent(order.id)}` }]] });
  }
}
