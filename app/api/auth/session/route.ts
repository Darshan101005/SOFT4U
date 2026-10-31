import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** GET -> { user } (null when signed out). */
export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user }, { headers: { 'Cache-Control': 'no-store' } });
}
