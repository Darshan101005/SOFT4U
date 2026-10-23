import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { siteConfig } from '@/lib/site-config';
import { ShieldCheck, Zap, Headphones, BadgePercent, ArrowRight, Mail, Phone, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: { absolute: `About Us | ${siteConfig.name}` },
  description: `${siteConfig.name} is a Pakistani online store for OTT subscriptions, streaming access and genuine software at affordable prices, with instant digital delivery.`,
  alternates: { canonical: '/about' },
};

const highlights = [
  {
    icon: Zap,
    title: 'Instant Delivery',
    text: 'Most orders reach your email or WhatsApp within minutes of payment, with simple activation steps.',
  },
  {
    icon: ShieldCheck,
    title: 'Protected Checkout',
    text: 'Payments are processed by a licensed Pakistani payment partner. Your card details never touch our servers.',
  },
  {
    icon: BadgePercent,
    title: 'Best Prices in PKR',
    text: 'Clear plan options and honest prices in Pakistani Rupees, so premium services fit every budget.',
  },
  {
    icon: Headphones,
    title: 'Real Human Support',
    text: 'Our team answers on WhatsApp, phone and email and replaces any access that stops working during your plan.',
  },
];

const stats = [
  { value: '30+', label: 'Digital products' },
  { value: '5 min', label: 'Average delivery' },
  { value: '24/7', label: 'Order processing' },
  { value: '100%', label: 'Replacement warranty' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <Header />
      <main className="flex-1 w-full">
        <section className="bg-pista-lighter border-b border-pista-light">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 text-center space-y-4">
            <div className="text-xs font-bold text-pista-dark uppercase tracking-wider">About {siteConfig.name}</div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-charcoal">All Subscriptions at One Place</h1>
            <p className="text-sm sm:text-base text-charcoal-muted max-w-2xl mx-auto leading-relaxed">
              {siteConfig.name} is an online digital store based in {siteConfig.city}. We make premium OTT
              subscriptions, streaming services, VPNs, AI tools and software easy and affordable to buy, with
              protected checkout and private digital delivery.
            </p>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-charcoal">Who we are</h2>
            <p className="text-sm text-charcoal-muted leading-relaxed">
              We started {siteConfig.name} for one simple reason: paying for international digital services from
              Pakistan is often difficult and expensive. We take care of that for you, offering popular services
              such as Netflix, YouTube Premium, Spotify, Canva, ChatGPT and leading VPNs in convenient plans,
              priced in {siteConfig.currency}.
            </p>
            <p className="text-sm text-charcoal-muted leading-relaxed">
              Every order is checked by our team, delivered to your email or WhatsApp, and covered by a replacement
              warranty for the full plan duration. If something stops working, we fix it.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {stats.map(s => (
              <div key={s.label} className="bg-surface-card border border-charcoal-border rounded-2xl p-5 text-center">
                <div className="text-2xl font-extrabold text-pista-dark">{s.value}</div>
                <div className="text-xs text-charcoal-subtle mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-surface-card border-y border-charcoal-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h2 className="text-2xl font-bold text-charcoal text-center mb-8">Why customers choose {siteConfig.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {highlights.map(h => (
                <div key={h.title} className="rounded-2xl border border-charcoal-border p-5 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-pista-lighter text-pista-dark flex items-center justify-center">
                    <h.icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-bold text-charcoal">{h.title}</h3>
                  <p className="text-xs text-charcoal-muted leading-relaxed">{h.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface-card border border-charcoal-border rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-bold text-charcoal">Business information</h2>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between gap-4"><dt className="text-charcoal-subtle">Business name</dt><dd className="font-semibold text-charcoal text-right">{siteConfig.legalName}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-charcoal-subtle">Website</dt><dd className="font-semibold text-charcoal text-right">{siteConfig.domain}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-charcoal-subtle">Address</dt><dd className="font-semibold text-charcoal text-right">{siteConfig.address}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-charcoal-subtle">Support hours</dt><dd className="font-semibold text-charcoal text-right">{siteConfig.hours}</dd></div>
            </dl>
          </div>
          <div className="bg-pista-lighter border border-pista-light rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-bold text-charcoal">Talk to us</h2>
            <ul className="text-sm space-y-2">
              <li>
                <a href={`mailto:${siteConfig.email}`} className="flex items-center gap-2 text-charcoal hover:text-pista-dark">
                  <Mail className="w-4 h-4 text-pista-dark" aria-hidden="true" /> {siteConfig.email}
                </a>
              </li>
              <li>
                <a href={siteConfig.phoneHref} className="flex items-center gap-2 text-charcoal hover:text-pista-dark">
                  <Phone className="w-4 h-4 text-pista-dark" aria-hidden="true" /> {siteConfig.phone}
                </a>
              </li>
              <li>
                <a href={siteConfig.whatsappHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-charcoal hover:text-pista-dark">
                  <MessageCircle className="w-4 h-4 text-pista-dark" aria-hidden="true" /> WhatsApp {siteConfig.whatsapp}
                </a>
              </li>
            </ul>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link href="/shop" className="inline-flex items-center gap-2 px-5 py-2.5 bg-pista-dark text-white hover:bg-pista-darker text-sm font-bold rounded-lg">
                Browse Products <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link href="/contact" className="inline-flex items-center px-5 py-2.5 bg-surface-card border border-pista-light text-pista-darker hover:border-pista text-sm font-semibold rounded-lg">
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
