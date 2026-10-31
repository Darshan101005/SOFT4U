import React from 'react';
import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AccountNav } from '@/components/account-layout';
import { getSessionUser } from '@/lib/session';
import { siteConfig } from '@/lib/site-config';
import { safe } from '@/app/_store/storefront';

export const metadata: Metadata = {
  title: { absolute: `My Account | ${siteConfig.name}` },
  robots: { index: false, follow: false },
};

/** Account frame. Each page calls requireAccountUser() so sign-in returns to the exact page. */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await safe(() => getSessionUser(), null);
  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-8">
          <div className="md:col-span-3">{user && <AccountNav name={user.name} email={user.email} />}</div>
          <div className="md:col-span-9 min-w-0">{children}</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
