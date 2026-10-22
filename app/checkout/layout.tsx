import type { Metadata } from 'next';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: { absolute: `Checkout | ${siteConfig.name}` },
  description: `Secure checkout for digital subscriptions and software at ${siteConfig.name}. Prices in ${siteConfig.currency} with instant digital delivery.`,
  alternates: { canonical: '/checkout' },
  robots: { index: false, follow: true },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
