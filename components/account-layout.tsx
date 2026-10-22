'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useAuth } from '@/lib/context/auth-context';
import {
  Package,
  Boxes,
  LifeBuoy,
  User,
  Shield,
  LayoutDashboard,
  LogOut
} from 'lucide-react';

export function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const links = [
    { label: 'Overview', href: '/account', icon: LayoutDashboard },
    { label: 'Orders & Receipts', href: '/account/orders', icon: Package },
    { label: 'Active Vault & Keys', href: '/account/products', icon: Boxes },
    { label: 'Support Helpdesk', href: '/account/support', icon: LifeBuoy },
    { label: 'Customer Profile', href: '/account/profile', icon: User },
    { label: 'Security & Sessions', href: '/account/security', icon: Shield },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-3 space-y-4">
            <div className="bg-white border border-charcoal-border rounded-2xl p-5 space-y-4 shadow-xs">
              {/* User badge */}
              <div className="flex items-center gap-3 pb-4 border-b border-surface-muted">
                <div className="w-10 h-10 rounded-full bg-pista-lighter text-charcoal flex items-center justify-center font-bold text-sm border border-pista">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="overflow-hidden">
                  <div className="text-sm font-bold text-charcoal truncate">{user?.name || 'Customer'}</div>
                  <div className="text-[11px] text-charcoal-subtle truncate">{user?.email || 'customer@example.com'}</div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                {links.map(link => {
                  const isActive = pathname === link.href;
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg transition-colors ${
                        isActive
                          ? 'bg-pista-light text-pista-darker font-bold'
                          : 'text-charcoal-muted hover:bg-surface-muted hover:text-charcoal'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Sign out */}
              <div className="pt-2 border-t border-surface-muted">
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-charcoal-subtle hover:text-charcoal w-full text-left rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="md:col-span-9">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
