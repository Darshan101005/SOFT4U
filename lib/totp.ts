import crypto from 'crypto';
import QRCode from 'qrcode';

/**
 * Dependency-free TOTP (RFC 6238): SHA1, 6 digits, 30-second period.
 * Works with Google Authenticator, Microsoft Authenticator, Authy, 1Password.
 * Used for admin 2FA and optional customer 2FA.
 */

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const DIGITS = 6;
const PERIOD = 30;

function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(input: string): Buffer {
  const clean = (input || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    value = (value << 5) | B32.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export function generateTotpSecret(bytes = 20): string {
  return base32Encode(crypto.randomBytes(bytes));
}

function hotp(secret: string, counter: number): string {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', base32Decode(secret)).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const bin =
    ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16) | ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff);
  return (bin % 10 ** DIGITS).toString().padStart(DIGITS, '0');
}

/** Verifies a 6-digit code with a +/-1 step window for clock drift. */
export function verifyTotp(secret: string, token: string, window = 1): boolean {
  const code = (token || '').replace(/\s+/g, '');
  if (!secret || !/^\d{6}$/.test(code)) return false;
  const counter = Math.floor(Date.now() / 1000 / PERIOD);
  for (let i = -window; i <= window; i++) {
    const candidate = hotp(secret, counter + i);
    if (crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(code))) return true;
  }
  return false;
}

/** otpauth:// URI imported by authenticator apps. */
export function otpauthURL(secret: string, accountLabel: string, issuer = 'Soft4u'): string {
  const params = new URLSearchParams({ secret, issuer, algorithm: 'SHA1', digits: String(DIGITS), period: String(PERIOD) });
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountLabel)}?${params.toString()}`;
}

/** PNG data URI of the otpauth QR code, for the setup screen. */
export async function otpauthQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, { margin: 1, width: 240, color: { dark: '#2B3328', light: '#FFFFFF' } });
}
