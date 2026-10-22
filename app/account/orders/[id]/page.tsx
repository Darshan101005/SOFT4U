import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AccountLayout } from '@/components/account-layout';
import { db } from '@/lib/db';
import {
  ShieldCheck,
  Zap,
  Copy,
  ArrowLeft,
  LifeBuoy,
  Printer,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { OrderVaultReveal } from './order-vault-reveal';

export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({
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
    <AccountLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/account/orders"
            className="text-xs text-pista-dark font-semibold hover:underline inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Orders</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-charcoal-subtle">Order:</span>
            <span className="font-mono font-bold text-xs text-charcoal">{order.orderNumber}</span>
          </div>
        </div>

        {/* Invoice & Order Summary */}
        <div className="bg-white border border-charcoal-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-charcoal-border gap-4">
            <div>
              <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">
                PURCHASE INVOICE & RECEIPT
              </div>
              <h1 className="text-2xl font-extrabold text-charcoal">
                Order {order.orderNumber}
              </h1>
              <div className="text-xs text-charcoal-subtle mt-1">
                Issued to <span className="font-semibold text-charcoal">{order.customerName}</span> ({order.customerEmail}) on {new Date(order.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-pista-lighter text-pista-dark rounded text-xs font-bold font-mono uppercase">
                {order.paymentStatus}
              </span>
              <span className="px-3 py-1 bg-pista-light text-pista-darker rounded text-xs font-bold font-mono uppercase">
                {order.fulfillmentStatus}
              </span>
            </div>
          </div>

          {/* Interactive Vault with revealed passwords and license keys */}
          <OrderVaultReveal order={order} />

          {/* Payment & Invoice Breakdown */}
          <div className="pt-6 border-t border-charcoal-border">
            <h3 className="text-xs font-bold text-charcoal-subtle uppercase tracking-wider mb-3">
              Financial Breakdown
            </h3>
            <div className="bg-surface-bg border border-charcoal-border rounded-xl p-4 space-y-2 text-xs max-w-md">
              <div className="flex justify-between text-charcoal-muted">
                <span>Payment Method</span>
                <span className="font-semibold text-charcoal">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-charcoal-muted">
                <span>Subtotal</span>
                <span className="font-mono text-charcoal">${order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-pista-dark">
                  <span>Coupon Discount ({order.couponCode})</span>
                  <span className="font-mono font-bold">-${order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-charcoal-border flex justify-between font-bold text-sm text-charcoal">
                <span>Total Paid</span>
                <span className="font-mono">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Warranty & Support Banner */}
          <div className="pt-4 border-t border-charcoal-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-charcoal-muted">
              <ShieldCheck className="w-4 h-4 text-pista-dark" />
              <span>Full Term Replacement Warranty Active on all items in this order</span>
            </div>
            <Link
              href={`/account/support?orderId=${order.orderNumber}`}
              className="px-4 py-2 bg-pista-dark text-white hover:bg-pista-darker text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <LifeBuoy className="w-3.5 h-3.5 text-pista-dark" />
              <span>Need Help? Open Ticket</span>
            </Link>
          </div>
        </div>
      </div>
    </AccountLayout>
  );
}
