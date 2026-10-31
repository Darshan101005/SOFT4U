import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import type { DeliveryChannel } from '@/lib/db/types';
import { errorResponse, readJson } from '@/lib/api';
import { approveOrder, cancelOrder, deliverOrder, inventoryToFields, refundOrder, rejectOrder } from '@/lib/order-lifecycle';
import { chatIdsForUser, telegramEnabled } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET -> { order, vault, proofImages, telegramLinked }
 *   order.total / order.currency is exactly what the customer was asked to pay
 *   vault: per order line, the available vault items (and their fields) the admin can send
 *   proofImages: { [proofId]: ['/api/admin/payment-proofs/<id>?i=0', ...] } (signed redirects)
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;
  const order = (await db.getOrderById(id)) || (await db.getOrderByNumber(id));
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  // Per order line: the oldest available vault items (a few extra so the admin can pick another one).
  const vault = await Promise.all(
    order.items.map(async item => {
      const available = await db.getAvailableInventory(item.productId, item.variantId, item.quantity + 15);
      return { orderItem: item, required: item.quantity, available, fields: available.map(inventoryToFields) };
    }),
  );
  const proofImages = Object.fromEntries(
    (order.paymentProofs || []).map(p => [p.id, p.images.map((_, i) => `/api/admin/payment-proofs/${p.id}?i=${i}`)]),
  );
  const telegramLinked = Boolean(order.customerId && telegramEnabled() && (await chatIdsForUser(order.customerId)).length);
  return NextResponse.json({ order, vault, proofImages, telegramLinked });
}

/**
 * POST { action, ... }
 *   approve
 *   reject   { reason }
 *   deliver  { lines: [{ orderItemId, fields: [{label,value}], inventoryItemIds?, instructions? }], channels: ['email','telegram'], note? }
 *            -> { emailSent, telegramSent, copyText }   (approves first if still under review: "accept and send")
 *   cancel   { reason? }
 *   refund   { reason }        (completed orders only)
 *   note     { adminNote }
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const { id: ref } = await params;
  try {
    const found = (await db.getOrderById(ref)) || (await db.getOrderByNumber(ref));
    if (!found) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    const id = found.id;
    const body = await readJson(req);
    switch (body.action) {
      case 'approve':
        return NextResponse.json({ ok: true, order: await approveOrder(id, admin) });
      case 'reject':
        return NextResponse.json({ ok: true, order: await rejectOrder(id, admin, String(body.reason || '')) });
      case 'deliver': {
        const channels = (Array.isArray(body.channels) ? body.channels : []).filter((c: string) =>
          ['email', 'telegram', 'whatsapp', 'account'].includes(c),
        ) as DeliveryChannel[];
        const result = await deliverOrder(id, admin, { lines: Array.isArray(body.lines) ? body.lines : [], channels, note: body.note });
        return NextResponse.json({ ok: true, ...result });
      }
      case 'cancel':
        return NextResponse.json({ ok: true, order: await cancelOrder(id, { type: 'admin', name: admin.name }, body.reason) });
      case 'refund':
        return NextResponse.json({ ok: true, order: await refundOrder(id, admin, String(body.reason || '')) });
      case 'note':
        return NextResponse.json({ ok: true, order: await db.updateOrder(id, { adminNote: String(body.adminNote || '').slice(0, 4000) }) });
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err) {
    return errorResponse(err);
  }
}
