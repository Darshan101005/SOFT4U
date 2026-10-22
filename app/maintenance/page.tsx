import React from 'react';
import type { Metadata } from 'next';
import { LogoText } from '@/components/brand/logo';
import { siteConfig } from '@/lib/site-config';
import { Wrench, Mail, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: { absolute: `Under Maintenance | ${siteConfig.name}` },
  description: `${siteConfig.name} is being updated and will be back shortly.`,
  alternates: { canonical: '/maintenance' },
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center p-6">
      <main className="max-w-md w-full text-center space-y-6 bg-surface-card border border-charcoal-border rounded-2xl p-8 sm:p-10 shadow-sm">
        <LogoText size="lg" />
        <div className="w-16 h-16 rounded-2xl bg-pista-lighter text-pista-dark flex items-center justify-center mx-auto">
          <Wrench className="w-8 h-8" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-charcoal">We&apos;ll be back soon</h1>
          <p className="text-sm text-charcoal-muted leading-relaxed">
            We are making a few improvements to the store. Please check back shortly. For urgent orders, contact us below.
          </p>
        </div>
        <div className="pt-4 border-t border-surface-muted flex flex-col gap-3">
          <a
            href={siteConfig.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 bg-pista-dark text-white hover:bg-pista-darker text-sm font-bold rounded-lg flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" aria-hidden="true" />
            WhatsApp {siteConfig.whatsapp}
          </a>
          <a href={`mailto:${siteConfig.email}`} className="text-sm text-charcoal-muted hover:text-pista-dark flex items-center justify-center gap-2">
            <Mail className="w-4 h-4" aria-hidden="true" />
            {siteConfig.email}
          </a>
        </div>
      </main>
    </div>
  );
}
