'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Slim pistachio bar at the top of the window during internal navigation.
 * Starts on a same-origin link click (or a router.push via the
 * `soft4u:navigate` event) and finishes when the pathname or query changes.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [active, setActive] = useState(false);
  const [done, setDone] = useState(false);
  const routeKey = `${pathname}?${search?.toString() || ''}`;

  const [lastKey, setLastKey] = useState(routeKey);
  if (lastKey !== routeKey) {
    setLastKey(routeKey);
    if (active) {
      setActive(false);
      setDone(true);
    }
  }

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 300);
    return () => clearTimeout(t);
  }, [done]);

  useEffect(() => {
    if (!active) return;
    // Safety net: never leave the bar running (e.g. a download link or a cancelled navigation).
    const t = setTimeout(() => setActive(false), 12000);
    return () => clearTimeout(t);
  }, [active]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.('a');
      if (!a || !a.href || a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      setDone(false);
      setActive(true);
    };
    const onNavigate = () => {
      setDone(false);
      setActive(true);
    };
    document.addEventListener('click', onClick);
    window.addEventListener('soft4u:navigate', onNavigate);
    return () => {
      document.removeEventListener('click', onClick);
      window.removeEventListener('soft4u:navigate', onNavigate);
    };
  }, []);

  if (!active && !done) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-[100] h-[3px] pointer-events-none" role="progressbar" aria-label="Loading page" aria-busy={active}>
      <div
        className={`h-full bg-pista-600 shadow-[0_0_8px_var(--color-pista-500)] ${active ? 'soft4u-progress' : 'w-full transition-opacity duration-300 opacity-0'}`}
      />
    </div>
  );
}

/** Starts the progress bar for programmatic navigation (router.push). */
export function startRouteProgress() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('soft4u:navigate'));
}
