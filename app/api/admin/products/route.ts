import { NextRequest, NextResponse } from 'next/server';
import { db, type ProductInput } from '@/lib/db';
import type { Product } from '@/lib/db/types';
import { requireAdmin } from '@/lib/admin-auth';
import { errorResponse, readJson } from '@/lib/api';

export const dynamic = 'force-dynamic';

const STATUSES: Product['status'][] = ['active', 'draft', 'disabled', 'archived'];

function dbError(err: unknown): NextResponse | null {
  const e = err as { code?: string; constraint?: string; detail?: string };
  if (e?.code === '23505') {
    const what = /slug/i.test(`${e.constraint} ${e.detail}`) ? 'URL slug' : /sku/i.test(`${e.constraint} ${e.detail}`) ? 'SKU' : 'value';
    return NextResponse.json({ error: `That ${what} is already used by another product` }, { status: 409 });
  }
  if (e?.code === '23503') return NextResponse.json({ error: 'The selected category no longer exists' }, { status: 400 });
  return null;
}

/** Basic server-side checks before writing a product. */
function validate(p: Partial<ProductInput>, creating: boolean): string | null {
  if (creating || p.name !== undefined) if (!p.name || p.name.trim().length < 2) return 'Enter a product name';
  if (creating || p.slug !== undefined) if (!p.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)) return 'The URL slug may only use lowercase letters, numbers and dashes';
  if (p.status !== undefined && !STATUSES.includes(p.status)) return 'Invalid status';
  if (p.variants !== undefined) {
    if (!Array.isArray(p.variants) || p.variants.length === 0) return 'Add at least one plan (variant)';
    for (const v of p.variants) {
      if (!v.name || !String(v.name).trim()) return 'Every plan needs a name';
      if (!(Number(v.price) > 0)) return `Enter a PKR price for "${v.name}"`;
      if (v.usdPricingMode === 'fixed' && !(Number(v.usdPrice) > 0)) return `Enter the fixed USD price for "${v.name}"`;
      if (v.usdPricingMode === 'percent' && !(Number(v.usdMarkupPercent) >= -90)) return `Enter the USD margin % for "${v.name}"`;
      if (v.usdPricingMode === 'amount' && !Number.isFinite(Number(v.usdMarkupAmount))) return `Enter the USD margin amount for "${v.name}"`;
      if (v.compareAtPrice !== undefined && v.compareAtPrice !== null && Number(v.compareAtPrice) > 0 && Number(v.compareAtPrice) <= Number(v.price)) {
        return `"Compare at" for "${v.name}" must be higher than the price (or empty)`;
      }
    }
  }
  return null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const products = await db.getProducts();
  return NextResponse.json({ products });
}

/**
 * POST { action, ... }
 *   create      { productData }
 *   update      { id, updates }      (a `variants` array replaces the plan set, matched by id)
 *   set_status  { id, status }       active | draft | disabled | archived
 *   toggle_status { id }             active <-> disabled
 *   duplicate   { id }               copy saved as draft
 *   delete      { id }               permanent; disabling is the safer default
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const body = await readJson(req);
    const { action, id, productData, updates } = body;
    try {
      if (action === 'create') {
        const problem = validate(productData || {}, true);
        if (problem) return NextResponse.json({ error: problem }, { status: 400 });
        const created = await db.createProduct(productData);
        return NextResponse.json({ success: true, product: created }, { status: 201 });
      }
      if (action === 'update' && id && updates) {
        const problem = validate(updates, false);
        if (problem) return NextResponse.json({ error: problem }, { status: 400 });
        const updated = await db.updateProduct(id, updates);
        if (!updated) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        return NextResponse.json({ success: true, product: updated });
      }
      if (action === 'set_status' && id) {
        if (!STATUSES.includes(body.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        const updated = await db.updateProduct(id, { status: body.status });
        if (!updated) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        return NextResponse.json({ success: true, product: updated });
      }
      if (action === 'toggle_status' && id) {
        const existing = await db.getProductById(id);
        if (!existing) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        const updated = await db.updateProduct(id, { status: existing.status === 'active' ? 'disabled' : 'active' });
        return NextResponse.json({ success: true, product: updated });
      }
      if (action === 'duplicate' && id) {
        const existing = await db.getProductById(id);
        if (!existing) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        const { id: _oldId, createdAt: _c, updatedAt: _u, variants, ...rest } = existing;
        void _oldId;
        void _c;
        void _u;
        const stamp = Date.now().toString(36);
        const duplicated = await db.createProduct({
          ...rest,
          name: `${existing.name} (Copy)`,
          slug: `${existing.slug}-copy-${stamp}`,
          sku: existing.sku ? `${existing.sku}-COPY-${stamp.toUpperCase()}` : '',
          status: 'draft',
          // New variant ids so the copy never touches the original's plans.
          variants: variants.map(({ id: _vid, productId: _pid, ...v }) => {
            void _vid;
            void _pid;
            return { ...v, sku: v.sku ? `${v.sku}-C${stamp.toUpperCase()}` : '' };
          }),
        });
        return NextResponse.json({ success: true, product: duplicated });
      }
      if (action === 'delete' && id) {
        const deleted = await db.deleteProduct(id);
        return NextResponse.json({ success: deleted });
      }
    } catch (err) {
      const mapped = dbError(err);
      if (mapped) return mapped;
      throw err;
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return errorResponse(err);
  }
}
