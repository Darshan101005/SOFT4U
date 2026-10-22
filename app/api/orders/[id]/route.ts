import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const emailParam = req.nextUrl.searchParams.get('email');

  let order = await db.getOrderById(id);
  if (!order) {
    order = await db.getOrderByNumber(id);
  }

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // If email verification is requested or matches, provide full fulfillment data,
  // otherwise provide safe summary without raw passwords
  const isVerified = emailParam && emailParam.toLowerCase() === order.customerEmail.toLowerCase();

  const safeOrder = {
    ...order,
    items: order.items.map(item => {
      if (isVerified || !item.fulfillmentData) {
        return item;
      }
      // Mask password for anonymous order lookup
      return {
        ...item,
        fulfillmentData: {
          ...item.fulfillmentData,
          credentials: item.fulfillmentData.credentials?.map(c => ({
            ...c,
            password: '•••••••••••• (Verify email to reveal)'
          }))
        }
      };
    })
  };

  return NextResponse.json({ order: safeOrder, isVerified });
}
