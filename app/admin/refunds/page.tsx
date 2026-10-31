import React from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { formatMoney } from '@/lib/money';
import { RotateCcw } from 'lucide-react';
import { Card, EmptyState, PageHeader, Stat, Table } from '../_components/primitives';
import { fmtDateTime } from '../_components/format';
import { requireAdminPage } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminRefundsPage() {
  await requireAdminPage();
  const refunded = await db.getOrders({ status: 'refunded', limit: 200 });
  const totals = refunded.reduce(
    (acc, o) => {
      acc[o.currency] += o.total;
      return acc;
    },
    { PKR: 0, USD: 0 },
  );

  return (
    <AdminLayout>
      <PageHeader
        kicker="Operations"
        title="Refunds"
        description={
          <>
            Refunds are recorded on delivered orders only. Send the money back to the customer yourself, then open the order and choose <strong>Mark refunded</strong> with a reason.
          </>
        }
        actions={
          <Link href="/admin/orders?status=completed" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-charcoal-border bg-white font-bold text-sm hover:border-pista">
            Delivered orders
          </Link>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Stat label="Refunded orders" value={refunded.length} />
        <Stat label="Refunded in PKR" value={formatMoney(totals.PKR, 'PKR')} />
        <Stat label="Refunded in USD" value={formatMoney(totals.USD, 'USD')} />
      </div>
      <Card bodyClassName="p-0">
        {refunded.length === 0 ? (
          <EmptyState icon={RotateCcw} title="No refunds recorded" description="Refunded orders will be listed here with their reason." />
        ) : (
          <Table head={['Order', 'Customer', 'Amount', 'Reason', 'Refunded', '']}>
            {refunded.map(o => (
              <tr key={o.id} className="hover:bg-surface-bg/60">
                <td className="px-4 py-3 font-mono font-bold">{o.orderNumber}</td>
                <td className="px-4 py-3">
                  <div className="font-semibold">{o.customerName}</div>
                  <div className="text-xs text-charcoal-subtle">{o.customerEmail}</div>
                </td>
                <td className="px-4 py-3 font-bold whitespace-nowrap">{formatMoney(o.total, o.currency)}</td>
                <td className="px-4 py-3 text-xs text-charcoal-muted max-w-xs">{o.statusReason || '—'}</td>
                <td className="px-4 py-3 text-xs text-charcoal-subtle whitespace-nowrap">{fmtDateTime(o.refundedAt || o.updatedAt)}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/orders/${o.orderNumber}`} className="text-xs font-bold text-pista-dark hover:underline">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </AdminLayout>
  );
}
