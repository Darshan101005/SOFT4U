import { MetadataRoute } from 'next';
import { NOINDEX_PATHS, siteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: NOINDEX_PATHS,
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
