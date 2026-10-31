import type { Metadata } from 'next';
import { LegalPage, legalSummary, loadLegal } from '@/app/_store/legal-page';
import { siteConfig } from '@/lib/site-config';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const page = await loadLegal('refund-policy');
  const title = `${page.title || 'Refund & Return Policy'} | ${siteConfig.name}`;
  const description = legalSummary(page.content) || `Refund & Return Policy for ${siteConfig.name}.`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: '/refund-policy' },
    openGraph: { title, description, url: '/refund-policy', type: 'article' },
    twitter: { card: 'summary', title, description },
  };
}

export default function RefundPolicyPage() {
  return <LegalPage path="/refund-policy" slug="refund-policy" fallbackTitle="Refund & Return Policy" />;
}