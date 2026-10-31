import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { errorResponse, readJson } from '@/lib/api';
import { sendEmail } from '@/lib/email';
import { esc } from '@/lib/email-templates';
import { EMAIL_RE, normalizeEmail } from '@/lib/password-policy';
import { isLimited, recordAttempt } from '@/lib/rate-limit';
import { clientIp } from '@/lib/request-meta';
import { getSessionUser } from '@/lib/session';
import { siteConfig } from '@/lib/site-config';

/**
 * POST { name, email, phone?, subject?, message, website? (honeypot) } -> { ok }
 * Sends the message to the store's contact email. 5 messages per hour per IP.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await readJson(req);
    if (body.website) return NextResponse.json({ ok: true });
    const name = String(body.name || '').trim().slice(0, 80);
    const email = normalizeEmail(String(body.email || '')).slice(0, 120);
    const phone = String(body.phone || '').trim().slice(0, 30);
    const subject = String(body.subject || '').trim().slice(0, 140);
    const message = String(body.message || '').trim().slice(0, 4000);
    if (name.length < 2) return NextResponse.json({ error: 'Enter your name' }, { status: 400 });
    if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    if (message.length < 10) return NextResponse.json({ error: 'Write a message of at least 10 characters' }, { status: 400 });

    const key = `contact:${clientIp(req.headers) || 'unknown'}`;
    if (await isLimited(key, 5, 60)) return NextResponse.json({ error: 'Too many messages. Please try again later or message us on WhatsApp.' }, { status: 429 });
    await recordAttempt(key);

    const [settings, user] = await Promise.all([db.getSiteSettings(), getSessionUser()]);
    const to = settings.contactEmail || siteConfig.email;
    const rows: Array<[string, string]> = [
      ['Name', name],
      ['Email', email],
      ['Phone / WhatsApp', phone || '-'],
      ['Subject', subject || '-'],
      ['Account', user ? `${user.name} (${user.email})` : 'Not signed in'],
    ];
    const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#2B3328;">
<h2 style="margin:0 0 12px 0;">New contact message</h2>
<table cellpadding="6" cellspacing="0">${rows.map(([k, v]) => `<tr><td style="color:#687263;">${esc(k)}</td><td><strong>${esc(v)}</strong></td></tr>`).join('')}</table>
<p style="white-space:pre-wrap;border-top:1px solid #DDE7D3;padding-top:12px;margin-top:12px;">${esc(message)}</p>
<p style="color:#687263;font-size:12px;">Reply to the customer at ${esc(email)}.</p></div>`;
    const text = `New contact message\n\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${message}`;
    const sent = await sendEmail(to, { subject: `Contact: ${subject || name}`.slice(0, 160), html, text }, 'other');
    if (!sent.ok) return NextResponse.json({ error: 'We could not send your message right now. Please message us on WhatsApp.' }, { status: 502 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
