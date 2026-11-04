'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { ANNOUNCEMENT_COOKIE } from '@/lib/announcement';

export type AnnouncementBarData = {
  /** Stable key for this announcement version (id + text), used for dismissal. */
  key: string;
  text: string;
  link?: string;
  ctaText?: string;
};

/**
 * Thin promo bar above the storefront header. Rendered by <Header /> only, so it
 * never appears in the admin panel. Closing it hides it until the browser is closed,
 * or until the admin publishes a different announcement.
 */
export function AnnouncementBar({ announcement }: { announcement: AnnouncementBarData }) {
  const [closed, setClosed] = useState(false);
  if (closed) return null;

  const close = () => {
    setClosed(true);
    document.cookie = `${ANNOUNCEMENT_COOKIE}=${encodeURIComponent(announcement.key)}; path=/; SameSite=Lax`;
  };

  const external = announcement.link ? /^https?:\/\//i.test(announcement.link) : false;

  return (
    <div role="region" aria-label="Announcement" className="bg-pista-light text-charcoal text-xs sm:text-sm border-b border-pista-300">
      <div className="max-w-7xl mx-auto flex items-center gap-2 px-3 sm:px-6 py-2">
        <div className="flex-1 min-w-0 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-center">
          <Sparkles className="w-3.5 h-3.5 shrink-0 text-pista-darker" aria-hidden="true" />
          <span className="font-medium">{announcement.text}</span>
          {announcement.link && (
            <Link
              href={announcement.link}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
              className="inline-flex items-center gap-1 font-semibold text-pista-darker hover:underline"
            >
              {announcement.ctaText || 'Shop now'}
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          )}
        </div>
        <button
          type="button"
          onClick={close}
          className="shrink-0 p-1 rounded text-charcoal-subtle hover:text-charcoal hover:bg-pista-200/60 transition-colors"
          aria-label="Close announcement"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
