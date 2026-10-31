import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { getPool, tx } from '@/lib/db/pool';
import { mapAdmin } from '@/lib/db';
import type { AdminUser } from '@/lib/db/types';
import { newId } from '@/lib/ids';
import { checkPassword, EMAIL_RE, normalizeEmail } from '@/lib/password-policy';
import { clearAttempts, isLimited, recordAttempt } from '@/lib/rate-limit';
import { generateTotpSecret, otpauthQrDataUrl, otpauthURL, verifyTotp } from '@/lib/totp';
import {
  ADMIN_2FA_COOKIE,
  ADMIN_2FA_MINUTES,
  ADMIN_COOKIE,
  ADMIN_SESSION_DAYS,
  signAdmin2faToken,
  signAdminToken,
  verifyAdmin2faToken,
  verifyAdminToken,
} from '@/lib/admin-jwt';
import { AuthError } from '@/lib/auth';

export { ADMIN_COOKIE, ADMIN_2FA_COOKIE } from '@/lib/admin-jwt';

/**
 * Admin accounts + sessions. There is no admin signup: the seed admin is
 * created by `bun run db:seed`, further admins are added by an admin.
 * Every admin can pause, re-activate or delete other admins, but at least one
 * active admin must always remain (enforced here under an advisory lock and
 * again by a database trigger, see db/migrations/0002_admin_guard.sql).
 */

const BCRYPT_ROUNDS = 12;
const LOGIN_MAX_FAILS = 6;
const LOGIN_WINDOW_MIN = 15;
const ADMIN_LOCK_KEY = 4_242_001;

interface AdminRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  status: 'active' | 'paused';
  totp_enabled: boolean;
  totp_secret: string | null;
  totp_pending_secret: string | null;
  token_version: number;
  [key: string]: unknown;
}

async function rowById(id: string): Promise<AdminRow | null> {
  const r = await getPool().query<AdminRow>(`SELECT * FROM admin_users WHERE id = $1`, [id]);
  return r.rows[0] ?? null;
}

async function rowByEmail(email: string): Promise<AdminRow | null> {
  const r = await getPool().query<AdminRow>(`SELECT * FROM admin_users WHERE lower(email) = $1`, [normalizeEmail(email)]);
  return r.rows[0] ?? null;
}

function cookieOpts(maxAge: number) {
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge };
}

async function issueSession(row: AdminRow): Promise<void> {
  const token = await signAdminToken({ sub: row.id, email: row.email, name: row.name, tv: row.token_version });
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, cookieOpts(ADMIN_SESSION_DAYS * 24 * 60 * 60));
  store.set(ADMIN_2FA_COOKIE, '', cookieOpts(0));
  await getPool().query(`UPDATE admin_users SET last_login_at = now() WHERE id = $1`, [row.id]);
}

/* ------------------------------------------------------------------ */
/* Session checks                                                      */
/* ------------------------------------------------------------------ */

/**
 * The signed-in admin, re-checked against the database on every call
 * (paused / deleted admins and revoked tokens are rejected immediately).
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  try {
    const token = (await cookies()).get(ADMIN_COOKIE)?.value;
    const payload = await verifyAdminToken(token);
    if (!payload) return null;
    const r = await getPool().query<AdminRow & { revoked: boolean }>(
      `SELECT a.*, EXISTS (SELECT 1 FROM admin_revoked_tokens WHERE jti = $2) AS revoked FROM admin_users a WHERE a.id = $1`,
      [payload.sub, payload.jti],
    );
    const row = r.rows[0];
    if (!row || row.revoked || row.status !== 'active' || row.token_version !== payload.tv) return null;
    return mapAdmin(row);
  } catch {
    return null;
  }
}

/** For route handlers: `const admin = await requireAdmin(); if (admin instanceof NextResponse) return admin;` */
export async function requireAdmin(): Promise<AdminUser | NextResponse> {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return admin;
}

/** For admin server components / layouts: redirects to /admin/login when signed out. */
export async function requireAdminPage(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');
  return admin;
}

/* ------------------------------------------------------------------ */
/* Login                                                               */
/* ------------------------------------------------------------------ */

