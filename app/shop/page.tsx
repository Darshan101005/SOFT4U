import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { siteConfig } from '@/lib/site-config';
import { products } from '@/data/products';
import { categories } from '@/data/categories';
import { ShopCatalog } from './shop-catalog';

export const metadata: Metadata = {
  title: { absolute: `Shop All Subscriptions | ${siteConfig.name}` },
  description: `Browse all OTT subscriptions, streaming, VPN, AI and software plans at ${siteConfig.name}. Prices in ${siteConfig.currency} with instant digital delivery.`,
  alternates: { canonical: '/shop' },
};

export default function ShopPage() {
  const activeProducts = products.filter(p => p.status === 'active');
  const activeCategories = categories
    .filter(c => c.status === 'active')
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <nav aria-label="Breadcrumb" className="text-xs text-charcoal-subtle mb-2">
            <Link href="/" className="hover:text-pista-dark">Home</Link>
            <span className="mx-1.5">/</span>
            <span className="text-charcoal-muted">Shop</span>
          </nav>
          <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">All digital access</div>
          <h1 className="text-3xl font-extrabold text-charcoal">Explore the complete collection</h1>
          <p className="text-sm text-charcoal-subtle mt-1">
            {activeProducts.length} products available with protected checkout and private delivery.
          </p>
        </div>

        <ShopCatalog initialProducts={activeProducts} categories={activeCategories} />
      </main>
      <Footer />
    </div>
  );
}
