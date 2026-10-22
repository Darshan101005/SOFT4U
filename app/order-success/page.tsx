'use client';

import React, { useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSessionStorageValue } from '@/hooks/use-hydrated';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { siteConfig } from '@/lib/site-config';
import { formatPrice } from '@/app/_store/price';
import { LAST_ORDER_KEY, type LastOrderSummary } from '@/app/_store/last-order';
import { CheckCircle2, MessageCircle, Package, ArrowRight, Mail, Clock } from 'lucide-react';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get('orderId');
  const raw = useSessionStorageValue(LAST_ORDER_KEY);
  const loaded = raw !== undefined;

  const order = useMemo<LastOrderSummary | null>(() => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as LastOrderSummary;
      return !orderIdParam || parsed.orderNumber === orderIdParam ? parsed : null;
    } catch {
      // Ignore unreadable storage; the page falls back to the order number in the URL.
      return null;
    }
  }, [raw, orderIdParam]);

  const orderNumber = order?.orderNumber || orderIdParam;

  if (!loaded) {
    return <div className="py-20 text-center text-sm text-charcoal-subtle">Loading your order...</div>;
  }

  if (!orderNumber) {
    return (
      <div className="max-w-lg mx-auto p-10 text-center bg-surface-card border border-charcoal-border rounded-2xl space-y-4">
        <h1 className="text-xl font-bold text-charcoal">No recent order found</h1>
        <p className="text-sm text-charcoal-subtle">Looking for an earlier order? Use the order tracker or contact our support team.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/track-order" className="px-5 py-2.5 bg-pista-dark text-white hover:bg-pista-darker text-sm font-bold rounded-lg">
            Track Order
          </Link>
          <Link href="/shop" className="px-5 py-2.5 border border-pista-light text-pista-darker hover:border-pista text-sm font-semibold rounded-lg">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const whatsappMessage = encodeURIComponent(
    `Hello ${siteConfig.name}, I placed order ${orderNumber}${order ? ` for ${formatPrice(order.total)}` : ''}. Please share the payment details.`
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-3 bg-surface-card border border-charcoal-border rounded-2xl p-8 sm:p-10">
        <div className="w-16 h-16 rounded-full bg-pista-lighter text-pista-dark flex items-center justify-center mx-auto border border-pista-light">
          <CheckCircle2 className="w-9 h-9" aria-hidden="true" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal">Thank you for your order!</h1>
        <p className="text-sm text-charcoal-muted">
          Your order number is{' '}
          <span className="font-mono font-bold text-charcoal bg-surface-muted px-2 py-0.5 rounded">{orderNumber}</span>
        </p>
        {order && (
          <p className="text-sm text-charcoal-subtle">
            A confirmation will be sent to <span className="font-semibold text-charcoal">{order.email}</span>
            {order.whatsapp ? <> and WhatsApp <span className="font-semibold text-charcoal">{order.whatsapp}</span></> : null}.
          </p>
        )}
      </div>

      <div className="bg-pista-lighter border border-pista-light rounded-2xl p-6 space-y-3">
        <h2 className="text-base font-bold text-charcoal">Payment status: pending</h2>
        <p className="text-sm text-charcoal-muted leading-relaxed">
          Online card and bank payment through Premier is coming soon. Our team will contact you on WhatsApp shortly
          to complete payment. Your product is delivered as soon as payment is confirmed.
        </p>
        <a
          href={`${siteConfig.whatsappHref}?text=${whatsappMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-pista-dark text-white hover:bg-pista-darker text-sm font-bold rounded-lg"
        >
          <MessageCircle className="w-4 h-4" aria-hidden="true" />
          Confirm on WhatsApp
        </a>
      </div>

      {order && (
        <div className="bg-surface-card border border-charcoal-border rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-charcoal">Order summary</h2>
          <ul className="divide-y divide-surface-muted">
            {order.items.map((item, idx) => (
              <li key={idx} className="py-3 flex items-start justify-between gap-3 text-sm">
                <div>
                  <div className="font-semibold text-charcoal">{item.name}</div>
                  <div className="text-xs text-charcoal-subtle">{item.variant} × {item.quantity}</div>
                </div>
                <div className="font-bold text-charcoal whitespace-nowrap">{formatPrice(item.price * item.quantity)}</div>
              </li>
            ))}
          </ul>
          <dl className="pt-3 border-t border-surface-muted space-y-1.5 text-sm">
            <div className="flex justify-between text-charcoal-muted"><dt>Subtotal</dt><dd className="font-semibold text-charcoal">{formatPrice(order.subtotal)}</dd></div>
            {order.discount > 0 && (
              <div className="flex justify-between text-pista-darker"><dt>Discount</dt><dd className="font-semibold">- {formatPrice(order.discount)}</dd></div>
            )}
            <div className="flex justify-between text-charcoal-muted"><dt>Payment method</dt><dd className="font-semibold text-charcoal text-right">{order.paymentMethod}</dd></div>
            <div className="flex justify-between pt-2"><dt className="font-bold text-charcoal">Total</dt><dd className="text-xl font-extrabold text-charcoal">{formatPrice(order.total)}</dd></div>
          </dl>
        </div>
      )}

      <div className="bg-surface-card border border-charcoal-border rounded-2xl p-6">
        <h2 className="text-base font-bold text-charcoal mb-4">What happens next?</h2>
        <ol className="space-y-3 text-sm text-charcoal-muted">
          <li className="flex gap-3"><Clock className="w-5 h-5 text-pista-dark flex-shrink-0" aria-hidden="true" /> Our team confirms your payment.</li>
          <li className="flex gap-3"><Mail className="w-5 h-5 text-pista-dark flex-shrink-0" aria-hidden="true" /> Your access details are sent to your email and WhatsApp, usually within minutes.</li>
          <li className="flex gap-3"><Package className="w-5 h-5 text-pista-dark flex-shrink-0" aria-hidden="true" /> Follow the activation steps and enjoy. Your plan is covered by our replacement warranty.</li>
        </ol>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href={`/track-order?orderId=${encodeURIComponent(orderNumber)}`}
          className="p-4 bg-surface-card border border-charcoal-border hover:border-pista rounded-xl flex items-center justify-between text-sm font-semibold text-charcoal transition-colors"
        >
          <span className="flex items-center gap-3"><Package className="w-5 h-5 text-pista-dark" aria-hidden="true" /> Track your order</span>
          <ArrowRight className="w-4 h-4 text-charcoal-subtle" aria-hidden="true" />
        </Link>
        <Link
          href="/shop"
          className="p-4 bg-surface-card border border-charcoal-border hover:border-pista rounded-xl flex items-center justify-between text-sm font-semibold text-charcoal transition-colors"
        >
          <span>Continue shopping</span>
          <ArrowRight className="w-4 h-4 text-charcoal-subtle" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <Suspense fallback={<div className="text-center py-20 text-sm text-charcoal-subtle">Loading order...</div>}>
          <OrderSuccessContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
