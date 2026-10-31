import type { Metadata } from 'next';
import { LegalPage, legalSummary, loadLegal } from '@/app/_store/legal-page';
import { siteConfig } from '@/lib/site-config';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const page = await loadLegal('delivery-policy');
  const title = `${page.title || 'Delivery & Service Policy'} | ${siteConfig.name}`;
  const description = legalSummary(page.content) || `Delivery & Service Policy for ${siteConfig.name}.`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: '/delivery-policy' },
    openGraph: { title, description, url: '/delivery-policy', type: 'article' },
    twitter: { card: 'summary', title, description },
  };
}

export default function DeliveryPolicyPage() {
  return <LegalPage path="/delivery-policy" slug="delivery-policy" fallbackTitle="Delivery & Service Policy" />;
}