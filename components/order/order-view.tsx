'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Clock, CreditCard, Loader2, MessageCircle, PackageCheck, RefreshCw, Search, XCircle } from 'lucide-react';
import type { PublicOrder } from '@/lib/order-access';
import type { OrderStatus } from '@/lib/db/types';
import { CopyButton } from '@/components/ui/copy-button';
import { PaymentDetails, PaymentLogo } from '@/components/order/payment-details';
import { DeliveryPanel } from '@/components/order/delivery-panel';
import { EMPTY_PROOF, ProofFields, proofPayload, proofProblem, type ProofValue } from '@/components/order/proof-fields';
import { formatPrice } from '@/app/_store/price';
import { formatGbp } from '@/lib/money';

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Awaiting payment',
  under_review: 'Payment under review',
  processing: 'Payment approved',
  completed: 'Delivered',
  rejected: 'Payment rejected',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const tone =
    status === 'completed'
      ? 'bg-pista-600 text-white'
      : status === 'processing'
        ? 'bg-pista-100 text-pista-darker'
        : status === 'under_review'
          ? 'bg-accent-amber/15 text-[#8a5a12]'
          : status === 'rejected'
            ? 'bg-accent-rose/12 text-accent-rose'
            : status === 'cancelled' || status === 'refunded'
              ? 'bg-surface-muted text-charcoal-muted'
              : 'bg-pista-lighter text-pista-darker';
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${tone}`}>{STATUS_LABELS[status] || status}</span>;
}

const STEPS: Array<{ key: string; label: string; icon: typeof Clock }> = [
  { key: 'placed', label: 'Order placed', icon: CreditCard },
  { key: 'review', label: 'Payment review', icon: Search },
  { key: 'approved', label: 'Approved', icon: CheckCircle2 },
  { key: 'delivered', label: 'Delivered', icon: PackageCheck },
];

function stepIndex(status: OrderStatus): number {
  switch (status) {
    case 'pending':
    case 'rejected':
      return 0;
    case 'under_review':
      return 1;
    case 'processing':
      return 2;
    case 'completed':
    case 'refunded':
      return 3;
    default:
      return -1;
  }
}

function fmtDate(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/**
 * Customer order page body: status, payment details + proof upload while awaiting payment,
 * rejection reason with re-upload, delivered access, items, proofs and timeline.
 */
export function OrderView({
  initial,
  whatsappHref,
  storeName,
  notice,
  signInHref = '/login',
  trackEmail,
}: {
  initial: PublicOrder;
  whatsappHref: string;
  storeName: string;
  notice?: string;
  signInHref?: string;
  /** Email entered on Track Order; sent with refreshes so the API can check it. */
  trackEmail?: string;
}) {
  const [order, setOrder] = useState<PublicOrder>(initial);
  const [proof, setProof] = useState<ProofValue>(EMPTY_PROOF);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(notice ? { tone: 'error', text: notice } : null);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const n = encodeURIComponent(order.orderNumber);
  const canUpload = order.orderStatus === 'pending' || order.orderStatus === 'rejected';
  // Only the signed-in owner may upload proof or cancel.
  const canAct = order.canSeeDelivery;
  const canCancel = canAct && (order.orderStatus === 'pending' || order.orderStatus === 'rejected' || order.orderStatus === 'under_review');
  // A refund before delivery stops the progress at "Approved".
  const idx = order.orderStatus === 'refunded' && !order.deliveredAt ? 2 : stepIndex(order.orderStatus);
  const pd = order.paymentDetails;
  const amountValue = order.currency === 'USD' ? order.total.toFixed(2) : String(Math.round(order.total));

  const refresh = async () => {
    setRefreshing(true);
    try {
      const q = trackEmail ? `?email=${encodeURIComponent(trackEmail)}` : '';
      const res = await fetch(`/api/orders/${n}${q}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.order) setOrder(data.order);
    } finally {
      setRefreshing(false);
    }
  };

  const submitProof = async () => {
    const p = proofProblem(proof);
    if (p) return setMessage({ tone: 'error', text: p });
    setSending(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/orders/${n}/payment-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proofPayload(proof)),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Upload failed. Please try again.');
      setOrder(data.order);
      setProof(EMPTY_PROOF);
      setMessage({ tone: 'ok', text: 'Payment proof received. Our team will verify it shortly and email you.' });
    } catch (err) {
      setMessage({ tone: 'error', text: (err as Error).message });
    } finally {
      setSending(false);
    }
  };

  const cancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${n}/cancel`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not cancel this order');
      setOrder(data.order);
      setMessage({ tone: 'ok', text: 'Your order was cancelled.' });
    } catch (err) {
      setMessage({ tone: 'error', text: (err as Error).message });
    } finally {
      setCancelling(false);
      setConfirmCancel(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="bg-surface-card border border-charcoal-border rounded-2xl p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-charcoal-subtle">Order ID</div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-extrabold text-charcoal text-lg sm:text-xl break-all">{order.orderNumber}</span>
              <CopyButton value={order.orderNumber} label="Copy order ID" compact />
            </div>
            <div className="text-xs text-charcoal-subtle mt-0.5">Placed on {fmtDate(order.createdAt)}</div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={order.orderStatus} />
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing}
              className="inline-flex items-center justify-center w-11 h-11 rounded-xl border border-charcoal-border bg-white text-charcoal-muted hover:border-pista"
              aria-label="Refresh order status"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            </button>
          </div>
        </div>

        {idx >= 0 && (
          <ol className="grid grid-cols-4 gap-1.5 sm:gap-3" aria-label="Order progress">
            {STEPS.map((s, i) => {
              const done = i <= idx;
              const Icon = s.icon;
              return (
                <li key={s.key} className="flex flex-col items-center text-center gap-1.5">
                  <span className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 ${done ? 'bg-pista-600 border-pista-600 text-white' : 'bg-white border-charcoal-border text-charcoal-subtle'}`}>
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <span className={`text-[10px] sm:text-xs leading-tight ${done ? 'font-bold text-charcoal' : 'text-charcoal-subtle'}`}>{s.label}</span>
                </li>
              );
            })}
          </ol>
        )}

        {message && (
          <div role={message.tone === 'error' ? 'alert' : 'status'} className={`p-3 rounded-xl text-sm ${message.tone === 'ok' ? 'bg-pista-lighter border border-pista-light text-pista-darker font-semibold' : 'bg-white border-l-4 border-accent-rose text-charcoal'}`}>
            {message.text}
          </div>
        )}

        {order.orderStatus === 'under_review' && (
          <p className="p-3 rounded-xl bg-accent-amber/10 border border-accent-amber/30 text-sm text-charcoal flex items-start gap-2">
            <Clock className="w-4 h-4 text-accent-amber shrink-0 mt-0.5" aria-hidden="true" />
            We received your payment proof. Our team is verifying it, usually within 5 to 30 minutes during business hours. You will get an email when it is approved.
          </p>
        )}
        {order.orderStatus === 'processing' && (
          <p className="p-3 rounded-xl bg-pista-lighter border border-pista-light text-sm text-charcoal flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-pista-dark shrink-0 mt-0.5" aria-hidden="true" />
            Your payment is approved. We are preparing your delivery and will notify you as soon as it is ready.
          </p>
        )}
        {order.orderStatus === 'rejected' && (
          <div className="p-3 rounded-xl bg-accent-rose/8 border border-accent-rose/30 text-sm text-charcoal flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-accent-rose shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <strong>We could not verify your payment.</strong>
              {order.statusReason && <p className="mt-1">Reason: {order.statusReason}</p>}
              <p className="mt-1 text-charcoal-muted">Check the details below and upload the correct proof again, or contact us on WhatsApp.</p>
            </div>
          </div>
        )}
        {(order.orderStatus === 'cancelled' || order.orderStatus === 'refunded') && (
          <p className="p-3 rounded-xl bg-surface-muted text-sm text-charcoal flex items-start gap-2">
            <XCircle className="w-4 h-4 text-charcoal-subtle shrink-0 mt-0.5" aria-hidden="true" />
            {order.orderStatus === 'cancelled' ? 'This order was cancelled.' : 'This order was refunded.'}
            {order.statusReason ? ` ${order.statusReason}` : ''}
          </p>
        )}
      </div>

      {order.requiresSignIn && (
        <div className="p-4 sm:p-5 rounded-2xl bg-pista-lighter border border-pista-light text-sm text-charcoal flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span>This order is delivered. Sign in to the account that placed it to see your access details.</span>
          <Link href={signInHref} className="inline-flex items-center justify-center min-h-11 px-5 rounded-xl bg-pista-dark text-white font-bold whitespace-nowrap">
            Sign in
          </Link>
        </div>
      )}

      {order.canSeeDelivery && <DeliveryPanel items={order.items} />}

      {canUpload && pd && (
        <section aria-labelledby="pay-title" className="bg-surface-card border border-charcoal-border rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 id="pay-title" className="text-base font-bold text-charcoal">
              {order.orderStatus === 'rejected' ? 'Upload your payment proof again' : 'Complete your payment'}
            </h2>
            <PaymentLogo method={pd} className="h-6" />
          </div>
          <PaymentDetails
            method={pd}
            amountLabel={formatPrice(order.total, order.currency)}
            amountValue={amountValue}
            sendLabel={pd.sendAmount ? formatGbp(pd.sendAmount) : undefined}
            sendValue={pd.sendAmount ? pd.sendAmount.toFixed(2) : undefined}
          />
          {!canAct ? (
            <p className="text-sm text-charcoal-muted">
              <Link href={signInHref} className="font-bold text-pista-darker underline">
                Sign in
              </Link>{' '}
              to the account that placed this order to upload the payment proof.
            </p>
          ) : (
            <>
              <ProofFields value={proof} onChange={setProof} idPrefix={`proof-${order.orderNumber}`} />
              <button
                type="button"
                onClick={submitProof}
                disabled={sending}
                className="w-full sm:w-auto min-h-12 px-6 rounded-xl bg-pista-dark text-white text-sm font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {sending && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                {sending ? 'Uploading...' : 'Submit payment proof'}
              </button>
            </>
          )}
        </section>
      )}

      <section aria-labelledby="items-title" className="bg-surface-card border border-charcoal-border rounded-2xl p-4 sm:p-6">
        <h2 id="items-title" className="text-sm font-bold text-charcoal mb-3">
          Items
        </h2>
        <ul className="divide-y divide-surface-muted">
          {order.items.map(item => (
            <li key={item.id} className="py-3 flex justify-between gap-3 text-sm">
              <div className="min-w-0">
                <div className="font-semibold text-charcoal">{item.productName}</div>
                <div className="text-xs text-charcoal-subtle">
                  {item.variantName} × {item.quantity}
                  {item.deliveredAt ? ` · delivered ${fmtDate(item.deliveredAt)}` : ''}
                </div>
              </div>
              <div className="font-bold text-charcoal whitespace-nowrap">{formatPrice(item.price * item.quantity, order.currency)}</div>
            </li>
          ))}
        </ul>
        <dl className="pt-3 border-t border-surface-muted space-y-1.5 text-sm">
          <div className="flex justify-between text-charcoal-muted">
            <dt>Subtotal</dt>
            <dd className="font-semibold text-charcoal">{formatPrice(order.subtotal, order.currency)}</dd>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-pista-darker">
              <dt>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</dt>
              <dd className="font-semibold">- {formatPrice(order.discount, order.currency)}</dd>
            </div>
          )}
          <div className="flex justify-between text-charcoal-muted">
            <dt>Payment method</dt>
            <dd className="font-semibold text-charcoal text-right">{order.paymentMethodName || order.paymentMethod}</dd>
          </div>
          <div className="flex justify-between pt-2">
            <dt className="font-bold text-charcoal">Total</dt>
            <dd className="text-lg font-extrabold text-charcoal">{formatPrice(order.total, order.currency)}</dd>
          </div>
        </dl>
      </section>

      {order.paymentProofs && order.paymentProofs.length > 0 && (
        <section aria-labelledby="proofs-title" className="bg-surface-card border border-charcoal-border rounded-2xl p-4 sm:p-6">
          <h2 id="proofs-title" className="text-sm font-bold text-charcoal mb-3">
            Payment proofs
          </h2>
          <ul className="space-y-2">
            {order.paymentProofs.map(p => (
              <li key={p.id} className="flex items-center justify-between gap-3 text-sm p-3 rounded-xl bg-surface-muted">
                <div className="min-w-0">
                  <div className="font-mono font-semibold text-charcoal break-all">{p.transactionId}</div>
                  <div className="text-xs text-charcoal-subtle">
                    Sent {fmtDate(p.createdAt)}
                    {p.rejectReason ? ` · ${p.rejectReason}` : ''}
                  </div>
                </div>
                <span className={`text-xs font-bold capitalize ${p.status === 'accepted' ? 'text-pista-darker' : p.status === 'rejected' ? 'text-accent-rose' : 'text-charcoal-muted'}`}>
                  {p.status === 'submitted' ? 'Under review' : p.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {order.timeline.length > 0 && (
        <section aria-labelledby="timeline-title" className="bg-surface-card border border-charcoal-border rounded-2xl p-4 sm:p-6">
          <h2 id="timeline-title" className="text-sm font-bold text-charcoal mb-3">
            Order timeline
          </h2>
          <ol className="space-y-4">
            {[...order.timeline].reverse().map((evt, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-pista mt-1.5 flex-shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <div className="font-bold text-charcoal">{STATUS_LABELS[evt.status as OrderStatus] || evt.status.replace(/_/g, ' ')}</div>
                  {evt.note && <div className="text-charcoal-muted break-words">{evt.note}</div>}
                  <div className="text-xs text-charcoal-subtle mt-0.5">{fmtDate(evt.timestamp)}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 bg-surface-card border border-charcoal-border rounded-2xl">
        <span className="text-sm text-charcoal-muted">Need help with this order?</span>
        <div className="flex flex-col sm:flex-row gap-2">
          {canCancel &&
            (confirmCancel ? (
              <div className="flex gap-2">
                <button type="button" onClick={cancel} disabled={cancelling} aria-busy={cancelling || undefined} className="flex-1 min-h-11 px-4 rounded-xl bg-accent-rose text-white text-sm font-bold disabled:opacity-60 inline-flex items-center justify-center gap-2">
                  {cancelling && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  {cancelling ? 'Cancelling...' : 'Yes, cancel order'}
                </button>
                <button type="button" onClick={() => setConfirmCancel(false)} className="flex-1 min-h-11 px-4 rounded-xl border border-charcoal-border text-sm font-semibold">
                  Keep order
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmCancel(true)} className="min-h-11 px-4 rounded-xl border border-charcoal-border text-sm font-semibold text-charcoal-muted hover:border-accent-rose hover:text-accent-rose">
                Cancel order
              </button>
            ))}
          <a
            href={`${whatsappHref}?text=${encodeURIComponent(`Hello ${storeName}, I need help with order ${order.orderNumber}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 min-h-11 px-4 bg-pista-dark text-white hover:bg-pista-darker text-sm font-semibold rounded-xl"
          >
            <MessageCircle className="w-4 h-4" aria-hidden="true" />
            WhatsApp Support
          </a>
        </div>
      </div>
    </div>
  );
}
