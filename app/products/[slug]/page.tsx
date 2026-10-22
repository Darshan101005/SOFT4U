import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { siteConfig, SITE_URL } from '@/lib/site-config';
import { products, getProductBySlug } from '@/data/products';
import { getCategoryById } from '@/data/categories';
import { ProductClient } from './product-client';

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) {
    return { title: { absolute: `Product not found | ${siteConfig.name}` }, robots: { index: false } };
  }
  const title = product.seoTitle || `Buy ${product.name} in Pakistan | ${siteConfig.name}`;
  const description = product.seoDescription || product.shortDescription;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title,
      description,
      url: `/products/${product.slug}`,
      images: product.images[0] ? [{ url: product.images[0], alt: product.name }] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: Params) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product || product.status !== 'active') {
    notFound();
  }

  const category = getCategoryById(product.categoryId) || null;
  const relatedIds = product.relatedProductIds || [];
  const relatedProducts = [
    ...products.filter(p => relatedIds.includes(p.id)),
    ...products.filter(p => p.categoryId === product.categoryId && !relatedIds.includes(p.id)),
  ]
    .filter(p => p.id !== product.id && p.status === 'active')
    .slice(0, 3);

  const lowest = Math.min(...product.variants.map(v => v.price));
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription,
    sku: product.sku,
    image: product.images[0] ? `${SITE_URL}${product.images[0]}` : undefined,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: siteConfig.currency,
      lowPrice: lowest,
      offerCount: product.variants.length,
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/products/${product.slug}`,
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <ProductClient product={product} category={category} relatedProducts={relatedProducts} />
      </main>
      <Footer />
    </div>
  );
}
