'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BadgeCheck,
  Ban,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  KeyRound,
  Mail,
  MessageCircle,
  Package,
  RotateCcw,
  Send,
  User,
  XCircle,
} from 'lucide-react';
import type { DeliveryChannel, DeliveryField, InventoryItem, Order, OrderItem, PaymentProof } from '@/lib/db/types';
import { formatMoney } from '@/lib/money';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  CopyButton,
  EmptyState,
  KeyValue,
  LoadingBlock,
  Modal,
  OrderStatusBadge,
  Textarea,
  api,
  copyText,
  cx,
  errMsg,
  toast,
  useDialog,
} from '../../_components/ui';
import { KvBuilder, cleanRows, toRows, type KvRow } from '../../_components/kv-builder';
import { fmtDateTime, parseUserAgent } from '../../_components/format';

interface VaultLine {
  orderItem: OrderItem;
  required: number;
  available: InventoryItem[];
  fields: DeliveryField[][];
}

interface Detail {
  order: Order;
  vault: VaultLine[];
  proofImages: Record<string, string[]>;
  telegramLinked: boolean;
}

interface LineState {
  selected: string[];
  rows: KvRow[];
  instructions: string;
}

interface DeliverResult {
  emailSent: boolean;
  telegramSent: boolean;
  telegramAvailable: boolean;
  copyText: string;
  channels: DeliveryChannel[];
}

function waLink(phone: string | undefined, text: string): string | null {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length < 8) return null;
  const intl = digits.startsWith('0') ? `92${digits.slice(1)}` : digits;
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
}

