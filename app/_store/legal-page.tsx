import React from 'react';
import Link from 'next/link';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { db } from '@/lib/db';
import type { LegalSlug } from '@/lib/db/types';
import { seedLegalPages } from '@/lib/db/seed-data';
import { SITE_URL } from '@/lib/site-config';
import { getStoreInfo, jsonLd, safe } from '@/app/_store/storefront';
import { Markdown } from '@/app/_store/markdown';

const POLICY_LINKS = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/refund-policy', label: 'Refund & Return Policy' },
  { href: '/delivery-policy', label: 'Delivery & Service Policy' },
  { href: '/cookie-policy', label: 'Cookie Policy' },
];

/** Published copy from Admin → Pages; the seeded text is the fallback if the page is missing. */
export async function loadLegal(slug: LegalSlug) {
  const page = await safe(() => db.getLegalPageBySlug(slug), null);
  const seed = seedLegalPages.find(p => p.slug === slug);
  if (page && page.status === 'published' && page.content.trim()) return { title: page.title, content: page.content, updated: page.lastPublishedAt };
  return { title: seed?.title || '', content: seed?.content || '', updated: '' };
}

/** First real paragraph, for the meta description. */
export function legalSummary(content: string, max = 160): string {
  const para = content
    .split(/\n\s*\n/)
    .map(s => s.trim())
    .find(s => s && !s.startsWith('#') && !s.startsWith('**Last updated') && !s.startsWith('-'));
  const text = (para || '').replace(/\*\*|\*|`|\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\s+/g, ' ');
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export async function LegalPage({ path, slug, fallbackTitle }: { path: string; slug: LegalSlug; fallbackTitle: string }) {
  const [{ title, content, updated }, store] = await Promise.all([loadLegal(slug), getStoreInfo()]);
  const heading = title || fallbackTitle;
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: heading, item: `${SITE_URL}${path}` },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }} />
      <main className="flex-1 w-full">
        <section className="bg-pista-lighter border-b border-pista-light">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
            <nav aria-label="Breadcrumb" className="text-xs text-charcoal-subtle mb-3">
              <Link href="/" className="hover:text-pista-dark">
                Home
              </Link>
              <span className="mx-1.5">/</span>
              <span className="text-charcoal-muted">{heading}</span>
            </nav>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-charcoal">{heading}</h1>
            {updated && (
              <p className="mt-2 text-xs text-charcoal-subtle">
                Last updated: {new Date(updated).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <article className="lg:col-span-8 bg-surface-card border border-charcoal-border rounded-2xl p-5 sm:p-10 min-w-0 break-words">
            <Markdown source={updated ? content.replace(/^\*\*Last updated:[^\n]*\*\*\s*$/m, '') : content} skipFirstH1 />
          </article>
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-surface-card border border-charcoal-border rounded-2xl p-5 sm:p-6">
              <h2 className="text-sm font-bold text-charcoal uppercase tracking-wider mb-3">Store Policies</h2>
              <ul className="space-y-1">
                {POLICY_LINKS.map(link => {
                  const active = link.href === path;
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        aria-current={active ? 'page' : undefined}
                        className={`flex items-center min-h-11 px-3 rounded-lg text-sm transition-colors ${
                          active ? 'bg-pista-lighter text-pista-darker font-semibold' : 'text-charcoal-muted hover:bg-surface-muted hover:text-pista-dark'
                        }`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="bg-pista-lighter border border-pista-light rounded-2xl p-5 sm:p-6 space-y-3">
              <h2 className="text-sm font-bold text-charcoal uppercase tracking-wider">Questions?</h2>
              <p className="text-sm text-charcoal-muted">
                Our {store.name} support team is happy to help. {store.hours}.
              </p>
              <ul className="space-y-1 text-sm">
                <li>
                  <a href={`mailto:${store.email}`} className="flex items-center gap-2 min-h-11 text-charcoal hover:text-pista-dark break-all">
                    <Mail className="w-4 h-4 text-pista-dark shrink-0" aria-hidden="true" />
                    <span>{store.email}</span>
                  </a>
                </li>
                <li>
                  <a href={store.phoneHref} className="flex items-center gap-2 min-h-11 text-charcoal hover:text-pista-dark">
                    <Phone className="w-4 h-4 text-pista-dark shrink-0" aria-hidden="true" />
                    <span>{store.phone}</span>
                  </a>
                </li>
                <li>
                  <a href={store.whatsappHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 min-h-11 text-charcoal hover:text-pista-dark">
                    <MessageCircle className="w-4 h-4 text-pista-dark shrink-0" aria-hidden="true" />
                    <span>WhatsApp {store.whatsapp}</span>
                  </a>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
