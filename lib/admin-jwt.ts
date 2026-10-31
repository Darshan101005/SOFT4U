/**
 * Admin session tokens: HS256 JWTs in an httpOnly cookie, signed with
 * ADMIN_JWT_SECRET. Implemented on Web Crypto so the same code runs in the
 * edge middleware and in Node route handlers.
 */

export const ADMIN_COOKIE = 'soft4u_admin';
export const ADMIN_2FA_COOKIE = 'soft4u_admin_2fa';
export const ADMIN_SESSION_DAYS = 7;
export const ADMIN_2FA_MINUTES = 5;

export interface AdminTokenPayload {
  sub: string;
  email: string;
  name: string;
  /** admin_users.token_version at issue time; bumping it revokes old tokens. */
  tv: number;
  typ: 'admin';
  /** Token id, used to revoke this one session on sign-out. Older tokens fall back to `<sub>.<iat>`. */
  jti: string;
  /** Expiry (seconds since epoch). */
  exp: number;
}

const enc = new TextEncoder();
let keyPromise: Promise<CryptoKey> | null = null;

function key(): Promise<CryptoKey> {
  const s = process.env.ADMIN_JWT_SECRET;
  if (!s || s.length < 16) throw new Error('ADMIN_JWT_SECRET is not set (min 16 characters)');
  if (!keyPromise) {
    keyPromise = crypto.subtle.importKey('raw', enc.encode(s), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
  }
  return keyPromise;
}

function b64url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function sign(payload: Record<string, unknown>, ttlSeconds: number): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = b64url(enc.encode(JSON.stringify({ ...payload, iat: now, exp: now + ttlSeconds })));
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await key(), enc.encode(`${header}.${body}`)));
  return `${header}.${body}.${b64url(sig)}`;
}

async function verify(token: string | undefined | null): Promise<Record<string, unknown> | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[0])));
    if (header?.alg !== 'HS256') return null;
    const ok = await crypto.subtle.verify('HMAC', await key(), b64urlDecode(parts[2]) as BufferSource, enc.encode(`${parts[0]}.${parts[1]}`));
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[1])));
    if (typeof payload?.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function signAdminToken(p: Omit<AdminTokenPayload, 'typ' | 'jti' | 'exp'>): Promise<string> {
  return sign({ sub: p.sub, email: p.email, name: p.name, tv: p.tv, typ: 'admin', jti: crypto.randomUUID() }, ADMIN_SESSION_DAYS * 24 * 60 * 60);
}

export async function verifyAdminToken(token: string | undefined | null): Promise<AdminTokenPayload | null> {
  const payload = await verify(token);
  if (!payload || payload.typ !== 'admin' || typeof payload.sub !== 'string') return null;
  return {
    sub: payload.sub,
    email: String(payload.email || ''),
    name: String(payload.name || ''),
    tv: Number(payload.tv || 0),
    typ: 'admin',
    jti: typeof payload.jti === 'string' && payload.jti ? payload.jti : `${payload.sub}.${Number(payload.iat || 0)}`,
    exp: Number(payload.exp),
  };
}

/** Short-lived token that only authorises entering the 2FA code. */
export async function signAdmin2faToken(adminId: string): Promise<string> {
  return sign({ sub: adminId, typ: 'admin_2fa' }, ADMIN_2FA_MINUTES * 60);
}

export async function verifyAdmin2faToken(token: string | undefined | null): Promise<string | null> {
  const payload = await verify(token);
  return payload?.typ === 'admin_2fa' && typeof payload.sub === 'string' ? payload.sub : null;
}
