import React from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { Users, Mail, Phone, ShoppingBag, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage() {
  const users = await db.getUsers();
  const orders = await db.getOrders();

  const customers = users.filter(u => u.role === 'CUSTOMER');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">
            CUSTOMER RELATIONSHIPS
          </div>
          <h1 className="text-3xl font-extrabold text-charcoal">Customer Directory</h1>
          <p className="text-xs text-charcoal-subtle mt-0.5">
            Registered customer records, purchase frequency, lifetime value, and communication channels.
          </p>
        </div>

        <div className="bg-white border border-charcoal-border rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-bg text-charcoal-subtle uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3.5">Customer Name</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Phone / WhatsApp</th>
                  <th className="p-3.5">Orders Placed</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Member Since</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-muted">
                {customers.map(c => {
                  const custOrders = orders.filter(o => o.customerId === c.id || o.customerEmail === c.email);
                  const totalSpent = custOrders.reduce((sum, o) => sum + o.total, 0);
                  return (
                    <tr key={c.id} className="hover:bg-surface-bg/60">
                      <td className="p-3.5 font-bold text-charcoal">{c.name}</td>
                      <td className="p-3.5 font-mono text-charcoal-muted">{c.email}</td>
                      <td className="p-3.5 text-charcoal-subtle">{c.phone || c.whatsapp || '—'}</td>
                      <td className="p-3.5">
                        <span className="font-bold text-charcoal">{custOrders.length} orders</span>{' '}
                        <span className="font-mono text-charcoal-subtle">(${totalSpent.toFixed(2)})</span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-pista-lighter text-pista-dark font-bold font-mono text-[10px] uppercase">
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-charcoal-subtle font-mono">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
