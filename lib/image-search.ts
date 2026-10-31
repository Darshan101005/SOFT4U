import { db } from '@/lib/db';

/**
 * Logo search for the admin image picker ("type hotstar, get Hotstar logos").
 * Results come from the store's own media library first (already processed,
 * one click to use), then Wikimedia Commons (free, no API key). A chosen web
 * result is passed to processCatalogueImage() so it is normalised like
 * every other catalogue image.
 */

export interface ImageCandidate {
  source: 'library' | 'wikimedia';
  title: string;
  /** Preview URL. */
  thumbUrl: string;
  /** URL to process / use. */
  url: string;
  /** Present for library items (already on Cloudinary). */
  publicId?: string;
  width?: number;
  height?: number;
}

async function searchWikimedia(term: string, limit: number): Promise<ImageCandidate[]> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrnamespace: '6',
    gsrlimit: String(limit),
    gsrsearch: `${term} logo`,
    prop: 'imageinfo',
    iiprop: 'url|mime|size',
    iiurlwidth: '512',
  });
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: { 'User-Agent': 'Soft4u/1.0 (https://soft4u.top)' },
    signal: AbortSignal.timeout(6000),
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const data = await res.json();
  const pages = Object.values<any>(data?.query?.pages || {});
  return pages
    .map(p => ({ p, info: p?.imageinfo?.[0] }))
    .filter(({ info }) => info && /image\/(png|svg\+xml|jpeg|webp)/.test(info.mime || ''))
    .sort((a, b) => (a.p.index ?? 0) - (b.p.index ?? 0))
    .map(({ p, info }) => ({
      source: 'wikimedia' as const,
      title: String(p.title || '').replace(/^File:/, '').replace(/\.[a-z0-9]+$/i, ''),
      thumbUrl: info.thumburl || info.url,
      // SVGs are processed from the PNG rendering.
      url: info.mime === 'image/svg+xml' ? info.thumburl || info.url : info.url,
      width: info.thumbwidth || info.width,
      height: info.thumbheight || info.height,
    }));
}

export async function searchLogoImages(term: string, limit = 12): Promise<ImageCandidate[]> {
  const q = term.trim();
  if (q.length < 2) return [];
  const [library, web] = await Promise.all([
    db.getMediaLibrary(q, limit).catch(() => []),
    searchWikimedia(q, limit).catch(() => [] as ImageCandidate[]),
  ]);
  return [
    ...library.map(m => ({
      source: 'library' as const,
      title: m.name,
      thumbUrl: m.url,
      url: m.url,
      publicId: m.publicId,
      width: m.width,
      height: m.height,
    })),
    ...web,
  ];
}
