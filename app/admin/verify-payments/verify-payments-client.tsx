'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, ExternalLink, Send, XCircle } from 'lucide-react';
import type { Order } from '@/lib/db/types';
import { formatMoney } from '@/lib/money';
import { Badge, Button, Card, CopyButton, EmptyState, LoadingBlock, Modal, OrderStatusBadge, PageHeader, SegmentChips, api, errMsg, toast, useDialog } from '../_components/ui';
import { fmtDateTime, timeAgo } from '../_components/format';

type Tab = 'under_review' | 'pending' | 'rejected';

export function VerifyPaymentsClient() {
  const [tab, setTab] = useState<Tab>('under_review');
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const { confirm, prompt, dialog } = useDialog();

  const [version, setVersion] = useState(0);
  const load = useCallback(async (_t?: Tab) => setVersion(v => v + 1), []);

  useEffect(() => {
    let alive = true;
    api<{ orders: Order[]; counts: Record<string, number> }>(`/api/admin/orders?status=${tab}&limit=100`)
      .then(d => {
        if (!alive) return;
        setOrders(tab === 'under_review' ? [...d.orders].reverse() : d.orders);
        setCounts(d.counts);
      })
      .catch(err => {
        if (!alive) return;
        toast.error(errMsg(err));
        setOrders([]);
      });
    return () => {
      alive = false;
    };
  }, [tab, version]);

  const act = async (o: Order, action: 'approve' | 'reject', reason?: string) => {
    setBusy(o.id + action);
    try {
      await api(`/api/admin/orders/${o.id}`, { body: { action, reason } });
      toast.success(action === 'approve' ? `${o.orderNumber} approved. Deliver it from Orders.` : `${o.orderNumber} rejected, customer notified`);
      await load(tab);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(null);
    }
  };

  const approve = async (o: Order) => {
    const ok = await confirm({
      title: `Approve ${o.orderNumber}?`,
      message: `Confirm that ${formatMoney(o.total, o.currency)} arrived in your ${o.paymentMethodName || o.paymentMethod} account.`,
      confirmLabel: 'Approve payment',
    });
    if (ok) await act(o, 'approve');
  };

  const reject = async (o: Order) => {
    const reason = await prompt({
      title: `Reject ${o.orderNumber}?`,
      message: 'The customer receives this reason and can upload a new proof.',
      inputLabel: 'Reason the customer will see',
      placeholder: 'e.g. Transaction ID not found in our account',
      required: true,
      multiline: true,
      confirmLabel: 'Reject payment',
      danger: true,
    });
    if (reason) await act(o, 'reject', reason);
  };

  return (
    <div>
      <PageHeader
        kicker="Commerce"
        title="Verify payments"
        description="Check each screenshot and transaction ID against your bank, Easypaisa or JazzCash account, then approve or reject. Oldest first."
      />
      <div className="mb-4">
        <SegmentChips
          options={[
            { key: 'under_review' as Tab, label: 'Proof submitted', count: counts.under_review ?? 0 },
            { key: 'pending' as Tab, label: 'Awaiting payment', count: counts.pending ?? 0 },
            { key: 'rejected' as Tab, label: 'Rejected', count: counts.rejected ?? 0 },
          ]}
          value={tab}
          onChange={t => {
            setOrders(null);
            setTab(t);
          }}
        />
      </div>

      {orders === null ? (
        <LoadingBlock />
      ) : orders.length === 0 ? (
        <Card>
          <EmptyState
            icon={BadgeCheck}
            title={tab === 'under_review' ? 'No payment waiting for review' : 'Nothing here'}
            description={tab === 'under_review' ? 'New proofs appear here as soon as customers upload them. You also get an email and Telegram alert.' : undefined}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map(o => {
            const proof = o.paymentProofs?.[0];
            return (
              <Card key={o.id} bodyClassName="p-0">
                <div className="p-4 sm:p-5 grid gap-4 lg:grid-cols-[1fr_auto]">
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/orders/${o.orderNumber}`} className="font-mono font-extrabold text-charcoal hover:text-pista-dark">
                        {o.orderNumber}
                      </Link>
                      <OrderStatusBadge status={o.orderStatus} />
                      <span className="text-xs text-charcoal-subtle">placed {timeAgo(o.createdAt)}</span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3 text-sm">
                      <div>
                        <div className="text-[11px] text-charcoal-subtle font-semibold uppercase">Amount to receive</div>
                        <div className="text-lg font-extrabold whitespace-nowrap">{formatMoney(o.total, o.currency)}</div>
                        <div className="text-xs text-charcoal-muted">{o.paymentMethodName || o.paymentMethod}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] text-charcoal-subtle font-semibold uppercase">Transaction ID</div>
                        {proof ? (
                          <div className="flex items-center gap-1">
                            <code className="font-mono font-bold break-all">{proof.transactionId}</code>
                            <CopyButton value={proof.transactionId} label="Transaction ID" />
                          </div>
                        ) : (
                          <div className="text-charcoal-subtle">No proof yet</div>
                        )}
                        {proof?.senderName && <div className="text-xs text-charcoal-muted">From {proof.senderName}{proof.senderAccount ? ` · ${proof.senderAccount}` : ''}</div>}
                        {proof?.amount !== undefined && proof?.amount !== null && proof && (
                          <div className="text-xs">
                            Typed amount: <strong>{formatMoney(proof.amount, o.currency)}</strong>{' '}
                            {Math.abs(proof.amount - o.total) > 0.009 && <Badge tone="rose">Does not match</Badge>}
                          </div>
                        )}
                        {proof?.paymentDate && <div className="text-xs text-charcoal-muted">Paid on {proof.paymentDate}</div>}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] text-charcoal-subtle font-semibold uppercase">Customer</div>
                        <div className="font-semibold truncate">{o.customerName}</div>
                        <div className="text-xs text-charcoal-muted truncate">{o.customerEmail}</div>
                        <div className="text-xs text-charcoal-muted truncate">{o.items.map(i => `${i.productName} (${i.variantName})`).join(', ')}</div>
                      </div>
                    </div>
                    {proof && <div className="text-[11px] text-charcoal-subtle">Proof submitted {fmtDateTime(proof.createdAt)}</div>}
                    {o.statusReason && o.orderStatus === 'rejected' && <div className="text-xs text-accent-rose">Rejected: {o.statusReason}</div>}
                  </div>
                  {proof && proof.images.length > 0 && (
                    <div className="flex gap-2 flex-wrap lg:justify-end">
                      {proof.images.map((_, i) => {
                        const src = `/api/admin/payment-proofs/${proof.id}?i=${i}`;
                        return (
                          <button key={src} type="button" onClick={() => setLightbox(src)} className="w-28 h-28 rounded-xl border border-charcoal-border overflow-hidden bg-surface-bg hover:border-pista">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="px-4 sm:px-5 py-3 border-t border-surface-muted flex flex-wrap gap-2">
                  {o.orderStatus !== 'rejected' && (
                    <>
                      <Link href={`/admin/orders/${o.orderNumber}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pista text-charcoal text-xs font-bold hover:bg-pista-hover">
                        <Send className="w-3.5 h-3.5" /> Accept and send
                      </Link>
                      <Button size="sm" variant="secondary" icon={BadgeCheck} loading={busy === o.id + 'approve'} onClick={() => approve(o)}>
                        Approve only
                      </Button>
                      <Button size="sm" variant="outline-danger" icon={XCircle} loading={busy === o.id + 'reject'} onClick={() => reject(o)}>
                        Reject
                      </Button>
                    </>
                  )}
                  <Link href={`/admin/orders/${o.orderNumber}`} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-pista-dark hover:underline">
                    Open order <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={Boolean(lightbox)} onClose={() => setLightbox(null)} title="Payment screenshot" size="xl">
        {lightbox && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={lightbox} alt="Payment screenshot" className="w-full max-h-[75vh] object-contain rounded-xl bg-surface-bg" />
        )}
      </Modal>
      {dialog}
    </div>
  );
}
