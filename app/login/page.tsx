import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getSessionUser } from '@/lib/session';
import { siteConfig } from '@/lib/site-config';
import { safe } from '@/app/_store/storefront';
import { safeNext } from '@/app/_store/safe-next';
import { LoginForm } from './login-form';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { absolute: `Sign In | ${siteConfig.name}` },
  description: `Sign in to your ${siteConfig.name} account to see your orders, delivered access and support.`,
  alternates: { canonical: '/login' },
  robots: { index: false, follow: true },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function LoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === 'string' ? sp.next : null);
  const user = await safe(() => getSessionUser(), null);
  if (user) redirect(next);
  const email = typeof sp.email === 'string' ? sp.email.slice(0, 120) : '';
  const notice = sp.reset === '1' ? 'Your password was changed. Sign in with your new password.' : sp.verified === '1' ? 'Your email is verified. Sign in to continue.' : '';

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <Header />
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-10 sm:py-14">
        <LoginForm next={next} initialEmail={email} notice={notice} />
      </main>
      <Footer />
    </div>
  );
}
