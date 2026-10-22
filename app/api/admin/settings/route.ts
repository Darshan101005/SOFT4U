import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const settings = await db.getSiteSettings();
  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  try {
    const updates = await req.json();
    const updated = await db.updateSiteSettings(updates);
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Settings update failed' }, { status: 500 });
  }
}
