import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { Image as ImageIcon, Plus, Check } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminBannersPage() {
  const banners = await db.getBanners();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">
            CAMPAIGN CREATIVES
          </div>
          <h1 className="text-3xl font-extrabold text-charcoal">Banners & Hero Graphics</h1>
          <p className="text-xs text-charcoal-subtle mt-0.5">
            Manage storefront promotional cards, seasonal artwork, and interactive campaign triggers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map(banner => (
            <div key={banner.id} className="bg-white border border-charcoal-border rounded-2xl p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-surface-muted">
                <span className="font-bold text-xs text-charcoal">{banner.title}</span>
                <span className="px-2 py-0.5 rounded bg-pista-lighter text-pista-dark text-[10px] font-mono font-bold uppercase">
                  {banner.status}
                </span>
              </div>

              <p className="text-xs text-charcoal-muted">{banner.subtitle}</p>

              <div className="text-xs text-charcoal-subtle flex items-center justify-between pt-2">
                <span>Placement: <strong className="text-charcoal">{banner.position}</strong></span>
                <span className="font-mono text-pista-dark">{banner.url}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
