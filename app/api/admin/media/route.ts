import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { searchLogoImages, type ImageCandidate } from '@/lib/image-search';
import { deleteImage } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Candidate = Omit<ImageCandidate, 'source'> & { source: ImageCandidate['source'] | 'svgl' | 'simpleicons' };

/** svgl.app: free SVG brand logos, no key. */
async function searchSvgl(term: string): Promise<Candidate[]> {
  try {
    const res = await fetch(`https://api.svgl.app?search=${encodeURIComponent(term)}`, { signal: AbortSignal.timeout(5000), cache: 'no-store' });
    if (!res.ok) return [];
    const list = (await res.json()) as Array<{ title?: string; route?: string | { light?: string; dark?: string }; wordmark?: string | { light?: string; dark?: string } }>;
    if (!Array.isArray(list)) return [];
    const out: Candidate[] = [];
    for (const item of list.slice(0, 6)) {
      const routes = [item.route, item.wordmark]
        .map(r => (typeof r === 'string' ? r : r?.light || r?.dark))
        .filter((r): r is string => Boolean(r && /^https:\/\//.test(r)));
      routes.forEach((url, i) => out.push({ source: 'svgl', title: `${item.title || term}${i ? ' wordmark' : ''}`, thumbUrl: url, url }));
    }
    return out;
  } catch {
    return [];
  }
}

/** Simple Icons CDN: one brand-coloured SVG per slug. */
function simpleIconCandidates(term: string): Candidate[] {
  const base = term
    .toLowerCase()
    .replace(/\+/g, 'plus')
    .replace(/\./g, 'dot')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '');
  if (!base) return [];
  const slugs = [...new Set([base, base.replace(/plus$/, ''), base.replace(/tv$/, '')])].filter(s => s.length > 1);
  return slugs.map(slug => ({ source: 'simpleicons' as const, title: `${term} (Simple Icons)`, thumbUrl: `https://cdn.simpleicons.org/${slug}`, url: `https://cdn.simpleicons.org/${slug}` }));
}

/** Keeps only web results that actually load as an image. */
async function verifyLoads(items: Candidate[]): Promise<Candidate[]> {
  const checks = await Promise.all(
    items.map(async item => {
      try {
        const res = await fetch(item.thumbUrl, {
          signal: AbortSignal.timeout(4000),
          cache: 'no-store',
          headers: { 'User-Agent': 'Soft4u/1.0 (https://soft4u.top)' },
        });
        const type = res.headers.get('content-type') || '';
        res.body?.cancel().catch(() => undefined);
        return res.ok && (/^image\//.test(type) || /\.svg(\?|$)/.test(item.thumbUrl)) ? item : null;
      } catch {
        return null;
      }
    }),
  );
  return checks.filter((c): c is Candidate => Boolean(c));
}

/**
 * GET ?q=hotstar -> { results } media library first, then free logo sources
 *                   (svgl.app, Simple Icons, Wikimedia Commons), only those that load.
 * GET (no q)     -> { library } latest library images
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const q = req.nextUrl.searchParams.get('q')?.trim().slice(0, 60);
  if (!q) return NextResponse.json({ library: await db.getMediaLibrary(undefined, 300) });
  if (q.length < 2) return NextResponse.json({ results: [] });

  const [base, svgl] = await Promise.all([searchLogoImages(q, 10).catch(() => [] as ImageCandidate[]), searchSvgl(q)]);
  const library = base.filter(c => c.source === 'library');
  const wikimedia = base.filter(c => c.source === 'wikimedia').slice(0, 8);
  const web = await verifyLoads([...svgl, ...simpleIconCandidates(q), ...wikimedia]);
  const seen = new Set<string>();
  const results = [...library, ...web].filter(r => (seen.has(r.url) ? false : (seen.add(r.url), true)));
  return NextResponse.json({ results });
}

/** DELETE ?id=<media id> -> removes it from the library and Cloudinary. */
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const id = req.nextUrl.searchParams.get('id') || '';
  const removed = await db.deleteMediaAsset(id);
  if (removed) await deleteImage(removed.publicId);
  return NextResponse.json({ ok: Boolean(removed) });
}
