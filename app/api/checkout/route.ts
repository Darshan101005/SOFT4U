import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { Currency, DeliveryChannel } from '@/lib/db/types';
import { errorResponse, readJson } from '@/lib/api';
import { CheckoutError, priceCart } from '@/lib/checkout';
import { notifyOrderPlaced, submitPaymentProof } from '@/lib/order-lifecycle';
import { toPublicOrder } from '@/lib/order-access';
import { getSessionUser } from '@/lib/session';
import { EMAIL_RE, normalizeEmail } from '@/lib/password-policy';
import { requestMeta } from '@/lib/request-meta';
import { logActivity } from '@/lib/activity';
import { runSweeps } from '@/lib/maintenance';
import { formatPersonName } from '@/lib/format-name';
import { allowedCurrency } from '@/lib/currency-pref';

const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/;

/**
 * POST {
 *   customerName, customerEmail, customerWhatsapp?, customerPhone?, customerTelegram?,
 *   items: [{ productId, variantId, quantity }], couponCode?, paymentMethod (payment_methods.key),
 *   currency: 'PKR' | 'USD', deliveryChannels?: ['email','whatsapp','telegram','account'], customerNote?,
 *   proof?: { screenshots: dataUri[] (1-3, JPG/PNG/WebP, 5 MB each), transactionId, senderName?, senderAccount?, amountPaid?, paymentDate? }
 * } -> 201 { order, orderNumber, proofError? }
 *
 * Creates a `pending` order; with `proof` it goes straight to `under_review`.
 * Otherwise the proof is sent later via POST /api/orders/<orderNumber>/payment-proof.
 */
export async function POST(req: NextRequest) {
  runSweeps();
  try {
    const body = await readJson(req);
    const settings = await db.getSiteSettings({ fresh: true });
    if (settings.maintenanceMode) throw new CheckoutError('MAINTENANCE', settings.maintenanceMessage, 503);

    const user = await getSessionUser();
    if (!user) throw new CheckoutError('SIGN_IN_REQUIRED', 'Please sign in to place an order', 401);

    const name = formatPersonName(String(body.customerName || user?.name || '').slice(0, 80));
    const email = normalizeEmail(user?.email || String(body.customerEmail || ''));
    const whatsapp = String(body.customerWhatsapp || user?.whatsapp || '').trim().slice(0, 24);
    const phone = String(body.customerPhone || user?.phone || '').trim().slice(0, 24);
    const telegram = String(body.customerTelegram || user?.telegram || '').trim().replace(/^@+/, '').slice(0, 40);
    if (name.length < 2) throw new CheckoutError('NAME', 'Enter your full name');
    if (!EMAIL_RE.test(email)) throw new CheckoutError('EMAIL', 'Enter a valid email address');
    if (settings.requireWhatsapp && !whatsapp) throw new CheckoutError('WHATSAPP', 'Enter your WhatsApp number with country code');
    if (whatsapp && !PHONE_RE.test(whatsapp)) throw new CheckoutError('WHATSAPP', 'Enter a valid WhatsApp number with country code');
    if (settings.requirePhone && !phone) throw new CheckoutError('PHONE', 'Enter your mobile number');
    if (phone && !PHONE_RE.test(phone)) throw new CheckoutError('PHONE', 'Enter a valid mobile number');

    // Outside Pakistan (while the PKR lock is on) the order is always USD, whatever the body says.
    const currency: Currency = await allowedCurrency(body.currency, req.headers, settings);
    const method = await db.getPaymentMethodByKey(String(body.paymentMethod || ''));
    if (!method || !method.enabled) throw new CheckoutError('PAYMENT_METHOD', 'Choose an available payment method');

    const cart = await priceCart({
      lines: Array.isArray(body.items) ? body.items : [],
      currency,
      couponCode: body.couponCode ? String(body.couponCode) : undefined,
      customerId: user?.id,
      email,
    });
    if (!method.currencies.includes(cart.currency)) {
      throw new CheckoutError('PAYMENT_METHOD', `${method.name} does not accept ${cart.currency}. Choose another method or switch currency.`);
    }
    if (cart.coupon && !(await db.claimCouponUse(cart.coupon.id))) {
      throw new CheckoutError('BAD_COUPON', 'This coupon has reached its usage limit');
    }

    const allowed: DeliveryChannel[] = ['email', 'whatsapp', 'telegram', 'account'];
    const channels = (Array.isArray(body.deliveryChannels) ? body.deliveryChannels : ['email']).filter((c: string) =>
      allowed.includes(c as DeliveryChannel),
    ) as DeliveryChannel[];
    if (!channels.includes('email')) channels.unshift('email');

    const meta = requestMeta(req);
    let order;
    try {
      order = await db.createOrder({
        customerId: user?.id,
        customerName: name,
        customerEmail: email,
        customerPhone: phone || undefined,
        customerWhatsapp: whatsapp || undefined,
        customerTelegram: telegram || undefined,
        currency: cart.currency,
        fxRate: cart.fxRate,
        items: cart.items,
        subtotal: cart.subtotal,
        discount: cart.discount,
        couponCode: cart.coupon?.code,
        tax: 0,
        total: cart.total,
        totalPkr: cart.totalPkr,
        paymentMethod: method.key,
        paymentMethodName: method.name,
        deliveryChannels: channels,
        customerNote: body.customerNote ? String(body.customerNote).slice(0, 500) : undefined,
        ip: meta.ip || undefined,
        userAgent: meta.userAgent || undefined,
      });
    } catch (err) {
      if (cart.coupon) await db.releaseCouponUse(cart.coupon.code);
      throw err;
    }

    logActivity({ headers: req.headers, eventType: 'order_placed', userId: user?.id, email });

    // eSIM4U-style single step: the payment proof may come with the order.
    // If the upload fails the order stays `pending` and the proof can be sent again from the order page.
    const proof = body.proof && typeof body.proof === 'object' ? body.proof : null;
    let proofError: string | undefined;
    if (proof) {
      try {
        order = await submitPaymentProof(order.id, {
          transactionId: String(proof.transactionId || ''),
          senderName: proof.senderName ? String(proof.senderName).slice(0, 80) : undefined,
          senderAccount: proof.senderAccount ? String(proof.senderAccount).slice(0, 60) : undefined,
          amount: proof.amountPaid !== undefined && proof.amountPaid !== '' && Number.isFinite(Number(proof.amountPaid)) ? Number(proof.amountPaid) : undefined,
          paymentDate: proof.paymentDate ? String(proof.paymentDate) : undefined,
          screenshotDataUris: Array.isArray(proof.screenshots) ? proof.screenshots.map(String) : [],
        });
        logActivity({ headers: req.headers, eventType: 'payment_proof', userId: user?.id, email });
      } catch (err) {
        proofError = err instanceof Error ? err.message : 'Payment proof upload failed';
        await notifyOrderPlaced(order);
      }
    } else {
      await notifyOrderPlaced(order);
    }
    return NextResponse.json({ ok: true, orderNumber: order.orderNumber, order: await toPublicOrder(order, true), proofError }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
