import React from 'react';
import type { Metadata } from 'next';
import { Clock, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { siteConfig, SITE_URL } from '@/lib/site-config';
import { getStoreInfo, jsonLd } from '@/app/_store/storefront';
import { ContactForm } from './contact-form';

export const dynamic = 'force-dynamic';

const title = `Contact Us | ${siteConfig.name}`;
const description = `Contact ${siteConfig.name} support by WhatsApp, Telegram, phone or email for help with orders, payments and subscriptions.`;

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: '/contact' },
  openGraph: { title, description, url: '/contact', type: 'website' },
  twitter: { card: 'summary', title, description },
};

export default async function ContactPage() {
  const store = await getStoreInfo();
  const channels = [
    { icon: MessageCircle, title: 'WhatsApp', value: store.whatsapp, note: 'Fastest way to reach us. Tap to start a chat.', href: store.whatsappHref, external: true },
    ...(store.telegramHref ? [{ icon: Send, title: 'Telegram', value: store.telegram, note: 'Message our team on Telegram.', href: store.telegramHref, external: true }] : []),
    { icon: Phone, title: 'Phone', value: store.phone, note: 'Call us for order and payment questions.', href: store.phoneHref, external: false },
    { icon: Mail, title: 'Email', value: store.email, note: 'We reply to every email within 24 hours.', href: `mailto:${store.email}`, external: false },
  ];
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Contact', item: `${SITE_URL}/contact` },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }} />
      <main className="flex-1 w-full">
        <section className="bg-pista-lighter border-b border-pista-light">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 text-center space-y-3">
            <div className="text-xs font-bold text-pista-dark uppercase tracking-wider">Get in touch</div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-charcoal">Contact Us</h1>
            <p className="text-sm text-charcoal-muted max-w-xl mx-auto">Questions before you buy, or need help with an order? The {store.name} team is here to help.</p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-5 space-y-4 min-w-0">
            {channels.map(c => (
              <a
                key={c.title}
                href={c.href}
                {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="p-4 sm:p-5 bg-surface-card border border-charcoal-border hover:border-pista rounded-2xl flex items-start gap-4 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-pista-lighter text-pista-dark flex items-center justify-center flex-shrink-0">
                  <c.icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-charcoal">{c.title}</div>
                  <div className="text-sm text-pista-darker font-semibold mt-0.5 break-all">{c.value}</div>
                  <div className="text-xs text-charcoal-subtle mt-0.5">{c.note}</div>
                </div>
              </a>
            ))}

            <div className="p-4 sm:p-5 bg-surface-card border border-charcoal-border rounded-2xl space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-pista-dark flex-shrink-0" aria-hidden="true" />
                <div>
                  <div className="font-bold text-charcoal">Address</div>
                  <div className="text-charcoal-muted">{store.address}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-pista-dark flex-shrink-0" aria-hidden="true" />
                <div>
                  <div className="font-bold text-charcoal">Support hours</div>
                  <div className="text-charcoal-muted">{store.hours}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 min-w-0">
            <ContactForm whatsapp={store.whatsapp} whatsappHref={store.whatsappHref} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
