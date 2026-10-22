import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const inventory = await db.getInventory();
  return NextResponse.json({ inventory });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id, itemData, updates } = body;

    if (action === 'create' && itemData) {
      const created = await db.addInventoryItem(itemData);
      return NextResponse.json({ success: true, item: created }, { status: 201 });
    }

    if (action === 'update' && id && updates) {
      const updated = await db.updateInventoryItem(id, updates);
      return NextResponse.json({ success: true, item: updated });
    }

    if (action === 'delete' && id) {
      const deleted = await db.deleteInventoryItem(id);
      return NextResponse.json({ success: deleted });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Inventory operation failed' }, { status: 500 });
  }
}