export type AdminLoginResult = { status: 'ok'; admin: AdminUser } | { status: 'two_factor_required' };

export async function adminLogin(emailInput: string, password: string): Promise<AdminLoginResult> {
  const email = normalizeEmail(emailInput);
  const key = `admin-login:${email}`;
  if (await isLimited(key, LOGIN_MAX_FAILS, LOGIN_WINDOW_MIN)) {
    throw new AuthError('LOCKED', `Too many failed attempts. Try again in ${LOGIN_WINDOW_MIN} minutes.`, 429);
  }
  const row = EMAIL_RE.test(email) ? await rowByEmail(email) : null;
  if (!row || !(await bcrypt.compare(password || '', row.password_hash))) {
    await recordAttempt(key);
    throw new AuthError('INVALID_CREDENTIALS', 'Incorrect email or password', 401);
  }
  if (row.status !== 'active') throw new AuthError('PAUSED', 'This admin account is paused. Ask another admin to re-activate it.', 403);
  await clearAttempts(key);

  if (row.totp_enabled && row.totp_secret) {
    (await cookies()).set(ADMIN_2FA_COOKIE, await signAdmin2faToken(row.id), cookieOpts(ADMIN_2FA_MINUTES * 60));
    return { status: 'two_factor_required' };
  }
  await issueSession(row);
  return { status: 'ok', admin: mapAdmin(row) };
}

export async function adminVerifyLogin2fa(code: string): Promise<AdminUser> {
  const adminId = await verifyAdmin2faToken((await cookies()).get(ADMIN_2FA_COOKIE)?.value);
  if (!adminId) throw new AuthError('EXPIRED', 'Your sign-in step expired. Sign in again.', 401);
  const key = `admin-2fa:${adminId}`;
  if (await isLimited(key, LOGIN_MAX_FAILS, LOGIN_WINDOW_MIN)) throw new AuthError('LOCKED', 'Too many wrong codes. Try again later.', 429);
  const row = await rowById(adminId);
  if (!row || row.status !== 'active') throw new AuthError('PAUSED', 'This admin account is not active.', 403);
  if (!row.totp_enabled || !row.totp_secret || !verifyTotp(row.totp_secret, code)) {
    await recordAttempt(key);
    throw new AuthError('INVALID_CODE', 'That code is not right. Try again.', 400);
  }
  await clearAttempts(key);
  await issueSession(row);
  return mapAdmin(row);
}

/** Signs out this browser and revokes its token, so a copied cookie stops working too. Other devices stay signed in. */
export async function adminLogout(): Promise<void> {
  const store = await cookies();
  const payload = await verifyAdminToken(store.get(ADMIN_COOKIE)?.value).catch(() => null);
  if (payload) {
    const pool = getPool();
    await pool.query(
      `INSERT INTO admin_revoked_tokens (jti, expires_at) VALUES ($1, to_timestamp($2)) ON CONFLICT (jti) DO NOTHING`,
      [payload.jti, payload.exp],
    );
    await pool.query(`DELETE FROM admin_revoked_tokens WHERE expires_at < now()`);
  }
  store.set(ADMIN_COOKIE, '', cookieOpts(0));
  store.set(ADMIN_2FA_COOKIE, '', cookieOpts(0));
}

/* ------------------------------------------------------------------ */
/* Admin management                                                    */
/* ------------------------------------------------------------------ */

function validatePassword(password: string) {
  const check = checkPassword(password);
  if (!check.ok) throw new AuthError('WEAK_PASSWORD', check.error!);
}

