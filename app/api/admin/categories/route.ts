import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const categories = await db.getCategories();
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id, categoryData, updates } = body;

    if (action === 'create' && categoryData) {
      const created = await db.createCategory(categoryData);
      return NextResponse.json({ success: true, category: created }, { status: 201 });
    }

    if (action === 'update' && id && updates) {
      const updated = await db.updateCategory(id, updates);
      return NextResponse.json({ success: true, category: updated });
    }

    if (action === 'delete' && id) {
      const deleted = await db.deleteCategory(id);
      return NextResponse.json({ success: deleted });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Category operation failed' }, { status: 500 });
  }
}
