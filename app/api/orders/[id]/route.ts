import { NextRequest, NextResponse } from 'next/server';
import { loadOrderForViewer, toPublicOrder } from '@/lib/order-access';

export const dynamic = 'force-dynamic';

/** GET /api/orders/<Order ID> -> { order } (customer view; see lib/order-access.ts for what is visible). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = await loadOrderForViewer(decodeURIComponent(id));
  if (!found) return NextResponse.json({ error: 'Order not found. Check your Order ID.' }, { status: 404 });
  return NextResponse.json(
    { order: await toPublicOrder(found.order, found.canSeeDelivery) },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
