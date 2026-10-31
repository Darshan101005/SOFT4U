'use client';

import React, { useState } from 'react';
import { BadgeCheck, Check, EyeOff, Star, Trash2, X } from 'lucide-react';
import type { Product, Review } from '@/lib/db/types';
import { Badge, Button, Card, EmptyState, PageHeader, SegmentChips, Toggle, api, errMsg, toast, useDialog } from '../_components/ui';
import { fmtDate } from '../_components/format';

type Filter = 'pending' | 'approved' | 'hidden' | 'rejected' | 'all';

export function ReviewsClient({ initialReviews, products }: { initialReviews: Review[]; products: Product[] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [filter, setFilter] = useState<Filter>(initialReviews.some(r => r.status === 'pending') ? 'pending' : 'all');
  const [busy, setBusy] = useState<string | null>(null);
  const { confirm, dialog } = useDialog();
  const productName = (id: string) => products.find(p => p.id === id)?.name || 'Deleted product';

  const call = async (r: Review, body: Record<string, unknown>, ok: string) => {
    setBusy(r.id);
    try {
      const res = await api<{ review?: Review }>('/api/reviews', { body: { id: r.id, ...body } });
      if (body.action === 'delete') setReviews(prev => prev.filter(x => x.id !== r.id));
      else if (res.review) setReviews(prev => prev.map(x => (x.id === r.id ? res.review! : x)));
      toast.success(ok);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(null);
    }
  };

  const shown = reviews.filter(r => filter === 'all' || r.status === filter);
  const count = (f: Filter) => (f === 'all' ? reviews.length : reviews.filter(r => r.status === f).length);

  return (
    <div>
      <PageHeader kicker="Operations" title="Reviews" description="Customers can review products after delivery. New reviews wait here until you approve them." />
      <div className="mb-4">
        <SegmentChips
          options={(['pending', 'approved', 'hidden', 'rejected', 'all'] as Filter[]).map(k => ({ key: k, label: k === 'pending' ? 'Waiting' : k.charAt(0).toUpperCase() + k.slice(1), count: count(k) }))}
          value={filter}
          onChange={setFilter}
        />
      </div>
      {shown.length === 0 ? (
        <Card>
          <EmptyState icon={Star} title="No reviews here" />
        </Card>
      ) : (
        <div className="space-y-3">
          {shown.map(r => (
            <Card key={r.id} bodyClassName="p-4 sm:p-5">
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex text-accent-amber">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} className={`w-4 h-4 ${i <= r.rating ? 'fill-accent-amber' : 'text-charcoal-border'}`} />
                      ))}
                    </span>
                    <span className="font-bold text-charcoal">{r.title || 'Review'}</span>
                    <Badge tone={r.status === 'approved' ? 'green' : r.status === 'pending' ? 'amber' : r.status === 'rejected' ? 'rose' : 'gray'}>{r.status}</Badge>
                    {r.verifiedPurchase && (
                      <Badge tone="blue">
                        <BadgeCheck className="w-3 h-3" />
                        Verified purchase
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-charcoal-muted mt-2 whitespace-pre-wrap">{r.comment}</p>
                  <div className="text-xs text-charcoal-subtle mt-2">
                    {r.customerName} ({r.customerEmail}) on <strong>{productName(r.productId)}</strong> · {fmtDate(r.createdAt)}
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:items-end shrink-0">
                  <div className="flex flex-wrap gap-1.5">
                    {r.status !== 'approved' && (
                      <Button size="sm" icon={Check} disabled={busy === r.id} onClick={() => call(r, { action: 'update_status', status: 'approved' }, 'Review published')}>
                        Approve
                      </Button>
                    )}
                    {r.status === 'approved' && (
                      <Button size="sm" variant="secondary" icon={EyeOff} disabled={busy === r.id} onClick={() => call(r, { action: 'update_status', status: 'hidden' }, 'Review hidden')}>
                        Hide
                      </Button>
                    )}
                    {r.status === 'pending' && (
                      <Button size="sm" variant="secondary" icon={X} disabled={busy === r.id} onClick={() => call(r, { action: 'update_status', status: 'rejected' }, 'Review rejected')}>
                        Reject
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={Trash2}
                      disabled={busy === r.id}
                      onClick={async () => {
                        if (await confirm({ title: 'Delete this review?', confirmLabel: 'Delete', danger: true })) await call(r, { action: 'delete' }, 'Review deleted');
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                  <Toggle checked={r.isFeatured} disabled={busy === r.id || r.status !== 'approved'} onChange={v => call(r, { action: 'feature', isFeatured: v }, v ? 'Shown on the homepage' : 'Removed from the homepage')} label="Feature on homepage" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {dialog}
    </div>
  );
}
