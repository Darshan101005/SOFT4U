'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';
import type { FAQ } from '@/lib/db/types';
import { Badge } from '../_components/ui';
import { CrudList } from '../_components/crud-list';

const CATEGORIES = ['General', 'Orders', 'Payments', 'Delivery', 'Account', 'Refunds', 'Products'];

export function FaqsClient({ initialItems }: { initialItems: FAQ[] }) {
  const cats = [...new Set([...CATEGORIES, ...initialItems.map(f => f.category)])];
  return (
    <CrudList
      resource="faqs"
      title="FAQs"
      description="Shown on the FAQ page and the homepage FAQ section. The SOFT4U ASSISTANT also uses them to answer questions."
      noun="FAQ"
      icon={HelpCircle}
      initialItems={initialItems as never}
      orderKey="displayOrder"
      activeKey={['status', 'active', 'disabled']}
      primary={i => i.question}
      secondary={i => i.answer}
      badges={i => <Badge tone="gray">{i.category}</Badge>}
      fields={[
        { key: 'question', label: 'Question', type: 'text', required: true, full: true },
        { key: 'answer', label: 'Answer', type: 'textarea', required: true },
        { key: 'category', label: 'Group', type: 'select', options: cats.map(c => ({ value: c, label: c })), default: 'General' },
      ]}
    />
  );
}
