import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const announcements = await db.getAnnouncements(true);
  return NextResponse.json({ announcements });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id, text, link, ctaText, enabled } = body;

    if (action === 'create') {
      const created = await db.createAnnouncement({ text, link, ctaText, priority: 1, enabled: true });
      return NextResponse.json({ success: true, announcement: created });
    }

    if (action === 'update' && id) {
      const updated = await db.updateAnnouncement(id, { text, link, ctaText, enabled });
      return NextResponse.json({ success: true, announcement: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
