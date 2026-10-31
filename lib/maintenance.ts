import { getPool } from '@/lib/db/pool';

/**
 * Opportunistic housekeeping. Neon free tier must be allowed to scale to
 * zero, so there is no cron or background poller: pruning runs on real
 * requests (order reads, checkout, auth) and is throttled in-process.
 *
 * Orders never expire: an unpaid order stays "Awaiting payment" until the
 * customer uploads proof or the customer / admin cancels it. Vault items are
 * only assigned at delivery, so an unpaid order holds no stock.
 */

const PRUNE_MS = 60 * 60 * 1000;
export const ACTIVITY_RETENTION_DAYS = 7;
const EMAIL_LOG_RETENTION_DAYS = 30;

let lastPrune = 0;

/** Hourly at most: drop expired sessions, OTPs, link codes, old activity and email logs. */
export async function pruneIfDue(): Promise<void> {
  if (Date.now() - lastPrune < PRUNE_MS) return;
  lastPrune = Date.now();
  try {
    await getPool().query(
      `DELETE FROM user_sessions WHERE expires_at < now();
       DELETE FROM email_otps WHERE expires_at < now() - interval '1 day';
       DELETE FROM auth_attempts WHERE created_at < now() - interval '1 day';
       DELETE FROM telegram_link_codes WHERE expires_at < now();
       DELETE FROM telegram_state WHERE updated_at < now() - interval '2 days';
       DELETE FROM activity_log WHERE created_at < now() - interval '${ACTIVITY_RETENTION_DAYS} days';
       DELETE FROM email_log WHERE created_at < now() - interval '${EMAIL_LOG_RETENTION_DAYS} days';`,
    );
  } catch (err) {
    console.error('[sweep] prune failed:', err instanceof Error ? err.message : err);
  }
}

/** Fire-and-forget wrapper for request handlers. */
export function runSweeps(): void {
  pruneIfDue().catch(() => {});
}
