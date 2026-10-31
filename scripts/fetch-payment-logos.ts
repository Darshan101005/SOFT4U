/**
 * Downloads the official payment brand logos (Wikimedia Commons), trims empty
 * borders through Cloudinary and saves them to public/assets/payments/.
 * One-off helper; the files are committed. Admins can replace a logo per
 * payment method from the admin panel.
 *
 *   bun scripts/fetch-payment-logos.ts
 */
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

const SOURCES: Record<string, string> = {
  meezan: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Meezan_Bank_Limited_logo_%282026%29.svg/960px-Meezan_Bank_Limited_logo_%282026%29.svg.png',
  easypaisa: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Easypaisa_Digital_Bank_logo.png/960px-Easypaisa_Digital_Bank_logo.png',
  jazzcash: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/JazzCash_logo_%282025%29.png/960px-JazzCash_logo_%282025%29.png',
};

async function main() {
  cloudinary.config({ secure: true });
  const dir = path.join(process.cwd(), 'public', 'assets', 'payments');
  mkdirSync(dir, { recursive: true });
  for (const [name, url] of Object.entries(SOURCES)) {
    const src = await fetch(url, { headers: { 'User-Agent': 'Soft4u/1.0 (https://soft4u.top)' } });
    if (!src.ok) throw new Error(`${name}: download failed ${src.status}`);
    const dataUri = `data:image/png;base64,${Buffer.from(await src.arrayBuffer()).toString('base64')}`;
    const up = await cloudinary.uploader.upload(dataUri, {
      folder: `${process.env.CLOUDINARY_FOLDER || 'SOFT4U'}/payments`,
      public_id: name,
      overwrite: true,
      format: 'png',
      transformation: [{ effect: 'trim:10' }, { height: 240, crop: 'limit' }],
    });
    const out = await fetch(up.secure_url);
    if (!out.ok) throw new Error(`${name}: processed download failed ${out.status}`);
    const file = path.join(dir, `${name}.png`);
    writeFileSync(file, Buffer.from(await out.arrayBuffer()));
    console.log(`${name}.png ${up.width}x${up.height} <- ${up.secure_url}`);
  }
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
