'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';

export type PopupBanner = {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  mobileImage?: string;
  ctaText?: string;
  url?: string;
  position: string;
};

const STORAGE_KEY = 's4u_popup_closed';
const SHOW_DELAY_MS = 1200;

/** Does a banner's "Where" setting match the current page? */
function matches(position: string, path: string) {
  const where = (position || 'home').toLowerCase();
  if (where === 'all') return !path.startsWith('/checkout') && !path.startsWith('/order-success');
  if (where.includes('home') && path === '/') return true;
  if (where.includes('shop') && path.startsWith('/shop')) return true;
  if (where.includes('category') && path.startsWith('/categories')) return true;
  return false;
}

/** A banner "version": editing the image or title shows it again to people who closed the old one. */
const versionKey = (b: PopupBanner) => `${b.id}:${b.image}:${b.title}`;

function closedKeys(): string[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

/**
 * Promotional popup managed from Admin → Banners. Shows the first active banner
 * for the current page shortly after it opens. Visitors can close it (X, backdrop
 * or Esc); a closed banner stays closed for the rest of the browser session.
 */
export function BannerPopup({ banners }: { banners: PopupBanner[] }) {
  const pathname = usePathname() || '/';
  const [banner, setBanner] = useState<PopupBanner | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const closed = closedKeys();
    const next = banners.find(b => b.image && matches(b.position, pathname) && !closed.includes(versionKey(b)));
    if (!next) return;
    const t = window.setTimeout(() => {
      setBanner(next);
      requestAnimationFrame(() => setVisible(true));
    }, SHOW_DELAY_MS);
    return () => {
      window.clearTimeout(t);
      setVisible(false);
      setBanner(null);
    };
  }, [banners, pathname]);

  const close = useCallback(() => {
    if (!banner) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...closedKeys(), versionKey(banner)].slice(-20)));
    } catch {
      /* storage blocked: just close for now */
    }
    setVisible(false);
    window.setTimeout(() => setBanner(null), 200);
  }, [banner]);

  useEffect(() => {
    if (!banner) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [banner, close]);

  if (!banner) return null;

  const external = banner.url ? /^https?:\/\//i.test(banner.url) : false;
  const image = (
    <picture>
      {banner.mobileImage && <source media="(max-width: 640px)" srcSet={banner.mobileImage} />}
      <img src={banner.image} alt={banner.title} className="block w-full max-h-[60vh] object-contain bg-pista-100" />
    </picture>
  );

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-sm transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label={banner.title}
    >
      <div
        className={`relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl transition-transform duration-200 ${visible ? 'scale-100' : 'scale-95'}`}
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-charcoal shadow-md hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-pista"
        >
          <X className="w-5 h-5" />
        </button>

        {banner.url ? (
          <Link href={banner.url} onClick={close} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
            {image}
          </Link>
        ) : (
          image
        )}

        <div className="p-5 sm:p-6 text-center">
          <h2 className="text-lg sm:text-xl font-bold text-charcoal">{banner.title}</h2>
          {banner.subtitle && <p className="mt-1 text-sm text-charcoal-subtle">{banner.subtitle}</p>}
          <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
            {banner.url && (
              <Link
                href={banner.url}
                onClick={close}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                className="inline-flex min-h-11 items-center justify-center px-5 rounded-xl bg-pista text-charcoal text-sm font-bold hover:bg-pista-dark hover:text-white transition-colors"
              >
                {banner.ctaText || 'Shop now'}
              </Link>
            )}
            <button
              type="button"
              onClick={close}
              className="inline-flex min-h-11 items-center justify-center px-5 rounded-xl border border-charcoal-border text-sm font-semibold text-charcoal hover:bg-surface-bg transition-colors"
            >
              {banner.url ? 'Maybe later' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
