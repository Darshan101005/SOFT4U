import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Headphones, Lock, Mail, MessageCircle, Phone, Wallet } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { siteConfig, SITE_URL } from '@/lib/site-config';
import { getStoreInfo, jsonLd } from '@/app/_store/storefront';

export const dynamic = 'force-dynamic';

const title = `About Us | ${siteConfig.name}`;
const description = `${siteConfig.name} is an online store for OTT and streaming subscriptions, AI tools, VPNs and genuine software, with manually verified payments and private digital delivery.`;

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: '/about' },
  openGraph: { title, description, url: '/about', type: 'website' },
  twitter: { card: 'summary', title, description },
};

const highlights = [
  { icon: BadgeCheck, title: 'Verified by a person', text: 'Every payment is checked by our team before delivery, so you always know where your order stands.' },
  { icon: Lock, title: 'Private delivery', text: 'Access details are shown only on your order page and account, and sent to the channels you choose.' },
  { icon: Wallet, title: 'Clear prices', text: 'Prices in PKR or USD with no hidden charges. Pay by bank transfer, Easypaisa or JazzCash.' },
  { icon: Headphones, title: 'Real human support', text: 'Our team answers on WhatsApp, Telegram and email, and replaces access that stops working during your plan.' },
];

export default async function AboutPage() {
  const store = await getStoreInfo();
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'About', item: `${SITE_URL}/about` },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }} />
      <main className="flex-1 w-full">
        <section className="bg-pista-lighter border-b border-pista-light">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 text-center space-y-4">
            <div className="text-xs font-bold text-pista-dark uppercase tracking-wider">About {store.name}</div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-charcoal">All Subscriptions at One Place</h1>
            <p className="text-sm sm:text-base text-charcoal-muted max-w-2xl mx-auto leading-relaxed">
              {store.name} makes premium OTT subscriptions, streaming services, VPNs, AI tools and software easy to buy, with clear prices, manually verified payments and private
              digital delivery.
            </p>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-4">
          <h2 className="text-2xl font-bold text-charcoal">Who we are</h2>
          <p className="text-sm sm:text-base text-charcoal-muted leading-relaxed">
            Paying for international digital services is often difficult. We take care of that for you, offering popular services such as Netflix, YouTube Premium, Spotify,
            Canva, ChatGPT and leading VPNs in convenient plans.
          </p>
          <p className="text-sm sm:text-base text-charcoal-muted leading-relaxed">
            Every order is checked by our team, delivered to your account and email, and covered by a replacement warranty for the full plan duration. If something stops
            working, we fix it.
          </p>
        </section>

        <section className="bg-surface-card border-y border-charcoal-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
            <h2 className="text-2xl font-bold text-charcoal text-center mb-8">Why customers choose {store.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {highlights.map(h => (
                <div key={h.title} className="rounded-2xl border border-charcoal-border p-5 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-pista-lighter text-pista-dark flex items-center justify-center">
                    <h.icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-bold text-charcoal">{h.title}</h3>
                  <p className="text-sm text-charcoal-muted leading-relaxed">{h.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface-card border border-charcoal-border rounded-2xl p-5 sm:p-6 space-y-3 min-w-0">
            <h2 className="text-lg font-bold text-charcoal">Business information</h2>
            <dl className="text-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                <dt className="text-charcoal-subtle">Business name</dt>
                <dd className="font-semibold text-charcoal sm:text-right">{siteConfig.legalName}</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                <dt className="text-charcoal-subtle">Website</dt>
                <dd className="font-semibold text-charcoal sm:text-right">{siteConfig.domain}</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                <dt className="text-charcoal-subtle">Address</dt>
                <dd className="font-semibold text-charcoal sm:text-right">{store.address}</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                <dt className="text-charcoal-subtle">Support hours</dt>
                <dd className="font-semibold text-charcoal sm:text-right">{store.hours}</dd>
              </div>
            </dl>
          </div>
          <div className="bg-pista-lighter border border-pista-light rounded-2xl p-5 sm:p-6 space-y-3 min-w-0">
            <h2 className="text-lg font-bold text-charcoal">Talk to us</h2>
            <ul className="text-sm space-y-1">
              <li>
                <a href={`mailto:${store.email}`} className="flex items-center gap-2 min-h-11 text-charcoal hover:text-pista-dark break-all">
                  <Mail className="w-4 h-4 text-pista-dark shrink-0" aria-hidden="true" /> {store.email}
                </a>
              </li>
              <li>
                <a href={store.phoneHref} className="flex items-center gap-2 min-h-11 text-charcoal hover:text-pista-dark">
                  <Phone className="w-4 h-4 text-pista-dark shrink-0" aria-hidden="true" /> {store.phone}
                </a>
              </li>
              <li>
                <a href={store.whatsappHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 min-h-11 text-charcoal hover:text-pista-dark">
                  <MessageCircle className="w-4 h-4 text-pista-dark shrink-0" aria-hidden="true" /> WhatsApp {store.whatsapp}
                </a>
              </li>
            </ul>
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link href="/shop" className="inline-flex items-center justify-center gap-2 min-h-11 px-5 bg-pista-dark text-white hover:bg-pista-darker text-sm font-bold rounded-xl">
                Browse Products <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center min-h-11 px-5 bg-surface-card border border-pista-light text-pista-darker hover:border-pista text-sm font-semibold rounded-xl">
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
