import { SITE_URL } from '@/lib/site-config';

/**
 * Public origin used for canonical URLs, the sitemap, robots and JSON-LD.
 * NEXT_PUBLIC_APP_URL must be https://soft4u.top in production.
 */
export function siteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_APP_URL || SITE_URL).trim().replace(/\/+$/, '');
  try {
    return new URL(raw).origin;
  } catch {
    return SITE_URL;
  }
}

export function absoluteUrl(path = '/'): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Paths that must never be indexed (also listed in robots.txt). */
export const NOINDEX_PATHS = [
  '/admin',
  '/account',
  '/api/',
  '/checkout',
  '/cart',
  '/login',
  '/register',
  '/forgot-password',
  '/order-success',
  '/maintenance',
];
