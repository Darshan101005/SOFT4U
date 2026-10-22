import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ProductImage } from '@/components/brand/product-image';
import { siteConfig } from '@/lib/site-config';
import { categories } from '@/data/categories';
import { getProductsByCategory } from '@/data/products';
import { formatPrice } from '@/app/_store/price';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: { absolute: `All Categories | ${siteConfig.name}` },
  description: `Shop by category at ${siteConfig.name}: streaming, music, AI tools, VPN, antivirus and creative software, priced in ${siteConfig.currency}.`,
  alternates: { canonical: '/categories' },
};

export default function CategoriesPage() {
  const activeCategories = categories
    .filter(c => c.status === 'active')
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">Categories</div>
          <h1 className="text-3xl font-extrabold text-charcoal">Shop by category</h1>
          <p className="text-sm text-charcoal-subtle mt-2">
            Find the right subscription faster. Every plan comes with protected checkout and private delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeCategories.map(cat => {
            const catProducts = getProductsByCategory(cat.id);
            const from = catProducts.length ? Math.min(...catProducts.map(p => p.price)) : null;
            return (
              <div
                key={cat.id}
                className="bg-surface-card border border-charcoal-border rounded-2xl overflow-hidden hover:border-pista hover:shadow-md transition-all flex flex-col"
              >
                <ProductImage src={cat.image} name={cat.name} className="h-32" imgClassName="p-8" />
                <div className="p-6 flex-1 flex flex-col">
                  <h2 className="text-lg font-bold text-charcoal">{cat.name}</h2>
                  <p className="text-sm text-charcoal-muted mt-1 leading-relaxed">{cat.description}</p>
                  <ul className="mt-4 space-y-1.5 text-sm flex-1">
                    {catProducts.slice(0, 3).map(p => (
                      <li key={p.id}>
                        <Link href={`/products/${p.slug}`} className="flex items-center justify-between gap-2 text-charcoal hover:text-pista-dark">
                          <span className="truncate">{p.name}</span>
                          <span className="text-xs text-charcoal-subtle whitespace-nowrap">from {formatPrice(p.price)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/categories/${cat.slug}`}
                    className="mt-5 w-full py-2.5 px-3 bg-pista-lighter hover:bg-pista-light text-pista-darker text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>
                      View {catProducts.length} product{catProducts.length === 1 ? '' : 's'}
                      {from !== null ? ` · from ${formatPrice(from)}` : ''}
                    </span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}
