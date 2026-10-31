import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CategoryIcon } from '@/components/category-tile';
import { db } from '@/lib/db';
import type { Category, Product } from '@/lib/db/types';
import { siteConfig, SITE_URL } from '@/lib/site-config';
import { getPricing, jsonLd, safe } from '@/app/_store/storefront';
import { formatPrice, fromPrice } from '@/app/_store/price';

export const dynamic = 'force-dynamic';

const title = `All Categories | ${siteConfig.name}`;
const description = `Shop by category at ${siteConfig.name}: streaming and OTT, music, AI tools, VPN, antivirus and creative software at the best prices.`;

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: '/categories' },
  openGraph: { title, description, url: '/categories', type: 'website' },
  twitter: { card: 'summary_large_image', title, description },
};

export default async function CategoriesPage() {
  const [categories, products, pricing] = await Promise.all([safe(() => db.getCategories(true), [] as Category[]), safe(() => db.getProducts(true), [] as Product[]), getPricing()]);
  const active = [...categories].sort((a, b) => a.displayOrder - b.displayOrder);
  const byCat = new Map<string, Product[]>();
  for (const p of products) byCat.set(p.categoryId, [...(byCat.get(p.categoryId) || []), p]);

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Categories', item: `${SITE_URL}/categories` },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="mb-8 sm:mb-10 text-center max-w-2xl mx-auto">
          <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">Categories</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal">Shop by category</h1>
          <p className="text-sm text-charcoal-subtle mt-2">Find the right subscription faster. Every plan comes with verified payment and private delivery.</p>
        </div>

        {active.length === 0 ? (
          <p className="p-10 text-center bg-surface-card border border-charcoal-border rounded-2xl text-sm text-charcoal-subtle">Categories will appear here soon.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {active.map(cat => {
              const list = byCat.get(cat.id) || [];
              const prices = list.map(p => fromPrice(p, pricing).price).filter(n => n > 0);
              const from = prices.length ? Math.min(...prices) : null;
              return (
                <li key={cat.id} className="group bg-surface-card border border-charcoal-border rounded-2xl overflow-hidden hover:border-pista hover:shadow-md transition-all flex flex-col">
                  <Link href={`/categories/${cat.slug}`} className="flex items-center gap-4 p-5 bg-gradient-to-br from-pista-50 to-pista-100 border-b border-charcoal-border">
                    <CategoryIcon category={cat} className="w-20 h-20 shrink-0" />
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-charcoal group-hover:text-pista-darker">{cat.name}</h2>
                      <p className="text-xs text-charcoal-subtle mt-0.5">
                        {list.length} product{list.length === 1 ? '' : 's'}
                        {from !== null && (
                          <>
                            {' · from '}
                            <span data-price>{formatPrice(from, pricing.currency)}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </Link>
                  <div className="p-5 flex-1 flex flex-col">
                    {cat.description && <p className="text-sm text-charcoal-muted leading-relaxed line-clamp-3">{cat.description}</p>}
                    {list.length > 0 && (
                      <ul className="mt-4 space-y-0.5 text-sm flex-1">
                        {list.slice(0, 3).map(p => (
                          <li key={p.id}>
                            <Link href={`/products/${p.slug}`} className="flex items-center justify-between gap-2 min-h-11 text-charcoal hover:text-pista-dark">
                              <span className="truncate">{p.name}</span>
                              <span className="text-xs text-charcoal-subtle whitespace-nowrap" data-price>{formatPrice(fromPrice(p, pricing).price, pricing.currency)}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Link
                      href={`/categories/${cat.slug}`}
                      className="mt-4 w-full min-h-11 px-3 bg-pista-lighter hover:bg-pista-light text-pista-darker text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      Browse {cat.name}
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}
