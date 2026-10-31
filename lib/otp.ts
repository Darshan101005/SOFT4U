import crypto from 'crypto';
import { getPool } from '@/lib/db/pool';
import { randomToken, sha256 } from '@/lib/ids';
import { normalizeEmail } from '@/lib/password-policy';

/**
 * Email one-time codes (6 digits) for signup verification and password reset.
 *  - expire after OTP_TTL_MINUTES
 *  - a new code invalidates older ones
 *  - resend cooldown of RESEND_COOLDOWN_SECONDS, at most MAX_SENDS_PER_HOUR
 *  - MAX_ATTEMPTS wrong guesses burn the code
 * Codes are stored as salted SHA-256 hashes, never in plain text.
 */

export type OtpPurpose = 'signup' | 'password_reset';

export const OTP_TTL_MINUTES = 10;
export const RESEND_COOLDOWN_SECONDS = 60;
export const MAX_SENDS_PER_HOUR = 5;
export const MAX_ATTEMPTS = 5;

export class OtpError extends Error {
  constructor(
    public code: 'COOLDOWN' | 'RATE_LIMIT',
    public retryAfterSeconds: number,
  ) {
    super(code === 'COOLDOWN' ? `Please wait ${retryAfterSeconds}s before requesting a new code` : 'Too many codes requested. Try again later');
  }
}

function pepper(): string {
  return process.env.BETTER_AUTH_SECRET || process.env.ADMIN_JWT_SECRET || 'soft4u-otp';
}

function hashCode(email: string, purpose: OtpPurpose, code: string): string {
  return sha256(`${pepper()}:${purpose}:${normalizeEmail(email)}:${code}`);
}

export interface OtpStatus {
  /** Seconds until a new code may be requested (0 = now). */
  cooldownSeconds: number;
  /** Sends left in the rolling hour. */
  remainingSends: number;
}

export async function getOtpStatus(email: string, purpose: OtpPurpose): Promise<OtpStatus> {
  const res = await getPool().query<{ last: Date | null; n: number }>(
    `SELECT max(created_at) AS last, count(*)::int AS n FROM email_otps
      WHERE lower(email) = $1 AND purpose = $2 AND created_at > now() - interval '1 hour'`,
    [normalizeEmail(email), purpose],
  );
  const row = res.rows[0];
  const last = row?.last ? new Date(row.last).getTime() : 0;
  const elapsed = last ? Math.floor((Date.now() - last) / 1000) : Infinity;
  return {
    cooldownSeconds: elapsed === Infinity ? 0 : Math.max(0, RESEND_COOLDOWN_SECONDS - elapsed),
    remainingSends: Math.max(0, MAX_SENDS_PER_HOUR - (row?.n ?? 0)),
  };
}

export interface CreatedOtp {
  code: string;
  /** Present when withLink was requested (password reset links). */
  linkToken?: string;
  expiresAt: Date;
}

/** Creates a fresh code (throws OtpError on cooldown / hourly limit). */
export async function createOtp(email: string, purpose: OtpPurpose, opts: { withLink?: boolean } = {}): Promise<CreatedOtp> {
  const clean = normalizeEmail(email);
  const status = await getOtpStatus(clean, purpose);
  if (status.remainingSends <= 0) throw new OtpError('RATE_LIMIT', 3600);
  if (status.cooldownSeconds > 0) throw new OtpError('COOLDOWN', status.cooldownSeconds);

  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  const linkToken = opts.withLink ? randomToken(32) : undefined;
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  const pool = getPool();
  await pool.query(
    `UPDATE email_otps SET consumed_at = now() WHERE lower(email) = $1 AND purpose = $2 AND consumed_at IS NULL`,
    [clean, purpose],
  );
  await pool.query(
    `INSERT INTO email_otps (email, purpose, code_hash, link_token_hash, expires_at) VALUES ($1,$2,$3,$4,$5)`,
    [clean, purpose, hashCode(clean, purpose, code), linkToken ? sha256(linkToken) : null, expiresAt],
  );
  return { code, linkToken, expiresAt };
}

export type OtpVerifyResult =
  | { ok: true }
  | { ok: false; reason: 'invalid' | 'expired' | 'too_many_attempts' | 'missing'; attemptsLeft?: number };

