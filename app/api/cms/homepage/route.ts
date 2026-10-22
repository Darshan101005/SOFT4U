import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const sections = await db.getHomepageSections();
  return NextResponse.json({ sections });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, sectionId, updates, orderedIds, newSection } = body;

    if (action === 'reorder' && Array.isArray(orderedIds)) {
      const reordered = await db.reorderHomepageSections(orderedIds);
      return NextResponse.json({ success: true, sections: reordered });
    }

    if (action === 'toggle_enabled' && sectionId) {
      const current = (await db.getHomepageSections()).find(s => s.id === sectionId);
      if (!current) return NextResponse.json({ error: 'Section not found' }, { status: 404 });
      const updated = await db.updateHomepageSection(sectionId, { enabled: !current.enabled });
      return NextResponse.json({ success: true, section: updated });
    }

    if (action === 'update' && sectionId && updates) {
      const updated = await db.updateHomepageSection(sectionId, updates);
      return NextResponse.json({ success: true, section: updated });
    }

    if (action === 'add' && newSection) {
      const created = await db.addHomepageSection(newSection);
      return NextResponse.json({ success: true, section: created });
    }

    if (action === 'delete' && sectionId) {
      const success = await db.deleteHomepageSection(sectionId);
      return NextResponse.json({ success });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'CMS operation failed' }, { status: 500 });
  }
}
