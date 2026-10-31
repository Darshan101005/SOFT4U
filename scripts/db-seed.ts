/**
 * Idempotent seed. Inserts missing rows only; never overwrites anything the
 * admin has edited. Safe to run any number of times.
 *
 *   bun run db:seed            seed content + seed admin
 *   bun run db:seed --images   also move local /public brand logos to Cloudinary
 *                              (processed with the catalogue pipeline) and add them to the media library
 */
import { readFileSync } from 'fs';
import path from 'path';
import { db, getPool } from '../lib/db';
import { DEFAULT_SITE_SETTINGS } from '../lib/db/defaults';
import { seedCategories, seedFaqs, seedHomepageSections, seedLegalPages, seedNavigation, seedPaymentMethods, seedProducts } from '../lib/db/seed-data';
import { ensureSeedAdmin } from '../lib/admin-auth';
import { cloudinaryEnabled, processCatalogueImage } from '../lib/cloudinary';

const pool = getPool();

async function exists(table: string, id: string): Promise<boolean> {
  const r = await pool.query(`SELECT 1 FROM ${table} WHERE id = $1`, [id]);
  return (r.rowCount ?? 0) > 0;
}

function mime(file: string): string {
  if (file.endsWith('.svg')) return 'image/svg+xml';
  if (file.endsWith('.jpg') || file.endsWith('.jpeg')) return 'image/jpeg';
  if (file.endsWith('.webp')) return 'image/webp';
  return 'image/png';
}

