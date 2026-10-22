import React from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import {
  DollarSign,
  Package,
  Boxes,
  Users,
  Key,
  LifeBuoy,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Zap,
  CheckCircle2
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const analytics = await db.getAnalyticsSummary();
  const products = await db.getProducts();
  const lowInventoryProducts = products.filter(p => {
    const totalStock = p.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
    return totalStock < 20;
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">
              EXECUTIVE OVERVIEW
            </div>
            <h1 className="text-3xl font-extrabold text-charcoal">Commerce Dashboard</h1>
            <p className="text-xs text-charcoal-subtle mt-0.5">
              Live revenue telemetry, automated digital fulfillment tracking, and system health.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/products/new"
              className="px-4 py-2 bg-pista text-charcoal hover:bg-pista-hover text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              + Create Product
            </Link>
            <Link
              href="/admin/homepage"
              className="px-4 py-2 bg-pista-dark text-white hover:bg-pista-darker text-xs font-semibold rounded-lg transition-colors"
            >
              Edit Homepage CMS
            </Link>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white border border-charcoal-border rounded-2xl shadow-xs space-y-2">
            <div className="flex items-center justify-between text-charcoal-subtle text-xs">
              <span>Gross Revenue</span>
              <DollarSign className="w-4 h-4 text-pista-dark" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-charcoal">
              ${analytics.totalRevenue.toFixed(2)}
            </div>
            <div className="text-[11px] text-pista-dark font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+24.8% vs last month</span>
            </div>
          </div>

          <div className="p-5 bg-white border border-charcoal-border rounded-2xl shadow-xs space-y-2">
            <div className="flex items-center justify-between text-charcoal-subtle text-xs">
              <span>Total Orders</span>
              <Package className="w-4 h-4 text-pista-dark" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-charcoal">
              {analytics.totalOrders}
            </div>
            <div className="text-[11px] text-charcoal-subtle">
              Avg: ${analytics.avgOrderValue.toFixed(2)} / order
            </div>
          </div>

          <div className="p-5 bg-white border border-charcoal-border rounded-2xl shadow-xs space-y-2">
            <div className="flex items-center justify-between text-charcoal-subtle text-xs">
              <span>Active Products</span>
              <Boxes className="w-4 h-4 text-pista-dark" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-charcoal">
              {analytics.activeProducts}
            </div>
            <div className="text-[11px] text-pista-dark font-semibold">
              100% In Stock
            </div>
          </div>

          <div className="p-5 bg-white border border-charcoal-border rounded-2xl shadow-xs space-y-2">
            <div className="flex items-center justify-between text-charcoal-subtle text-xs">
              <span>Open Support Tickets</span>
              <LifeBuoy className="w-4 h-4 text-pista-dark" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-charcoal">
              {analytics.openTickets}
            </div>
            <div className="text-[11px] text-charcoal-subtle">
              Avg Response: 9 minutes
            </div>
          </div>
        </div>

        {/* Revenue Performance Bar Chart & Inventory Status */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Revenue Chart Box */}
          <div className="lg:col-span-8 bg-white border border-charcoal-border rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-muted">
              <div>
                <h2 className="text-sm font-bold text-charcoal uppercase tracking-wider">
                  Monthly Revenue & Fulfillment Trajectory
                </h2>
                <p className="text-[11px] text-charcoal-subtle">Verified gross transaction volume</p>
              </div>
              <span className="text-xs font-mono font-bold text-pista-dark">Pista Green Palette</span>
            </div>

            {/* Visual Bar Chart rendered in Charcoal & Pista Green */}
            <div className="h-56 flex items-end justify-between gap-4 pt-6 px-2">
              {analytics.monthlyData.map(m => {
                const heightPercent = Math.min(100, Math.round((m.revenue / 10000) * 100));
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="text-[10px] font-mono text-charcoal-subtle opacity-0 group-hover:opacity-100 transition-opacity">
                      ${m.revenue}
                    </div>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-pista hover:bg-pista-hover rounded-t-lg transition-all"
                    />
                    <div className="text-xs font-bold text-charcoal">{m.month}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions & Low Stock Alerts */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-charcoal-border rounded-2xl p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-charcoal uppercase tracking-wider pb-3 border-b border-surface-muted">
                Quick Operations
              </h2>
              <div className="space-y-2 text-xs">
                <Link
                  href="/admin/inventory"
                  className="flex items-center justify-between p-3 rounded-lg bg-surface-bg hover:bg-pista-lighter transition-colors"
                >
                  <span className="font-semibold text-charcoal">Add Digital Keys to Vault</span>
                  <Key className="w-4 h-4 text-pista-dark" />
                </Link>
                <Link
                  href="/admin/pages"
                  className="flex items-center justify-between p-3 rounded-lg bg-surface-bg hover:bg-pista-lighter transition-colors"
                >
                  <span className="font-semibold text-charcoal">Publish Legal Terms</span>
                  <ArrowUpRight className="w-4 h-4 text-pista-dark" />
                </Link>
                <Link
                  href="/admin/coupons"
                  className="flex items-center justify-between p-3 rounded-lg bg-surface-bg hover:bg-pista-lighter transition-colors"
                >
                  <span className="font-semibold text-charcoal">Create Promo Discount</span>
                  <ArrowUpRight className="w-4 h-4 text-pista-dark" />
                </Link>
                <Link
                  href="/admin/settings"
                  className="flex items-center justify-between p-3 rounded-lg bg-surface-bg hover:bg-pista-lighter transition-colors"
                >
                  <span className="font-semibold text-charcoal">Maintenance Mode Toggle</span>
                  <ArrowUpRight className="w-4 h-4 text-pista-dark" />
                </Link>
              </div>
            </div>

            {/* Low inventory alert */}
            {lowInventoryProducts.length > 0 && (
              <div className="bg-white border border-charcoal-border rounded-2xl p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-charcoal">
                  <AlertTriangle className="w-4 h-4 text-pista-dark" />
                  <span>Low Inventory Notice</span>
                </div>
                <div className="space-y-2 text-xs">
                  {lowInventoryProducts.slice(0, 2).map(p => (
                    <div key={p.id} className="p-2.5 bg-surface-bg rounded-lg flex items-center justify-between">
                      <span className="truncate max-w-[150px] font-medium">{p.name}</span>
                      <Link href="/admin/inventory" className="text-[11px] text-pista-dark font-bold hover:underline">
                        Restock
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white border border-charcoal-border rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-muted">
            <div>
              <h2 className="text-sm font-bold text-charcoal uppercase tracking-wider">
                Recent Orders & Digital Fulfillment Status
              </h2>
              <p className="text-[11px] text-charcoal-subtle">All orders automatically fulfilled via credential vault</p>
            </div>
            <Link href="/admin/orders" className="text-xs font-semibold text-pista-dark hover:underline">
              View All Orders →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-bg text-charcoal-subtle uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3">Order Number</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Purchased Items</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Fulfillment</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-muted">
                {analytics.recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-surface-bg/60 transition-colors">
                    <td className="p-3 font-mono font-bold text-charcoal">{order.orderNumber}</td>
                    <td className="p-3">
                      <div className="font-bold text-charcoal">{order.customerName}</div>
                      <div className="text-[10px] text-charcoal-subtle">{order.customerEmail}</div>
                    </td>
                    <td className="p-3 text-charcoal-muted truncate max-w-xs">
                      {order.items.map(i => `${i.productName} (${i.variantName})`).join(', ')}
                    </td>
                    <td className="p-3 font-mono font-bold text-charcoal">${order.total.toFixed(2)}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-pista-lighter text-pista-dark text-[10px] font-bold font-mono uppercase">
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-pista-light text-pista-darker text-[10px] font-bold font-mono uppercase">
                        {order.fulfillmentStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/admin/orders/${order.orderNumber}`}
                        className="px-2.5 py-1 bg-surface-muted text-charcoal hover:bg-surface-subtle rounded font-semibold text-[11px]"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
