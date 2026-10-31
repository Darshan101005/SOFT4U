'use client';

import React from 'react';
import { Compass, ExternalLink } from 'lucide-react';
import type { NavigationItem } from '@/lib/db/types';
import { Badge } from '../_components/ui';
import { CrudList } from '../_components/crud-list';

const POSITIONS = { header: 'Header menu', footer: 'Footer links', mobile: 'Mobile menu' };

export function NavigationClient({ initialNavigation }: { initialNavigation: NavigationItem[] }) {
  return (
    <CrudList
      resource="navigation"
      title="Navigation"
      description="Menu links in the header, footer and mobile menu. Use the arrows to reorder and the switch to hide a link."
      noun="Link"
      icon={Compass}
      initialItems={initialNavigation as never}
      orderKey="displayOrder"
      activeKey={['visible', true, false]}
      groupBy={{
        key: 'position',
        labels: POSITIONS,
        empty: { mobile: 'Empty: the mobile menu uses your Header menu links. Add links here only if you want a different menu on phones.' },
      }}
      primary={i => i.label}
      secondary={i => i.url}
      badges={i =>
        i.targetBlank ? (
          <Badge tone="gray">
            <ExternalLink className="w-3 h-3" />
            New tab
          </Badge>
        ) : null
      }
      fields={[
        { key: 'label', label: 'Label', type: 'text', required: true },
        { key: 'url', label: 'Link', type: 'text', required: true, placeholder: '/shop or https://…' },
        { key: 'position', label: 'Menu', type: 'select', options: Object.entries(POSITIONS).map(([value, label]) => ({ value, label })), default: 'header' },
        { key: 'targetBlank', label: 'Open in a new tab', type: 'toggle', hint: 'For external links' },
      ]}
    />
  );
}
