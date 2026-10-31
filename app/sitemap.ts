import { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { siteUrl } from '@/lib/seo';

// Rebuilt at most once an hour so new products and categories appear without a deploy.
export const revalidate = 3600;

// Fall back to "now" when a record has no valid date, so the build never fails.
function toDate(value?: string): Date {
  const d = value ? new Date(value) : new Date();
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

const PAGES: Array<{ path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' }> = [
  { path: '', priority: 1.0, changeFrequency: 'daily' },
  { path: '/shop', priority: 0.9, changeFrequency: 'daily' },
  { path: '/categories', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/track-order', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/faq', priority: 0.6, changeFrequency: 'weekly' },
];

const LEGAL = ['terms', 'privacy', 'refund-policy', 'cookie-policy', 'delivery-policy'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [products, categories, legal] = await Promise.all([
    db.getProducts(true).catch(() => []),
    db.getCategories(true).catch(() => []),
    db.getLegalPages().catch(() => []),
  ]);

  const pageUrls = PAGES.map(p => ({ url: `${base}${p.path}`, lastModified: new Date(), changeFrequency: p.changeFrequency, priority: p.priority }));

  const legalUrls = LEGAL.filter(slug => legal.some(l => l.slug === slug && l.status === 'published')).map(slug => {
    const page = legal.find(l => l.slug === slug);
    return { url: `${base}/${slug}`, lastModified: toDate(page?.updatedAt), changeFrequency: 'monthly' as const, priority: 0.3 };
  });

  const categoryUrls = categories.map(c => ({
    url: `${base}/categories/${c.slug}`,
    lastModified: toDate(c.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
    ...(c.image && /^https?:\/\//.test(c.image) ? { images: [c.image] } : {}),
  }));

  const productUrls = products.map(p => {
    const image = p.logo || p.images[0];
    return {
      url: `${base}/products/${p.slug}`,
      lastModified: toDate(p.updatedAt),
      changeFrequency: 'daily' as const,
      priority: 0.9,
      ...(image && /^https?:\/\//.test(image) ? { images: [image] } : {}),
    };
  });

  return [...pageUrls, ...categoryUrls, ...productUrls, ...legalUrls];
}
