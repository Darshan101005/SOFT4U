'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Order } from '@/lib/db/types';
import { Search, Filter, ExternalLink, Package, Check, Zap } from 'lucide-react';

export function AdminOrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredOrders = orders.filter(o => {
    if (statusFilter !== 'all' && o.orderStatus !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">
            COMMERCE OPERATIONS
          </div>
          <h1 className="text-3xl font-extrabold text-charcoal">Orders & Digital Delivery</h1>
          <p className="text-xs text-charcoal-subtle mt-0.5">
            Monitor real-time customer purchases, automated fulfillment status, and credentials dispatched.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-charcoal-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex-1 max-w-sm relative">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by Order #, customer email or name..."
            className="w-full text-xs px-3 py-2 pl-8 border border-charcoal-border rounded-lg bg-surface-bg focus:bg-white focus:outline-none focus:border-pista-hover"
          />
          <Search className="w-3.5 h-3.5 text-charcoal-subtle absolute left-2.5 top-2.5" />
        </div>

        <div className="flex items-center gap-3 text-xs">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
          >
            <option value="all">All Order Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-charcoal-border rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-bg text-charcoal-subtle uppercase font-bold text-[10px]">
              <tr>
                <th className="p-3.5">Order Number</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Items</th>
                <th className="p-3.5">Total</th>
                <th className="p-3.5">Payment</th>
                <th className="p-3.5">Fulfillment</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-muted">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-surface-bg/60 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-charcoal">{order.orderNumber}</td>

                  <td className="p-3.5">
                    <div className="font-bold text-charcoal">{order.customerName}</div>
                    <div className="text-[10px] text-charcoal-subtle">{order.customerEmail}</div>
                  </td>

                  <td className="p-3.5 text-charcoal-muted truncate max-w-xs">
                    {order.items.map(i => `${i.productName} (${i.variantName})`).join(', ')}
                  </td>

                  <td className="p-3.5 font-mono font-bold text-charcoal">
                    ${order.total.toFixed(2)}
                  </td>

                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded bg-pista-lighter text-pista-dark font-bold font-mono text-[10px] uppercase">
                      {order.paymentStatus}
                    </span>
                  </td>

                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded bg-pista-light text-pista-darker font-bold font-mono text-[10px] uppercase">
                      {order.fulfillmentStatus}
                    </span>
                  </td>

                  <td className="p-3.5 text-charcoal-subtle font-mono text-[11px]">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>

                  <td className="p-3.5 text-right">
                    <Link
                      href={`/admin/orders/${order.orderNumber}`}
                      className="px-3 py-1 bg-surface-muted text-charcoal hover:bg-surface-subtle rounded font-semibold text-[11px] inline-flex items-center gap-1"
                    >
                      <span>Manage</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
