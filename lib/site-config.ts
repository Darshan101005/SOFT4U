/**
 * Single source of truth for Soft4u business + contact details.
 * Every page, the footer, metadata, robots and sitemap read from here, so
 * changing a value here updates it across the whole site.
 */

export const SITE_URL = "https://soft4u.top";

export const siteConfig = {
  name: "Soft4u",
  // TODO: replace with the registered business / legal name used for the payment gateway.
  legalName: "Soft4u",
  url: SITE_URL,
  domain: "soft4u.top",
  tagline: "Premium digital subscriptions and software, delivered instantly.",
  description:
    "Buy OTT subscriptions, streaming accounts and genuine software licences in Pakistan at the best prices. Instant digital delivery via email and WhatsApp.",

  email: "support@soft4u.top",
  phone: "+92 323 9539487",
  phoneHref: "tel:+923239539487",
  whatsapp: "+92 323 9539487",
  whatsappHref: "https://wa.me/923239539487",

  // TODO: replace with the real business address in Pakistan.
  address: "Pakistan",
  // TODO: confirm business hours with the client.
  hours: "Mon – Sat, 10:00 AM – 10:00 PM (PKT)",

  currency: "PKR",
  currencySymbol: "Rs",
} as const;

export type SiteConfig = typeof siteConfig;
