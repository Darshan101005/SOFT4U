import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { db } from '@/lib/db';
import type { Product } from '@/lib/db/types';
import { siteConfig, SITE_URL } from '@/lib/site-config';
import { getPricing, getStoreInfo, jsonLd, safe } from '@/app/_store/storefront';
import { activeVariants, isOrderable } from '@/app/_store/price';
import { ProductClient } from './product-client';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string }> };

async function loadProduct(slug: string): Promise<Product | null> {
  const p = await safe(() => db.getProductBySlug(slug), null);
  return p && p.status === 'active' ? p : null;
}

function absolute(url?: string): string | undefined {
  if (!url) return undefined;
  return url.startsWith('http') ? url : `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) return { title: { absolute: `Product not found | ${siteConfig.name}` }, robots: { index: false } };
  const title = product.seoTitle || `Buy ${product.name} | ${siteConfig.name}`;
  const description = product.seoDescription || product.shortDescription;
  const image = product.logo || product.images[0];
  const url = `/products/${product.slug}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website', images: image ? [{ url: image, alt: product.name }] : undefined },
    twitter: { card: 'summary_large_image', title, description, images: image ? [image] : undefined },
  };
}

export default async function ProductDetailPage({ params }: Params) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) notFound();

  const [categories, allProducts, ratings, reviews, faqs, pricing, store] = await Promise.all([
    safe(() => db.getCategories(true), []),
    safe(() => db.getProducts(true), [] as Product[]),
    safe(() => db.getRatingSummaries(), {} as Record<string, { average: number; count: number }>),
    safe(() => db.getReviews(product.id), []),
    safe(() => db.getFAQs(true), []),
    getPricing(),
    getStoreInfo(),
  ]);

  const category = categories.find(c => c.id === product.categoryId) || null;
  const relatedIds = product.relatedProductIds || [];
  const related = [...allProducts.filter(p => relatedIds.includes(p.id)), ...allProducts.filter(p => p.categoryId === product.categoryId && !relatedIds.includes(p.id))]
    .filter(p => p.id !== product.id)
    .slice(0, 4);
  const approved = reviews.filter(r => r.status === 'approved');
  const rating = ratings[product.id];
  const productFaqs = faqs.filter(f => f.productId === product.id || (f.categoryId && f.categoryId === product.categoryId && !f.productId));
  const categoryNames = Object.fromEntries(categories.map(c => [c.id, c.name]));

  const url = `${SITE_URL}/products/${product.slug}`;
  const variants = activeVariants(product);
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription,
    sku: product.sku,
    url,
    image: [absolute(product.logo || product.images[0])].filter(Boolean),
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    category: category?.name,
    offers: variants.map(v => ({
      '@type': 'Offer',
      name: v.name,
      sku: v.sku,
      price: v.price,
      priceCurrency: 'PKR',
      availability: isOrderable(v) ? (v.stockMode === 'preorder' ? 'https://schema.org/PreOrder' : 'https://schema.org/InStock') : 'https://schema.org/OutOfStock',
      url,
      seller: { '@type': 'Organization', name: siteConfig.name },
    })),
    aggregateRating: rating && rating.count > 0 ? { '@type': 'AggregateRating', ratingValue: rating.average.toFixed(1), reviewCount: rating.count } : undefined,
    review: approved.slice(0, 5).map(r => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.customerName },
      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
      reviewBody: r.comment,
      datePublished: r.createdAt.slice(0, 10),
    })),
  };
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE_URL}/shop` },
      ...(category ? [{ '@type': 'ListItem', position: 3, name: category.name, item: `${SITE_URL}/categories/${category.slug}` }] : []),
      { '@type': 'ListItem', position: category ? 4 : 3, name: product.name, item: url },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <ProductClient
          product={product}
          category={category}
          related={related}
          pricing={pricing}
          rating={rating}
          reviews={approved}
          faqs={productFaqs.map(f => ({ id: f.id, question: f.question, answer: f.answer }))}
          ratings={ratings}
          categoryNames={categoryNames}
          whatsappHref={store.whatsappHref}
          storeName={store.name}
        />
      </main>
      <Footer />
    </div>
  );
}