export async function createAdmin(input: { name: string; email: string; password: string }, createdBy?: string): Promise<AdminUser> {
  const name = (input.name || '').trim();
  const email = normalizeEmail(input.email);
  if (name.length < 2) throw new AuthError('INVALID_NAME', 'Enter a name');
  if (!EMAIL_RE.test(email)) throw new AuthError('INVALID_EMAIL', 'Enter a valid email address');
  validatePassword(input.password);
  if (await rowByEmail(email)) throw new AuthError('EMAIL_TAKEN', 'An admin with this email already exists', 409);
  const r = await getPool().query<AdminRow>(
    `INSERT INTO admin_users (id, email, name, password_hash, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [newId('adm'), email, name, await bcrypt.hash(input.password, BCRYPT_ROUNDS), createdBy ?? null],
  );
  return mapAdmin(r.rows[0]);
}

/** Creates or refreshes the seed admin (idempotent; used by scripts/db-seed.ts). */
export async function ensureSeedAdmin(email: string, password: string, name = 'Soft4u Admin'): Promise<'created' | 'exists'> {
  const existing = await rowByEmail(email);
  if (existing) return 'exists';
  await getPool().query(`INSERT INTO admin_users (id, email, name, password_hash, created_by) VALUES ($1,$2,$3,$4,'seed')`, [
    newId('adm'),
    normalizeEmail(email),
    name,
    await bcrypt.hash(password, BCRYPT_ROUNDS),
  ]);
  return 'created';
}

export async function updateAdminProfile(adminId: string, updates: { name?: string; email?: string }): Promise<AdminUser> {
  const row = await rowById(adminId);
  if (!row) throw new AuthError('NOT_FOUND', 'Admin not found', 404);
  const name = updates.name !== undefined ? updates.name.trim() : row.name;
  const email = updates.email !== undefined ? normalizeEmail(updates.email) : row.email;
  if (name.length < 2) throw new AuthError('INVALID_NAME', 'Enter a name');
  if (!EMAIL_RE.test(email)) throw new AuthError('INVALID_EMAIL', 'Enter a valid email address');
  if (email !== normalizeEmail(row.email)) {
    const dupe = await rowByEmail(email);
    if (dupe && dupe.id !== adminId) throw new AuthError('EMAIL_TAKEN', 'That email is already used by another admin', 409);
  }
  const r = await getPool().query<AdminRow>(
    `UPDATE admin_users SET name = $2, email = $3, updated_at = now() WHERE id = $1 RETURNING *`,
    [adminId, name, email],
  );
  return mapAdmin(r.rows[0]);
}

/** Changes the admin's own password and signs out their other sessions (re-issues this one). */
export async function changeAdminPassword(adminId: string, currentPassword: string, newPassword: string): Promise<void> {
  const row = await rowById(adminId);
  if (!row) throw new AuthError('NOT_FOUND', 'Admin not found', 404);
  if (!(await bcrypt.compare(currentPassword || '', row.password_hash))) throw new AuthError('INVALID_PASSWORD', 'Your current password is incorrect');
  validatePassword(newPassword);
  const r = await getPool().query<AdminRow>(
    `UPDATE admin_users SET password_hash = $2, token_version = token_version + 1, updated_at = now() WHERE id = $1 RETURNING *`,
    [adminId, await bcrypt.hash(newPassword, BCRYPT_ROUNDS)],
  );
  await issueSession(r.rows[0]);
}

/** Another admin sets a new password for `targetId` (revokes the target's sessions). */
export async function setAdminPassword(targetId: string, newPassword: string): Promise<void> {
  validatePassword(newPassword);
  const r = await getPool().query(
    `UPDATE admin_users SET password_hash = $2, token_version = token_version + 1, updated_at = now() WHERE id = $1 RETURNING id`,
    [targetId, await bcrypt.hash(newPassword, BCRYPT_ROUNDS)],
  );
  if (!r.rowCount) throw new AuthError('NOT_FOUND', 'Admin not found', 404);
}

function lastAdminError(): AuthError {
  return new AuthError('LAST_ACTIVE_ADMIN', 'At least one active admin must remain. Add or re-activate another admin first.', 409);
}

/** Pause or re-activate an admin. Pausing revokes their sessions. */
export async function setAdminStatus(targetId: string, status: 'active' | 'paused'): Promise<AdminUser> {
  try {
    return await tx(async client => {
      await client.query(`SELECT pg_advisory_xact_lock($1)`, [ADMIN_LOCK_KEY]);
      const target = (await client.query<AdminRow>(`SELECT * FROM admin_users WHERE id = $1 FOR UPDATE`, [targetId])).rows[0];
      if (!target) throw new AuthError('NOT_FOUND', 'Admin not found', 404);
      if (status === 'paused' && target.status === 'active') {
        const others = await client.query<{ n: number }>(`SELECT count(*)::int AS n FROM admin_users WHERE status = 'active' AND id <> $1`, [targetId]);
        if ((others.rows[0]?.n ?? 0) < 1) throw lastAdminError();
      }
      const r = await client.query<AdminRow>(
        `UPDATE admin_users SET status = $2, token_version = token_version + CASE WHEN $2 = 'paused' THEN 1 ELSE 0 END, updated_at = now()
          WHERE id = $1 RETURNING *`,
        [targetId, status],
      );
      return mapAdmin(r.rows[0]);
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes('LAST_ACTIVE_ADMIN')) throw lastAdminError();
    throw err;
  }
}

export async function deleteAdmin(targetId: string): Promise<void> {
  try {
    await tx(async client => {
      await client.query(`SELECT pg_advisory_xact_lock($1)`, [ADMIN_LOCK_KEY]);
      const target = (await client.query<AdminRow>(`SELECT * FROM admin_users WHERE id = $1 FOR UPDATE`, [targetId])).rows[0];
      if (!target) throw new AuthError('NOT_FOUND', 'Admin not found', 404);
      const others = await client.query<{ n: number }>(`SELECT count(*)::int AS n FROM admin_users WHERE status = 'active' AND id <> $1`, [targetId]);
      if ((others.rows[0]?.n ?? 0) < 1) throw lastAdminError();
      await client.query(`DELETE FROM admin_users WHERE id = $1`, [targetId]);
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes('LAST_ACTIVE_ADMIN')) throw lastAdminError();
    throw err;
  }
}

/* ------------------------------------------------------------------ */
/* Admin TOTP 2FA                                                      */
/* ------------------------------------------------------------------ */

export async function beginAdminTotpSetup(adminId: string): Promise<{ secret: string; otpauthUrl: string; qrDataUrl: string }> {
  const row = await rowById(adminId);
  if (!row) throw new AuthError('NOT_FOUND', 'Admin not found', 404);
  if (row.totp_enabled) throw new AuthError('ALREADY_ENABLED', 'Two-factor authentication is already on');
  const secret = generateTotpSecret();
  await getPool().query(`UPDATE admin_users SET totp_pending_secret = $2, updated_at = now() WHERE id = $1`, [adminId, secret]);
  const otpauthUrl = otpauthURL(secret, row.email, 'Soft4u Admin');
  return { secret, otpauthUrl, qrDataUrl: await otpauthQrDataUrl(otpauthUrl) };
}

export async function enableAdminTotp(adminId: string, code: string): Promise<void> {
  const row = await rowById(adminId);
  if (!row?.totp_pending_secret) throw new AuthError('NO_SETUP', 'Start the setup again');
  if (!verifyTotp(row.totp_pending_secret, code)) throw new AuthError('INVALID_CODE', 'That code is not right. Check the time on your phone and try again.');
  await getPool().query(
    `UPDATE admin_users SET totp_enabled = true, totp_secret = totp_pending_secret, totp_pending_secret = NULL, updated_at = now() WHERE id = $1`,
    [adminId],
  );
}

export async function disableAdminTotp(adminId: string, password: string, code: string): Promise<void> {
  const row = await rowById(adminId);
  if (!row?.totp_enabled || !row.totp_secret) throw new AuthError('NOT_ENABLED', 'Two-factor authentication is not on');
  if (!(await bcrypt.compare(password || '', row.password_hash))) throw new AuthError('INVALID_PASSWORD', 'Your password is incorrect');
  if (!verifyTotp(row.totp_secret, code)) throw new AuthError('INVALID_CODE', 'That code is not right');
  await getPool().query(`UPDATE admin_users SET totp_enabled = false, totp_secret = NULL, totp_pending_secret = NULL, updated_at = now() WHERE id = $1`, [adminId]);
}

/** Another admin removes 2FA from `targetId` (lost phone). */
export async function resetAdminTotp(targetId: string): Promise<void> {
  await getPool().query(`UPDATE admin_users SET totp_enabled = false, totp_secret = NULL, totp_pending_secret = NULL, updated_at = now() WHERE id = $1`, [targetId]);
}
