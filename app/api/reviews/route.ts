import { NextRequest, NextResponse } from 'next/server';
import { db, queryOne } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/admin-auth';
import { getSessionUser } from '@/lib/session';
import { errorResponse } from '@/lib/api';

/** GET ?productId= -> approved reviews for a product. Without productId: admins get every review, others an empty list. */
export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get('productId');
  if (productId) return NextResponse.json({ reviews: await db.getReviews(productId) });
  const admin = await getCurrentAdmin();
  return NextResponse.json({ reviews: admin ? await db.getReviews() : [] });
}

/**
 * POST { productId, rating, title?, comment } -> creates a review (signed-in customers, moderated: status 'pending').
 * POST { action: 'update_status', id, status } -> admin moderation.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id, status, productId, rating, title, comment } = body;

    if (action === 'update_status' || action === 'delete' || action === 'feature') {
      const admin = await getCurrentAdmin();
      if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (action === 'delete') return NextResponse.json({ success: await db.deleteReview(id) });
      if (action === 'feature') return NextResponse.json({ success: true, review: await db.updateReview(id, { isFeatured: Boolean(body.isFeatured) }) });
      if (!['approved', 'pending', 'hidden', 'rejected'].includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      return NextResponse.json({ success: true, review: await db.updateReviewStatus(id, status) });
    }

    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Sign in to write a review' }, { status: 401 });
    const text = String(comment || '').trim();
    const stars = Math.round(Number(rating));
    if (!productId || !text || text.length > 2000 || !(stars >= 1 && stars <= 5)) {
      return NextResponse.json({ error: 'Add a rating (1-5) and a comment' }, { status: 400 });
    }
    const purchase = await queryOne<{ order_id: string }>(
      `SELECT o.id AS order_id FROM orders o JOIN order_items oi ON oi.order_id = o.id
        WHERE o.customer_id = $1 AND oi.product_id = $2 AND o.order_status = 'completed' LIMIT 1`,
      [user.id, productId],
    );
    const review = await db.createReview({
      productId,
      customerId: user.id,
      orderId: purchase?.order_id,
      customerName: user.name,
      customerEmail: user.email,
      rating: stars,
      title: String(title || '').trim().slice(0, 120),
      comment: text,
      verifiedPurchase: Boolean(purchase),
      status: 'pending',
      isFeatured: false,
    });
    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
