'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { Announcement } from '@/lib/db/types';

export function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/announcements')
      .then(res => res.json())
      .then(data => {
        if (data.announcements && data.announcements.length > 0) {
          setAnnouncement(data.announcements[0]);
        }
      })
      .catch(() => {
        // Fallback default
        setAnnouncement({
          id: 'ann_01',
          text: 'SPRING SALE: Use code SOFT20 for 20% OFF all AI & Streaming subscriptions',
          link: '/shop',
          ctaText: 'Claim Discount',
          priority: 1,
          enabled: true,
          createdAt: ''
        });
      });
  }, []);

  if (!announcement || !announcement.enabled || dismissed) {
    return null;
  }

  return (
    <div className="bg-pista-light text-charcoal text-xs py-2 px-4 border-b border-pista-300 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex-1 text-center flex items-center justify-center gap-2">
          <span className="text-pista-darker font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
          <span className="font-normal text-charcoal">{announcement.text}</span>
          {announcement.link && (
            <Link
              href={announcement.link}
              className="text-pista-darker hover:underline font-semibold inline-flex items-center gap-1 ml-1"
            >
              {announcement.ctaText || 'Shop Now'}
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-charcoal-subtle hover:text-charcoal p-1 transition-colors"
          aria-label="Dismiss announcement"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
