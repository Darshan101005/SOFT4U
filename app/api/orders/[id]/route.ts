import { NextRequest, NextResponse } from 'next/server';
import { loadOrderForViewer, toPublicOrder } from '@/lib/order-access';
import { normalizeEmail } from '@/lib/password-policy';

export const dynamic = 'force-dynamic';

const NOT_FOUND = 'Order not found. Check your Order ID and email.';

/**
 * GET /api/orders/<Order ID>?email=<order email> -> { order }
 * The signed-in owner can read their order by ID alone. Anyone else must also
 * send the email used on the order, and still never sees delivered access.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = await loadOrderForViewer(decodeURIComponent(id));
  if (!found) return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
  if (!found.isOwner) {
    const email = normalizeEmail(req.nextUrl.searchParams.get('email') || '');
    if (!email || normalizeEmail(found.order.customerEmail) !== email) {
      return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
    }
  }
  return NextResponse.json(
    { order: await toPublicOrder(found.order, found.canSeeDelivery) },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
