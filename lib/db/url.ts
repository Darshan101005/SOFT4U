/**
 * pg treats sslmode=require as verify-full today and warns about it. Neon's
 * URLs use sslmode=require, so we state verify-full explicitly (same
 * behaviour, no warning).
 */
export function normalizePgUrl(url: string): string {
  return url.replace(/([?&])sslmode=(require|prefer|verify-ca)(?=&|$)/, '$1sslmode=verify-full');
}
