import { NextRequest, NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api';
import { loadOrderForViewer, toPublicOrder } from '@/lib/order-access';
import { cancelOrder } from '@/lib/order-lifecycle';

/** POST -> cancels an order that has not been approved yet (signed-in owner only). */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const found = await loadOrderForViewer(decodeURIComponent(id));
    if (!found) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (!found.isOwner) return NextResponse.json({ error: 'Sign in to cancel this order' }, { status: 403 });
    const order = await cancelOrder(found.order.id, { type: 'customer', name: found.order.customerName });
    return NextResponse.json({ ok: true, order: await toPublicOrder(order, found.canSeeDelivery) });
  } catch (err) {
    return errorResponse(err);
  }
}
