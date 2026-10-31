import { getPool } from '@/lib/db/pool';
import { randomCode } from '@/lib/ids';

/**
 * Linking Telegram chats to Soft4u accounts, plus per-chat bot state.
 *
 * Customers link either by
 *  1. a 6-character code shown on the website (Account -> Telegram), sent to
 *     the bot as `/link CODE` or opened through the t.me/<bot>?start=CODE link, or
 *  2. signing in inside the bot with their email + password (the password
 *     message is deleted from the chat straight away), plus the authenticator
 *     code when the account has 2FA on.
 * Links are removed on password reset, password change and when an admin blocks the account.
 * Admins link with a code generated in the admin panel, which enables order
 * alerts in Telegram.
 */

export const LINK_CODE_TTL_MINUTES = 15;

export interface LinkCode {
  code: string;
  expiresAt: string;
}

async function insertCode(column: 'user_id' | 'admin_id', ownerId: string): Promise<LinkCode> {
  const pool = getPool();
  await pool.query(`DELETE FROM telegram_link_codes WHERE ${column} = $1`, [ownerId]);
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = randomCode(6);
    try {
      const r = await pool.query<{ expires_at: Date }>(
        `INSERT INTO telegram_link_codes (code, ${column}, expires_at) VALUES ($1, $2, now() + ($3 || ' minutes')::interval) RETURNING expires_at`,
        [code, ownerId, String(LINK_CODE_TTL_MINUTES)],
      );
      return { code, expiresAt: new Date(r.rows[0].expires_at).toISOString() };
    } catch {
      // collision, retry
    }
  }
  throw new Error('Could not generate a link code');
}

export function createLinkCode(userId: string): Promise<LinkCode> {
  return insertCode('user_id', userId);
}

export function createAdminLinkCode(adminId: string): Promise<LinkCode> {
  return insertCode('admin_id', adminId);
}

export interface ChatInfo {
  chatId: string;
  username?: string | null;
  firstName?: string | null;
}

export type ConsumedLink = { kind: 'customer'; userId: string } | { kind: 'admin'; adminId: string } | null;

/** Single-use: consumes a valid code and binds the chat to its owner. */
export async function consumeLinkCode(code: string, chat: ChatInfo): Promise<ConsumedLink> {
  const clean = (code || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(clean)) return null;
  const r = await getPool().query<{ user_id: string | null; admin_id: string | null }>(
    `DELETE FROM telegram_link_codes WHERE code = $1 AND expires_at > now() RETURNING user_id, admin_id`,
    [clean],
  );
  const row = r.rows[0];
  if (!row) return null;
  if (row.user_id) {
    await linkUserChat(row.user_id, chat);
    return { kind: 'customer', userId: row.user_id };
  }
  if (row.admin_id) {
    await getPool().query(
      `INSERT INTO telegram_admins (chat_id, admin_id, username, first_name) VALUES ($1,$2,$3,$4)
       ON CONFLICT (chat_id) DO UPDATE SET admin_id = EXCLUDED.admin_id, username = EXCLUDED.username, first_name = EXCLUDED.first_name, linked_at = now()`,
      [chat.chatId, row.admin_id, chat.username ?? null, chat.firstName ?? null],
    );
    return { kind: 'admin', adminId: row.admin_id };
  }
  return null;
}

/** One chat maps to one customer; re-linking moves it. */
export async function linkUserChat(userId: string, chat: ChatInfo): Promise<void> {
  await getPool().query(
    `INSERT INTO telegram_users (chat_id, user_id, username, first_name) VALUES ($1,$2,$3,$4)
     ON CONFLICT (chat_id) DO UPDATE SET user_id = EXCLUDED.user_id, username = EXCLUDED.username, first_name = EXCLUDED.first_name, linked_at = now()`,
    [chat.chatId, userId, chat.username ?? null, chat.firstName ?? null],
  );
}

/** The customer linked to this chat, if that account is still active (blocked accounts lose bot access). */
export async function getLinkedUserId(chatId: string): Promise<string | null> {
  const r = await getPool().query<{ user_id: string }>(
    `SELECT t.user_id FROM telegram_users t JOIN users u ON u.id = t.user_id WHERE t.chat_id = $1 AND u.status = 'active'`,
    [chatId],
  );
  return r.rows[0]?.user_id ?? null;
}

export async function getTelegramLinkForUser(userId: string): Promise<{ chatId: string; username?: string; linkedAt: string } | null> {
  const r = await getPool().query<{ chat_id: string; username: string | null; linked_at: Date }>(
    `SELECT chat_id, username, linked_at FROM telegram_users WHERE user_id = $1 ORDER BY linked_at DESC LIMIT 1`,
    [userId],
  );
  const row = r.rows[0];
  return row ? { chatId: row.chat_id, username: row.username ?? undefined, linkedAt: new Date(row.linked_at).toISOString() } : null;
}

export async function unlinkUser(userId: string): Promise<void> {
  await getPool().query(`DELETE FROM telegram_users WHERE user_id = $1`, [userId]);
}

export async function unlinkAdmin(adminId: string): Promise<void> {
  await getPool().query(`DELETE FROM telegram_admins WHERE admin_id = $1`, [adminId]);
}

export async function getAdminIdForChat(chatId: string): Promise<string | null> {
  const r = await getPool().query<{ admin_id: string }>(
    `SELECT t.admin_id FROM telegram_admins t JOIN admin_users a ON a.id = t.admin_id WHERE t.chat_id = $1 AND a.status = 'active'`,
    [chatId],
  );
  return r.rows[0]?.admin_id ?? null;
}

/** Drops every binding of a chat (customer link, admin alerts, state). */
export async function logoutChat(chatId: string): Promise<void> {
  const pool = getPool();
  await pool.query(`DELETE FROM telegram_users WHERE chat_id = $1`, [chatId]);
  await pool.query(`DELETE FROM telegram_admins WHERE chat_id = $1`, [chatId]);
  await pool.query(`DELETE FROM telegram_state WHERE chat_id = $1`, [chatId]);
}

/* ---------------- Conversation state ---------------- */

export interface ChatState {
  mode: string;
  data: Record<string, unknown>;
}

export async function getState(chatId: string): Promise<ChatState | null> {
  const r = await getPool().query<{ mode: string | null; data: Record<string, unknown> }>(
    `SELECT mode, data FROM telegram_state WHERE chat_id = $1 AND updated_at > now() - interval '30 minutes'`,
    [chatId],
  );
  const row = r.rows[0];
  return row?.mode ? { mode: row.mode, data: row.data || {} } : null;
}

export async function setState(chatId: string, mode: string, data: Record<string, unknown> = {}): Promise<void> {
  await getPool().query(
    `INSERT INTO telegram_state (chat_id, mode, data, updated_at) VALUES ($1,$2,$3::jsonb,now())
     ON CONFLICT (chat_id) DO UPDATE SET mode = EXCLUDED.mode, data = EXCLUDED.data, updated_at = now()`,
    [chatId, mode, JSON.stringify(data)],
  );
}

export async function clearState(chatId: string): Promise<void> {
  await getPool().query(`DELETE FROM telegram_state WHERE chat_id = $1`, [chatId]);
}
