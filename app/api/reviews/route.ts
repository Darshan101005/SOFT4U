import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get('productId');
  const reviews = await db.getReviews(productId || undefined);
  return NextResponse.json({ reviews });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id, status, productId, customerName, customerEmail, rating, title, comment } = body;

    if (action === 'update_status' && id && status) {
      const updated = await db.updateReviewStatus(id, status);
      return NextResponse.json({ success: true, review: updated });
    }

    if (!productId || !customerName || !rating || !comment) {
      return NextResponse.json({ error: 'Missing required review fields' }, { status: 400 });
    }

    const newRev = await db.createReview({
      productId,
      customerName,
      customerEmail: customerEmail || 'anonymous@soft4u.top',
      rating: Number(rating) || 5,
      title: title || 'Customer Review',
      comment,
      verifiedPurchase: true,
      status: 'approved',
      isFeatured: false,
    });

    return NextResponse.json({ success: true, review: newRev }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Review failed' }, { status: 500 });
  }
}
