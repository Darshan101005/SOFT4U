import type { Metadata } from 'next';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: { absolute: `Your Cart | ${siteConfig.name}` },
  description: `Review the subscriptions and software in your ${siteConfig.name} cart before checkout.`,
  alternates: { canonical: '/cart' },
  robots: { index: false, follow: true },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
