import { after } from 'next/server';
import { Resend } from 'resend';
import { getPool } from '@/lib/db/pool';
import type { EmailContent } from '@/lib/email-templates';
import { siteConfig } from '@/lib/site-config';

/**
 * Email sending via Resend. Sends never throw: failures are logged to the
 * console and the email_log table, so a send problem (for example the domain
 * not verified in Resend yet) can never break signup, checkout or delivery.
 *
 * No Reply-To header is set: every template says "do not reply" and points to
 * the Contact page / WhatsApp instead.
 */

let client: Resend | null = null;

export function emailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function resend(): Resend | null {
  if (!emailEnabled()) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

function fromAddress(): string {
  return process.env.EMAIL_FROM || `${siteConfig.name} <${siteConfig.email}>`;
}

export type EmailKind =
  | 'signup_otp'
  | 'resend_otp'
  | 'password_reset'
  | 'welcome'
  | 'two_factor'
  | 'order_placed'
  | 'order_under_review'
  | 'payment_approved'
  | 'payment_rejected'
  | 'order_delivered'
  | 'admin_new_order'
  | 'admin_invite'
  | 'other';

export interface SendResult {
  ok: boolean;
  id?: string;
  error?: string;
}

async function log(to: string, subject: string, kind: EmailKind, status: 'sent' | 'failed' | 'skipped', id?: string, error?: string) {
  try {
    await getPool().query(
      `INSERT INTO email_log (to_email, subject, kind, status, provider_id, error) VALUES ($1,$2,$3,$4,$5,$6)`,
      [to, subject.slice(0, 300), kind, status, id ?? null, error ? error.slice(0, 1000) : null],
    );
  } catch {
    // logging must never break the caller
  }
}

/** Sends one email and resolves with the outcome. Never rejects. */
export async function sendEmail(to: string | string[], content: EmailContent, kind: EmailKind = 'other'): Promise<SendResult> {
  const recipients = (Array.isArray(to) ? to : [to]).map(t => t.trim()).filter(Boolean);
  const first = recipients[0] || '';
  if (recipients.length === 0) return { ok: false, error: 'no recipient' };
  const r = resend();
  if (!r) {
    console.warn(`[email] RESEND_API_KEY not set, skipped "${content.subject}" to ${first}`);
    await log(first, content.subject, kind, 'skipped', undefined, 'RESEND_API_KEY not set');
    return { ok: false, error: 'email disabled' };
  }
  try {
    const { data, error } = await r.emails.send({
      from: fromAddress(),
      to: recipients,
      subject: content.subject,
      html: content.html,
      text: content.text,
    });
    if (error) {
      console.error(`[email] send failed (${kind}) to ${first}:`, error.message);
      await log(first, content.subject, kind, 'failed', undefined, error.message);
      return { ok: false, error: error.message };
    }
    await log(first, content.subject, kind, 'sent', data?.id);
    return { ok: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[email] send error (${kind}) to ${first}:`, message);
    await log(first, content.subject, kind, 'failed', undefined, message);
    return { ok: false, error: message };
  }
}

/**
 * Fire-and-forget for request handlers: runs after the response is sent via
 * next/server `after()` (kept alive on Vercel), or detached outside a request.
 */
export function queueEmail(to: string | string[], content: EmailContent, kind: EmailKind = 'other'): void {
  const run = () => sendEmail(to, content, kind).then(() => undefined);
  try {
    after(run);
  } catch {
    void run();
  }
}
