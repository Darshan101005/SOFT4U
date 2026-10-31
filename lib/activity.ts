import https from 'https';
import { after } from 'next/server';
import { getPool } from '@/lib/db/pool';
import { pruneIfDue } from '@/lib/maintenance';
import { clientIp, deviceName, userAgent } from '@/lib/request-meta';

/**
 * IP + geo + device logging for important events (signup, login, checkout,
 * payment proof, admin login, ...). Geo comes from ipwho.is (location, ISP,
 * flag, timezone) and ipapi.is (VPN / proxy / Tor / datacenter flags).
 * Rows are kept 7 days (pruned opportunistically); users.last_seen_at keeps
 * the "last seen" time beyond that.
 */

export type ActivityEvent =
  | 'signup'
  | 'email_verified'
  | 'login'
  | 'login_failed'
  | 'logout'
  | 'session'
  | 'password_reset'
  | 'password_change'
  | '2fa_enabled'
  | '2fa_disabled'
  | 'order_placed'
  | 'payment_proof'
  | 'telegram_linked'
  | 'admin_login'
  | 'admin_login_failed';

/** Events the browser may report through POST /api/auth/activity. */
export const CLIENT_EVENTS: ActivityEvent[] = ['session'];

function isIPv4(ip: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(ip);
}

function getJson(url: string, timeoutMs = 4000): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'soft4u/1.0', Accept: 'application/json' }, timeout: timeoutMs }, res => {
      let body = '';
      res.on('data', chunk => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 0, data: JSON.parse(body) });
        } catch {
          reject(new Error('invalid JSON'));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
  });
}

async function fetchGeo(ip: string) {
  const [who, api] = await Promise.allSettled([getJson(`https://ipwho.is/${encodeURIComponent(ip)}`), getJson(`https://api.ipapi.is/?q=${encodeURIComponent(ip)}`)]);
  const ipwho = who.status === 'fulfilled' && who.value.status < 300 && who.value.data?.success !== false ? who.value.data : null;
  const ipapi = api.status === 'fulfilled' && api.value.status < 300 ? api.value.data : null;
  return { ipwho, ipapi };
}

export interface RecordActivityInput {
  headers: Headers;
  eventType: ActivityEvent;
  userId?: string | null;
  email?: string | null;
  actorType?: 'customer' | 'admin' | 'guest';
  /** Optional IPs reported by the browser (used only when headers have none). */
  clientIpv4?: string | null;
  clientIpv6?: string | null;
}

/** Writes one activity_log row. Never throws. */
export async function recordActivity(input: RecordActivityInput): Promise<void> {
  try {
    const headerIp = clientIp(input.headers);
    const ua = userAgent(input.headers) || null;
    let ipv4: string | null = null;
    let ipv6: string | null = null;
    if (headerIp) {
      if (isIPv4(headerIp)) ipv4 = headerIp;
      else if (headerIp.includes(':')) ipv6 = headerIp;
    }
    if (!ipv4 && input.clientIpv4 && isIPv4(input.clientIpv4)) ipv4 = input.clientIpv4;
    if (!ipv6 && input.clientIpv6 && input.clientIpv6.includes(':') && input.clientIpv6 !== '::1') ipv6 = input.clientIpv6;

    const lookup = ipv4 || ipv6;
    const { ipwho, ipapi } = lookup ? await fetchGeo(lookup) : { ipwho: null, ipapi: null };
    const conn = ipwho?.connection;
    const company = ipapi?.company;

    const pool = getPool();
    await pool.query(
      `INSERT INTO activity_log (user_id, email, actor_type, event_type, ipv4, ipv6, continent, country, country_code, region, city,
         latitude, longitude, postal, calling_code, flag_img, flag_emoji, currency_code, timezone_id, timezone_utc, isp, org,
         is_vpn, vpn_service, vpn_url, is_proxy, is_tor, is_datacenter, is_mobile, is_crawler, is_abuser, user_agent, device)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33)`,
      [
        input.userId || null,
        input.email || null,
        input.actorType || (input.userId ? 'customer' : 'guest'),
        input.eventType,
        ipv4,
        ipv6,
        ipwho?.continent || null,
        ipwho?.country || null,
        ipwho?.country_code || null,
        ipwho?.region || null,
        ipwho?.city || null,
        ipwho?.latitude ?? null,
        ipwho?.longitude ?? null,
        ipwho?.postal || null,
        ipwho?.calling_code || null,
        ipwho?.flag?.img || null,
        ipwho?.flag?.emoji || null,
        ipapi?.location?.currency_code || ipwho?.currency?.code || null,
        ipwho?.timezone?.id || null,
        ipwho?.timezone?.utc || null,
        conn?.isp || company?.name || null,
        conn?.org || company?.name || null,
        Boolean(ipapi?.is_vpn),
        ipapi?.vpn?.service || null,
        ipapi?.vpn?.url || null,
        Boolean(ipapi?.is_proxy),
        Boolean(ipapi?.is_tor),
        Boolean(ipapi?.is_datacenter),
        Boolean(ipapi?.is_mobile),
        Boolean(ipapi?.is_crawler),
        Boolean(ipapi?.is_abuser),
        ua,
        ua ? deviceName(ua) : null,
      ],
    );
    if (input.userId && input.actorType !== 'admin') {
      await pool.query(`UPDATE users SET last_seen_at = now() WHERE id = $1`, [input.userId]);
    }
  } catch (err) {
    console.error('[activity] record failed:', err instanceof Error ? err.message : err);
  } finally {
    pruneIfDue().catch(() => {});
  }
}

/** Records activity after the response is sent (geo lookups never slow a request). */
export function logActivity(input: RecordActivityInput): void {
  const headers = new Headers(input.headers);
  const run = () => recordActivity({ ...input, headers });
  try {
    after(run);
  } catch {
    void run();
  }
}
