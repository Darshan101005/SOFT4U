import { NextRequest, NextResponse } from 'next/server';
import { errorResponse, readJson } from '@/lib/api';
import { loadOrderForViewer, toPublicOrder } from '@/lib/order-access';
import { MAX_PROOF_IMAGE_BYTES, MAX_PROOF_IMAGES, submitPaymentProof } from '@/lib/order-lifecycle';
import { dataUriBytes } from '@/lib/cloudinary';
import { logActivity } from '@/lib/activity';

export const runtime = 'nodejs';

/**
 * POST { transactionId, screenshots: dataUri[] (1-3, JPG/PNG/WebP, 5 MB each), senderName?, senderAccount?, amountPaid?, paymentDate? }
 * Allowed for the signed-in order owner only.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const found = await loadOrderForViewer(decodeURIComponent(id));
    if (!found) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (!found.isOwner) {
      return NextResponse.json({ error: 'Sign in to the account that placed this order to upload the payment proof.' }, { status: 403 });
    }
    const body = await readJson(req);
    const screenshots: string[] = Array.isArray(body.screenshots) ? body.screenshots.map(String) : body.screenshot ? [String(body.screenshot)] : [];
    if (screenshots.length === 0) return NextResponse.json({ error: 'Attach your payment screenshot' }, { status: 400 });
    if (screenshots.length > MAX_PROOF_IMAGES) return NextResponse.json({ error: `Upload up to ${MAX_PROOF_IMAGES} screenshots` }, { status: 400 });
    if (screenshots.some(s => dataUriBytes(s) > MAX_PROOF_IMAGE_BYTES)) return NextResponse.json({ error: 'Each screenshot must be 5 MB or smaller' }, { status: 413 });
    const amount = body.amountPaid ?? body.amount;
    const amountNum = amount !== undefined && amount !== '' ? Number(amount) : undefined;
    const updated = await submitPaymentProof(found.order.id, {
      transactionId: String(body.transactionId || ''),
      senderName: body.senderName ? String(body.senderName).slice(0, 80) : undefined,
      senderAccount: body.senderAccount ? String(body.senderAccount).slice(0, 60) : undefined,
      amount: amountNum !== undefined && Number.isFinite(amountNum) ? amountNum : undefined,
      paymentDate: body.paymentDate ? String(body.paymentDate) : undefined,
      screenshotDataUris: screenshots,
    });
    logActivity({ headers: req.headers, eventType: 'payment_proof', userId: updated.customerId, email: updated.customerEmail });
    return NextResponse.json({ ok: true, order: await toPublicOrder(updated, found.canSeeDelivery) });
  } catch (err) {
    return errorResponse(err);
  }
}
