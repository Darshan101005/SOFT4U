import React from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { RotateCcw, Check, ShieldCheck, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminRefundsPage() {
  const orders = await db.getOrders();
  const refundedOrders = orders.filter(o => o.paymentStatus === 'refunded' || o.orderStatus === 'refunded');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">
            PAYMENT REVERSALS & DISPUTES
          </div>
          <h1 className="text-3xl font-extrabold text-charcoal">Refund Management</h1>
          <p className="text-xs text-charcoal-subtle mt-0.5">
            Audit trail of customer returns, automated refund authorizations, and credential revocations.
          </p>
        </div>

        <div className="bg-white border border-charcoal-border rounded-2xl shadow-xs overflow-hidden">
          {refundedOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-bg text-charcoal-subtle uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3.5">Order Ref</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Amount Refunded</th>
                    <th className="p-3.5">Items</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5 text-right">Order Vault</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-muted">
                  {refundedOrders.map(order => (
                    <tr key={order.id} className="hover:bg-surface-bg/60">
                      <td className="p-3.5 font-mono font-bold text-charcoal">{order.orderNumber}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-charcoal">{order.customerName}</div>
                        <div className="text-[10px] text-charcoal-subtle">{order.customerEmail}</div>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-charcoal">${order.total.toFixed(2)}</td>
                      <td className="p-3.5 text-charcoal-muted truncate max-w-xs">
                        {order.items.map(i => i.productName).join(', ')}
                      </td>
                      <td className="p-3.5 text-charcoal-subtle font-mono">{new Date(order.updatedAt).toLocaleDateString()}</td>
                      <td className="p-3.5 text-right">
                        <Link
                          href={`/admin/orders/${order.orderNumber}`}
                          className="px-3 py-1 bg-surface-muted text-charcoal rounded font-semibold text-[11px]"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-charcoal-subtle">
              <RotateCcw className="w-8 h-8 text-pista-dark mx-auto mb-2" />
              <div className="font-bold text-sm text-charcoal">Zero Active Refund Disputes</div>
              <p className="mt-1">All orders are currently settled with 99.98% fulfillment customer satisfaction.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
