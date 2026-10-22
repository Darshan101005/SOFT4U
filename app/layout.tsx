import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { SITE_URL, siteConfig } from '@/lib/site-config';

const defaultTitle = `${siteConfig.name} – Digital Subscriptions & Software in Pakistan`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: defaultTitle,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    title: defaultTitle,
    description: siteConfig.description,
    url: SITE_URL,
    siteName: siteConfig.name,
    locale: 'en_PK',
    type: 'website',
    images: [{ url: '/hero/soft4u-hero.png', width: 1801, height: 873, alt: `${siteConfig.name} digital store` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: siteConfig.description,
    images: ['/hero/soft4u-hero.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F6FAF1',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="bg-surface-bg text-charcoal font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
