import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { errorResponse, readJson } from '@/lib/api';

export const dynamic = 'force-dynamic';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const categories = await db.getCategories();
  return NextResponse.json({ categories });
}

/** POST { action: 'create' (categoryData) | 'update' (id, updates) | 'delete' (id) } */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const body = await readJson(req);
    const { action, id, categoryData, updates } = body;
    const check = (c: Record<string, unknown>, creating: boolean): string | null => {
      if (creating || c.name !== undefined) if (typeof c.name !== 'string' || c.name.trim().length < 2) return 'Enter a category name';
      if (creating || c.slug !== undefined) if (typeof c.slug !== 'string' || !SLUG_RE.test(c.slug)) return 'The slug may only use lowercase letters, numbers and dashes';
      if (c.status !== undefined && !['active', 'disabled'].includes(String(c.status))) return 'Invalid status';
      return null;
    };
    try {
      if (action === 'create' && categoryData) {
        const problem = check(categoryData, true);
        if (problem) return NextResponse.json({ error: problem }, { status: 400 });
        const created = await db.createCategory({ status: 'active', featured: false, displayOrder: 0, ...categoryData });
        return NextResponse.json({ success: true, category: created }, { status: 201 });
      }
      if (action === 'update' && id && updates) {
        const problem = check(updates, false);
        if (problem) return NextResponse.json({ error: problem }, { status: 400 });
        const updated = await db.updateCategory(id, updates);
        if (!updated) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        return NextResponse.json({ success: true, category: updated });
      }
      if (action === 'delete' && id) {
        return NextResponse.json({ success: await db.deleteCategory(id) });
      }
    } catch (err) {
      if ((err as { code?: string })?.code === '23505') return NextResponse.json({ error: 'That slug is already used by another category' }, { status: 409 });
      throw err;
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return errorResponse(err);
  }
}
