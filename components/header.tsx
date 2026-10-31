import React from 'react';
import { db } from '@/lib/db';
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

/** Site header. Navigation comes from Admin → Navigation (header), with a built-in fallback. */
export async function Header() {
  const [items, store, pricing] = await Promise.all([safe(() => db.getNavigation('header'), []), getStoreInfo(), getPricing()]);
  const nav = items
    .filter(i => i.visible && !i.parentId)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(i => ({ label: i.label, href: i.url, targetBlank: i.targetBlank }));

  return (
    <HeaderClient
      nav={nav.length ? nav : DEFAULT_NAV}
      whatsapp={store.whatsapp}
      whatsappHref={store.whatsappHref}
      pricing={pricing}
      logoUrl={store.logoUrl}
    />
  );
}
