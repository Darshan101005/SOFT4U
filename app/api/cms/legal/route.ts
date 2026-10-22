import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');
  if (slug) {
    const page = await db.getLegalPageBySlug(slug);
    if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    return NextResponse.json({ page });
  }
  const pages = await db.getLegalPages();
  return NextResponse.json({ pages });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, title, content, action, note } = body;

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    if (action === 'publish') {
      const updated = await db.publishLegalPage(slug, content, note);
      return NextResponse.json({ success: true, page: updated });
    } else if (action === 'save_draft') {
      const updated = await db.updateLegalPage(slug, { draftContent: content, status: 'draft' });
      return NextResponse.json({ success: true, page: updated });
    } else if (action === 'restore_version') {
      const versionNumber = Number(body.version);
      const page = await db.getLegalPageBySlug(slug);
      if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
      const targetRev = page.revisions.find(r => r.version === versionNumber);
      if (!targetRev) return NextResponse.json({ error: 'Revision not found' }, { status: 404 });

      const updated = await db.publishLegalPage(slug, targetRev.content, `Restored from version v${versionNumber}`);
      return NextResponse.json({ success: true, page: updated });
    }

    const updated = await db.updateLegalPage(slug, { title, content });
    return NextResponse.json({ success: true, page: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed updating legal page' }, { status: 500 });
  }
}
