import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { HelpCircle, Plus, Trash2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminFAQsPage() {
  const faqs = await db.getFAQs();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">
            KNOWLEDGE BASE
          </div>
          <h1 className="text-3xl font-extrabold text-charcoal">Frequently Asked Questions (CMS)</h1>
          <p className="text-xs text-charcoal-subtle mt-0.5">
            Add or edit global store answers that feed into the storefront FAQ and AI Concierge knowledge base.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map(faq => (
            <div key={faq.id} className="bg-white border border-charcoal-border rounded-2xl p-6 shadow-xs space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-surface-muted">
                <span className="text-xs font-bold text-charcoal">{faq.question}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-pista-lighter text-pista-dark font-bold uppercase font-mono">
                  {faq.category}
                </span>
              </div>
              <p className="text-xs text-charcoal-muted leading-relaxed pt-1">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
