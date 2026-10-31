'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoText } from '@/components/brand/logo';
import { Toaster } from '@/app/admin/_components/ui';
import {
  LayoutDashboard,
  Package,
  BadgeCheck,
  Boxes,
  Layers,
  KeyRound,
  Tag,
  Users,
  LifeBuoy,
  RotateCcw,
  Star,
  Home,
  Image as ImageIcon,
  Megaphone,
  HelpCircle,
  MessageSquareQuote,
  FileText,
  Compass,
  Store,
  CreditCard,
  Coins,
  ShieldCheck,
  UserCircle2,
  ExternalLink,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';

type NavItem = { label: string; href: string; icon: React.ComponentType<{ className?: string }>; badge?: 'review' | 'deliver' };

const NAV_GROUPS: Array<{ group: string; items: NavItem[] }> = [
  {
    group: 'Commerce',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { label: 'Orders', href: '/admin/orders', icon: Package, badge: 'deliver' },
      { label: 'Verify Payments', href: '/admin/verify-payments', icon: BadgeCheck, badge: 'review' },
      { label: 'Products', href: '/admin/products', icon: Boxes },
      { label: 'Categories', href: '/admin/categories', icon: Layers },
      { label: 'Vault / Inventory', href: '/admin/inventory', icon: KeyRound },
      { label: 'Coupons', href: '/admin/coupons', icon: Tag },
    ],
  },
  {
    group: 'Operations',
    items: [
      { label: 'Customers', href: '/admin/customers', icon: Users },
      { label: 'Support tickets', href: '/admin/support', icon: LifeBuoy },
      { label: 'Refunds', href: '/admin/refunds', icon: RotateCcw },
      { label: 'Reviews', href: '/admin/reviews', icon: Star },
    ],
  },
  {
    group: 'Content & CMS',
    items: [
      { label: 'Homepage', href: '/admin/homepage', icon: Home },
      { label: 'Banners', href: '/admin/banners', icon: ImageIcon },
      { label: 'Announcements', href: '/admin/announcements', icon: Megaphone },
      { label: 'FAQs', href: '/admin/faqs', icon: HelpCircle },
      { label: 'Testimonials', href: '/admin/testimonials', icon: MessageSquareQuote },
      { label: 'Legal pages', href: '/admin/pages', icon: FileText },
      { label: 'Navigation', href: '/admin/navigation', icon: Compass },
    ],
  },
  {
    group: 'Settings',
    items: [
      { label: 'Store & contact details', href: '/admin/settings', icon: Store },
      { label: 'Payment methods', href: '/admin/payment-methods', icon: CreditCard },
      { label: 'Currency & pricing', href: '/admin/currency', icon: Coins },
      { label: 'Admins', href: '/admin/users', icon: ShieldCheck },
      { label: 'My profile', href: '/admin/profile', icon: UserCircle2 },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [me, setMe] = useState<{ name: string; email: string } | null>(null);
  const [counts, setCounts] = useState<{ under_review: number; processing: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/admin/me', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (alive && d?.admin) setMe({ name: d.admin.name, email: d.admin.email });
      })
      .catch(() => undefined);
    fetch('/api/admin/orders?countsOnly=1', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (alive && d?.counts) setCounts({ under_review: d.counts.under_review || 0, processing: d.counts.processing || 0 });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => undefined);
    window.location.assign('/admin/login');
  };

  const badgeFor = (b?: NavItem['badge']) => {
    if (!b || !counts) return 0;
    return b === 'review' ? counts.under_review : counts.processing;
  };

  return (
    <div className="min-h-screen bg-surface-bg text-charcoal flex flex-col">
      <header className="h-16 bg-white border-b border-charcoal-border px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="lg:hidden p-2 -ml-2 rounded-lg text-charcoal-muted hover:bg-pista-lighter"
            aria-label={mobileOpen ? 'Close admin menu' : 'Open admin menu'}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link href="/admin" className="flex items-center gap-2.5">
            <LogoText size="sm" />
            <span className="text-[10px] text-pista-darker uppercase font-bold px-1.5 py-0.5 bg-pista-light rounded">Admin</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 border border-charcoal-border hover:border-pista text-xs font-bold rounded-lg transition-colors"
          >
            <span>View store</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-xl hover:bg-pista-lighter"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="w-8 h-8 rounded-full bg-pista text-charcoal font-extrabold text-sm flex items-center justify-center">
                {(me?.name || 'A').trim().charAt(0).toUpperCase()}
              </span>
              <span className="hidden md:block text-left">
                <span className="block text-xs font-bold text-charcoal leading-tight max-w-[160px] truncate">{me?.name || 'Admin'}</span>
                <span className="block text-[10px] text-charcoal-subtle leading-tight max-w-[160px] truncate">{me?.email || ''}</span>
              </span>
              <ChevronDown className="w-4 h-4 text-pista-dark" />
            </button>
            {menuOpen && (
              <div role="menu" className="absolute right-0 mt-2 w-52 bg-white border border-pista-light rounded-xl shadow-xl py-1 z-50">
                <Link href="/admin/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-pista-50">
                  <UserCircle2 className="w-4 h-4 text-pista-dark" /> My profile
                </Link>
                <Link href="/" target="_blank" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-pista-50 sm:hidden">
                  <ExternalLink className="w-4 h-4 text-pista-dark" /> View store
                </Link>
                <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-accent-rose hover:bg-accent-rose/5">
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {mobileOpen && <div className="fixed inset-0 top-16 z-20 bg-charcoal/30 lg:hidden" onClick={() => setMobileOpen(false)} />}
        <aside
          className={`fixed lg:sticky top-16 z-30 h-[calc(100vh-4rem)] w-64 shrink-0 bg-pista-50 border-r border-charcoal-border p-3 overflow-y-auto space-y-5 transition-transform duration-200 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {NAV_GROUPS.map(grp => (
            <div key={grp.group} className="space-y-0.5">
              <div className="text-[10px] font-bold text-pista-dark uppercase tracking-wider px-3 mb-1">{grp.group}</div>
              {grp.items.map(item => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                const n = badgeFor(item.badge);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-lg transition-colors ${
                      active ? 'bg-pista text-charcoal font-bold shadow-xs' : 'text-charcoal-muted hover:bg-pista-100 hover:text-charcoal'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {n > 0 && (
                      <span className={`min-w-5 h-5 px-1.5 rounded-full text-[10px] font-extrabold flex items-center justify-center ${active ? 'bg-white text-charcoal' : 'bg-accent-amber text-white'}`}>
                        {n}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </aside>

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
