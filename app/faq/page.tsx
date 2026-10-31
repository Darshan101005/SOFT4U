import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { db } from '@/lib/db';
import { seedFaqs } from '@/lib/db/seed-data';
import { siteConfig, SITE_URL } from '@/lib/site-config';
import { getStoreInfo, jsonLd, safe } from '@/app/_store/storefront';

export const dynamic = 'force-dynamic';

const title = `FAQs | ${siteConfig.name}`;
const description = `Answers to common questions about ordering, payment, delivery, warranty and refunds at ${siteConfig.name}.`;

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: '/faq' },
  openGraph: { title, description, url: '/faq', type: 'website' },
  twitter: { card: 'summary', title, description },
};

export default async function FAQPage() {
  const [rows, store] = await Promise.all([safe(() => db.getFAQs(true), []), getStoreInfo()]);
  const source = rows.length ? rows.filter(f => !f.productId) : seedFaqs.filter(f => f.status === 'active');
  const faqs = [...source].sort((a, b) => a.displayOrder - b.displayOrder);
  const groups = new Map<string, typeof faqs>();
  for (const f of faqs) {
    const key = f.category || 'General';
    groups.set(key, [...(groups.get(key) || []), f]);
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
  };
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'FAQ', item: `${SITE_URL}/faq` },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <Header />
      {faqs.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqJsonLd) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }} />
      <main className="flex-1 w-full">
        <section className="bg-pista-lighter border-b border-pista-light">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 text-center space-y-3">
            <div className="text-xs font-bold text-pista-dark uppercase tracking-wider">Help centre</div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-charcoal">Frequently Asked Questions</h1>
            <p className="text-sm text-charcoal-muted max-w-xl mx-auto">Quick answers about ordering, payment, delivery and warranty.</p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
          {[...groups.entries()].map(([group, list]) => (
            <section key={group} aria-label={group} className="space-y-3">
              {groups.size > 1 && <h2 className="text-sm font-bold uppercase tracking-wider text-pista-dark">{group}</h2>}
              {list.map(faq => (
                <details key={faq.id} className="group bg-surface-card border border-charcoal-border rounded-2xl open:border-pista transition-colors">
                  <summary className="min-h-14 px-5 py-3 font-bold text-sm sm:text-base text-charcoal cursor-pointer flex items-center justify-between gap-4 list-none">
                    <span>{faq.question}</span>
                    <ChevronDown className="w-4 h-4 text-pista-dark flex-shrink-0 group-open:rotate-180 transition-transform" aria-hidden="true" />
                  </summary>
                  <p className="mx-5 pb-5 pt-3 border-t border-surface-muted text-sm text-charcoal-muted leading-relaxed whitespace-pre-line">{faq.answer}</p>
                </details>
              ))}
            </section>
          ))}

          <div className="p-6 bg-surface-card border border-charcoal-border rounded-2xl text-center space-y-3">
            <h2 className="text-lg font-bold text-charcoal">Still have a question?</h2>
            <p className="text-sm text-charcoal-muted">Our support team will be happy to help you. {store.hours}.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <a href={store.whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center min-h-11 px-5 bg-pista-dark text-white hover:bg-pista-darker text-sm font-bold rounded-xl">
                Chat on WhatsApp
              </a>
              <Link href="/contact" className="inline-flex items-center justify-center min-h-11 px-5 border border-pista-light text-pista-darker hover:border-pista text-sm font-semibold rounded-xl">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
