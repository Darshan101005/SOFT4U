'use client';

import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import type { Banner } from '@/lib/db/types';
import { Badge } from '../_components/ui';
import { CrudList } from '../_components/crud-list';
import { fmtDate } from '../_components/format';

const POSITIONS = [
  { value: 'home', label: 'Homepage' },
  { value: 'all', label: 'Every page' },
  { value: 'shop', label: 'Shop page' },
  { value: 'category', label: 'Category pages' },
];

export function BannersClient({ initialItems }: { initialItems: Banner[] }) {
  return (
    <CrudList
      resource="banners"
      title="Banners"
      description="Popup shown to visitors shortly after a page opens; they can close it. The first switched-on banner for the page (inside its dates) is shown, once per browser session. Set dates to run a campaign."
      noun="Banner"
      icon={ImageIcon}
      initialItems={initialItems as never}
      orderKey="priority"
      activeKey={['status', 'active', 'disabled']}
      primary={i => (
        <span className="flex items-center gap-3">
          {i.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={i.image} alt="" className="w-20 h-10 rounded-lg object-cover border border-charcoal-border" />
          )}
          {i.title}
        </span>
      )}
      secondary={i => i.subtitle}
      badges={i => (
        <>
          <Badge tone="gray">{POSITIONS.find(p => p.value === i.position)?.label || i.position}</Badge>
          {(i.startDate || i.endDate) && <Badge tone="amber">{i.startDate ? fmtDate(i.startDate) : 'Now'} → {i.endDate ? fmtDate(i.endDate) : 'No end'}</Badge>}
          {i.url && <Badge tone="blue">{i.ctaText || 'Link'} → {i.url}</Badge>}
        </>
      )}
      fields={[
        { key: 'title', label: 'Title', type: 'text', required: true },
        { key: 'subtitle', label: 'Subtitle', type: 'text' },
        { key: 'ctaText', label: 'Button text', type: 'text', placeholder: 'e.g. Shop now' },
        { key: 'url', label: 'Button link', type: 'text', placeholder: '/shop or https://…' },
        { key: 'position', label: 'Where', type: 'select', options: POSITIONS, default: 'home' },
        { key: 'startDate', label: 'Starts', type: 'date' },
        { key: 'endDate', label: 'Ends', type: 'date' },
        { key: 'image', label: 'Popup image (desktop)', type: 'banner-image', required: true, hint: 'Shown in the popup, about 1000×700 (landscape or square). PNG, JPG, WebP or SVG up to 5 MB.' },
        { key: 'mobileImage', label: 'Mobile image (optional)', type: 'banner-image', hint: 'Used on phones instead, about 800×800.' },
      ]}
    />
  );
}
