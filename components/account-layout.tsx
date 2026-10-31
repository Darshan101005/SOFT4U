'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Boxes, LayoutDashboard, LifeBuoy, LogOut, Package, Send, Shield, User } from 'lucide-react';
import { useAuth } from '@/lib/context/auth-context';

const LINKS = [
  { label: 'Overview', href: '/account', icon: LayoutDashboard },
  { label: 'My orders', href: '/account/orders', icon: Package },
  { label: 'My access', href: '/account/products', icon: Boxes },
  { label: 'Profile', href: '/account/profile', icon: User },
  { label: 'Security', href: '/account/security', icon: Shield },
  { label: 'Telegram', href: '/account/telegram', icon: Send },
  { label: 'Support', href: '/account/support', icon: LifeBuoy },
];

/** Account sidebar (desktop) / scrollable tab row (mobile). */
export function AccountNav({ name, email }: { name: string; email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const isActive = (href: string) => (href === '/account' ? pathname === '/account' : pathname?.startsWith(href));

  const signOut = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  return (
    <>
      <nav aria-label="Account" className="md:hidden -mx-4 px-4 overflow-x-auto">
        <ul className="flex gap-2 w-max pb-1">
          {LINKS.map(l => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={isActive(l.href) ? 'page' : undefined}
                className={`inline-flex items-center gap-1.5 min-h-11 px-3.5 rounded-xl border text-sm font-semibold whitespace-nowrap ${
                  isActive(l.href) ? 'bg-pista-lighter border-pista-300 text-pista-darker' : 'bg-white border-charcoal-border text-charcoal-muted'
                }`}
              >
                <l.icon className="w-4 h-4" aria-hidden="true" />
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="hidden md:block bg-white border border-charcoal-border rounded-2xl p-5 space-y-4 shadow-xs md:sticky md:top-24">
        <div className="flex items-center gap-3 pb-4 border-b border-surface-muted">
          <div className="w-10 h-10 rounded-full bg-pista-lighter text-pista-darker flex items-center justify-center font-bold text-sm border border-pista">{name.charAt(0).toUpperCase()}</div>
          <div className="overflow-hidden">
            <div className="text-sm font-bold text-charcoal truncate">{name}</div>
            <div className="text-[11px] text-charcoal-subtle truncate">{email}</div>
          </div>
        </div>
        <nav aria-label="Account" className="space-y-1">
          {LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? 'page' : undefined}
              className={`flex items-center gap-2.5 min-h-11 px-3 text-sm rounded-xl transition-colors ${
                isActive(l.href) ? 'bg-pista-light text-pista-darker font-bold' : 'text-charcoal-muted hover:bg-surface-muted hover:text-charcoal'
              }`}
            >
              <l.icon className="w-4 h-4" aria-hidden="true" />
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="pt-2 border-t border-surface-muted">
          <button type="button" onClick={signOut} className="flex items-center gap-2 min-h-11 px-3 text-sm text-charcoal-subtle hover:text-charcoal w-full text-left rounded-xl">
            <LogOut className="w-4 h-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}
