import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getSessionUser } from '@/lib/session';
import { siteConfig } from '@/lib/site-config';
import { safe } from '@/app/_store/storefront';
import { safeNext } from '@/app/_store/safe-next';
import { RegisterForm } from './register-form';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { absolute: `Create Account | ${siteConfig.name}` },
  description: `Create your ${siteConfig.name} account to order subscriptions and software and keep every delivery in one place.`,
  alternates: { canonical: '/register' },
  robots: { index: false, follow: true },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function RegisterPage({ searchParams }: Props) {
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === 'string' ? sp.next : null);
  const user = await safe(() => getSessionUser(), null);
  if (user) redirect(next);

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <Header />
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-10 sm:py-14">
        <RegisterForm next={next} />
      </main>
      <Footer />
    </div>
  );
}
