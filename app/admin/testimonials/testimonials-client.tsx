'use client';

import React from 'react';
import { MessageSquareQuote, Star } from 'lucide-react';
import type { Testimonial } from '@/lib/db/types';
import { Badge } from '../_components/ui';
import { CrudList } from '../_components/crud-list';

export function TestimonialsClient({ initialItems }: { initialItems: Testimonial[] }) {
  return (
    <CrudList
      resource="testimonials"
      title="Testimonials"
      description="Customer quotes for the homepage. Only add real feedback (for example from WhatsApp chats, with permission). The section is hidden when empty."
      noun="Testimonial"
      icon={MessageSquareQuote}
      initialItems={initialItems as never}
      orderKey="displayOrder"
      activeKey={['status', 'active', 'disabled']}
      primary={i => i.name}
      secondary={i => `“${i.content}”`}
      badges={i => (
        <>
          <Badge tone="amber">
            <Star className="w-3 h-3" />
            {i.rating}
          </Badge>
          {i.roleOrCompany && <Badge tone="gray">{i.roleOrCompany}</Badge>}
          {i.featured && <Badge tone="green">Featured</Badge>}
        </>
      )}
      fields={[
        { key: 'name', label: 'Customer name', type: 'text', required: true },
        { key: 'roleOrCompany', label: 'City or role', type: 'text', placeholder: 'e.g. Lahore' },
        { key: 'content', label: 'What they said', type: 'textarea', required: true },
        { key: 'rating', label: 'Rating', type: 'rating', default: 5 },
        { key: 'featured', label: 'Featured', type: 'toggle', hint: 'Show first on the homepage' },
        { key: 'avatar', label: 'Photo (optional)', type: 'image', hint: 'PNG, JPG, WebP or SVG up to 5 MB.' },
      ]}
    />
  );
}
