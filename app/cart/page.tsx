import React from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getPricing } from '@/app/_store/storefront';
import { CartView } from './cart-view';

export const dynamic = 'force-dynamic';

export default async function CartPage() {
  const pricing = await getPricing();
  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <CartView currency={pricing.currency} />
      </main>
      <Footer />
    </div>
  );
}
