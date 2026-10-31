import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CatalogBrowser } from '@/components/catalog/catalog-browser';
import { siteConfig, SITE_URL } from '@/lib/site-config';
import { loadCatalogPage } from '@/app/_store/catalog-page';
import { jsonLd } from '@/app/_store/storefront';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const filtered = Object.keys(sp).length > 0;
  const title = `Shop All Subscriptions & Software | ${siteConfig.name}`;
  const description = `Browse OTT and streaming subscriptions, AI tools, VPNs and software licences at ${siteConfig.name}. Prices in PKR and USD with private digital delivery.`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: '/shop' },
    robots: filtered ? { index: false, follow: true } : undefined,
    openGraph: { title, description, url: '/shop', type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function ShopPage({ searchParams }: Props) {
  const { pricing, filters, result, ratings, categoryNames, popular } = await loadCatalogPage(await searchParams);
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE_URL}/shop` },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="mb-6 sm:mb-8">
          <nav aria-label="Breadcrumb" className="text-xs text-charcoal-subtle mb-2">
            <Link href="/" className="hover:text-pista-dark">
              Home
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-charcoal-muted">Shop</span>
          </nav>
          <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">All digital access</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal">Explore the complete collection</h1>
          <p className="text-sm text-charcoal-subtle mt-1">{result.catalogTotal} products with verified payments and private delivery.</p>
        </div>

        <CatalogBrowser
          key={pricing.currency}
          initial={result}
          initialFilters={filters}
          pricing={pricing}
          basePath="/shop"
          ratings={ratings}
          categoryNames={categoryNames}
          popular={popular}
        />
      </main>
      <Footer />
    </div>
  );
}
