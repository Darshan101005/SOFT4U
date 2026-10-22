import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const products = await db.getProducts();
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id, productData, updates } = body;

    if (action === 'create') {
      const created = await db.createProduct(productData);
      return NextResponse.json({ success: true, product: created }, { status: 201 });
    }

    if (action === 'update' && id && updates) {
      const updated = await db.updateProduct(id, updates);
      return NextResponse.json({ success: true, product: updated });
    }

    if (action === 'toggle_status' && id) {
      const existing = await db.getProductById(id);
      if (!existing) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      const newStatus = existing.status === 'active' ? 'disabled' : 'active';
      const updated = await db.updateProduct(id, { status: newStatus });
      return NextResponse.json({ success: true, product: updated });
    }

    if (action === 'duplicate' && id) {
      const existing = await db.getProductById(id);
      if (!existing) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

      const { id: oldId, ...rest } = existing;
      const duplicated = await db.createProduct({
        ...rest,
        name: `${existing.name} (Copy)`,
        slug: `${existing.slug}-copy-${Date.now().toString(36)}`,
        status: 'draft',
      });
      return NextResponse.json({ success: true, product: duplicated });
    }

    if (action === 'delete' && id) {
      const deleted = await db.deleteProduct(id);
      return NextResponse.json({ success: deleted });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Product operation failed' }, { status: 500 });
  }
}
