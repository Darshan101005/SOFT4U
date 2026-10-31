import type { SiteSettings } from './types';
import { siteConfig } from '@/lib/site-config';

/**
 * Baseline settings. Stored settings are merged over this, so a key added
 * here later is always present even if the DB row predates it.
 */
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: siteConfig.name,
  tagline: siteConfig.tagline,
  description: siteConfig.description,
  contactEmail: siteConfig.email,
  contactPhone: siteConfig.phone,
  contactWhatsapp: siteConfig.whatsapp,
  contactTelegram: '',
  contactAddress: siteConfig.address,
  businessHours: siteConfig.hours,
  currencySymbol: siteConfig.currencySymbol,
  currencyCode: siteConfig.currency,
  usdEnabled: true,
  fallbackUsdRate: 280,
  usdPricing: { mode: 'auto', percent: 0, amount: 0, roundTo: 0.01 },
  taxRate: 0,
  orderAlertEmails: [],
  maintenanceMode: false,
  maintenanceMessage: 'We are making a few improvements and will be back shortly.',
  guestCheckoutEnabled: false,
  requirePhone: false,
  requireWhatsapp: true,
  branding: {
    primaryColor: '#93C572',
    backgroundColor: '#F8FBF4',
    charcoalColor: '#2B3328',
    borderRadius: '12px',
  },
  socialLinks: {
    whatsapp: siteConfig.whatsappHref,
  },
  seoDefaults: {
    title: `${siteConfig.name} – Digital Subscriptions & Software`,
    description: siteConfig.description,
    keywords:
      'netflix premium, ott subscriptions, youtube premium, chatgpt plus, canva pro, vpn, software licence, digital subscriptions',
  },
  aiSupportEnabled: true,
  aiSupportName: 'SOFT4U ASSISTANT',
  aiWelcomeMessage:
    'Hi! I am the SOFT4U ASSISTANT. Ask me about products, prices, payment or your order status.',
};

export function mergeSettings(stored: Partial<SiteSettings> | null | undefined): SiteSettings {
  const s = stored || {};
  return {
    ...DEFAULT_SITE_SETTINGS,
    ...s,
    usdPricing: { ...DEFAULT_SITE_SETTINGS.usdPricing, ...(s.usdPricing || {}) },
    branding: { ...DEFAULT_SITE_SETTINGS.branding, ...(s.branding || {}) },
    socialLinks: { ...DEFAULT_SITE_SETTINGS.socialLinks, ...(s.socialLinks || {}) },
    seoDefaults: { ...DEFAULT_SITE_SETTINGS.seoDefaults, ...(s.seoDefaults || {}) },
  };
}
