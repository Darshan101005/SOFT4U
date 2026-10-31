'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Package } from 'lucide-react';
import type { Order } from '@/lib/db/types';
import { formatMoney } from '@/lib/money';
import { Card, EmptyState, LoadingBlock, OrderStatusBadge, PageHeader, Pager, SearchInput, SegmentChips, Table, api, errMsg, toast } from '../_components/ui';
import { fmtDateTime } from '../_components/format';
import { formatPersonName } from '@/lib/format-name';

type StatusKey = 'all' | Order['orderStatus'];

const SEGMENTS: Array<{ key: StatusKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Awaiting payment' },
  { key: 'under_review', label: 'Under review' },
  { key: 'processing', label: 'To deliver' },
  { key: 'completed', label: 'Delivered' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'refunded', label: 'Refunded' },
];

export function AdminOrdersClient({ initialStatus, initialSearch }: { initialStatus: string; initialSearch: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<StatusKey>((SEGMENTS.find(s => s.key === initialStatus)?.key || 'all') as StatusKey);
  const [search, setSearch] = useState(initialSearch);
  const [debounced, setDebounced] = useState(initialSearch);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ orders: Order[]; total: number; limit: number; counts: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let alive = true;
    const params = new URLSearchParams({ status, page: String(page), limit: '25' });
    if (debounced) params.set('search', debounced);
    api<{ orders: Order[]; total: number; limit: number; counts: Record<string, number> }>(`/api/admin/orders?${params}`)
      .then(d => {
        if (alive) setData(d);
      })
      .catch(err => toast.error(errMsg(err)))
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [status, page, debounced]);

  const counts = data?.counts || {};
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div>
      <PageHeader kicker="Commerce" title="Orders" description="Every order with its payment and delivery state. Open an order to verify payment, deliver access or refund." />

      <div className="flex flex-col gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={v => {
            setSearch(v);
            setPage(1);
            setLoading(true);
          }}
          placeholder="Search order ID, customer name, email or WhatsApp"
          className="max-w-md"
        />
        <SegmentChips
          options={SEGMENTS.map(s => ({ ...s, count: s.key === 'all' ? total : counts[s.key] ?? 0 }))}
          value={status}
          onChange={k => {
            setStatus(k);
            setPage(1);
            setLoading(true);
          }}
        />
      </div>

      <Card bodyClassName="p-0">
        {loading && !data ? (
          <LoadingBlock />
        ) : !data || data.orders.length === 0 ? (
          <EmptyState icon={Package} title="No orders here" description={debounced ? 'Try another search.' : 'Orders appear here as soon as customers check out.'} />
        ) : (
          <>
            <div className={loading ? 'opacity-60 transition-opacity' : ''}>
              <Table head={['Order', 'Customer', 'Items', 'Total', 'Method', 'Status', 'Placed', '']}>
                {data.orders.map(o => (
                  <tr key={o.id} onClick={() => router.push(`/admin/orders/${o.orderNumber}`)} className="hover:bg-surface-bg/60 cursor-pointer">
                    <td className="px-4 py-3 font-mono font-bold whitespace-nowrap">{o.orderNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-charcoal">{formatPersonName(o.customerName)}</div>
                      <div className="text-xs text-charcoal-subtle">{o.customerEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-charcoal-muted max-w-[240px]">
                      <div className="truncate">{o.items.map(i => `${i.productName} (${i.variantName})${i.quantity > 1 ? ` ×${i.quantity}` : ''}`).join(', ')}</div>
                    </td>
                    <td className="px-4 py-3 font-bold whitespace-nowrap">{formatMoney(o.total, o.currency)}</td>
                    <td className="px-4 py-3 text-xs text-charcoal-muted whitespace-nowrap">{o.paymentMethodName || o.paymentMethod}</td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={o.orderStatus} />
                    </td>
                    <td className="px-4 py-3 text-xs text-charcoal-subtle whitespace-nowrap">{fmtDateTime(o.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/orders/${o.orderNumber}`} className="inline-flex text-charcoal-subtle hover:text-pista-dark" aria-label="Open order">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </Table>
            </div>
            <Pager
              page={page}
              pages={pages}
              total={data.total}
              noun="orders"
              onPage={p => {
                setPage(p);
                setLoading(true);
              }}
            />
          </>
        )}
      </Card>
    </div>
  );
}
