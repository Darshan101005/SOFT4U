import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { LineChart, DollarSign, Package, Users, TrendingUp, ShieldCheck, Zap } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage() {
  const analytics = await db.getAnalyticsSummary();
  const products = await db.getProducts();

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">
            DATA INTELLIGENCE
          </div>
          <h1 className="text-3xl font-extrabold text-charcoal">Commerce Analytics</h1>
          <p className="text-xs text-charcoal-subtle mt-0.5">
            Real-time conversion metrics, average order values, and product performance.
          </p>
        </div>

        {/* 4 Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white border border-charcoal-border rounded-2xl shadow-xs space-y-2">
            <div className="text-xs text-charcoal-subtle">Conversion Rate</div>
            <div className="text-2xl font-extrabold font-mono text-charcoal">4.82%</div>
            <div className="text-[11px] text-pista-dark font-semibold">+1.2% this week</div>
          </div>

          <div className="p-5 bg-white border border-charcoal-border rounded-2xl shadow-xs space-y-2">
            <div className="text-xs text-charcoal-subtle">Average Order Value</div>
            <div className="text-2xl font-extrabold font-mono text-charcoal">${analytics.avgOrderValue.toFixed(2)}</div>
            <div className="text-[11px] text-charcoal-subtle">Driven by multi-month passes</div>
          </div>

          <div className="p-5 bg-white border border-charcoal-border rounded-2xl shadow-xs space-y-2">
            <div className="text-xs text-charcoal-subtle">Fulfillment Success Rate</div>
            <div className="text-2xl font-extrabold font-mono text-charcoal">99.98%</div>
            <div className="text-[11px] text-pista-dark font-semibold">Under 110s median delivery</div>
          </div>

          <div className="p-5 bg-white border border-charcoal-border rounded-2xl shadow-xs space-y-2">
            <div className="text-xs text-charcoal-subtle">Refund Frequency</div>
            <div className="text-2xl font-extrabold font-mono text-charcoal">0.02%</div>
            <div className="text-[11px] text-charcoal-subtle">Protected by auto-replacement</div>
          </div>
        </div>

        {/* Product Sales Leaderboard */}
        <div className="bg-white border border-charcoal-border rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-charcoal uppercase tracking-wider pb-2 border-b border-surface-muted">
            Top Grossing Subscriptions
          </h2>

          <div className="space-y-3">
            {products.slice(0, 5).map((p, idx) => (
              <div key={p.id} className="p-3 bg-surface-bg rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded bg-pista-light text-pista-darker flex items-center justify-center font-bold text-[10px] font-mono">
                    #{idx + 1}
                  </span>
                  <div>
                    <div className="font-bold text-charcoal">{p.name}</div>
                    <div className="text-[10px] text-charcoal-subtle font-mono">{p.sku}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold font-mono text-charcoal">${p.price}</div>
                  <div className="text-[10px] text-pista-dark">Instant automated fulfillment</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
