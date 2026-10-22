import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { siteConfig } from '@/lib/site-config';
import { ChevronDown } from 'lucide-react';

export const metadata: Metadata = {
  title: { absolute: `FAQs | ${siteConfig.name}` },
  description: `Answers to common questions about ordering, payment, delivery, warranty and refunds at ${siteConfig.name}.`,
  alternates: { canonical: '/faq' },
};

const faqs = [
  {
    q: `What does ${siteConfig.name} sell?`,
    a: `${siteConfig.name} sells digital products: OTT and streaming subscriptions, VPNs, AI tools, design and productivity software, and gaming top-ups. All products are delivered online.`,
  },
  {
    q: 'How will I receive my order?',
    a: 'After payment, your access details (login, profile, activation code or licence key) are sent to your email and WhatsApp along with simple activation steps.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Most orders are delivered instantly or within a few minutes. Some products that need manual activation can take up to 2 hours. The maximum delivery time is 24 hours.',
  },
  {
    q: 'Which payment methods do you accept?',
    a: `We are adding debit/credit card and bank payments through a licensed Pakistani payment gateway. All prices are in ${siteConfig.currency}. Until online payment is live, our team will confirm your order and payment on WhatsApp.`,
  },
  {
    q: 'Is my payment information safe?',
    a: 'Yes. Card and bank payments are processed on the payment partner’s secure pages. We never see or store your card number or CVV.',
  },
  {
    q: 'What if my subscription stops working?',
    a: 'Every product has a replacement warranty for the plan duration you paid for. Contact us with your order number and we will replace it, usually the same day.',
  },
  {
    q: 'Can I get a refund?',
    a: 'Yes, if we cannot deliver your order or provide a working replacement. Please read our Refund & Return Policy for the full details.',
  },
  {
    q: 'Do I need to create an account to order?',
    a: 'No. You can check out as a guest with your name, email and WhatsApp number. Your order number lets you track your order at any time.',
  },
  {
    q: 'Can I use the subscription on my phone and TV?',
    a: 'Yes, as long as the original service supports the device. The number of screens or devices allowed is listed on each product page.',
  },
  {
    q: 'How can I contact support?',
    a: `WhatsApp ${siteConfig.whatsapp}, call ${siteConfig.phone} or email ${siteConfig.email}. Support hours: ${siteConfig.hours}.`,
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(f => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

export default function FAQPage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <main className="flex-1 w-full">
        <section className="bg-pista-lighter border-b border-pista-light">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center space-y-3">
            <div className="text-xs font-bold text-pista-dark uppercase tracking-wider">Help centre</div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-charcoal">Frequently Asked Questions</h1>
            <p className="text-sm text-charcoal-muted max-w-xl mx-auto">
              Quick answers about ordering, payment, delivery and warranty.
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-3">
          {faqs.map(faq => (
            <details
              key={faq.q}
              className="group p-5 bg-surface-card border border-charcoal-border rounded-2xl open:border-pista transition-colors"
            >
              <summary className="font-bold text-sm sm:text-base text-charcoal cursor-pointer flex items-center justify-between gap-4 list-none">
                <span>{faq.q}</span>
                <ChevronDown className="w-4 h-4 text-pista-dark flex-shrink-0 group-open:rotate-180 transition-transform" aria-hidden="true" />
              </summary>
              <p className="mt-3 pt-3 border-t border-surface-muted text-sm text-charcoal-muted leading-relaxed">{faq.a}</p>
            </details>
          ))}

          <div className="mt-8 p-6 bg-surface-card border border-charcoal-border rounded-2xl text-center space-y-3">
            <h2 className="text-lg font-bold text-charcoal">Still have a question?</h2>
            <p className="text-sm text-charcoal-muted">Our support team will be happy to help you.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href={siteConfig.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-pista-dark text-white hover:bg-pista-darker text-sm font-bold rounded-lg"
              >
                Chat on WhatsApp
              </a>
              <Link href="/contact" className="px-5 py-2.5 border border-pista-light text-pista-darker hover:border-pista text-sm font-semibold rounded-lg">
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
