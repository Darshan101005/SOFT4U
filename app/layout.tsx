import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { db } from '@/lib/db';
import type { SiteSettings } from '@/lib/db/types';
import { siteConfig } from '@/lib/site-config';
import { absoluteUrl, siteUrl } from '@/lib/seo';

const FALLBACK_TITLE = `${siteConfig.name} | Digital Subscriptions, Software & AI Tools`;
const OG_IMAGE = '/hero/soft4u-hero.png';

async function settings(): Promise<SiteSettings | null> {
  try {
    return await db.getSiteSettings();
  } catch {
    return null;
  }
}

/** Global defaults; every page sets its own title, description and canonical on top. */
export async function generateMetadata(): Promise<Metadata> {
  const s = await settings();
  const title = s?.seoDefaults?.title || FALLBACK_TITLE;
  const description = s?.seoDefaults?.description || siteConfig.description;
  const ogImage = s?.seoDefaults?.ogImage || OG_IMAGE;
  const google = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || s?.seoDefaults?.googleSiteVerification?.trim() || undefined;
  const keywords = s?.seoDefaults?.keywords
    ?.split(',')
    .map(k => k.trim())
    .filter(Boolean);

  return {
    metadataBase: new URL(siteUrl()),
    title: { default: title, template: `%s | ${siteConfig.name}` },
    description,
    applicationName: siteConfig.name,
    keywords: keywords?.length ? keywords : undefined,
    authors: [{ name: siteConfig.name, url: siteUrl() }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    category: 'shopping',
    formatDetection: { telephone: false, email: false, address: false },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
    },
    openGraph: {
      type: 'website',
      siteName: siteConfig.name,
      url: '/',
      locale: 'en_US',
      title,
      description,
      images: [{ url: ogImage, width: 1801, height: 873, alt: `${siteConfig.name} digital store` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    verification: google ? { google } : undefined,
    icons: s?.faviconUrl ? { icon: [{ url: s.faviconUrl, type: 'image/png' }], apple: [{ url: s.faviconUrl }] } : undefined,
    appleWebApp: { capable: true, title: siteConfig.name, statusBarStyle: 'default' },
    other: { 'mobile-web-app-capable': 'yes' },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F6FAF1',
};

function jsonLd(s: SiteSettings | null) {
  const base = siteUrl();
  const sameAs = Object.values(s?.socialLinks || {}).filter((u): u is string => typeof u === 'string' && /^https?:\/\//.test(u.trim()));
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${base}/#organization`,
      name: s?.siteName || siteConfig.name,
      legalName: siteConfig.legalName,
      url: base,
      logo: absoluteUrl('/apple-icon'),
      description: s?.description || siteConfig.description,
      email: s?.contactEmail || siteConfig.email,
      telephone: s?.contactPhone || siteConfig.phone,
      address: { '@type': 'PostalAddress', streetAddress: s?.contactAddress || siteConfig.address, addressCountry: 'PK' },
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email: s?.contactEmail || siteConfig.email,
          telephone: s?.contactWhatsapp || siteConfig.whatsapp,
          availableLanguage: ['English', 'Urdu'],
        },
      ],
      ...(sameAs.length ? { sameAs } : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${base}/#website`,
      name: s?.siteName || siteConfig.name,
      url: base,
      inLanguage: 'en',
      publisher: { '@id': `${base}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${base}/shop?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
  ];
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await settings();
  return (
    <html lang="en">
      <body suppressHydrationWarning className="bg-surface-bg text-charcoal font-sans antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(s)).replace(/</g, '\\u003c') }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
