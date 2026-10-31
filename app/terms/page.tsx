import type { Metadata } from 'next';
import { LegalPage, legalSummary, loadLegal } from '@/app/_store/legal-page';
import { siteConfig } from '@/lib/site-config';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const page = await loadLegal('terms');
  const title = `${page.title || 'Terms & Conditions'} | ${siteConfig.name}`;
  const description = legalSummary(page.content) || `Terms & Conditions for ${siteConfig.name}.`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: '/terms' },
    openGraph: { title, description, url: '/terms', type: 'article' },
    twitter: { card: 'summary', title, description },
  };
}

export default function TermsPage() {
  return <LegalPage path="/terms" slug="terms" fallbackTitle="Terms & Conditions" />;
}