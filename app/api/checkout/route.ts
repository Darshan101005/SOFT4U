import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { OrderItem } from '@/lib/db/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      customerWhatsapp,
      items,
      couponCode,
      paymentMethod,
      customerId
    } = body;

    if (!customerEmail || !customerName || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Customer details and valid cart items are required' }, { status: 400 });
    }

    // SERVER-SIDE PRICE VERIFICATION:
    // Never trust client prices. Look up actual products and variants from database.
    let verifiedSubtotal = 0;
    const verifiedOrderItems: OrderItem[] = [];

    for (const item of items) {
      const product = await db.getProductById(item.productId);
      if (!product || product.status !== 'active') {
        return NextResponse.json({ error: `Product "${item.productName || item.productId}" is not available.` }, { status: 400 });
      }

      const variant = product.variants.find(v => v.id === item.variantId);
      if (!variant || variant.status !== 'active') {
        return NextResponse.json({ error: `Variant for "${product.name}" is not active.` }, { status: 400 });
      }

      const itemQty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const itemPrice = Number(variant.price);
      verifiedSubtotal += itemPrice * itemQty;

      verifiedOrderItems.push({
        id: `oi_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        orderId: '', // populated in db.createOrder
        productId: product.id,
        productName: product.name,
        productImage: product.images[0] || '',
        variantId: variant.id,
        variantName: variant.name,
        price: itemPrice,
        quantity: itemQty,
        expiryDays: variant.expiryDays
      });
    }

    // VERIFY COUPON SERVER-SIDE
    let discount = 0;
    let verifiedCouponCode: string | undefined = undefined;

    if (couponCode) {
      const coupon = await db.getCouponByCode(couponCode);
      if (coupon) {
        if (!coupon.minOrderAmount || verifiedSubtotal >= coupon.minOrderAmount) {
          if (coupon.type === 'percentage') {
            discount = (verifiedSubtotal * coupon.value) / 100;
            if (coupon.maxDiscount && discount > coupon.maxDiscount) {
              discount = coupon.maxDiscount;
            }
          } else {
            discount = Math.min(coupon.value, verifiedSubtotal);
          }
          verifiedCouponCode = coupon.code;
          coupon.usageCount += 1;
          await db.updateCoupon(coupon.id, { usageCount: coupon.usageCount });
        }
      }
    }

    const verifiedTotal = Math.max(0, verifiedSubtotal - discount);

    // CREATE ORDER & AUTOMATICALLY DISPATCH FULFILLMENT
    const newOrder = await db.createOrder({
      customerId: customerId || undefined,
      customerName,
      customerEmail,
      customerPhone: customerPhone || undefined,
      customerWhatsapp: customerWhatsapp || undefined,
      items: verifiedOrderItems,
      subtotal: parseFloat(verifiedSubtotal.toFixed(2)),
      discount: parseFloat(discount.toFixed(2)),
      couponCode: verifiedCouponCode,
      tax: 0,
      total: parseFloat(verifiedTotal.toFixed(2)),
      paymentMethod: paymentMethod || 'Credit / Debit Card (Stripe)',
      paymentStatus: 'paid', // Instant settlement for simulation
      fulfillmentStatus: 'fulfilled',
      orderStatus: 'completed',
    });

    await db.logAction(
      customerEmail,
      customerName,
      'ORDER_COMPLETED',
      'Order',
      newOrder.orderNumber,
      `Order placed and fulfilled: $${newOrder.total} (${verifiedOrderItems.length} items)`
    );

    return NextResponse.json({
      success: true,
      order: newOrder,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message || 'Checkout failed' }, { status: 500 });
  }
}
