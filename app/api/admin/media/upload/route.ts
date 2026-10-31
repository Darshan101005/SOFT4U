import { NextRequest, NextResponse } from 'next/server';
import { isIP } from 'node:net';
import { lookup } from 'node:dns/promises';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { errorResponse, readJson } from '@/lib/api';
import { cloudinaryEnabled, dataUriBytes, processCatalogueImage } from '@/lib/cloudinary';

export const runtime = 'nodejs';

/** What the admin can upload or link: PNG, JPG, WebP or SVG, up to 5 MB. */
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const KINDS = ['products', 'categories', 'library', 'banners'] as const;

class UploadError extends Error {}

const MAX_REDIRECTS = 5;

/** Private, loopback, link-local, CGNAT, multicast and reserved addresses. */
function blockedIp(ip: string): boolean {
  let h = ip.toLowerCase();
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(h);
  if (mapped) h = mapped[1];
  if (isIP(h) === 4) {
    const [a, b] = h.split('.').map(Number);
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) || (a === 198 && (b === 18 || b === 19))
    );
  }
  if (isIP(h) === 6) {
    return h === '::' || h === '::1' || h.startsWith('fc') || h.startsWith('fd') || /^fe[89ab]/.test(h) || h.startsWith('ff') || h.startsWith('::ffff:');
  }
  return true;
}

function blockedName(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal');
}

/** Rejects the URL unless its host is public, after resolving DNS (every A/AAAA record must be public). */
async function assertPublicUrl(url: URL): Promise<void> {
  if (!['http:', 'https:'].includes(url.protocol)) throw new UploadError('Use an http or https image link');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (blockedName(host)) throw new UploadError('That address is not allowed');
  if (isIP(host)) {
    if (blockedIp(host)) throw new UploadError('That address is not allowed');
    return;
  }
  let addresses: Array<{ address: string }>;
  try {
    addresses = await lookup(host, { all: true, verbatim: true });
  } catch {
    throw new UploadError('Could not find that website. Check the link.');
  }
  if (!addresses.length || addresses.some(a => blockedIp(a.address))) throw new UploadError('That address is not allowed');
}

/** Downloads an image URL server-side, checks type + size, returns a data URI. */
async function fetchImageAsDataUri(raw: string): Promise<string> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UploadError('That link is not a valid URL');
  }

  // Redirects are followed by hand so every hop is checked before it is fetched.
  let res: Response | null = null;
  const signal = AbortSignal.timeout(10000);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicUrl(url);
    try {
      res = await fetch(url, {
        redirect: 'manual',
        signal,
        cache: 'no-store',
        headers: { 'User-Agent': 'Soft4u/1.0 (https://soft4u.top)', Accept: 'image/*' },
      });
    } catch {
      throw new UploadError('Could not download the image (timeout or blocked)');
    }
    const location = res.status >= 300 && res.status < 400 ? res.headers.get('location') : null;
    if (!location) break;
    if (hop === MAX_REDIRECTS) throw new UploadError('The link redirects too many times');
    try {
      url = new URL(location, url);
    } catch {
      throw new UploadError('The link redirects to an invalid address');
    }
    res = null;
  }
  if (!res) throw new UploadError('Could not download the image');
  if (!res.ok) throw new UploadError(`The link returned HTTP ${res.status}`);

  const declared = Number(res.headers.get('content-length') || 0);
  if (declared > MAX_BYTES) throw new UploadError('The image is larger than 5 MB');
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > MAX_BYTES) throw new UploadError('The image is larger than 5 MB');
  if (buf.byteLength < 64) throw new UploadError('The link did not return an image');

  let type = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  const head = buf.subarray(0, 256).toString('utf8').trimStart();
  if (!ALLOWED_TYPES.includes(type) && (head.startsWith('<svg') || (head.startsWith('<?xml') && head.includes('<svg')))) type = 'image/svg+xml';
  if (type === 'image/jpg') type = 'image/jpeg';
  if (!ALLOWED_TYPES.includes(type)) throw new UploadError(`Unsupported image type (${type || 'unknown'}). Use PNG, JPG, WebP or SVG.`);
  return `data:${type};base64,${buf.toString('base64')}`;
}

/**
 * POST { source, kind?, name?, tags?, saveToLibrary? } -> { image, media? }
 *   source: data:image/...;base64 (file upload) or an http(s) image URL (pasted link / search result)
 *   kind:   products (default) | categories | library | banners
 * Accepted: PNG, JPG, WebP, SVG up to 5 MB. Every catalogue image goes through the
 * shared pipeline (trimmed, centred, 512x512 transparent PNG on Cloudinary).
 * `banners` keeps the original proportions (wide logos and banners).
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  if (!cloudinaryEnabled()) return NextResponse.json({ error: 'Image storage is not configured (CLOUDINARY_URL)' }, { status: 503 });
  try {
    const body = await readJson(req);
    let source = String(body.source || '').trim();
    const kind = (KINDS as readonly string[]).includes(body.kind) ? (body.kind as (typeof KINDS)[number]) : 'products';
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : undefined;
    const tags = Array.isArray(body.tags) ? body.tags.map((t: unknown) => String(t).slice(0, 40)).slice(0, 10) : [];
    const fromUrl = /^https?:\/\//i.test(source);

    try {
      if (source.startsWith('data:')) {
        const m = /^data:([a-z0-9.+/-]+);base64,/i.exec(source);
        const type = (m?.[1] || '').toLowerCase().replace('image/jpg', 'image/jpeg');
        if (!ALLOWED_TYPES.includes(type)) throw new UploadError('Use a PNG, JPG, WebP or SVG image');
        if (dataUriBytes(source) > MAX_BYTES) throw new UploadError('The image is larger than 5 MB');
      } else if (fromUrl) {
        source = await fetchImageAsDataUri(source);
      } else {
        throw new UploadError('Choose an image file or paste an image link');
      }
    } catch (err) {
      if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: 400 });
      throw err;
    }

    let image;
    try {
      image = await processCatalogueImage(source, { kind, name, tags });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      return NextResponse.json({ error: `Could not process this image: ${message}` }, { status: 400 });
    }
    let media = null;
    if (body.saveToLibrary !== false && kind !== 'banners') {
      media = await db.addMediaAsset({
        publicId: image.publicId,
        url: image.url,
        name: name || 'Image',
        tags,
        source: fromUrl ? 'url' : 'upload',
        width: image.width,
        height: image.height,
        format: image.format,
      });
    }
    return NextResponse.json({ ok: true, image, media });
  } catch (err) {
    return errorResponse(err);
  }
}
