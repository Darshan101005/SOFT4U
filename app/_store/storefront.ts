import { cache } from 'react';
import { db } from '@/lib/db';
import type { SiteSettings } from '@/lib/db/types';
import { getUsdPkrRate } from '@/lib/fx';
import { headers } from 'next/headers';
import { getCurrencyFromCookies, isUsdOnly } from '@/lib/currency-pref';
import { DEFAULT_USD_PRICING } from '@/lib/pricing';
import { siteConfig } from '@/lib/site-config';
import type { Pricing } from '@/app/_store/price';

/**
 * Server-only storefront data helpers. Every read falls back to lib/site-config
 * values when the database is unreachable, so public pages still render.
 */

export async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error('[storefront] data read failed:', err instanceof Error ? err.message : err);
    return fallback;
  }
}

export const getSettings = cache(async (): Promise<SiteSettings | null> => safe(() => db.getSiteSettings(), null));

/** Display currency (cookie only, never waits on geo lookup) plus the live rate. */
export const getPricing = cache(async (): Promise<Pricing> => {
  const settings = await getSettings();
  const usdEnabled = settings?.usdEnabled ?? false;
  const { currency: wanted, source } = await getCurrencyFromCookies();
  // Outside Pakistan (while the PKR lock is on) the cookie is ignored: USD only.
  const h = await headers();
  const usdOnly = settings && usdEnabled ? await safe(() => isUsdOnly(h, settings), true) : false;
  const currency = usdOnly || (usdEnabled && wanted === 'USD') ? 'USD' : 'PKR';
  const rate = currency === 'USD' ? await safe(async () => (await getUsdPkrRate()).rate, settings?.fallbackUsdRate || 280) : 1;
  return { currency, rate, usdPricing: settings?.usdPricing || DEFAULT_USD_PRICING, usdEnabled, resolved: usdOnly || !usdEnabled || source !== 'default', usdOnly };
});

export interface StoreInfo {
  name: string;
  description: string;
  tagline: string;
  logoUrl: string;
  email: string;
  phone: string;
  phoneHref: string;
  whatsapp: string;
  whatsappHref: string;
  telegram: string;
  telegramHref: string;
  address: string;
  hours: string;
  social: SiteSettings['socialLinks'];
}

function digits(v: string): string {
  return (v || '').replace(/[^\d]/g, '');
}

/** Business and contact details: admin settings first, lib/site-config as fallback. */
export const getStoreInfo = cache(async (): Promise<StoreInfo> => {
  const s = await getSettings();
  const phone = s?.contactPhone || siteConfig.phone;
  const whatsapp = s?.contactWhatsapp || siteConfig.whatsapp;
  const telegram = (s?.contactTelegram || s?.socialLinks?.telegram || '').trim();
  const telegramHref = telegram ? (telegram.startsWith('http') ? telegram : `https://t.me/${telegram.replace(/^@+/, '')}`) : '';
  return {
    name: s?.siteName || siteConfig.name,
    description: s?.description || siteConfig.description,
    tagline: s?.tagline || siteConfig.tagline,
    logoUrl: s?.logoUrl || '',
    email: s?.contactEmail || siteConfig.email,
    phone,
    phoneHref: digits(phone) ? `tel:+${digits(phone)}` : siteConfig.phoneHref,
    whatsapp,
    whatsappHref: digits(whatsapp) ? `https://wa.me/${digits(whatsapp)}` : siteConfig.whatsappHref,
    telegram: telegram.startsWith('http') ? telegram.replace(/^https?:\/\/t\.me\//, '@') : telegram ? `@${telegram.replace(/^@+/, '')}` : '',
    telegramHref,
    address: s?.contactAddress || siteConfig.address,
    hours: s?.businessHours || siteConfig.hours,
    social: s?.socialLinks || {},
  };
});

/** JSON for a <script type="application/ld+json"> tag, with "<" escaped. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
