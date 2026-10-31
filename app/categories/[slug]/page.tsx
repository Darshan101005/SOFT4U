import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CatalogBrowser } from '@/components/catalog/catalog-browser';
import { CategoryIcon } from '@/components/category-tile';
import { db } from '@/lib/db';
import { siteConfig, SITE_URL } from '@/lib/site-config';
import { jsonLd, safe } from '@/app/_store/storefront';
import { loadCatalogPage } from '@/app/_store/catalog-page';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

async function loadCategory(slug: string) {
  const c = await safe(() => db.getCategoryBySlug(slug), null);
  return c && c.status === 'active' ? c : null;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await loadCategory(slug);
  if (!category) return { title: { absolute: `Category not found | ${siteConfig.name}` }, robots: { index: false } };
  const title = category.seoTitle ? (category.seoTitle.includes(siteConfig.name) ? category.seoTitle : `${category.seoTitle} | ${siteConfig.name}`) : `${category.name} | ${siteConfig.name}`;
  const description = category.seoDescription || category.description || `Shop ${category.name} at ${siteConfig.name}.`;
  const url = `/categories/${category.slug}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    robots: Object.keys(sp).length ? { index: false, follow: true } : undefined,
    openGraph: { title, description, url, type: 'website', images: category.image ? [{ url: category.image, alt: category.name }] : undefined },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function CategoryDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = await loadCategory(slug);
  if (!category) notFound();

  const { pricing, filters, result, ratings, categoryNames, popular } = await loadCatalogPage(await searchParams, category.slug);
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Categories', item: `${SITE_URL}/categories` },
      { '@type': 'ListItem', position: 3, name: category.name, item: `${SITE_URL}/categories/${category.slug}` },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-charcoal-subtle mb-5 flex-wrap">
          <Link href="/" className="hover:text-pista-dark">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          <Link href="/categories" className="hover:text-pista-dark">
            Categories
          </Link>
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="text-charcoal-muted font-semibold">{category.name}</span>
        </nav>

        <div className="bg-gradient-to-br from-pista-50 to-pista-100 border border-pista-light rounded-2xl p-5 sm:p-8 mb-6 sm:mb-8 flex items-center gap-4 sm:gap-6">
          <CategoryIcon category={category} className="w-16 h-16 sm:w-24 sm:h-24 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal">{category.name}</h1>
            {category.description && <p className="text-sm text-charcoal-muted mt-1.5 max-w-3xl leading-relaxed">{category.description}</p>}
          </div>
        </div>

        <CatalogBrowser
          key={pricing.currency}
          initial={result}
          initialFilters={filters}
          pricing={pricing}
          basePath={`/categories/${category.slug}`}
          lockedCategory={category.slug}
          ratings={ratings}
          categoryNames={categoryNames}
          popular={popular}
        />
      </main>
      <Footer />
    </div>
  );
}
