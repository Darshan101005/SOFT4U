import { cookies } from 'next/headers';
import { TZ_COOKIE, isValidTimeZone } from '@/lib/datetime';

/**
 * The visitor's IANA time zone from the `tz` cookie (set by the browser, see
 * components/local-time). Null on a first visit before the cookie exists;
 * <LocalTime> then formats in the browser after mount.
 */
export async function getViewerTimeZone(): Promise<string | null> {
  try {
    const raw = (await cookies()).get(TZ_COOKIE)?.value;
    const tz = raw ? decodeURIComponent(raw) : '';
    return isValidTimeZone(tz) ? tz : null;
  } catch {
    return null;
  }
}
