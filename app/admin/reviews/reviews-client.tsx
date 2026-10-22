'use client';

import React, { useState } from 'react';
import { Review, Product } from '@/lib/db/types';
import { Star, Check, EyeOff, Trash2, CheckCircle2 } from 'lucide-react';

export function ReviewsClient({
  initialReviews,
  products
}: {
  initialReviews: Review[];
  products: Product[];
}) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [notice, setNotice] = useState('');

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
  };

  const handleUpdateStatus = async (id: string, status: Review['status']) => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', id, status })
      });
      const data = await res.json();
      if (data.review) {
        setReviews(prev => prev.map(r => (r.id === id ? data.review : r)));
        showNotice(`Review status updated to ${status}!`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">
          REPUTATION & PROOF
        </div>
        <h1 className="text-3xl font-extrabold text-charcoal">Customer Reviews Moderation</h1>
        <p className="text-xs text-charcoal-subtle mt-0.5">
          Approve verified feedback, highlight top testimonials, or hide policy-violating comments.
        </p>
      </div>

      {notice && (
        <div className="p-3 bg-pista-lighter border border-pista text-xs font-semibold text-pista-dark rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      <div className="space-y-3">
        {reviews.map(review => {
          const product = products.find(p => p.id === review.productId);
          return (
            <div
              key={review.id}
              className="p-5 bg-white border border-charcoal-border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
            >
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-charcoal">{review.customerName}</span>
                  <span className="text-[11px] text-charcoal-subtle">({review.customerEmail})</span>
                  <div className="flex items-center gap-0.5 text-pista-dark ml-2">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-pista-hover" />
                    ))}
                  </div>
                </div>

                <div className="text-xs font-semibold text-charcoal">
                  &ldquo;{review.title}&rdquo; · <span className="text-pista-dark font-normal">{product?.name || review.productId}</span>
                </div>

                <p className="text-xs text-charcoal-muted leading-relaxed">
                  {review.comment}
                </p>

                <div className="text-[10px] text-charcoal-subtle font-mono">
                  Submitted {new Date(review.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                  review.status === 'approved'
                    ? 'bg-pista-lighter text-pista-dark'
                    : 'bg-surface-muted text-charcoal-subtle'
                }`}>
                  {review.status}
                </span>

                {review.status !== 'approved' && (
                  <button
                    onClick={() => handleUpdateStatus(review.id, 'approved')}
                    className="px-3 py-1 bg-pista-dark text-white hover:bg-pista-darker text-xs font-semibold rounded"
                  >
                    Approve
                  </button>
                )}

                {review.status === 'approved' && (
                  <button
                    onClick={() => handleUpdateStatus(review.id, 'hidden')}
                    className="px-3 py-1 bg-surface-muted text-charcoal-subtle hover:bg-surface-subtle text-xs font-semibold rounded"
                  >
                    Hide
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
