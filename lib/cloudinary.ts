import { v2 as cloudinary, type UploadApiOptions, type UploadApiResponse } from 'cloudinary';

/**
 * Cloudinary uploads. Configured from CLOUDINARY_URL
 * (cloudinary://<api_key>:<api_secret>@<cloud_name>); assets go under CLOUDINARY_FOLDER.
 *
 * Every catalogue image (product, category, library) goes through ONE
 * pipeline so all logos look the same: trim empty borders, fit into 448x448,
 * pad to a centred 512x512 transparent square, stored as PNG.
 *
 * Payment proofs are uploaded as `authenticated` assets: they are never
 * publicly reachable and are viewed through short-lived signed download URLs.
 */

let configured = false;

export function cloudinaryEnabled(): boolean {
  return Boolean(process.env.CLOUDINARY_URL);
}

function ensureConfigured() {
  if (configured) return;
  if (!process.env.CLOUDINARY_URL) throw new Error('CLOUDINARY_URL is not configured');
  cloudinary.config({ secure: true });
  configured = true;
}

export function cloudinaryFolder(sub?: string): string {
  const root = (process.env.CLOUDINARY_FOLDER || 'SOFT4U').replace(/\/+$/, '');
  return sub ? `${root}/${sub}` : root;
}

export const IMAGE_SIZE = 512;
const INNER_SIZE = 448;

/** The shared catalogue-image transformation. */
export const CATALOGUE_TRANSFORMATION = [
  { effect: 'trim:10' },
  { width: INNER_SIZE, height: INNER_SIZE, crop: 'fit' },
  { width: IMAGE_SIZE, height: IMAGE_SIZE, crop: 'pad', background: 'transparent' },
];

export const ACCEPTED_IMAGE_FORMATS = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'avif', 'bmp', 'tiff', 'heic'];
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export interface ProcessedImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

function toProcessed(res: UploadApiResponse): ProcessedImage {
  return { url: res.secure_url, publicId: res.public_id, width: res.width, height: res.height, format: res.format, bytes: res.bytes };
}

/** Accepts `data:image/...;base64,...` or an http(s) image URL. */
function assertSource(source: string) {
  if (/^data:image\/[a-z0-9.+-]+;base64,/i.test(source)) return;
  if (/^https?:\/\//i.test(source)) return;
  throw new Error('Provide an image file or an http(s) image URL');
}

/**
 * Uploads any image and stores it normalised (512x512 PNG, trimmed, centred).
 * `kind` picks the sub-folder: products | categories | library | banners.
 */
export async function processCatalogueImage(
  source: string,
  opts: { kind?: 'products' | 'categories' | 'library' | 'banners'; name?: string; tags?: string[] } = {},
): Promise<ProcessedImage> {
  ensureConfigured();
  assertSource(source);
  const kind = opts.kind || 'products';
  const params: UploadApiOptions = {
    folder: cloudinaryFolder(kind),
    resource_type: 'image',
    format: 'png',
    tags: ['soft4u', kind, ...(opts.tags || [])],
    unique_filename: true,
    overwrite: false,
  };
  if (kind !== 'banners') params.transformation = CATALOGUE_TRANSFORMATION;
  if (opts.name) {
    params.use_filename = true;
    params.filename_override = opts.name.replace(/[^\w.-]+/g, '-').slice(0, 80);
  }
  return toProcessed(await cloudinary.uploader.upload(source, params));
}

/** Uploads a payment screenshot privately. Returns the id to store in payment_proofs. */
export async function uploadPaymentProof(dataUri: string, orderNumber: string): Promise<{ publicId: string; format: string }> {
  ensureConfigured();
  if (!/^data:image\/(png|jpe?g|webp);base64,/i.test(dataUri)) {
    throw new Error('Upload a JPG, PNG or WebP screenshot');
  }
  const res = await cloudinary.uploader.upload(dataUri, {
    folder: cloudinaryFolder('payment-proofs'),
    resource_type: 'image',
    type: 'authenticated',
    tags: ['soft4u', 'payment-proof', orderNumber],
    unique_filename: true,
    transformation: [{ width: 2000, height: 2000, crop: 'limit' }],
  });
  return { publicId: res.public_id, format: res.format };
}

/** Short-lived signed URL for a private asset (default 10 minutes). */
export function getPrivateImageUrl(publicId: string, format = 'jpg', expiresInSeconds = 600): string {
  ensureConfigured();
  return cloudinary.utils.private_download_url(publicId, format, {
    type: 'authenticated',
    resource_type: 'image',
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
  });
}

export async function deleteImage(publicId: string, privateAsset = false): Promise<void> {
  if (!cloudinaryEnabled() || !publicId) return;
  ensureConfigured();
  await cloudinary.uploader
    .destroy(publicId, { resource_type: 'image', type: privateAsset ? 'authenticated' : 'upload', invalidate: true })
    .catch(() => undefined);
}

/** Data URI size in bytes (for upload limits). */
export function dataUriBytes(dataUri: string): number {
  const i = dataUri.indexOf(',');
  const b64 = i >= 0 ? dataUri.slice(i + 1) : dataUri;
  return Math.floor((b64.length * 3) / 4);
}
