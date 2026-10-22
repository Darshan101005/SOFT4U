import type { Metadata } from 'next';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: { absolute: `Order Confirmed | ${siteConfig.name}` },
  description: `Your ${siteConfig.name} order has been received. See your order number and next steps.`,
  alternates: { canonical: '/order-success' },
  robots: { index: false, follow: true },
};

export default function OrderSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