export function OrderDetailClient({ orderRef }: { orderRef: string }) {
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [showDelivery, setShowDelivery] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [result, setResult] = useState<DeliverResult | null>(null);
  const { confirm, prompt, dialog } = useDialog();

  const [version, setVersion] = useState(0);
  const load = useCallback(async () => setVersion(v => v + 1), []);

  useEffect(() => {
    let alive = true;
    api<Detail>(`/api/admin/orders/${encodeURIComponent(orderRef)}`)
      .then(d => {
        if (!alive) return;
        setData(d);
        setNote(d.order.adminNote || '');
        if (d.order.orderStatus === 'processing') setShowDelivery(true);
      })
      .catch(err => {
        if (!alive) return;
        if ((err as { status?: number }).status === 404) setNotFound(true);
        else toast.error(errMsg(err));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [orderRef, version]);

  const act = async (action: string, body: Record<string, unknown> = {}, okMsg?: string) => {
    setBusy(action);
    try {
      await api(`/api/admin/orders/${encodeURIComponent(orderRef)}`, { body: { action, ...body } });
      if (okMsg) toast.success(okMsg);
      await load();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <LoadingBlock />;
  if (notFound || !data) {
    return (
      <Card>
        <EmptyState icon={Package} title="Order not found" action={<Link href="/admin/orders" className="text-sm font-bold text-pista-dark hover:underline">Back to orders</Link>} />
      </Card>
    );
  }

  const { order, vault, proofImages, telegramLinked } = data;
  const s = order.orderStatus;
  const canReview = s === 'pending' || s === 'under_review' || s === 'rejected';
  const latestProof = order.paymentProofs?.[0];
  const ua = parseUserAgent(order.userAgent);

  const approve = async () => {
    const ok = await confirm({
      title: 'Approve this payment?',
      message:
        s === 'under_review'
          ? `Confirm that ${formatMoney(order.total, order.currency)} arrived in your account. The customer is told the payment is approved; you deliver next.`
          : `No payment proof is under review for this order. Approve only if you have confirmed ${formatMoney(order.total, order.currency)} in your account.`,
      confirmLabel: 'Approve payment',
    });
    if (ok) await act('approve', {}, 'Payment approved. Deliver the order next.');
  };

  const reject = async () => {
    const reason = await prompt({
      title: 'Reject this payment?',
      message: 'The customer receives this reason by email (and Telegram if linked) and can upload a new proof.',
      inputLabel: 'Reason the customer will see',
      placeholder: 'e.g. The amount received does not match the order total',
      required: true,
      multiline: true,
      confirmLabel: 'Reject payment',
      danger: true,
    });
    if (reason) await act('reject', { reason }, 'Payment rejected and the customer was notified');
  };

  const cancel = async () => {
    const reason = await prompt({
      title: 'Cancel this order?',
      message: 'Any coupon use is released. This cannot be undone.',
      inputLabel: 'Reason (optional)',
      confirmLabel: 'Cancel order',
      danger: true,
    });
    if (reason !== null) await act('cancel', { reason }, 'Order cancelled');
  };

  const refund = async () => {
    const reason = await prompt({
      title: 'Mark this order as refunded?',
      message: `Record that you returned ${formatMoney(order.total, order.currency)} to the customer. Send the money yourself first.${
        s === 'processing' ? ' The order closes without delivery and any coupon use is released.' : ''
      }`,
      inputLabel: 'Refund reason',
      required: true,
      multiline: true,
      confirmLabel: 'Mark refunded',
      danger: true,
    });
    if (reason) await act('refund', { reason }, 'Order marked as refunded');
  };

  return (
    <div>
      <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-xs font-bold text-pista-dark hover:underline mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> All orders
      </Link>

      {/* Header */}
      <div className="bg-white border border-charcoal-border rounded-2xl p-5 mb-6 flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold font-mono text-charcoal">{order.orderNumber}</h1>
            <CopyButton value={order.orderNumber} label="Order ID" />
            <OrderStatusBadge status={s} />
          </div>
          <p className="text-xs text-charcoal-subtle mt-1">
            Placed {fmtDateTime(order.createdAt)} · {order.paymentMethodName || order.paymentMethod}
            {order.statusReason ? ` · ${order.statusReason}` : ''}
          </p>
        </div>
        <div className="text-left lg:text-right">
          <div className="text-[11px] text-charcoal-subtle font-semibold uppercase">Order total</div>
          <div className="text-2xl font-extrabold whitespace-nowrap">{formatMoney(order.total, order.currency)}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        {canReview && (
          <>
            <Button icon={Send} onClick={() => setShowDelivery(true)}>
              Accept and send
            </Button>
            <Button variant="secondary" icon={BadgeCheck} loading={busy === 'approve'} onClick={approve}>
              Approve only
            </Button>
            {s !== 'rejected' && (
              <Button variant="outline-danger" icon={XCircle} loading={busy === 'reject'} onClick={reject}>
                Reject payment
              </Button>
            )}
            <Button variant="ghost" icon={Ban} loading={busy === 'cancel'} onClick={cancel}>
              Cancel order
            </Button>
          </>
        )}
        {s === 'processing' && (
          <>
            {!showDelivery && (
              <Button icon={Send} onClick={() => setShowDelivery(true)}>
                Deliver order
              </Button>
            )}
            <Button variant="outline-danger" icon={RotateCcw} loading={busy === 'refund'} onClick={refund}>
              Can&apos;t deliver: mark refunded
            </Button>
          </>
        )}
        {s === 'completed' && (
          <>
            <Button variant="secondary" icon={Send} onClick={() => setShowDelivery(v => !v)}>
              {showDelivery ? 'Hide re-send' : 'Re-send delivery'}
            </Button>
            <Button variant="outline-danger" icon={RotateCcw} loading={busy === 'refund'} onClick={refund}>
              Mark refunded
            </Button>
          </>
        )}
      </div>

      {result && (
        <DeliveryResultCard result={result} order={order} onClose={() => setResult(null)} />
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6 min-w-0">
          {showDelivery && (s === 'processing' || s === 'completed' || canReview) && (
            <DeliveryPanel
              key={`${order.id}-${order.updatedAt}`}
              order={order}
              vault={vault}
              telegramLinked={telegramLinked}
              onCancel={() => setShowDelivery(false)}
              onDelivered={async r => {
                setResult(r);
                setShowDelivery(false);
                await load();
              }}
              confirm={confirm}
            />
          )}

          <Card title={<span className="flex items-center gap-2"><Package className="w-4 h-4 text-pista-dark" />Items</span>} bodyClassName="p-0">
            <div className="divide-y divide-surface-muted">
              {order.items.map(item => (
                <div key={item.id} className="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-pista-lighter flex items-center justify-center overflow-hidden shrink-0">
                      {item.productImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.productImage} alt="" className="w-full h-full object-contain p-1" />
                      ) : (
                        <span className="font-extrabold text-pista-dark">{item.productName.charAt(0)}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-charcoal">{item.productName}</div>
                      <div className="text-xs text-charcoal-subtle">
                        {item.variantName} · {formatMoney(item.price, order.currency)} × {item.quantity}
                      </div>
                    </div>
                    <div className="font-bold whitespace-nowrap">{formatMoney(item.price * item.quantity, order.currency)}</div>
                  </div>
                  {item.fulfillmentData?.fields?.length ? (
                    <div className="mt-3 rounded-xl border border-pista-light bg-pista-50 p-3">
                      <div className="text-[11px] font-bold text-pista-darker uppercase mb-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Delivered {fmtDateTime(item.deliveredAt)}
                      </div>
                      {item.fulfillmentData.fields.map((f, i) => (
                        <KeyValue key={i} label={f.label} value={f.value} copy={f.value} mono />
                      ))}
                      {item.fulfillmentData.instructions && <p className="text-xs text-charcoal-muted mt-1 whitespace-pre-wrap">{item.fulfillmentData.instructions}</p>}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </Card>

          <Card
            title={<span className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-pista-dark" />Payment</span>}
            description={`Customer must transfer exactly ${formatMoney(order.total, order.currency)} via ${order.paymentMethodName || order.paymentMethod}.`}
            bodyClassName="p-0"
          >
            {!order.paymentProofs?.length ? (
              <EmptyState icon={Clock} title="No payment proof yet" description="The order stays Awaiting payment until the customer uploads a screenshot and transaction ID." />
            ) : (
              <div className="divide-y divide-surface-muted">
                {order.paymentProofs.map((p, idx) => (
                  <ProofBlock key={p.id} proof={p} images={proofImages[p.id] || []} currency={order.currency} latest={idx === 0} onOpen={setLightbox} />
                ))}
              </div>
            )}
          </Card>

          <Card title="Timeline">
            <ol className="relative border-l-2 border-pista-light ml-2 space-y-4">
              {[...order.timeline].reverse().map((ev, i) => (
                <li key={i} className="ml-4">
                  <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-pista border-2 border-white" />
                  <div className="text-sm font-bold text-charcoal">{ev.status}</div>
                  <div className="text-xs text-charcoal-muted whitespace-pre-wrap">{ev.note}</div>
                  <div className="text-[11px] text-charcoal-subtle">
                    {fmtDateTime(ev.timestamp)}
                    {ev.actor ? ` · ${ev.actor}` : ''}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6 min-w-0">
          <Card
            title={<span className="flex items-center gap-2"><User className="w-4 h-4 text-pista-dark" />Customer</span>}
            actions={order.customerId ? <Link href={`/admin/customers/${order.customerId}`} className="text-xs font-bold text-pista-dark hover:underline">Profile</Link> : <Badge tone="gray">Guest</Badge>}
          >
            <KeyValue label="Name" value={order.customerName} />
            <KeyValue label="Email" value={order.customerEmail} copy={order.customerEmail} />
            <KeyValue label="Phone" value={order.customerPhone} copy={order.customerPhone} />
            <KeyValue
              label="WhatsApp"
              value={
                order.customerWhatsapp ? (
                  <a href={waLink(order.customerWhatsapp, '') || '#'} target="_blank" rel="noopener noreferrer" className="text-pista-dark hover:underline">
                    {order.customerWhatsapp}
                  </a>
                ) : undefined
              }
              copy={order.customerWhatsapp}
            />
            <KeyValue label="Telegram" value={order.customerTelegram} copy={order.customerTelegram} />
            <KeyValue label="Bot linked" value={telegramLinked ? 'Yes, can receive delivery' : 'No'} />
            {order.customerNote && <KeyValue label="Customer note" value={order.customerNote} />}
          </Card>

          <Card title="Totals">
            <KeyValue label="Subtotal" value={formatMoney(order.subtotal, order.currency)} />
            {order.discount > 0 && <KeyValue label={`Discount${order.couponCode ? ` (${order.couponCode})` : ''}`} value={`− ${formatMoney(order.discount, order.currency)}`} />}
            {order.tax > 0 && <KeyValue label="Tax" value={formatMoney(order.tax, order.currency)} />}
            <KeyValue label="Total" value={formatMoney(order.total, order.currency)} />
            {order.currency === 'USD' && order.fxRate ? (
              <p className="text-[11px] text-charcoal-subtle mt-2">
                Internal: rate {order.fxRate.toFixed(2)} PKR per USD, about {formatMoney(order.totalPkr, 'PKR')}. Customers never see this.
              </p>
            ) : null}
          </Card>

          <Card title="Admin note" description="Private. Customers never see it.">
            <Textarea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Paid from brother's account, confirmed on call" />
            <Button size="sm" className="mt-2" loading={busy === 'note'} disabled={note === (order.adminNote || '')} onClick={() => act('note', { adminNote: note }, 'Note saved')}>
              Save note
            </Button>
          </Card>

          <Card title="Checkout device">
            <KeyValue label="IP address" value={order.ip} copy={order.ip} mono />
            <KeyValue label="Device" value={ua ? `${ua.device} · ${ua.os} · ${ua.browser}` : undefined} />
            <KeyValue label="Delivered via" value={order.deliveryChannels?.length && order.deliveredAt ? order.deliveryChannels.join(', ') : undefined} />
            <KeyValue label="Approved" value={order.approvedAt ? fmtDateTime(order.approvedAt) : undefined} />
            <KeyValue label="Delivered" value={order.deliveredAt ? fmtDateTime(order.deliveredAt) : undefined} />
            {latestProof && <KeyValue label="Latest proof" value={fmtDateTime(latestProof.createdAt)} />}
          </Card>
        </div>
      </div>

      <Modal open={Boolean(lightbox)} onClose={() => setLightbox(null)} title="Payment screenshot" size="xl">
        {lightbox && (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox} alt="Payment screenshot" className="w-full max-h-[70vh] object-contain rounded-xl bg-surface-bg" />
            <a href={lightbox} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-pista-dark hover:underline">
              Open full size <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </Modal>
      {dialog}
    </div>
  );
}

function ProofBlock({ proof, images, currency, latest, onOpen }: { proof: PaymentProof; images: string[]; currency: Order['currency']; latest: boolean; onOpen: (url: string) => void }) {
  const tone = proof.status === 'accepted' ? 'green' : proof.status === 'rejected' ? 'rose' : 'amber';
  const label = proof.status === 'accepted' ? 'Accepted' : proof.status === 'rejected' ? 'Rejected' : 'Waiting for review';
  return (
    <div className={cx('p-4 sm:p-5', !latest && 'opacity-75')}>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Badge tone={tone}>{label}</Badge>
        <span className="text-xs text-charcoal-subtle">Submitted {fmtDateTime(proof.createdAt)}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <KeyValue label="Transaction ID" value={proof.transactionId} copy={proof.transactionId} mono />
          <KeyValue label="Sender name" value={proof.senderName} />
          <KeyValue label="Sender account" value={proof.senderAccount} copy={proof.senderAccount} mono />
          <KeyValue label="Amount paid (typed)" value={proof.amount !== undefined && proof.amount !== null ? formatMoney(proof.amount, currency) : undefined} />
          <KeyValue label="Payment date" value={proof.paymentDate} />
          {proof.rejectReason && <KeyValue label="Reject reason" value={proof.rejectReason} />}
        </div>
        <div className="flex sm:flex-col gap-2 flex-wrap">
          {images.map((src, i) => (
            <button key={src} type="button" onClick={() => onOpen(src)} className="w-28 h-28 rounded-xl border border-charcoal-border overflow-hidden bg-surface-bg hover:border-pista" title={`Screenshot ${i + 1}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DeliveryResultCard({ result, order, onClose }: { result: DeliverResult; order: Order; onClose: () => void }) {
  const wa = waLink(order.customerWhatsapp, result.copyText);
  return (
    <div className="mb-6 rounded-2xl border border-pista bg-pista-lighter p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="font-bold text-pista-darker flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" /> Delivery saved
        </div>
        <button onClick={onClose} className="text-xs font-bold text-charcoal-subtle hover:text-charcoal">
          Close
        </button>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {result.channels.includes('email') && <Badge tone={result.emailSent ? 'green' : 'rose'}><Mail className="w-3 h-3" />{result.emailSent ? 'Email sent' : 'Email failed (check Resend)'}</Badge>}
        {result.channels.includes('telegram') && <Badge tone={result.telegramSent ? 'green' : 'rose'}><MessageCircle className="w-3 h-3" />{result.telegramSent ? 'Telegram sent' : 'Telegram failed'}</Badge>}
        {result.channels.includes('whatsapp') && <Badge tone="blue">WhatsApp: copy below</Badge>}
      </div>
      <Textarea readOnly rows={7} value={result.copyText} className="font-mono text-xs bg-white" />
      <div className="flex flex-wrap gap-2">
        <Button icon={Copy} onClick={() => copyText(result.copyText, 'Delivery text copied for WhatsApp')}>
          Copy for WhatsApp
        </Button>
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-charcoal-border bg-white text-sm font-bold hover:border-pista">
            <MessageCircle className="w-4 h-4" /> Open WhatsApp chat
          </a>
        )}
      </div>
    </div>
  );
}

function DeliveryPanel({
  order,
  vault,
  telegramLinked,
  onCancel,
  onDelivered,
  confirm,
}: {
  order: Order;
  vault: VaultLine[];
  telegramLinked: boolean;
  onCancel: () => void;
  onDelivered: (r: DeliverResult) => Promise<void>;
  confirm: (o: { title: string; message?: React.ReactNode; confirmLabel?: string; danger?: boolean }) => Promise<boolean>;
}) {
  const resend = order.orderStatus === 'completed';
  const vaultByItem = useMemo(() => new Map(vault.map(v => [v.orderItem.id, v])), [vault]);

  const [lines, setLines] = useState<Record<string, LineState>>(() => {
    const init: Record<string, LineState> = {};
    for (const item of order.items) {
      const v = vaultByItem.get(item.id);
      const previous = item.fulfillmentData?.fields;
      if (resend && previous?.length) {
        init[item.id] = { selected: [], rows: toRows(previous), instructions: item.fulfillmentData?.instructions || '' };
      } else if (v && v.available.length >= item.quantity) {
        init[item.id] = { selected: v.available.slice(0, item.quantity).map(a => a.id), rows: [], instructions: '' };
      } else {
        init[item.id] = { selected: [], rows: [{ label: 'Email', value: '' }, { label: 'Password', value: '' }], instructions: '' };
      }
    }
    return init;
  });
  const [note, setNote] = useState('');
  const [channels, setChannels] = useState<Record<DeliveryChannel, boolean>>({
    email: true,
    telegram: telegramLinked,
    whatsapp: Boolean(order.customerWhatsapp),
    account: true,
  });
  const [sending, setSending] = useState(false);

  const setLine = (id: string, patch: Partial<LineState>) => setLines(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const toggleVault = (item: OrderItem, invId: string) => {
    const cur = lines[item.id].selected;
    if (cur.includes(invId)) setLine(item.id, { selected: cur.filter(x => x !== invId) });
    else setLine(item.id, { selected: [...cur, invId] });
  };

  const problems: string[] = [];
  for (const item of order.items) {
    const l = lines[item.id];
    const fields = cleanRows(l.rows);
    if (l.selected.length === 0 && fields.length === 0) problems.push(`${item.productName}: pick a vault item or type at least one detail`);
    if (l.selected.length > item.quantity) problems.push(`${item.productName}: select at most ${item.quantity} vault item(s)`);
    if (l.rows.some(r => r.label.trim() && !r.value.trim())) problems.push(`${item.productName}: fill or remove empty fields`);
  }

  const submit = async () => {
    if (problems.length) return toast.error(problems[0]);
    const chosen = (Object.keys(channels) as DeliveryChannel[]).filter(c => channels[c] && c !== 'account');
    const vaultCount = Object.values(lines).reduce((n, l) => n + l.selected.length, 0);
    const ok = await confirm({
      title: resend ? 'Re-send this delivery?' : order.orderStatus === 'processing' ? 'Deliver this order?' : 'Approve payment and deliver?',
      message: (
        <div className="space-y-2">
          {order.orderStatus !== 'processing' && !resend && <p>The payment is approved first, then the access is delivered.</p>}
          {vaultCount > 0 && <p>{vaultCount} vault item(s) will be marked as used and linked to this order. They can never be assigned again.</p>}
          <p>Channels: {chosen.length ? chosen.join(', ') : 'order page only'}. The customer can always see it on their order page.</p>
        </div>
      ),
      confirmLabel: resend ? 'Re-send' : 'Deliver now',
    });
    if (!ok) return;
    setSending(true);
    try {
      const res = await api<Omit<DeliverResult, 'channels'>>(`/api/admin/orders/${encodeURIComponent(order.id)}`, {
        body: {
          action: 'deliver',
          channels: [...chosen, 'account'],
          note,
          lines: order.items.map(item => ({
            orderItemId: item.id,
            inventoryItemIds: lines[item.id].selected,
            fields: cleanRows(lines[item.id].rows),
            instructions: lines[item.id].instructions,
          })),
        },
      });
      toast.success(resend ? 'Delivery re-sent' : 'Order delivered');
      await onDelivered({ ...res, channels: chosen });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <Card
      title={<span className="flex items-center gap-2"><Send className="w-4 h-4 text-pista-dark" />{resend ? 'Re-send delivery' : 'Deliver access'}</span>}
      description={resend ? 'Edit the details if needed and send them again. Vault items already used stay linked.' : 'Use vault stock when available, or type the details as heading and value pairs.'}
      className="border-pista"
    >
      <div className="space-y-6">
        {order.items.map(item => {
          const v = vaultByItem.get(item.id);
          const l = lines[item.id];
          return (
            <div key={item.id} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-bold text-charcoal">
                  {item.productName} <span className="text-charcoal-subtle font-semibold">· {item.variantName} × {item.quantity}</span>
                </div>
                {v && !resend && (
                  <Badge tone={v.available.length >= item.quantity ? 'green' : v.available.length ? 'amber' : 'gray'}>
                    <KeyRound className="w-3 h-3" />
                    {v.available.length} in vault
                  </Badge>
                )}
              </div>

              {!resend && v && v.available.length > 0 && (
                <div className="rounded-xl border border-charcoal-border overflow-hidden">
                  <div className="px-3 py-2 bg-surface-bg text-[11px] font-bold text-charcoal-subtle uppercase">
                    Vault items to assign ({l.selected.length} of {item.quantity} selected, oldest first)
                  </div>
                  <div className="divide-y divide-surface-muted max-h-64 overflow-y-auto">
                    {v.available.map((inv, i) => {
                      const on = l.selected.includes(inv.id);
                      return (
                        <label key={inv.id} className={cx('flex items-start gap-3 px-3 py-2.5 cursor-pointer', on ? 'bg-pista-50' : 'hover:bg-surface-bg')}>
                          <Checkbox checked={on} onChange={() => toggleVault(item, inv.id)} />
                          <div className="min-w-0 flex-1 text-xs">
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                              {(v.fields[i] || []).map((f, j) => (
                                <span key={j}>
                                  <span className="text-charcoal-subtle">{f.label}:</span> <span className="font-mono font-semibold text-charcoal break-all">{f.value}</span>
                                </span>
                              ))}
                            </div>
                            <div className="text-[10px] text-charcoal-subtle mt-0.5">Added {fmtDateTime(inv.createdAt)} · {inv.variantId ? 'this plan' : 'any plan of this product'}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
              {!resend && v && v.available.length === 0 && (
                <p className="text-xs text-charcoal-subtle">The vault has no unused item for this plan. Type the access details below.</p>
              )}

              <div>
                <div className="text-xs font-bold text-charcoal mb-2">{l.selected.length ? 'Extra details (optional)' : 'Access details'}</div>
                <KvBuilder rows={l.rows} onChange={rows => setLine(item.id, { rows })} />
              </div>
              <Textarea
                rows={2}
                value={l.instructions}
                onChange={e => setLine(item.id, { instructions: e.target.value })}
                placeholder="Instructions for this item (optional), e.g. Sign in on the TV app, do not change the password"
              />
            </div>
          );
        })}

        <div className="space-y-2">
          <div className="text-xs font-bold text-charcoal">Note to the customer (optional)</div>
          <Textarea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Thank you for your order. Message us on WhatsApp if anything does not work." />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold text-charcoal">Send by</div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Checkbox checked={channels.email} onChange={v => setChannels({ ...channels, email: v })} label={`Email (${order.customerEmail})`} />
            <Checkbox
              checked={channels.telegram}
              disabled={!telegramLinked}
              onChange={v => setChannels({ ...channels, telegram: v })}
              label={telegramLinked ? 'Telegram bot' : 'Telegram (customer has not linked the bot)'}
            />
            <Checkbox checked={channels.whatsapp} onChange={v => setChannels({ ...channels, whatsapp: v })} label="WhatsApp (copy text after sending)" />
          </div>
          <p className="text-[11px] text-charcoal-subtle">The details are always shown privately on the customer&apos;s order page as well.</p>
        </div>

        {problems.length > 0 && <p className="text-xs font-semibold text-accent-amber">{problems[0]}</p>}

        <div className="flex flex-wrap gap-2 pt-2 border-t border-surface-muted">
          <Button icon={Send} loading={sending} onClick={submit}>
            {resend ? 'Re-send delivery' : order.orderStatus === 'processing' ? 'Deliver now' : 'Approve and deliver'}
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            Close
          </Button>
        </div>
      </div>
    </Card>
  );
}
