import React from 'react';
import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { siteConfig } from '@/lib/site-config';
import { Mail, MessageCircle, Phone, MapPin, Clock } from 'lucide-react';
import { ContactForm } from './contact-form';

export const metadata: Metadata = {
  title: { absolute: `Contact Us | ${siteConfig.name}` },
  description: `Contact ${siteConfig.name} support by email, phone or WhatsApp for help with orders, subscriptions and payments.`,
  alternates: { canonical: '/contact' },
};

const channels = [
  {
    icon: MessageCircle,
    title: 'WhatsApp',
    value: siteConfig.whatsapp,
    note: 'Fastest way to reach us. Tap to start a chat.',
    href: siteConfig.whatsappHref,
    external: true,
  },
  {
    icon: Phone,
    title: 'Phone',
    value: siteConfig.phone,
    note: 'Call us for order and payment questions.',
    href: siteConfig.phoneHref,
    external: false,
  },
  {
    icon: Mail,
    title: 'Email',
    value: siteConfig.email,
    note: 'We reply to every email within 24 hours.',
    href: `mailto:${siteConfig.email}`,
    external: false,
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <Header />
      <main className="flex-1 w-full">
        <section className="bg-pista-lighter border-b border-pista-light">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center space-y-3">
            <div className="text-xs font-bold text-pista-dark uppercase tracking-wider">Get in touch</div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-charcoal">Contact Us</h1>
            <p className="text-sm text-charcoal-muted max-w-xl mx-auto">
              Questions before you buy, or need help with an order? The {siteConfig.name} team is here to help.
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-4">
            {channels.map(c => (
              <a
                key={c.title}
                href={c.href}
                {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="p-5 bg-surface-card border border-charcoal-border hover:border-pista rounded-2xl flex items-start gap-4 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-pista-lighter text-pista-dark flex items-center justify-center flex-shrink-0">
                  <c.icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-sm font-bold text-charcoal">{c.title}</div>
                  <div className="text-sm text-pista-darker font-semibold mt-0.5">{c.value}</div>
                  <div className="text-xs text-charcoal-subtle mt-0.5">{c.note}</div>
                </div>
              </a>
            ))}

            <div className="p-5 bg-surface-card border border-charcoal-border rounded-2xl space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-pista-dark flex-shrink-0" aria-hidden="true" />
                <div>
                  <div className="font-bold text-charcoal">Address</div>
                  <div className="text-charcoal-muted">{siteConfig.address}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-pista-dark flex-shrink-0" aria-hidden="true" />
                <div>
                  <div className="font-bold text-charcoal">Support hours</div>
                  <div className="text-charcoal-muted">{siteConfig.hours}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <ContactForm />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
