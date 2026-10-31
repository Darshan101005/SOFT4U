import React from 'react';
import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { getPricing, getSettings, safe } from '@/app/_store/storefront';
import { CheckoutClient } from './checkout-client';

export const dynamic = 'force-dynamic';

/**
 * Manual-payment checkout. Signing in is required so every order shows up in
 * the customer's account and in the Telegram bot.
 */
export default async function CheckoutPage() {
  const user = await safe(() => getSessionUser(), null);
  if (!user) redirect('/login?next=/checkout');

  const [pricing, settings, methods] = await Promise.all([getPricing(), getSettings(), safe(() => db.getPaymentMethods(true), [])]);
  const available = methods
    .filter(m => m.currencies.includes(pricing.currency))
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(m => ({
      key: m.key,
      name: m.name,
      type: m.type,
      description: m.description,
      accountTitle: m.accountTitle,
      accountNumber: m.accountNumber,
      iban: m.iban,
      bankName: m.bankName,
      branch: m.branch,
      instructions: m.instructions,
      logo: m.logo,
    }));

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <CheckoutClient
          currency={pricing.currency}
          methods={available}
          user={{ name: user.name, email: user.email, phone: user.phone || '', whatsapp: user.whatsapp || '', telegram: user.telegram || '', telegramLinked: Boolean(user.telegramLinked) }}
          requireWhatsapp={settings?.requireWhatsapp ?? true}
          requirePhone={settings?.requirePhone ?? false}
          maintenance={settings?.maintenanceMode ? settings.maintenanceMessage || 'Checkout is paused for maintenance.' : ''}
        />
      </main>
      <Footer />
    </div>
  );
}
