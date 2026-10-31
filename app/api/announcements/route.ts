import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { errorResponse } from '@/lib/api';

/** Public: active announcements (enabled and inside their date window). */
export async function GET() {
  const announcements = await db.getAnnouncements(true);
  return NextResponse.json({ announcements });
}

/** Admin: { action: 'create' | 'update' | 'delete', ... } */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const body = await req.json();
    const { action, id, text, link, ctaText, enabled, priority, startDate, endDate } = body;
    if (action === 'create') {
      if (!text) return NextResponse.json({ error: 'Text is required' }, { status: 400 });
      const created = await db.createAnnouncement({ text, link, ctaText, priority: Number(priority) || 1, enabled: enabled !== false, startDate, endDate });
      return NextResponse.json({ success: true, announcement: created });
    }
    if (action === 'update' && id) {
      const updates: Record<string, unknown> = {};
      for (const [k, v] of Object.entries({ text, link, ctaText, enabled, priority, startDate, endDate })) if (v !== undefined) updates[k] = v;
      const updated = await db.updateAnnouncement(id, updates);
      return NextResponse.json({ success: true, announcement: updated });
    }
    if (action === 'delete' && id) {
      return NextResponse.json({ success: await db.deleteAnnouncement(id) });
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return errorResponse(err);
  }
}
