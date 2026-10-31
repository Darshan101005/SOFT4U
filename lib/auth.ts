import bcrypt from 'bcryptjs';
import { getPool } from '@/lib/db/pool';
import { db, mapUser } from '@/lib/db';
import type { User } from '@/lib/db/types';
import { newId } from '@/lib/ids';
import { checkPassword, EMAIL_RE, normalizeEmail } from '@/lib/password-policy';
import { consumeLinkToken, createOtp, getOtpStatus, hasActiveOtp, OTP_TTL_MINUTES, OtpError, otpErrorMessage, verifyOtp, type OtpPurpose } from '@/lib/otp';
import { completePending2fa, createSession, destroyAllSessions } from '@/lib/session';
import { clearAttempts, isLimited, recordAttempt } from '@/lib/rate-limit';
import { generateTotpSecret, otpauthQrDataUrl, otpauthURL, verifyTotp } from '@/lib/totp';
import { queueEmail, sendEmail } from '@/lib/email';
import { appBaseUrl, passwordResetEmail, resendOtpEmail, signupOtpEmail, twoFactorChangedEmail, welcomeEmail } from '@/lib/email-templates';
import { pkTime, type RequestMeta } from '@/lib/request-meta';
import { unlinkUser } from '@/lib/telegram-link';

/**
 * Customer authentication (email + password only, no social login).
 *
 * Flow: signUp -> 6-digit OTP email -> verifySignup (account active + signed in)
 *       login (verified accounts only; unverified get a fresh OTP) -> optional TOTP step
 *       requestPasswordReset -> OTP code or link -> resetPassword
 *
 * Every function throws AuthError (code, HTTP status, user-facing message) on failure.
 */

export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
    public extra: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

const BCRYPT_ROUNDS = 12;
let dummy: Promise<string> | null = null;
function dummyHash(): Promise<string> {
  if (!dummy) dummy = bcrypt.hash('soft4u-timing-guard', BCRYPT_ROUNDS);
  return dummy;
}
const LOGIN_MAX_FAILS = 8;
const LOGIN_WINDOW_MIN = 15;

interface UserAuthRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  email_verified_at: Date | null;
  status: 'active' | 'suspended';
  totp_enabled: boolean;
  totp_secret: string | null;
  totp_pending_secret: string | null;
}

async function authRowByEmail(email: string): Promise<UserAuthRow | null> {
  const r = await getPool().query<UserAuthRow>(`SELECT * FROM users WHERE lower(email) = $1`, [normalizeEmail(email)]);
  return r.rows[0] ?? null;
}

