import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { Star, MessageSquareQuote } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminTestimonialsPage() {
  const testimonials = await db.getTestimonials();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">
            BRAND ADVOCACY
          </div>
          <h1 className="text-3xl font-extrabold text-charcoal">Homepage Testimonials (CMS)</h1>
          <p className="text-xs text-charcoal-subtle mt-0.5">
            Manage highlighted customer quotes that appear on the homepage trust section.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(t => (
            <div key={t.id} className="bg-white border border-charcoal-border rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-0.5 text-pista-dark">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-pista-hover" />
                ))}
              </div>
              <p className="text-xs text-charcoal italic leading-relaxed">
                &ldquo;{t.content}&rdquo;
              </p>
              <div className="pt-3 border-t border-surface-muted">
                <div className="font-bold text-xs text-charcoal">{t.name}</div>
                <div className="text-[10px] text-charcoal-subtle">{t.roleOrCompany}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
