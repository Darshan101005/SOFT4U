import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { siteConfig } from '@/lib/site-config';
import { Mail, MessageCircle, Phone } from 'lucide-react';

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

const POLICY_LINKS = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/refund-policy', label: 'Refund & Return Policy' },
  { href: '/delivery-policy', label: 'Delivery & Service Policy' },
  { href: '/cookie-policy', label: 'Cookie Policy' },
];

export const LEGAL_LAST_UPDATED = 'October 2026';

export function LegalPage({
  path,
  title,
  intro,
  sections,
}: {
  path: string;
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <Header />
      <main className="flex-1 w-full">
        <section className="bg-pista-lighter border-b border-pista-light">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <nav aria-label="Breadcrumb" className="text-xs text-charcoal-subtle mb-3">
              <Link href="/" className="hover:text-pista-dark">Home</Link>
              <span className="mx-1.5">/</span>
              <span className="text-charcoal-muted">{title}</span>
            </nav>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-charcoal">{title}</h1>
            <p className="mt-3 text-sm text-charcoal-muted max-w-3xl leading-relaxed">{intro}</p>
            <p className="mt-2 text-xs text-charcoal-subtle">Last updated: {LEGAL_LAST_UPDATED}</p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <article className="lg:col-span-8 bg-surface-card border border-charcoal-border rounded-2xl p-6 sm:p-10 space-y-8">
            {sections.map((section, idx) => (
              <section key={section.heading} aria-labelledby={`section-${idx}`} className="space-y-3">
                <h2 id={`section-${idx}`} className="text-lg font-bold text-charcoal">
                  {idx + 1}. {section.heading}
                </h2>
                {section.paragraphs?.map((p, i) => (
                  <p key={i} className="text-sm text-charcoal-muted leading-relaxed">{p}</p>
                ))}
                {section.bullets && (
                  <ul className="list-disc pl-5 space-y-1.5 text-sm text-charcoal-muted leading-relaxed marker:text-pista">
                    {section.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </article>

          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-surface-card border border-charcoal-border rounded-2xl p-6">
              <h2 className="text-sm font-bold text-charcoal uppercase tracking-wider mb-3">Store Policies</h2>
              <ul className="space-y-1">
                {POLICY_LINKS.map(link => {
                  const active = link.href === path;
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        aria-current={active ? 'page' : undefined}
                        className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                          active
                            ? 'bg-pista-lighter text-pista-darker font-semibold'
                            : 'text-charcoal-muted hover:bg-surface-muted hover:text-pista-dark'
                        }`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="bg-pista-lighter border border-pista-light rounded-2xl p-6 space-y-3">
              <h2 className="text-sm font-bold text-charcoal uppercase tracking-wider">Questions?</h2>
              <p className="text-sm text-charcoal-muted">
                Our {siteConfig.name} support team is happy to help. {siteConfig.hours}.
              </p>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href={`mailto:${siteConfig.email}`} className="flex items-center gap-2 text-charcoal hover:text-pista-dark">
                    <Mail className="w-4 h-4 text-pista-dark" aria-hidden="true" />
                    <span>{siteConfig.email}</span>
                  </a>
                </li>
                <li>
                  <a href={siteConfig.phoneHref} className="flex items-center gap-2 text-charcoal hover:text-pista-dark">
                    <Phone className="w-4 h-4 text-pista-dark" aria-hidden="true" />
                    <span>{siteConfig.phone}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={siteConfig.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-charcoal hover:text-pista-dark"
                  >
                    <MessageCircle className="w-4 h-4 text-pista-dark" aria-hidden="true" />
                    <span>WhatsApp {siteConfig.whatsapp}</span>
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
