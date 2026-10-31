/**
 * Date and time display helpers (client and server safe).
 *
 * Timestamps are stored and compared in UTC. These helpers only change how a
 * moment is shown: every function takes the IANA time zone to show it in
 * (the viewer's zone from the `tz` cookie, the store zone for reports, or the
 * customer's zone for emails and Telegram).
 *
 * Format: "1 Nov 2026, 3:20 AM" (day month year, 12-hour time).
 */

export type DateInput = Date | string | number | null | undefined;

/** Cookie holding the browser's IANA time zone (set by components/local-time). */
export const TZ_COOKIE = 'tz';
/** Default store time zone for reports and admin alerts. */
export const DEFAULT_STORE_TIMEZONE = 'Asia/Karachi';

const ZONE_RE = /^(UTC|[A-Za-z]+(?:\/[A-Za-z0-9_+-]+){1,2})$/;

/** True for a real IANA zone name such as "Asia/Karachi" or "UTC". */
export function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== 'string' || tz.length > 64 || !ZONE_RE.test(tz)) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** The zone when valid, otherwise UTC. */
export function safeTimeZone(tz: unknown, fallback = 'UTC'): string {
  return isValidTimeZone(tz) ? tz : fallback;
}

export function toDate(input: DateInput): Date | null {
  if (input === null || input === undefined || input === '') return null;
  const d = input instanceof Date ? input : new Date(typeof input === 'string' ? input.replace(' ', 'T') : input);
  return Number.isNaN(d.getTime()) ? null : d;
}

const formatters = new Map<string, Intl.DateTimeFormat>();
function fmt(locale: string, tz: string, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const zone = safeTimeZone(tz);
  const key = `${locale}|${zone}|${JSON.stringify(opts)}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, { ...opts, timeZone: zone });
    formatters.set(key, f);
  }
  return f;
}

/** ICU uses narrow no-break spaces in some outputs; plain spaces read the same everywhere. */
const plain = (s: string) => s.replace(/[\u202f\u00a0]/g, ' ');

/** "1 Nov 2026" */
export function formatDate(input: DateInput, timeZone: string, empty = '—'): string {
  const d = toDate(input);
  return d ? plain(fmt('en-GB', timeZone, { day: 'numeric', month: 'short', year: 'numeric' }).format(d)) : empty;
}

/** "3:20 AM" */
export function formatTime(input: DateInput, timeZone: string, empty = '—'): string {
  const d = toDate(input);
  return d ? plain(fmt('en-US', timeZone, { hour: 'numeric', minute: '2-digit', hour12: true }).format(d)) : empty;
}

/** "1 Nov 2026, 3:20 AM" */
export function formatDateTime(input: DateInput, timeZone: string, empty = '—'): string {
  const d = toDate(input);
  return d ? `${formatDate(d, timeZone)}, ${formatTime(d, timeZone)}` : empty;
}

/** "November 2026" */
export function formatMonthYear(input: DateInput, timeZone: string, empty = '—'): string {
  const d = toDate(input);
  return d ? plain(fmt('en-GB', timeZone, { month: 'long', year: 'numeric' }).format(d)) : empty;
}

/** "Just now", "5 min ago", "2 hours ago", "Yesterday", "3 days ago", then the date. */
export function timeAgo(input: DateInput, timeZone: string, empty = 'Never', now = Date.now()): string {
  const d = toDate(input);
  if (!d) return empty;
  const diff = now - d.getTime();
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < min) return 'Just now';
  if (diff < hour) return `${Math.floor(diff / min)} min ago`;
  if (diff < day) {
    const h = Math.floor(diff / hour);
    return `${h} hour${h === 1 ? '' : 's'} ago`;
  }
  if (diff < 2 * day) return 'Yesterday';
  if (diff < 30 * day) return `${Math.floor(diff / day)} days ago`;
  return formatDate(d, timeZone);
}

/** "GMT+5", "GMT+5:30", or "UTC" for the zone at the given moment. */
export function offsetLabel(timeZone: string, at: DateInput = new Date()): string {
  const zone = safeTimeZone(timeZone);
  if (zone === 'UTC') return 'UTC';
  const d = toDate(at) || new Date();
  try {
    const part = fmt('en-US', zone, { timeZoneName: 'shortOffset' })
      .formatToParts(d)
      .find(p => p.type === 'timeZoneName')?.value;
    if (part) return part === 'GMT' ? 'GMT+0' : part;
  } catch {
    // older engines without shortOffset
  }
  return zone;
}

/** "1 Nov 2026, 3:20 AM (GMT+5:30)" for emails and Telegram, where no browser zone exists. */
export function formatWithZone(input: DateInput, timeZone: string | null | undefined, empty = '—'): string {
  const d = toDate(input);
  if (!d) return empty;
  const zone = safeTimeZone(timeZone);
  return `${formatDateTime(d, zone)} (${offsetLabel(zone, d)})`;
}

/** All IANA zones the runtime knows, UTC first. */
export function listTimeZones(): string[] {
  const supported = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
  const zones = supported ? supported('timeZone') : [DEFAULT_STORE_TIMEZONE, 'Asia/Kolkata', 'Asia/Dubai', 'Europe/London'];
  return ['UTC', ...zones.filter(z => z !== 'UTC')];
}
