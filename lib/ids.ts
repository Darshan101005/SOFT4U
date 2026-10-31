import crypto from 'crypto';

/** Uppercase alphabet without look-alike characters (no I, O, 0, 1). */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function randomCode(length: number, alphabet = CODE_ALPHABET): string {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

/** Opaque primary key, e.g. `prod_k3j9x2m4q8w7`. */
export function newId(prefix: string): string {
  return `${prefix}_${randomCode(14, 'abcdefghijklmnopqrstuvwxyz0123456789')}`;
}

/** Customer-facing order / tracking id, e.g. `S4U-7KQ2M9XH4D` (~50 bits, not guessable). */
export function newOrderNumber(): string {
  return `S4U-${randomCode(10)}`;
}

export function newTicketNumber(): string {
  return `TKT-${randomCode(8)}`;
}

/** URL-safe random token (sessions, reset links). */
export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
