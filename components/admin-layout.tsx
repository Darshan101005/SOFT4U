'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoText } from '@/components/brand/logo';
import {
  LayoutDashboard,
  Package,
  Boxes,
  Layers,
  Key,
  Tag,
  Star,
  RotateCcw,
  Users,
  Compass,
  FileText,
  Megaphone,
  Image as ImageIcon,
  HelpCircle,
  MessageSquareQuote,
  LifeBuoy,
  CreditCard,
  LineChart,
  Settings,
  ShieldCheck,
  ClipboardList,
  ExternalLink,
  Menu,
  X
} from 'lucide-react';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navGroups = [
    {
      group: 'Overview',
      items: [
        { label: 'Dashboard', href: '/admin', icon: LayoutDashboard }
      ]
    },
    {
      group: 'Commerce',
      items: [
        { label: 'Orders', href: '/admin/orders', icon: Package },
        { label: 'Products', href: '/admin/products', icon: Boxes },
        { label: 'Categories', href: '/admin/categories', icon: Layers },
        { label: 'Digital Inventory', href: '/admin/inventory', icon: Key },
        { label: 'Coupons', href: '/admin/coupons', icon: Tag },
        { label: 'Customer Reviews', href: '/admin/reviews', icon: Star },
        { label: 'Refunds', href: '/admin/refunds', icon: RotateCcw },
      ]
    },
    {
      group: 'Content & CMS',
      items: [
        { label: 'Homepage Sections', href: '/admin/homepage', icon: Compass },
        { label: 'Legal Pages (CMS)', href: '/admin/pages', icon: FileText },
        { label: 'Announcements', href: '/admin/announcements', icon: Megaphone },
        { label: 'Banners', href: '/admin/banners', icon: ImageIcon },
        { label: 'Navigation Menus', href: '/admin/navigation', icon: Compass },
        { label: 'FAQs', href: '/admin/faqs', icon: HelpCircle },
        { label: 'Testimonials', href: '/admin/testimonials', icon: MessageSquareQuote },
      ]
    },
    {
      group: 'Operations',
      items: [
        { label: 'Customers', href: '/admin/customers', icon: Users },
        { label: 'Support Tickets', href: '/admin/support', icon: LifeBuoy },
        { label: 'Payment Gateways', href: '/admin/payment-gateways', icon: CreditCard },
        { label: 'Analytics', href: '/admin/analytics', icon: LineChart },
      ]
    },
    {
      group: 'System',
      items: [
        { label: 'Site Settings', href: '/admin/settings', icon: Settings },
        { label: 'Admin Users', href: '/admin/users', icon: ShieldCheck },
        { label: 'Audit Logs', href: '/admin/audit-logs', icon: ClipboardList },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-surface-bg text-charcoal flex flex-col">
      {/* Top Admin Navbar */}
      <header className="h-16 bg-white text-charcoal border-b border-charcoal-border px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-1.5 text-charcoal-muted hover:text-charcoal"
            aria-label={mobileOpen ? 'Close admin menu' : 'Open admin menu'}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/admin" className="flex items-center gap-2.5">
            <LogoText size="sm" />
            <span className="text-[10px] text-pista-darker uppercase font-bold px-1.5 py-0.5 bg-pista-light rounded">
              Admin
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1 px-3 py-1.5 bg-pista text-charcoal hover:bg-pista-hover text-xs font-bold rounded transition-colors"
          >
            <span>Live Store</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Admin Wrapper */}
      <div className="flex-1 flex">
        {/* Left Sidebar */}
        <aside
          className={`fixed lg:sticky top-16 z-30 h-[calc(100vh-4rem)] w-64 bg-pista-50 text-charcoal-muted border-r border-charcoal-border p-4 overflow-y-auto space-y-6 transition-transform duration-200 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {navGroups.map(grp => (
            <div key={grp.group} className="space-y-1">
              <div className="text-[10px] font-bold text-pista-dark uppercase tracking-wider px-3 mb-1">
                {grp.group}
              </div>
              {grp.items.map(item => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg transition-colors ${
                      isActive
                        ? 'bg-pista text-charcoal font-bold shadow-xs'
                        : 'text-charcoal-muted hover:bg-pista-100 hover:text-charcoal'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </aside>

        {/* Admin Content Canvas */}
        <main className="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
