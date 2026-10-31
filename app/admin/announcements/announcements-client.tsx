'use client';

import React from 'react';
import { Megaphone } from 'lucide-react';
import type { Announcement } from '@/lib/db/types';
import { Badge } from '../_components/ui';
import { CrudList } from '../_components/crud-list';
import { fmtDate } from '../_components/format';

export function AnnouncementsClient({ initialAnnouncements }: { initialAnnouncements: Announcement[] }) {
  return (
    <CrudList
      resource="announcements"
      title="Announcements"
      description="The thin bar at the top of every page. The first switched-on announcement inside its dates is shown; the bar is hidden when none is on."
      noun="Announcement"
      icon={Megaphone}
      initialItems={initialAnnouncements as never}
      orderKey="priority"
      activeKey={['enabled', true, false]}
      primary={i => i.text}
      badges={i => (
        <>
          {i.link && <Badge tone="blue">{i.ctaText || 'Link'} → {i.link}</Badge>}
          {(i.startDate || i.endDate) && <Badge tone="amber">{i.startDate ? fmtDate(i.startDate) : 'Now'} → {i.endDate ? fmtDate(i.endDate) : 'No end'}</Badge>}
        </>
      )}
      fields={[
        { key: 'text', label: 'Text', type: 'text', required: true, full: true, placeholder: 'e.g. Eid offer: 10% off with code EID10' },
        { key: 'ctaText', label: 'Link text', type: 'text', placeholder: 'e.g. Shop now' },
        { key: 'link', label: 'Link', type: 'text', placeholder: '/shop' },
        { key: 'startDate', label: 'Starts', type: 'date' },
        { key: 'endDate', label: 'Ends', type: 'date' },
      ]}
    />
  );
}
