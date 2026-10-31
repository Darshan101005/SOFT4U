import type { Metadata } from 'next';
import { LegalPage, legalSummary, loadLegal } from '@/app/_store/legal-page';
import { siteConfig } from '@/lib/site-config';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const page = await loadLegal('cookie-policy');
  const title = `${page.title || 'Cookie Policy'} | ${siteConfig.name}`;
  const description = legalSummary(page.content) || `Cookie Policy for ${siteConfig.name}.`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: '/cookie-policy' },
    openGraph: { title, description, url: '/cookie-policy', type: 'article' },
    twitter: { card: 'summary', title, description },
  };
}

export default function CookiePolicyPage() {
  return <LegalPage path="/cookie-policy" slug="cookie-policy" fallbackTitle="Cookie Policy" />;
}