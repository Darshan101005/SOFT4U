import type { Metadata } from 'next';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: { absolute: `Track Your Order | ${siteConfig.name}` },
  description: `Check the status of your ${siteConfig.name} order using your order number.`,
  alternates: { canonical: '/track-order' },
};

export default function TrackOrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
