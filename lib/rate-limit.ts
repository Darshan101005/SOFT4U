import { getPool } from '@/lib/db/pool';

/**
 * DB-backed attempt counter (works across serverless instances).
 * Keys look like 'login:<email>', 'admin-login:<email>', 'otp-verify:<email>'.
 */

export async function recordAttempt(key: string): Promise<void> {
  await getPool().query(`INSERT INTO auth_attempts (key) VALUES ($1)`, [key]);
}

export async function countAttempts(key: string, windowMinutes: number): Promise<number> {
  const res = await getPool().query<{ n: number }>(
    `SELECT count(*)::int AS n FROM auth_attempts WHERE key = $1 AND created_at > now() - ($2 || ' minutes')::interval`,
    [key, String(windowMinutes)],
  );
  return res.rows[0]?.n ?? 0;
}

export async function clearAttempts(key: string): Promise<void> {
  await getPool().query(`DELETE FROM auth_attempts WHERE key = $1`, [key]);
}

/** True when `key` has reached `max` attempts inside the window. */
export async function isLimited(key: string, max: number, windowMinutes: number): Promise<boolean> {
  return (await countAttempts(key, windowMinutes)) >= max;
}
