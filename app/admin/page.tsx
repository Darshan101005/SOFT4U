import React from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { formatMoney } from '@/lib/money';
import { ArrowRight, BadgeCheck, Boxes, Coins, KeyRound, LifeBuoy, Package, Send, Users, AlertTriangle } from 'lucide-react';
import { Card, EmptyState, OrderStatusBadge, PageHeader, Stat } from './_components/primitives';
import { fmtDateTime } from './_components/format';
import { requireAdminPage } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  await requireAdminPage();
  const [analytics, products, reviewQueue] = await Promise.all([
    db.getAnalyticsSummary(),
    db.getProducts(),
    db.getOrders({ status: ['under_review', 'processing'], limit: 8 }),
  ]);

  const lowVault = products
    .filter(p => p.status === 'active')
    .flatMap(p => p.variants.filter(v => v.status === 'active' && v.stockMode === 'vault' && v.stock <= 2).map(v => ({ product: p, variant: v })))
    .slice(0, 8);

  const maxRevenue = Math.max(1, ...analytics.monthlyData.map(m => m.revenue));
  const c = analytics.statusCounts;

  return (
    <AdminLayout>
      <PageHeader
        kicker="Commerce"
        title="Dashboard"
        description="Live figures from your orders, customers and vault. Revenue counts delivered orders, in PKR at the rate locked on each order."
        actions={
          <>
            <Link href="/admin/verify-payments" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pista text-charcoal font-bold text-sm hover:bg-pista-hover">
              <BadgeCheck className="w-4 h-4" /> Verify payments
            </Link>
            <Link href="/admin/products/new" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-charcoal-border bg-white font-bold text-sm hover:border-pista">
              Add product
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Revenue (delivered)" value={formatMoney(analytics.totalRevenue, 'PKR')} hint={`${analytics.completedOrders} delivered orders`} icon={Coins} />
        <Stat label="Orders" value={analytics.totalOrders} hint={`Average ${formatMoney(analytics.avgOrderValue, 'PKR')}`} icon={Package} href="/admin/orders" />
        <Stat
          label="Payments to verify"
          value={c.under_review}
          hint={`${c.pending} awaiting payment`}
          icon={BadgeCheck}
          href="/admin/verify-payments"
          tone={c.under_review > 0 ? 'attention' : 'default'}
        />
        <Stat label="Approved, to deliver" value={c.processing} hint="Send access to the customer" icon={Send} href="/admin/orders?status=processing" tone={c.processing > 0 ? 'attention' : 'default'} />
        <Stat label="Customers" value={analytics.totalCustomers} hint="Registered accounts" icon={Users} href="/admin/customers" />
        <Stat label="Active products" value={analytics.activeProducts} hint={`${products.length} in catalogue`} icon={Boxes} href="/admin/products" />
        <Stat label="Vault items available" value={analytics.availableInventory} hint="Ready to deliver" icon={KeyRound} href="/admin/inventory" />
        <Stat label="Open tickets" value={analytics.openTickets} hint="Open or pending" icon={LifeBuoy} href="/admin/support" tone={analytics.openTickets > 0 ? 'attention' : 'default'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-12 mb-6">
        <Card className="lg:col-span-7" title="Revenue, last 6 months" description="Delivered orders only (PKR).">
          {analytics.monthlyData.length === 0 ? (
            <EmptyState icon={Coins} title="No orders yet" description="Monthly revenue appears here once orders come in." />
          ) : (
            <div className="h-56 flex items-end gap-3 pt-4">
              {analytics.monthlyData.map(m => (
                <div key={m.month} className="flex-1 h-full flex flex-col justify-end items-center gap-2 min-w-0">
                  <div className="text-[10px] font-mono text-charcoal-subtle whitespace-nowrap">{m.revenue > 0 ? formatMoney(m.revenue, 'PKR').replace('PKR ', '') : '0'}</div>
                  <div className="w-full rounded-t-lg bg-pista hover:bg-pista-hover transition-colors" style={{ height: `${Math.max(2, Math.round((m.revenue / maxRevenue) * 100))}%` }} />
                  <div className="text-xs font-bold text-charcoal">{m.month}</div>
                  <div className="text-[10px] text-charcoal-subtle">{m.orders} orders</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-5" title="Order pipeline">
          <div className="space-y-2 text-sm">
            {(
              [
                ['pending', 'Awaiting payment'],
                ['under_review', 'Payment under review'],
                ['processing', 'Approved, to deliver'],
                ['completed', 'Delivered'],
                ['rejected', 'Payment rejected'],
                ['cancelled', 'Cancelled'],
                ['refunded', 'Refunded'],
              ] as const
            ).map(([key, label]) => (
              <Link key={key} href={`/admin/orders?status=${key}`} className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-bg hover:bg-pista-lighter">
                <span className="font-semibold text-charcoal">{label}</span>
                <span className="font-mono font-bold text-charcoal">{c[key]}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card
          className="lg:col-span-7"
          title="Needs your action"
          description="Payments to verify and approved orders waiting for delivery."
          actions={
            <Link href="/admin/orders" className="text-xs font-bold text-pista-dark hover:underline inline-flex items-center gap-1">
              All orders <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
          bodyClassName="p-0"
        >
          {reviewQueue.length === 0 ? (
            <EmptyState icon={BadgeCheck} title="All caught up" description="No payment is waiting for review and every approved order is delivered." />
          ) : (
            <div className="divide-y divide-surface-muted">
              {reviewQueue.map(o => (
                <Link key={o.id} href={`/admin/orders/${o.orderNumber}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-bg">
                  <div className="min-w-0 flex-1">
                    <div className="font-mono font-bold text-sm text-charcoal">{o.orderNumber}</div>
                    <div className="text-xs text-charcoal-subtle truncate">
                      {o.customerName} · {o.items.map(i => i.productName).join(', ')}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-sm whitespace-nowrap">{formatMoney(o.total, o.currency)}</div>
                    <OrderStatusBadge status={o.orderStatus} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <div className="lg:col-span-5 space-y-6">
          <Card title="Recent orders" bodyClassName="p-0">
            {analytics.recentOrders.length === 0 ? (
              <EmptyState icon={Package} title="No orders yet" />
            ) : (
              <div className="divide-y divide-surface-muted">
                {analytics.recentOrders.map(o => (
                  <Link key={o.id} href={`/admin/orders/${o.orderNumber}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-bg">
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-bold">{o.orderNumber}</div>
                      <div className="text-[11px] text-charcoal-subtle">{fmtDateTime(o.createdAt)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold whitespace-nowrap">{formatMoney(o.total, o.currency)}</div>
                      <OrderStatusBadge status={o.orderStatus} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card title={<span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-accent-amber" />Vault running low</span>} description="Vault-stock plans with 2 or fewer items left." bodyClassName="p-0">
            {lowVault.length === 0 ? (
              <p className="px-5 py-4 text-xs text-charcoal-subtle">No vault plan is running low.</p>
            ) : (
              <div className="divide-y divide-surface-muted">
                {lowVault.map(({ product, variant }) => (
                  <Link key={variant.id} href={`/admin/inventory?productId=${product.id}`} className="flex items-center justify-between px-5 py-2.5 hover:bg-surface-bg text-sm">
                    <span className="truncate">
                      {product.name} <span className="text-charcoal-subtle">· {variant.name}</span>
                    </span>
                    <span className={`font-mono font-bold ${variant.stock === 0 ? 'text-accent-rose' : 'text-accent-amber'}`}>{variant.stock} left</span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
