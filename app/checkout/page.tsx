import React from 'react';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { requestCountry } from '@/lib/currency-pref';
import { needsPayConversion, payRateFor } from '@/lib/fx';
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
  const usable = methods.filter(m => m.currencies.includes(pricing.currency));
  const ukMethods = usable.filter(m => m.payCurrency === 'GBP');
  // UK visitors see the UK bank account first; everyone else sees it last.
  const country = ukMethods.length ? await safe(async () => requestCountry(await headers()), null) : null;
  const gbpFirst = country === 'GB';
  const payRate = usable.some(m => needsPayConversion(m.payCurrency)) ? await safe(() => payRateFor(pricing.currency), 0) : 0;
  const available = usable
    .sort((a, b) => {
      const ga = a.payCurrency === 'GBP' ? 1 : 0;
      const gb = b.payCurrency === 'GBP' ? 1 : 0;
      if (ga !== gb) return gbpFirst ? gb - ga : ga - gb;
      return a.displayOrder - b.displayOrder;
    })
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
      sortCode: m.sortCode,
      payCurrency: m.payCurrency,
      instructions: m.instructions,
      logo: m.logo,
      payRate: needsPayConversion(m.payCurrency) && payRate > 0 ? payRate : undefined,
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
