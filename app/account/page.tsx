import React from 'react';
import Link from 'next/link';
import { AccountLayout } from '@/components/account-layout';
import { db } from '@/lib/db';
import {
  Package,
  Boxes,
  LifeBuoy,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AccountOverviewPage() {
  const orders = await db.getOrders();
  const tickets = await db.getTickets();

  // Filter for demo customer or all customer orders
  const customerOrders = orders.filter(
    o => o.customerEmail === 'customer@example.com' || o.customerId === 'usr_customer_demo'
  );
  const displayOrders = customerOrders.length > 0 ? customerOrders : orders.slice(0, 3);
  const customerTickets = tickets.filter(
    t => t.customerEmail === 'customer@example.com' || t.customerId === 'usr_customer_demo'
  );

  return (
    <AccountLayout>
      <div className="space-y-6">
        <div>
          <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">
            CUSTOMER VAULT & OVERVIEW
          </div>
          <h1 className="text-2xl font-extrabold text-charcoal">Welcome back</h1>
          <p className="text-xs text-charcoal-subtle mt-0.5">
            Manage your verified software passes, view secret credentials, and monitor warranty status.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-white border border-charcoal-border rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[11px] text-charcoal-subtle uppercase font-bold tracking-wider">Active Passes</div>
              <div className="text-2xl font-bold font-mono text-charcoal mt-1">{displayOrders.length}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-pista-lighter text-pista-dark">
              <Boxes className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 bg-white border border-charcoal-border rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[11px] text-charcoal-subtle uppercase font-bold tracking-wider">Total Orders</div>
              <div className="text-2xl font-bold font-mono text-charcoal mt-1">{displayOrders.length}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-pista-lighter text-pista-dark">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 bg-white border border-charcoal-border rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[11px] text-charcoal-subtle uppercase font-bold tracking-wider">Support Tickets</div>
              <div className="text-2xl font-bold font-mono text-charcoal mt-1">{customerTickets.length}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-pista-lighter text-pista-dark">
              <LifeBuoy className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Recent Purchases Vault */}
        <div className="bg-white border border-charcoal-border rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-surface-muted">
            <div>
              <h2 className="text-sm font-bold text-charcoal uppercase tracking-wider">
                Recent Subscriptions & Vault Items
              </h2>
              <p className="text-[11px] text-charcoal-subtle">Click into any order to view revealed credentials and passwords.</p>
            </div>
            <Link href="/account/orders" className="text-xs font-semibold text-pista-dark hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {displayOrders.map(order => (
              <div
                key={order.id}
                className="p-4 bg-surface-bg border border-charcoal-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-charcoal">{order.orderNumber}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-pista-lighter text-pista-dark font-bold font-mono uppercase">
                      {order.fulfillmentStatus}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-charcoal mt-1">
                    {order.items.map(i => `${i.productName} (${i.variantName})`).join(', ')}
                  </div>
                  <div className="text-[11px] text-charcoal-subtle mt-0.5">
                    Purchased on {new Date(order.createdAt).toLocaleDateString()} · ${order.total.toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/account/orders/${order.orderNumber}`}
                    className="px-3 py-1.5 bg-pista-dark text-white hover:bg-pista-darker text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3 text-pista-dark" />
                    <span>View Credentials</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Support Tickets */}
        <div className="bg-white border border-charcoal-border rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-surface-muted">
            <div>
              <h2 className="text-sm font-bold text-charcoal uppercase tracking-wider">
                Support Helpdesk Tickets
              </h2>
              <p className="text-[11px] text-charcoal-subtle">Inquiries and warranty extension requests.</p>
            </div>
            <Link href="/account/support" className="text-xs font-semibold text-pista-dark hover:underline flex items-center gap-1">
              <span>Open Helpdesk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {customerTickets.length > 0 ? (
            <div className="space-y-3">
              {customerTickets.map(ticket => (
                <div key={ticket.id} className="p-4 bg-surface-bg border border-charcoal-border rounded-xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-charcoal">{ticket.ticketNumber}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-pista-lighter text-pista-dark font-semibold uppercase">
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-charcoal mt-1">{ticket.subject}</div>
                    <div className="text-[11px] text-charcoal-subtle">Category: {ticket.category}</div>
                  </div>
                  <Link
                    href="/account/support"
                    className="text-xs font-semibold text-charcoal hover:underline"
                  >
                    View Thread
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-charcoal-subtle">
              No active support tickets. Need help? Open a ticket anytime!
            </div>
          )}
        </div>
      </div>
    </AccountLayout>
  );
}