async function main() {
  const counts: Record<string, number> = {};
  const bump = (k: string) => (counts[k] = (counts[k] || 0) + 1);

  // Seed admin
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (email && password) {
    const r = await ensureSeedAdmin(email, password, 'Darshan Venkatesan');
    console.log(`seed admin: ${r}`);
  } else {
    console.warn('SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set; skipped seed admin');
  }

  // Settings
  await pool.query(`INSERT INTO site_settings (id, data) VALUES (1, $1::jsonb) ON CONFLICT (id) DO NOTHING`, [JSON.stringify(DEFAULT_SITE_SETTINGS)]);

  for (const c of seedCategories) {
    if (await exists('categories', c.id)) continue;
    await db.createCategory(c);
    bump('categories');
  }

  for (const p of seedProducts) {
    if (p.id && (await exists('products', p.id))) continue;
    if (await pool.query(`SELECT 1 FROM products WHERE slug = $1`, [p.slug]).then(r => r.rowCount)) continue;
    await db.createProduct(p);
    bump('products');
  }

  for (const f of seedFaqs) {
    const r = await pool.query(
      `INSERT INTO faqs (id, question, answer, category, display_order, status) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
      [f.id, f.question, f.answer, f.category, f.displayOrder, f.status],
    );
    if (r.rowCount) bump('faqs');
  }

  for (const l of seedLegalPages) {
    const r = await pool.query(
      `INSERT INTO legal_pages (id, slug, title, content, status) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (slug) DO NOTHING`,
      [l.id, l.slug, l.title, l.content, l.status],
    );
    if (r.rowCount) bump('legal_pages');
  }

  for (const s of seedHomepageSections) {
    const r = await pool.query(
      `INSERT INTO homepage_sections (id, type, name, enabled, sort_order, settings) VALUES ($1,$2,$3,$4,$5,$6::jsonb) ON CONFLICT (id) DO NOTHING`,
      [s.id, s.type, s.name, s.enabled, s.order, JSON.stringify(s.settings)],
    );
    if (r.rowCount) bump('homepage_sections');
  }

  for (const n of seedNavigation) {
    const r = await pool.query(
      `INSERT INTO navigation_items (id, label, url, display_order, visible, target_blank, position) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
      [n.id, n.label, n.url, n.displayOrder, n.visible, n.targetBlank, n.position],
    );
    if (r.rowCount) bump('navigation_items');
  }

  for (const m of seedPaymentMethods) {
    const values = [
      m.id,
      m.key,
      m.name,
      m.type,
      m.description,
      m.accountTitle,
      m.accountNumber,
      m.iban,
      m.bankName,
      m.instructions,
      JSON.stringify(m.currencies),
      m.enabled,
      m.displayOrder,
      m.branch,
      m.logo ?? null,
    ];
    const r = await pool.query(
      `INSERT INTO payment_methods (id, key, name, type, description, account_title, account_number, iban, bank_name, instructions, currencies, enabled, display_order, branch, logo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13,$14,$15) ON CONFLICT (key) DO NOTHING`,
      values,
    );
    if (r.rowCount) bump('payment_methods');
    // Fill rows that were seeded earlier without account details (never overwrites admin edits).
    const filled = await pool.query(
      `UPDATE payment_methods SET name = $3, description = $5, account_title = $6, account_number = $7, iban = $8, bank_name = $9,
         instructions = $10, currencies = $11::jsonb, enabled = $12, display_order = $13, branch = $14, logo = COALESCE(logo, $15), updated_at = now()
       WHERE key = $2 AND account_number = '' AND $1::text IS NOT NULL AND $4::text IS NOT NULL`,
      values,
    );
    if (filled.rowCount) bump('payment_methods_filled');
  }

  // Brand is new on products: fill it where missing (never overwrites).
  for (const p of seedProducts) {
    if (!p.brand || !p.id) continue;
    const r = await pool.query(`UPDATE products SET brand = $2 WHERE id = $1 AND brand IS NULL`, [p.id, p.brand]);
    if (r.rowCount) bump('brands_filled');
  }

  if (process.argv.includes('--refresh-content')) {
    // Opt-in: re-applies seed wording (SEO, FAQs, legal, homepage, payment texts, settings copy)
    // to rows that came from the seed. Use only before the admin starts editing content.
    for (const p of seedProducts) {
      await pool.query(`UPDATE products SET seo_title = $2, seo_description = $3, brand = $4, updated_at = now() WHERE id = $1`, [p.id, p.seoTitle, p.seoDescription, p.brand ?? null]);
    }
    for (const c of seedCategories) {
      await pool.query(`UPDATE categories SET seo_title = $2, seo_description = $3, updated_at = now() WHERE id = $1`, [c.id, c.seoTitle ?? null, c.seoDescription ?? null]);
    }
    for (const f of seedFaqs) {
      await pool.query(`UPDATE faqs SET question = $2, answer = $3 WHERE id = $1`, [f.id, f.question, f.answer]);
    }
    for (const l of seedLegalPages) {
      await pool.query(`UPDATE legal_pages SET content = $2, title = $3, updated_at = now() WHERE slug = $1 AND revisions = '[]'::jsonb`, [l.slug, l.content, l.title]);
    }
    for (const s of seedHomepageSections) {
      await pool.query(`UPDATE homepage_sections SET settings = $2::jsonb, name = $3 WHERE id = $1`, [s.id, JSON.stringify(s.settings), s.name]);
    }
    for (const m of seedPaymentMethods) {
      await pool.query(`UPDATE payment_methods SET description = $2, instructions = $3, updated_at = now() WHERE key = $1`, [m.key, m.description, m.instructions]);
    }
    await pool.query(
      `UPDATE site_settings SET data = (data - 'paymentWindowMinutes' - 'paymentWindowMinutesUsd') || $1::jsonb, updated_at = now() WHERE id = 1`,
      [
        JSON.stringify({
          description: DEFAULT_SITE_SETTINGS.description,
          tagline: DEFAULT_SITE_SETTINGS.tagline,
          currencySymbol: DEFAULT_SITE_SETTINGS.currencySymbol,
          seoDefaults: DEFAULT_SITE_SETTINGS.seoDefaults,
          usdPricing: DEFAULT_SITE_SETTINGS.usdPricing,
        }),
      ],
    );
    bump('content_refreshed');
  }

  if (process.argv.includes('--images')) {
    if (!cloudinaryEnabled()) {
      console.warn('CLOUDINARY_URL not set; skipped image upload');
    } else {
      const products = await db.getProducts();
      const done = new Map<string, string>();
      for (const p of products) {
        const local = p.images[0];
        if (!local || !local.startsWith('/')) continue;
        try {
          let url = done.get(local);
          if (!url) {
            const file = path.join(process.cwd(), 'public', local);
            const dataUri = `data:${mime(file)};base64,${readFileSync(file).toString('base64')}`;
            const img = await processCatalogueImage(dataUri, { kind: 'library', name: p.slug, tags: [p.slug, ...p.tags.map(t => t.toLowerCase())] });
            await db.addMediaAsset({
              publicId: img.publicId,
              url: img.url,
              name: p.name,
              tags: [p.slug, ...p.tags],
              source: 'library',
              width: img.width,
              height: img.height,
              format: img.format,
            });
            url = img.url;
            done.set(local, url);
          }
          await db.updateProduct(p.id, { images: [url], logo: url });
          bump('images');
          console.log(`image: ${p.slug} -> ${url}`);
        } catch (err) {
          console.warn(`image failed for ${p.slug}:`, err instanceof Error ? err.message : err);
        }
      }
      const cats = await db.getCategories();
      for (const c of cats) {
        if (!c.image || !c.image.startsWith('/')) continue;
        const url = done.get(c.image);
        if (url) await db.updateCategory(c.id, { image: url });
      }
    }
  }

  const totals = await pool.query(`
    SELECT (SELECT count(*) FROM admin_users)::int AS admins, (SELECT count(*) FROM categories)::int AS categories,
           (SELECT count(*) FROM products)::int AS products, (SELECT count(*) FROM product_variants)::int AS variants,
           (SELECT count(*) FROM faqs)::int AS faqs, (SELECT count(*) FROM legal_pages)::int AS legal_pages,
           (SELECT count(*) FROM homepage_sections)::int AS sections, (SELECT count(*) FROM navigation_items)::int AS navigation,
           (SELECT count(*) FROM payment_methods)::int AS payment_methods, (SELECT count(*) FROM media_library)::int AS media`);
  console.log('inserted this run:', JSON.stringify(counts));
  console.log('totals:', JSON.stringify(totals.rows[0]));
  await pool.end();
}

main().catch(async err => {
  console.error(err instanceof Error ? err.stack || err.message : err);
  await pool.end().catch(() => {});
  process.exit(1);
});
