'use client';

import React, { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import {
  TZ_COOKIE,
  formatDate,
  formatDateTime,
  formatMonthYear,
  formatTime,
  isValidTimeZone,
  offsetLabel,
  timeAgo,
  type DateInput,
  toDate,
} from '@/lib/datetime';

/**
 * Viewer time zone for client components.
 *  - The server passes the `tz` cookie value, so the first render already shows local time.
 *  - The browser's own zone takes over after hydration (first visit, or the device moved zone).
 *  - The cookie is written or refreshed (1 year) whenever it differs from the browser zone.
 */

const TimeZoneContext = createContext<string | null>(null);

function browserTimeZone(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return isValidTimeZone(tz) ? tz : null;
  } catch {
    return null;
  }
}

const noopSubscribe = () => () => {};

function readCookie(name: string): string | null {
  const hit = document.cookie.split('; ').find(c => c.startsWith(`${name}=`));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : null;
}

export function TimeZoneProvider({ tz, children }: { tz?: string | null; children: React.ReactNode }) {
  const browser = useSyncExternalStore(noopSubscribe, browserTimeZone, () => null);
  const zone = browser || (isValidTimeZone(tz) ? tz : null);

  useEffect(() => {
    if (!browser || readCookie(TZ_COOKIE) === browser) return;
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${TZ_COOKIE}=${encodeURIComponent(browser)}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
  }, [browser]);

  return <TimeZoneContext.Provider value={zone}>{children}</TimeZoneContext.Provider>;
}

/** The viewer's IANA zone, or null until it is known (first visit, before hydration). */
export function useTimeZone(): string | null {
  return useContext(TimeZoneContext);
}

export type LocalTimeFormat = 'datetime' | 'date' | 'time' | 'month' | 'ago';

const FORMATTERS: Record<LocalTimeFormat, (d: DateInput, tz: string) => string> = {
  datetime: formatDateTime,
  date: formatDate,
  time: formatTime,
  month: formatMonthYear,
  ago: timeAgo,
};

/**
 * A timestamp in the viewer's local time, e.g. "1 Nov 2026, 3:20 AM".
 * Renders `empty` for a missing value and a short placeholder until the zone is known.
 * The zone comes from <TimeZoneProvider> in components/providers (root layout reads the cookie).
 */
export function LocalTime({
  iso,
  format = 'datetime',
  empty = '—',
  className,
}: {
  iso?: DateInput;
  format?: LocalTimeFormat;
  empty?: string;
  className?: string;
}) {
  const tz = useTimeZone();
  const d = toDate(iso);
  if (!d) return <span className={className}>{empty}</span>;
  if (!tz) {
    return (
      <time className={className} dateTime={d.toISOString()} suppressHydrationWarning>
        …
      </time>
    );
  }
  return (
    <time
      className={className}
      dateTime={d.toISOString()}
      title={`${formatDateTime(d, tz)} (${offsetLabel(tz, d)})`}
      suppressHydrationWarning={format === 'ago'}
    >
      {FORMATTERS[format](d, tz)}
    </time>
  );
}