/** Checks a code; consumes it on success. Wrong guesses count towards MAX_ATTEMPTS. */
export async function verifyOtp(email: string, purpose: OtpPurpose, code: string): Promise<OtpVerifyResult> {
  const clean = normalizeEmail(email);
  const value = (code || '').replace(/\s+/g, '');
  const pool = getPool();
  const res = await pool.query<{ id: string; code_hash: string; expires_at: Date }>(
    `SELECT id, code_hash, expires_at FROM email_otps
      WHERE lower(email) = $1 AND purpose = $2 AND consumed_at IS NULL
      ORDER BY created_at DESC LIMIT 1`,
    [clean, purpose],
  );
  const row = res.rows[0];
  if (!row) return { ok: false, reason: 'missing' };
  if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false, reason: 'expired' };

  // Count the attempt before comparing, in one conditional UPDATE, so parallel
  // guesses cannot go past MAX_ATTEMPTS.
  const upd = await pool.query<{ attempts: number }>(
    `UPDATE email_otps SET attempts = attempts + 1 WHERE id = $1 AND attempts < $2 AND consumed_at IS NULL RETURNING attempts`,
    [row.id, MAX_ATTEMPTS],
  );
  if (!upd.rowCount) return { ok: false, reason: 'too_many_attempts', attemptsLeft: 0 };
  const attempts = upd.rows[0].attempts;

  const expected = Buffer.from(row.code_hash);
  const got = Buffer.from(hashCode(clean, purpose, /^\d{6}$/.test(value) ? value : 'x'));
  if (expected.length === got.length && crypto.timingSafeEqual(expected, got)) {
    const claimed = await pool.query(`UPDATE email_otps SET consumed_at = now() WHERE id = $1 AND consumed_at IS NULL RETURNING id`, [row.id]);
    return claimed.rowCount ? { ok: true } : { ok: false, reason: 'invalid' };
  }
  if (attempts >= MAX_ATTEMPTS) {
    await pool.query(`UPDATE email_otps SET consumed_at = now() WHERE id = $1`, [row.id]);
    return { ok: false, reason: 'too_many_attempts', attemptsLeft: 0 };
  }
  return { ok: false, reason: 'invalid', attemptsLeft: MAX_ATTEMPTS - attempts };
}

/** True while an unused, unexpired code exists for this email + purpose. */
export async function hasActiveOtp(email: string, purpose: OtpPurpose): Promise<boolean> {
  const r = await getPool().query(
    `SELECT 1 FROM email_otps WHERE lower(email) = $1 AND purpose = $2 AND consumed_at IS NULL AND expires_at > now() LIMIT 1`,
    [normalizeEmail(email), purpose],
  );
  return Boolean(r.rowCount);
}

/** Consumes a reset-link token; returns the email it belongs to, or null. */
export async function consumeLinkToken(token: string, purpose: OtpPurpose): Promise<string | null> {
  if (!token) return null;
  const res = await getPool().query<{ email: string }>(
    `UPDATE email_otps SET consumed_at = now()
      WHERE link_token_hash = $1 AND purpose = $2 AND consumed_at IS NULL AND expires_at > now()
      RETURNING email`,
    [sha256(token), purpose],
  );
  return res.rows[0]?.email ?? null;
}

/** Peeks at a reset-link token without consuming it (to render the reset form). */
export async function peekLinkToken(token: string, purpose: OtpPurpose): Promise<string | null> {
  if (!token) return null;
  const res = await getPool().query<{ email: string }>(
    `SELECT email FROM email_otps WHERE link_token_hash = $1 AND purpose = $2 AND consumed_at IS NULL AND expires_at > now()`,
    [sha256(token), purpose],
  );
  return res.rows[0]?.email ?? null;
}

export function otpErrorMessage(reason: Exclude<OtpVerifyResult, { ok: true }>['reason'], attemptsLeft?: number): string {
  switch (reason) {
    case 'expired':
      return 'This code has expired. Request a new one.';
    case 'too_many_attempts':
      return 'Too many wrong attempts. Request a new code.';
    case 'missing':
      return 'No active code. Request a new one.';
    default:
      return attemptsLeft !== undefined ? `Incorrect code. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} left.` : 'Incorrect code.';
  }
}
