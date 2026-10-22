import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { ArrowLeft, Package, ShieldCheck, Zap, User, CreditCard } from 'lucide-react';
import { AdminOrderDetailActions } from './admin-order-actions';

export const dynamic = 'force-dynamic';

export default async function AdminOrderDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let order = await db.getOrderById(id);
  if (!order) {
    order = await db.getOrderByNumber(id);
  }

  if (!order) {
    notFound();
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/orders"
            className="text-xs text-pista-dark font-semibold hover:underline inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Orders List</span>
          </Link>
          <div className="text-xs font-mono font-bold text-charcoal">
            Order Ref: {order.orderNumber}
          </div>
        </div>

        <div className="bg-white border border-charcoal-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-charcoal-border gap-4">
            <div>
              <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">
                ORDER MANAGEMENT & AUDIT
              </div>
              <h1 className="text-2xl font-extrabold text-charcoal">
                Order {order.orderNumber}
              </h1>
              <div className="text-xs text-charcoal-subtle mt-0.5">
                Timestamp: {new Date(order.createdAt).toLocaleString()} · Gateway: {order.paymentMethod}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-pista-lighter text-pista-dark rounded text-xs font-bold font-mono uppercase">
                PAYMENT: {order.paymentStatus}
              </span>
              <span className="px-3 py-1 bg-pista-light text-pista-darker rounded text-xs font-bold font-mono uppercase">
                FULFILLMENT: {order.fulfillmentStatus}
              </span>
            </div>
          </div>

          {/* Customer & Delivery Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-surface-bg rounded-xl border border-charcoal-border space-y-2">
              <div className="font-bold text-charcoal flex items-center gap-1.5">
                <User className="w-4 h-4 text-pista-dark" />
                <span>Customer Profile</span>
              </div>
              <div><span className="text-charcoal-subtle">Name:</span> <span className="font-bold text-charcoal">{order.customerName}</span></div>
              <div><span className="text-charcoal-subtle">Email:</span> <span className="font-bold text-charcoal">{order.customerEmail}</span></div>
              {order.customerPhone && (
                <div><span className="text-charcoal-subtle">Phone:</span> <span className="font-mono text-charcoal">{order.customerPhone}</span></div>
              )}
            </div>

            <div className="p-4 bg-surface-bg rounded-xl border border-charcoal-border space-y-2">
              <div className="font-bold text-charcoal flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-pista-dark" />
                <span>Financial Settlement</span>
              </div>
              <div><span className="text-charcoal-subtle">Subtotal:</span> <span className="font-mono text-charcoal">${order.subtotal.toFixed(2)}</span></div>
              <div><span className="text-charcoal-subtle">Discount:</span> <span className="font-mono text-pista-dark">-${order.discount.toFixed(2)}</span></div>
              <div className="font-bold text-sm text-charcoal pt-1 border-t border-charcoal-border">
                Total Settled: ${order.total.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Interactive Fulfillment Data & Actions */}
          <AdminOrderDetailActions order={order} />
        </div>
      </div>
    </AdminLayout>
  );
}
