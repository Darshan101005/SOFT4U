import React from 'react';
import { db } from '@/lib/db';
import type { NavigationItem } from '@/lib/db/types';
import { getPricing, getStoreInfo, safe } from '@/app/_store/storefront';
import { HeaderClient, type HeaderNavLink } from '@/components/header-client';
import { cookies } from 'next/headers';
import { AnnouncementBar, type AnnouncementBarData } from '@/components/announcement-bar';
import { ANNOUNCEMENT_COOKIE } from '@/lib/announcement';
import { BannerPopup, type PopupBanner } from '@/components/banner-popup';

const DEFAULT_NAV: HeaderNavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'Categories', href: '/categories' },
  { label: 'Track Order', href: '/track-order' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
];

/** Short, cookie-safe hash so editing the text shows the bar again to people who closed it. */
function textHash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/** Cookie value read on the server so a closed announcement doesn't flash on the next page. */
async function closedAnnouncementKey(): Promise<string> {
  try {
    const raw = (await cookies()).get(ANNOUNCEMENT_COOKIE)?.value;
    if (!raw) return '';
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw; // already decoded
    }
  } catch {
    return '';
  }
}

/**
 * Site header. Navigation comes from Admin → Navigation (header and mobile), with a built-in fallback.
 * Also renders the storefront-only extras managed in the CMS: the announcement bar (Admin →
 * Announcements) above the header and the promotional popup (Admin → Banners).
 */
export async function Header() {
  const [items, mobileItems, store, pricing, announcements, banners, closedKey] = await Promise.all([
    safe(() => db.getNavigation('header'), []),
    safe(() => db.getNavigation('mobile'), []),
    getStoreInfo(),
    getPricing(),
    safe(() => db.getAnnouncements(true), []),
    safe(() => db.getBanners(true), []),
    closedAnnouncementKey(),
  ]);

  const top = announcements[0];
  const announcement: AnnouncementBarData | null = top ? { key: `${top.id}-${textHash(top.text)}`, text: top.text, link: top.link || undefined, ctaText: top.ctaText || undefined } : null;
  const popupBanners: PopupBanner[] = banners.map(b => ({
    id: b.id,
    title: b.title,
    subtitle: b.subtitle || undefined,
    image: b.image,
    mobileImage: b.mobileImage || undefined,
    ctaText: b.ctaText || undefined,
    url: b.url || undefined,
    position: b.position,
  }));
  const links = (list: NavigationItem[]): HeaderNavLink[] =>
    list
      .filter(i => i.visible && !i.parentId)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(i => ({ label: i.label, href: i.url, targetBlank: i.targetBlank }));
  const headerNav = links(items);
  const nav = headerNav.length ? headerNav : DEFAULT_NAV;
  // The phone drawer uses the "Mobile menu" links when there are any, otherwise the header links.
  const mobileNav = links(mobileItems);

  return (
    <>
      {announcement && announcement.key !== closedKey && <AnnouncementBar announcement={announcement} />}
      <HeaderClient
        nav={nav}
        mobileNav={mobileNav.length ? mobileNav : nav}
        whatsapp={store.whatsapp}
        whatsappHref={store.whatsappHref}
        pricing={pricing}
        logoUrl={store.logoUrl}
      />
      {popupBanners.length > 0 && <BannerPopup banners={popupBanners} />}
    </>
  );
}