async function authRowById(id: string): Promise<UserAuthRow | null> {
  const r = await getPool().query<UserAuthRow>(`SELECT * FROM users WHERE id = $1`, [id]);
  return r.rows[0] ?? null;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifyPasswordHash(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function requireEmail(email: string): string {
  const clean = normalizeEmail(email);
  if (!EMAIL_RE.test(clean)) throw new AuthError('INVALID_EMAIL', 'Enter a valid email address');
  return clean;
}

function requireStrongPassword(password: string, confirm?: string) {
  const check = checkPassword(password);
  if (!check.ok) throw new AuthError('WEAK_PASSWORD', check.error!);
  if (confirm !== undefined && password !== confirm) throw new AuthError('PASSWORD_MISMATCH', 'Passwords do not match');
}

/** Sends a code, mapping cooldown / hourly limits to AuthError. Returns seconds until the next resend. */
async function sendCode(email: string, name: string, purpose: OtpPurpose, resent: boolean): Promise<number> {
  try {
    if (purpose === 'password_reset') {
      const otp = await createOtp(email, purpose, { withLink: true });
      const link = `${appBaseUrl()}/forgot-password?token=${encodeURIComponent(otp.linkToken!)}&email=${encodeURIComponent(email)}`;
      await sendEmail(email, passwordResetEmail({ name, code: otp.code, link, minutes: OTP_TTL_MINUTES }), 'password_reset');
    } else {
      const otp = await createOtp(email, purpose);
      const content = resent
        ? resendOtpEmail({ name, code: otp.code, minutes: OTP_TTL_MINUTES })
        : signupOtpEmail({ name, code: otp.code, minutes: OTP_TTL_MINUTES });
      await sendEmail(email, content, resent ? 'resend_otp' : 'signup_otp');
    }
    return (await getOtpStatus(email, purpose)).cooldownSeconds;
  } catch (err) {
    if (err instanceof OtpError) {
      throw new AuthError(err.code === 'COOLDOWN' ? 'OTP_COOLDOWN' : 'OTP_RATE_LIMIT', err.message, 429, {
        retryAfterSeconds: err.retryAfterSeconds,
      });
    }
    throw err;
  }
}

/* ------------------------------------------------------------------ */
/* Signup + verification                                               */
/* ------------------------------------------------------------------ */

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Creates an unverified account and emails a 6-digit code. Re-signing up with
 * an unverified email sends a new code. The name/password are replaced only
 * when no code from an earlier signup is still active, so nobody can swap the
 * password while the real owner is entering their code. (An abandoned signup
 * whose code expired can be taken over by a fresh signup.)
 */
export async function signUp(input: SignUpInput, meta: RequestMeta): Promise<{ email: string; resendInSeconds: number }> {
  const name = (input.name || '').trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 80) throw new AuthError('INVALID_NAME', 'Enter your full name (2-80 characters)');
  const email = requireEmail(input.email);
  requireStrongPassword(input.password, input.confirmPassword);

  const existing = await authRowByEmail(email);
  const hash = await hashPassword(input.password);
  if (existing) {
    if (existing.email_verified_at) {
      throw new AuthError('EMAIL_TAKEN', 'An account with this email already exists. Sign in instead.', 409);
    }
    if (!(await hasActiveOtp(email, 'signup'))) {
      await getPool().query(`UPDATE users SET name = $2, password_hash = $3, updated_at = now() WHERE id = $1`, [existing.id, name, hash]);
    }
  } else {
    await getPool().query(
      `INSERT INTO users (id, name, email, password_hash, signup_ip) VALUES ($1,$2,$3,$4,$5)`,
      [newId('usr'), name, email, hash, meta.ip],
    );
  }
  const status = await getOtpStatus(email, 'signup');
  if (status.cooldownSeconds > 0) return { email, resendInSeconds: status.cooldownSeconds };
  const resendInSeconds = await sendCode(email, name, 'signup', false);
  return { email, resendInSeconds };
}

/** Sends a new code (signup verification or password reset). Silent for unknown emails. */
export async function resendCode(emailInput: string, purpose: OtpPurpose): Promise<{ resendInSeconds: number }> {
  const email = requireEmail(emailInput);
  const row = await authRowByEmail(email);
  if (!row) return { resendInSeconds: 60 };
  if (purpose === 'signup' && row.email_verified_at) {
    throw new AuthError('ALREADY_VERIFIED', 'This email is already verified. Sign in instead.');
  }
  return { resendInSeconds: await sendCode(email, row.name, purpose, true) };
}

/** Checks the signup code, activates the account, signs the user in and sends the welcome email. */
export async function verifySignup(emailInput: string, code: string, meta: RequestMeta): Promise<User> {
  const email = requireEmail(emailInput);
  const row = await authRowByEmail(email);
  if (!row) throw new AuthError('NOT_FOUND', 'No account found for this email', 404);
  if (row.email_verified_at) throw new AuthError('ALREADY_VERIFIED', 'This email is already verified. Sign in instead.');
  const result = await verifyOtp(email, 'signup', code);
  if (!result.ok) {
    throw new AuthError(`OTP_${result.reason.toUpperCase()}`, otpErrorMessage(result.reason, result.attemptsLeft), 400, {
      attemptsLeft: result.attemptsLeft,
    });
  }
  await getPool().query(`UPDATE users SET email_verified_at = now(), last_login_at = now(), updated_at = now() WHERE id = $1`, [row.id]);
  await createSession(row.id, { ip: meta.ip, userAgent: meta.userAgent });
  queueEmail(email, welcomeEmail({ name: row.name }), 'welcome');
  return (await db.getUserById(row.id))!;
}

/* ------------------------------------------------------------------ */
/* Login                                                               */
/* ------------------------------------------------------------------ */

export type LoginResult =
  | { status: 'ok'; user: User }
  | { status: 'two_factor_required' }
  | { status: 'verification_required'; email: string; resendInSeconds: number };

/** Verifies credentials. Unverified accounts get a fresh code instead of a session. */
export async function login(emailInput: string, password: string, meta: RequestMeta): Promise<LoginResult> {
  const email = requireEmail(emailInput);
  const key = `login:${email}`;
  if (await isLimited(key, LOGIN_MAX_FAILS, LOGIN_WINDOW_MIN)) {
    throw new AuthError('LOCKED', `Too many failed attempts. Try again in ${LOGIN_WINDOW_MIN} minutes or reset your password.`, 429);
  }
  const row = await authRowByEmail(email);
  // Unknown emails still pay the bcrypt cost so timing does not reveal which emails exist.
  const valid = row ? await verifyPasswordHash(password || '', row.password_hash) : (await bcrypt.compare(password || '', await dummyHash()), false);
  if (!row || !valid) {
    await recordAttempt(key);
    throw new AuthError('INVALID_CREDENTIALS', 'Incorrect email or password', 401);
  }
  if (row.status === 'suspended') throw new AuthError('SUSPENDED', 'This account is suspended. Please contact support.', 403);
  await clearAttempts(key);

  if (!row.email_verified_at) {
    const status = await getOtpStatus(email, 'signup');
    let resendInSeconds = status.cooldownSeconds;
    if (resendInSeconds === 0 && status.remainingSends > 0) {
      resendInSeconds = await sendCode(email, row.name, 'signup', true).catch(() => 60);
    }
    return { status: 'verification_required', email, resendInSeconds };
  }

  if (row.totp_enabled && row.totp_secret) {
    await createSession(row.id, { ip: meta.ip, userAgent: meta.userAgent, pending2fa: true });
    return { status: 'two_factor_required' };
  }

  await createSession(row.id, { ip: meta.ip, userAgent: meta.userAgent });
  await getPool().query(`UPDATE users SET last_login_at = now() WHERE id = $1`, [row.id]);
  return { status: 'ok', user: (await db.getUserById(row.id))! };
}

/** Second login step for 2FA accounts (uses the pending session cookie). */
export async function completeLogin2fa(userId: string, code: string): Promise<User> {
  const key = `login-2fa:${userId}`;
  if (await isLimited(key, LOGIN_MAX_FAILS, LOGIN_WINDOW_MIN)) {
    throw new AuthError('LOCKED', 'Too many wrong codes. Sign in again later.', 429);
  }
  const row = await authRowById(userId);
  if (!row || !row.totp_enabled || !row.totp_secret) throw new AuthError('NO_2FA', 'Two-factor authentication is not set up. Sign in again.', 400);
  if (!verifyTotp(row.totp_secret, code)) {
    await recordAttempt(key);
    throw new AuthError('INVALID_CODE', 'That code is not right. Try again.', 400);
  }
  await clearAttempts(key);
  if (!(await completePending2fa())) throw new AuthError('EXPIRED', 'Your sign-in step expired. Sign in again.', 401);
  await getPool().query(`UPDATE users SET last_login_at = now() WHERE id = $1`, [row.id]);
  return (await db.getUserById(row.id))!;
}

/**
 * Verifies email + password without creating a session (Telegram bot linking).
 * `totpRequired` is true for accounts with 2FA on: the caller must then check a
 * code with verifyUserTotp before linking.
 */
export async function verifyCredentials(emailInput: string, password: string): Promise<{ user: User; totpRequired: boolean } | null> {
  const email = normalizeEmail(emailInput);
  if (!EMAIL_RE.test(email)) return null;
  const key = `login:${email}`;
  if (await isLimited(key, LOGIN_MAX_FAILS, LOGIN_WINDOW_MIN)) return null;
  const row = await authRowByEmail(email);
  if (!row || !(await verifyPasswordHash(password || '', row.password_hash))) {
    await recordAttempt(key);
    return null;
  }
  if (row.status !== 'active' || !row.email_verified_at) return null;
  const user = await db.getUserById(row.id);
  return user ? { user, totpRequired: Boolean(row.totp_enabled && row.totp_secret) } : null;
}

/** Checks an authenticator code for an active account (shares the login 2FA attempt limit). */
export async function verifyUserTotp(userId: string, code: string): Promise<'ok' | 'invalid' | 'locked'> {
  const key = `login-2fa:${userId}`;
  if (await isLimited(key, LOGIN_MAX_FAILS, LOGIN_WINDOW_MIN)) return 'locked';
  const row = await authRowById(userId);
  if (!row || row.status !== 'active' || !row.totp_enabled || !row.totp_secret || !verifyTotp(row.totp_secret, code)) {
    await recordAttempt(key);
    return 'invalid';
  }
  await clearAttempts(key);
  return 'ok';
}

/* ------------------------------------------------------------------ */
/* Password reset / change                                             */
/* ------------------------------------------------------------------ */

/** Always succeeds from the caller's view (no account enumeration). */
export async function requestPasswordReset(emailInput: string): Promise<{ resendInSeconds: number }> {
  const email = requireEmail(emailInput);
  const row = await authRowByEmail(email);
  if (!row || row.status !== 'active') return { resendInSeconds: 60 };
  return { resendInSeconds: await sendCode(email, row.name, 'password_reset', false) };
}

export type ResetProof = { email: string; code: string } | { token: string };

/** Sets a new password from an emailed code or link. Signs out every session. */
export async function resetPassword(proof: ResetProof, newPassword: string, confirmPassword?: string): Promise<{ email: string }> {
  requireStrongPassword(newPassword, confirmPassword);
  let email: string | null;
  if ('token' in proof) {
    email = await consumeLinkToken(proof.token, 'password_reset');
    if (!email) throw new AuthError('INVALID_LINK', 'This reset link is invalid or has expired. Request a new one.');
  } else {
    email = requireEmail(proof.email);
    const result = await verifyOtp(email, 'password_reset', proof.code);
    if (!result.ok) {
      throw new AuthError(`OTP_${result.reason.toUpperCase()}`, otpErrorMessage(result.reason, result.attemptsLeft), 400, {
        attemptsLeft: result.attemptsLeft,
      });
    }
  }
  const row = await authRowByEmail(email);
  if (!row) throw new AuthError('NOT_FOUND', 'Account not found', 404);
  await getPool().query(
    `UPDATE users SET password_hash = $2, email_verified_at = COALESCE(email_verified_at, now()), updated_at = now() WHERE id = $1`,
    [row.id, await hashPassword(newPassword)],
  );
  await destroyAllSessions(row.id);
  await unlinkUser(row.id);
  await clearAttempts(`login:${normalizeEmail(email)}`);
  return { email: row.email };
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string, confirmPassword?: string): Promise<void> {
  const row = await authRowById(userId);
  if (!row) throw new AuthError('NOT_FOUND', 'Account not found', 404);
  if (!(await verifyPasswordHash(currentPassword || '', row.password_hash))) {
    throw new AuthError('INVALID_PASSWORD', 'Your current password is incorrect', 400);
  }
  requireStrongPassword(newPassword, confirmPassword);
  await getPool().query(`UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1`, [userId, await hashPassword(newPassword)]);
  await destroyAllSessions(userId, true);
  // Telegram chats count as signed-in devices: they must connect again.
  await unlinkUser(userId);
}

/* ------------------------------------------------------------------ */
/* Customer TOTP 2FA                                                   */
/* ------------------------------------------------------------------ */

export async function beginTotpSetup(userId: string): Promise<{ secret: string; otpauthUrl: string; qrDataUrl: string }> {
  const row = await authRowById(userId);
  if (!row) throw new AuthError('NOT_FOUND', 'Account not found', 404);
  if (row.totp_enabled) throw new AuthError('ALREADY_ENABLED', 'Two-factor authentication is already on');
  const secret = generateTotpSecret();
  await getPool().query(`UPDATE users SET totp_pending_secret = $2, updated_at = now() WHERE id = $1`, [userId, secret]);
  const otpauthUrl = otpauthURL(secret, row.email, 'Soft4u');
  return { secret, otpauthUrl, qrDataUrl: await otpauthQrDataUrl(otpauthUrl) };
}

export async function enableTotp(userId: string, code: string, meta: RequestMeta): Promise<void> {
  const row = await authRowById(userId);
  if (!row || !row.totp_pending_secret) throw new AuthError('NO_SETUP', 'Start the setup again', 400);
  if (!verifyTotp(row.totp_pending_secret, code)) throw new AuthError('INVALID_CODE', 'That code is not right. Check the time on your phone and try again.');
  await getPool().query(
    `UPDATE users SET totp_enabled = true, totp_secret = totp_pending_secret, totp_pending_secret = NULL, updated_at = now() WHERE id = $1`,
    [userId],
  );
  queueEmail(row.email, twoFactorChangedEmail({ name: row.name, enabled: true, when: pkTime(), device: meta.device }), 'two_factor');
}

/** Turning 2FA off needs the password and a current code. */
export async function disableTotp(userId: string, password: string, code: string, meta: RequestMeta): Promise<void> {
  const row = await authRowById(userId);
  if (!row || !row.totp_enabled || !row.totp_secret) throw new AuthError('NOT_ENABLED', 'Two-factor authentication is not on');
  if (!(await verifyPasswordHash(password || '', row.password_hash))) throw new AuthError('INVALID_PASSWORD', 'Your password is incorrect');
  if (!verifyTotp(row.totp_secret, code)) throw new AuthError('INVALID_CODE', 'That code is not right');
  await getPool().query(
    `UPDATE users SET totp_enabled = false, totp_secret = NULL, totp_pending_secret = NULL, updated_at = now() WHERE id = $1`,
    [userId],
  );
  queueEmail(row.email, twoFactorChangedEmail({ name: row.name, enabled: false, when: pkTime(), device: meta.device }), 'two_factor');
}

/** Admin action: customer lost their phone. */
export async function adminResetCustomerTotp(userId: string): Promise<void> {
  await getPool().query(
    `UPDATE users SET totp_enabled = false, totp_secret = NULL, totp_pending_secret = NULL, updated_at = now() WHERE id = $1`,
    [userId],
  );
}

export { mapUser };
