import React from 'react';
import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { siteConfig } from '@/lib/site-config';
import { ForgotForm } from './forgot-form';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { absolute: `Reset Password | ${siteConfig.name}` },
  description: `Reset your ${siteConfig.name} account password with a code sent to your email.`,
  alternates: { canonical: '/forgot-password' },
  robots: { index: false, follow: true },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const sp = await searchParams;
  const token = typeof sp.token === 'string' ? sp.token.slice(0, 200) : '';
  const email = typeof sp.email === 'string' ? sp.email.slice(0, 120) : '';
  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <Header />
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-10 sm:py-14">
        <ForgotForm initialEmail={email} token={token} />
      </main>
      <Footer />
    </div>
  );
}
