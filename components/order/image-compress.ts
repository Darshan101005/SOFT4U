'use client';

/**
 * Payment screenshots are downscaled and re-encoded in the browser before
 * upload: Vercel caps request bodies at 4.5 MB, and the server accepts at
 * most 3 images of 5 MB each (JPG / PNG / WebP).
 */
export const PROOF_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_PROOFS = 3;
export const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
export const MAX_PROOF_BYTES = 5 * 1024 * 1024;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This file could not be read as an image'));
    };
    img.src = url;
  });
}

export function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] || '';
  return Math.floor((base64.length * 3) / 4);
}

/** Returns a JPEG data URL, longest side <= maxSide. */
export async function compressImage(file: File, maxSide = 1600, quality = 0.8): Promise<string> {
  if (!PROOF_TYPES.includes(file.type)) throw new Error('Use a JPG, PNG or WebP image');
  if (file.size > MAX_SOURCE_BYTES) throw new Error('This image is too large. Use a screenshot under 15 MB');
  const img = await loadImage(file);
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not process this image');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  let q = quality;
  let out = canvas.toDataURL('image/jpeg', q);
  // ~0.9 MB per image keeps three screenshots (base64 in JSON) under the 4.5 MB request cap.
  while (dataUrlBytes(out) > 0.9 * 1024 * 1024 && q > 0.45) {
    q -= 0.1;
    out = canvas.toDataURL('image/jpeg', q);
  }
  if (dataUrlBytes(out) > MAX_PROOF_BYTES) throw new Error('Each screenshot must be 5 MB or smaller');
  return out;
}
