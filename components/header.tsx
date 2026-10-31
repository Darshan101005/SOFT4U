import React from 'react';
import { db } from '@/lib/db';
import type { NavigationItem } from '@/lib/db/types';
import { getPricing, getStoreInfo, safe } from '@/app/_store/storefront';
import { HeaderClient, type HeaderNavLink } from '@/components/header-client';

const DEFAULT_NAV: HeaderNavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'Categories', href: '/categories' },
  { label: 'Track Order', href: '/track-order' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
];

/** Site header. Navigation comes from Admin → Navigation (header and mobile), with a built-in fallback. */
export async function Header() {
  const [items, mobileItems, store, pricing] = await Promise.all([
    safe(() => db.getNavigation('header'), []),
    safe(() => db.getNavigation('mobile'), []),
    getStoreInfo(),
    getPricing(),
  ]);
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
    <HeaderClient
      nav={nav}
      mobileNav={mobileNav.length ? mobileNav : nav}
      whatsapp={store.whatsapp}
      whatsappHref={store.whatsappHref}
      pricing={pricing}
      logoUrl={store.logoUrl}
    />
  );
}
