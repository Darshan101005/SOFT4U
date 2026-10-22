'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Order } from '@/lib/db/types';
import { siteConfig } from '@/lib/site-config';
import { formatPrice } from '@/app/_store/price';
import { LAST_ORDER_KEY, type LastOrderSummary } from '@/app/_store/last-order';
import { Search, Package, MessageCircle } from 'lucide-react';

interface TrackedOrder {
  orderNumber: string;
  createdAt: string;
  status: string;
  items: { name: string; variant: string; quantity: number; price: number }[];
  total: number;
  timeline: { status: string; note: string; timestamp: string }[];
}

function fromApiOrder(o: Order): TrackedOrder {
  return {
    orderNumber: o.orderNumber,
    createdAt: o.createdAt,
    status: o.orderStatus,
    items: o.items.map(i => ({ name: i.productName, variant: i.variantName, quantity: i.quantity, price: i.price })),
    total: o.total,
    timeline: o.timeline.map(t => ({ status: t.status, note: t.note, timestamp: t.timestamp })),
  };
}

function fromLastOrder(o: LastOrderSummary): TrackedOrder {
  return {
    orderNumber: o.orderNumber,
    createdAt: o.createdAt,
    status: 'Payment pending',
    items: o.items,
    total: o.total,
    timeline: [
      { status: 'Order received', note: 'We have received your order and will contact you on WhatsApp to complete payment.', timestamp: o.createdAt },
    ],
  };
}

function readLastOrder(orderNumber: string): LastOrderSummary | null {
  try {
    const raw = sessionStorage.getItem(LAST_ORDER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastOrderSummary;
    return parsed.orderNumber.toUpperCase() === orderNumber.trim().toUpperCase() ? parsed : null;
  } catch {
    return null;
  }
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get('orderId') || '';

  const [orderQuery, setOrderQuery] = useState(initialOrderId);
  const [emailQuery, setEmailQuery] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchOrder = useCallback(async (orderId: string, email?: string) => {
    if (!orderId.trim()) return;
    setLoading(true);
    setErrorMsg('');
    // Orders placed in this browser are found first; the order API is optional for now.
    const last = readLastOrder(orderId);
    let found: TrackedOrder | null = last ? fromLastOrder(last) : null;
    if (!found) {
      try {
        const url = `/api/orders/${encodeURIComponent(orderId.trim())}${email ? `?email=${encodeURIComponent(email.trim())}` : ''}`;
        const res = await fetch(url);
        const data = await res.json();
        if (res.ok && data.order) found = fromApiOrder(data.order);
      } catch {
        // Lookup service unavailable; show the not-found message below.
      }
    }
    setOrder(found);
    if (!found) {
      setErrorMsg(`We could not find order ${orderId.trim()}. Please check the number or contact us on WhatsApp.`);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (initialOrderId) {
      const timer = setTimeout(() => fetchOrder(initialOrderId), 0);
      return () => clearTimeout(timer);
    }
  }, [initialOrderId, fetchOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(orderQuery, emailQuery);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-3 bg-surface-card border border-charcoal-border rounded-2xl p-8">
        <div className="w-12 h-12 rounded-full bg-pista-lighter text-pista-dark flex items-center justify-center mx-auto">
          <Package className="w-6 h-6" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-extrabold text-charcoal">Track Your Order</h1>
        <p className="text-sm text-charcoal-muted max-w-md mx-auto">
          Enter the order number from your confirmation email or WhatsApp message to see its status.
        </p>

        <form onSubmit={handleSearch} className="max-w-md mx-auto pt-3 space-y-3 text-left">
          <div>
            <label htmlFor="track-order-id" className="text-sm font-semibold text-charcoal block mb-1">Order number *</label>
            <input
              id="track-order-id"
              type="text"
              required
              value={orderQuery}
              onChange={e => setOrderQuery(e.target.value)}
              placeholder="e.g. PK-12345"
              className="w-full text-sm px-3 py-2.5 border border-charcoal-border rounded-lg bg-surface-bg focus:bg-surface-card focus:outline-none focus:border-pista font-mono"
            />
          </div>
          <div>
            <label htmlFor="track-email" className="text-sm font-semibold text-charcoal block mb-1">Email (optional)</label>
            <input
              id="track-email"
              type="email"
              value={emailQuery}
              onChange={e => setEmailQuery(e.target.value)}
              className="w-full text-sm px-3 py-2.5 border border-charcoal-border rounded-lg bg-surface-bg focus:bg-surface-card focus:outline-none focus:border-pista"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-pista-dark text-white hover:bg-pista-darker text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            <Search className="w-4 h-4" aria-hidden="true" />
            <span>{loading ? 'Checking...' : 'Track Order'}</span>
          </button>
        </form>

        {errorMsg && (
          <p role="alert" className="text-sm text-charcoal bg-surface-muted p-3 rounded-lg max-w-md mx-auto">
            {errorMsg}
          </p>
        )}
      </div>

      {order && (
        <div className="bg-surface-card border border-charcoal-border rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-surface-muted">
            <div>
              <div className="text-xs text-charcoal-subtle">Order number</div>
              <div className="font-mono font-bold text-charcoal text-lg">{order.orderNumber}</div>
              <div className="text-xs text-charcoal-subtle mt-0.5">Placed on {new Date(order.createdAt).toLocaleString('en-PK')}</div>
            </div>
            <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-pista-lighter text-pista-darker text-xs font-bold capitalize">
              {order.status}
            </span>
          </div>

          <div>
            <h2 className="text-sm font-bold text-charcoal mb-3">Items</h2>
            <ul className="divide-y divide-surface-muted">
              {order.items.map((item, idx) => (
                <li key={idx} className="py-3 flex justify-between gap-3 text-sm">
                  <div>
                    <div className="font-semibold text-charcoal">{item.name}</div>
                    <div className="text-xs text-charcoal-subtle">{item.variant} × {item.quantity}</div>
                  </div>
                  <div className="font-bold text-charcoal whitespace-nowrap">{formatPrice(item.price * item.quantity)}</div>
                </li>
              ))}
            </ul>
            <div className="flex justify-between pt-3 border-t border-surface-muted text-sm">
              <span className="font-bold text-charcoal">Total</span>
              <span className="font-extrabold text-charcoal">{formatPrice(order.total)}</span>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-charcoal mb-3">Order timeline</h2>
            <ol className="space-y-4">
              {order.timeline.map((evt, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-pista mt-1.5 flex-shrink-0" aria-hidden="true" />
                  <div>
                    <div className="font-bold text-charcoal">{evt.status}</div>
                    <div className="text-charcoal-muted">{evt.note}</div>
                    <div className="text-xs text-charcoal-subtle mt-0.5">{new Date(evt.timestamp).toLocaleString('en-PK')}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="pt-5 border-t border-surface-muted flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-sm text-charcoal-muted">Need help with this order?</span>
            <a
              href={`${siteConfig.whatsappHref}?text=${encodeURIComponent(`Hello ${siteConfig.name}, I need help with order ${order.orderNumber}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-pista-dark text-white hover:bg-pista-darker text-sm font-semibold rounded-lg"
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
              WhatsApp Support
            </a>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-charcoal-subtle">
        Can&apos;t find your order number? <Link href="/contact" className="underline hover:text-pista-darker">Contact us</Link> with your email address.
      </p>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <Suspense fallback={<div className="text-center py-20 text-sm text-charcoal-subtle">Loading tracker...</div>}>
          <TrackOrderContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
