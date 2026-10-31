import type { Metadata } from 'next';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: { absolute: `Checkout | ${siteConfig.name}` },
  description: `Checkout at ${siteConfig.name}: pay by bank transfer, Easypaisa or JazzCash and upload your payment proof for manual verification.`,
  alternates: { canonical: '/checkout' },
  robots: { index: false, follow: true },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
