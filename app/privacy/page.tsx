import type { Metadata } from 'next';
import { LegalPage, legalSummary, loadLegal } from '@/app/_store/legal-page';
import { siteConfig } from '@/lib/site-config';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const page = await loadLegal('privacy');
  const title = `${page.title || 'Privacy Policy'} | ${siteConfig.name}`;
  const description = legalSummary(page.content) || `Privacy Policy for ${siteConfig.name}.`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: '/privacy' },
    openGraph: { title, description, url: '/privacy', type: 'article' },
    twitter: { card: 'summary', title, description },
  };
}

export default function PrivacyPage() {
  return <LegalPage path="/privacy" slug="privacy" fallbackTitle="Privacy Policy" />;
}