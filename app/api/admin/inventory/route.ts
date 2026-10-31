import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { InventoryItem } from '@/lib/db/types';
import { requireAdmin } from '@/lib/admin-auth';
import { errorResponse, readJson } from '@/lib/api';

export const dynamic = 'force-dynamic';

const TYPES: InventoryItem['type'][] = ['credential', 'license_key', 'manual', 'generated'];

type ItemInput = { productId?: string; variantId?: string; type?: string; data?: InventoryItem['data']; expiresAt?: string };

function cleanData(d: InventoryItem['data'] | undefined): InventoryItem['data'] {
  const s = (v: unknown, max = 500) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined);
  const fields = Array.isArray(d?.fields)
    ? d!.fields!.map(f => ({ label: String(f?.label || '').trim().slice(0, 60), value: String(f?.value || '').trim().slice(0, 2000) })).filter(f => f.label && f.value)
    : [];
  return {
    email: s(d?.email),
    password: s(d?.password),
    licenseKey: s(d?.licenseKey, 2000),
    pin: s(d?.pin, 40),
    profileName: s(d?.profileName, 120),
    notes: s(d?.notes, 2000),
    ...(fields.length ? { fields } : {}),
  };
}

async function normalise(input: ItemInput): Promise<Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'> | string> {
  if (!input.productId) return 'Choose a product';
  const product = await db.getProductById(input.productId);
  if (!product) return 'Product not found';
  if (input.variantId && !product.variants.some(v => v.id === input.variantId)) return 'That plan does not belong to the product';
  const data = cleanData(input.data);
  if (!data.email && !data.password && !data.licenseKey && !data.pin && !data.profileName && !data.fields?.length && !data.notes) return 'Add at least one detail';
  return {
    productId: product.id,
    variantId: input.variantId || undefined,
    type: TYPES.includes(input.type as InventoryItem['type']) ? (input.type as InventoryItem['type']) : 'credential',
    data,
    status: 'available',
    expiresAt: input.expiresAt || undefined,
  };
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const productId = req.nextUrl.searchParams.get('productId') || undefined;
  const inventory = await db.getInventory({ productId });
  return NextResponse.json({ inventory });
}

/**
 * POST { action, ... }
 *   create       { itemData }
 *   bulk_create  { items[] }
 *   update       { id, updates: { data?, status?: 'available'|'disabled', variantId?, expiresAt? } }  (never on sold items)
 *   delete       { id }   (sold items are kept as delivery history)
 * Items are only ever marked sold by order delivery (one item can never go to two orders).
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const body = await readJson(req);
    const { action, id, itemData, updates, items } = body;
    if (action === 'create' && itemData) {
      const item = await normalise(itemData);
      if (typeof item === 'string') return NextResponse.json({ error: item }, { status: 400 });
      return NextResponse.json({ success: true, item: await db.addInventoryItem(item) }, { status: 201 });
    }
    if (action === 'bulk_create' && Array.isArray(items)) {
      if (items.length === 0) return NextResponse.json({ error: 'Nothing to add' }, { status: 400 });
      if (items.length > 500) return NextResponse.json({ error: 'Add at most 500 items at once' }, { status: 400 });
      const clean = [];
      for (let i = 0; i < items.length; i++) {
        const item = await normalise(items[i]);
        if (typeof item === 'string') return NextResponse.json({ error: `Line ${i + 1}: ${item}` }, { status: 400 });
        clean.push(item);
      }
      return NextResponse.json({ success: true, count: await db.addInventoryItems(clean) }, { status: 201 });
    }
    if (action === 'update' && id && updates) {
      const current = (await db.getInventory()).find(i => i.id === id);
      if (!current) return NextResponse.json({ error: 'Vault item not found' }, { status: 404 });
      if (current.status === 'sold') return NextResponse.json({ error: 'This item was already delivered and cannot be changed' }, { status: 409 });
      const patch: Partial<InventoryItem> = {};
      if (updates.data) patch.data = cleanData(updates.data);
      if (updates.status !== undefined) {
        if (!['available', 'disabled'].includes(updates.status)) return NextResponse.json({ error: 'Status can be available or disabled' }, { status: 400 });
        patch.status = updates.status;
      }
      if (updates.variantId !== undefined) patch.variantId = updates.variantId || undefined;
      if (updates.expiresAt !== undefined) patch.expiresAt = updates.expiresAt || undefined;
      return NextResponse.json({ success: true, item: await db.updateInventoryItem(id, patch) });
    }
    if (action === 'delete' && id) {
      const deleted = await db.deleteInventoryItem(id);
      if (!deleted) return NextResponse.json({ error: 'Delivered items are kept as history and cannot be deleted' }, { status: 409 });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return errorResponse(err);
  }
}
