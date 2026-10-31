import { cookies } from 'next/headers';
import { getPool } from '@/lib/db/pool';
import { mapUser } from '@/lib/db';
import type { User } from '@/lib/db/types';
import { newId, randomToken, sha256 } from '@/lib/ids';

/**
 * Customer sessions: random 256-bit token in an httpOnly cookie, only its
 * SHA-256 hash is stored (user_sessions). A session created after a correct
 * password on a 2FA account is `pending_2fa` and grants nothing until the
 * authenticator code is verified.
 */

export const SESSION_COOKIE = 'soft4u_session';
export const SESSION_DAYS = 30;
const PENDING_2FA_MINUTES = 10;
const TOUCH_INTERVAL_MS = 60 * 60 * 1000;

function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

export async function createSession(
  userId: string,
  meta: { ip?: string | null; userAgent?: string | null; pending2fa?: boolean } = {},
): Promise<void> {
  const token = randomToken(32);
  const pending = Boolean(meta.pending2fa);
  const ttlSeconds = pending ? PENDING_2FA_MINUTES * 60 : SESSION_DAYS * 24 * 60 * 60;
  await getPool().query(
    `INSERT INTO user_sessions (id, user_id, token_hash, pending_2fa, ip, user_agent, expires_at)
     VALUES ($1,$2,$3,$4,$5,$6, now() + ($7 || ' seconds')::interval)`,
    [newId('ses'), userId, sha256(token), pending, meta.ip ?? null, meta.userAgent ?? null, String(ttlSeconds)],
  );
  (await cookies()).set(SESSION_COOKIE, token, cookieOptions(ttlSeconds));
}

interface SessionRow {
  session_id: string;
  pending_2fa: boolean;
  last_used_at: Date;
  [key: string]: unknown;
}

async function loadSession(): Promise<{ row: SessionRow; token: string } | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const res = await getPool().query<SessionRow>(
    `SELECT s.id AS session_id, s.pending_2fa, s.last_used_at, u.*,
            EXISTS (SELECT 1 FROM telegram_users t WHERE t.user_id = u.id) AS telegram_linked
       FROM user_sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [sha256(token)],
  );
  const row = res.rows[0];
  return row ? { row, token } : null;
}

/** The signed-in, verified, active customer, or null. Safe in server components and route handlers. */
export async function getSessionUser(): Promise<User | null> {
  try {
    const s = await loadSession();
    if (!s || s.row.pending_2fa) return null;
    const user = mapUser(s.row);
    if (user.status !== 'active' || !user.emailVerified) return null;
    if (Date.now() - new Date(s.row.last_used_at).getTime() > TOUCH_INTERVAL_MS) {
      getPool()
        .query(`UPDATE user_sessions SET last_used_at = now() WHERE id = $1`, [s.row.session_id])
        .catch(() => {});
    }
    return user;
  } catch {
    return null;
  }
}

/** The user waiting on a 2FA code (pending session), or null. */
export async function getPending2faUserId(): Promise<string | null> {
  const s = await loadSession();
  if (!s || !s.row.pending_2fa) return null;
  return String(s.row.id);
}

/** Upgrades the current pending session after a correct 2FA code. */
export async function completePending2fa(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return false;
  const ttlSeconds = SESSION_DAYS * 24 * 60 * 60;
  const res = await getPool().query(
    `UPDATE user_sessions SET pending_2fa = false, expires_at = now() + ($2 || ' seconds')::interval, last_used_at = now()
      WHERE token_hash = $1 AND pending_2fa = true AND expires_at > now() RETURNING id`,
    [sha256(token), String(ttlSeconds)],
  );
  if (!res.rowCount) return false;
  (await cookies()).set(SESSION_COOKIE, token, cookieOptions(ttlSeconds));
  return true;
}

/** Signs out the current browser. */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await getPool().query(`DELETE FROM user_sessions WHERE token_hash = $1`, [sha256(token)]);
  store.set(SESSION_COOKIE, '', { ...cookieOptions(0), maxAge: 0 });
}

/** Signs the user out everywhere (password reset / change), optionally keeping the current browser. */
export async function destroyAllSessions(userId: string, keepCurrent = false): Promise<void> {
  const token = keepCurrent ? (await cookies()).get(SESSION_COOKIE)?.value : undefined;
  if (token) {
    await getPool().query(`DELETE FROM user_sessions WHERE user_id = $1 AND token_hash <> $2`, [userId, sha256(token)]);
  } else {
    await getPool().query(`DELETE FROM user_sessions WHERE user_id = $1`, [userId]);
  }
}

export interface SessionInfo {
  id: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
  lastUsedAt: string;
  current: boolean;
}

/** Active sessions for the account security page. */
export async function listSessions(userId: string): Promise<SessionInfo[]> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const currentHash = token ? sha256(token) : '';
  const res = await getPool().query<{ id: string; ip: string | null; user_agent: string | null; created_at: Date; last_used_at: Date; token_hash: string }>(
    `SELECT id, ip, user_agent, created_at, last_used_at, token_hash FROM user_sessions
      WHERE user_id = $1 AND pending_2fa = false AND expires_at > now() ORDER BY last_used_at DESC`,
    [userId],
  );
  return res.rows.map(r => ({
    id: r.id,
    ip: r.ip ?? undefined,
    userAgent: r.user_agent ?? undefined,
    createdAt: new Date(r.created_at).toISOString(),
    lastUsedAt: new Date(r.last_used_at).toISOString(),
    current: r.token_hash === currentHash,
  }));
}

export async function revokeSession(userId: string, sessionId: string): Promise<boolean> {
  const res = await getPool().query(`DELETE FROM user_sessions WHERE id = $1 AND user_id = $2 RETURNING id`, [sessionId, userId]);
  return (res.rowCount ?? 0) > 0;
}
