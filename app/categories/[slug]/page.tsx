import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ProductCard } from '@/components/product-card';
import { siteConfig } from '@/lib/site-config';
import { getCategoryBySlug } from '@/data/categories';
import { getProductsByCategory } from '@/data/products';
import { ChevronRight, ArrowLeft } from 'lucide-react';

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) {
    return { title: { absolute: `Category not found | ${siteConfig.name}` }, robots: { index: false } };
  }
  return {
    title: { absolute: `${category.seoTitle || category.name} | ${siteConfig.name}` },
    description: category.seoDescription || category.description,
    alternates: { canonical: `/categories/${category.slug}` },
  };
}

export default async function CategoryDetailPage({ params }: Params) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) {
    notFound();
  }

  const products = getProductsByCategory(category.id);

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-charcoal-subtle mb-6">
          <Link href="/" className="hover:text-pista-dark">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          <Link href="/categories" className="hover:text-pista-dark">Categories</Link>
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="text-charcoal-muted font-semibold">{category.name}</span>
        </nav>

        <div className="bg-pista-lighter border border-pista-light rounded-2xl p-6 sm:p-8 mb-8">
          <h1 className="text-3xl font-extrabold text-charcoal">{category.name}</h1>
          <p className="text-sm text-charcoal-muted mt-2 max-w-3xl leading-relaxed">{category.description}</p>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-base font-bold text-charcoal">
            {products.length} product{products.length === 1 ? '' : 's'} available
          </h2>
          <Link href="/categories" className="text-sm font-semibold text-pista-darker hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            All categories
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {products.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-surface-card border border-charcoal-border rounded-2xl text-sm text-charcoal-subtle">
            New products in this category are coming soon.
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
