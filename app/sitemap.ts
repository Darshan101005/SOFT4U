import { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { SITE_URL } from '@/lib/site-config';

// Fall back to "now" when a record has no valid date, so the build never fails.
function toDate(value?: string): Date {
  const d = value ? new Date(value) : new Date();
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Catalog comes from data/ (mock data until integration).
  const products = await db.getProducts(true);
  const categories = await db.getCategories(true);

  const pageUrls = [
    '',
    '/shop',
    '/categories',
    '/track-order',
    '/about',
    '/contact',
    '/faq',
    '/terms',
    '/privacy',
    '/refund-policy',
    '/cookie-policy',
  ].map(route => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.7,
  }));

  const categoryUrls = categories.map(c => ({
    url: `${SITE_URL}/categories/${c.slug}`,
    lastModified: toDate(c.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const productUrls = products.map(p => ({
    url: `${SITE_URL}/products/${p.slug}`,
    lastModified: toDate(p.updatedAt),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  return [...pageUrls, ...categoryUrls, ...productUrls];
}
