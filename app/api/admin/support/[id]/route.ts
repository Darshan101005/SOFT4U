import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db, query } from '@/lib/db';
import type { SupportTicket } from '@/lib/db/types';
import { errorResponse, readJson } from '@/lib/api';
import { queueEmail } from '@/lib/email';
import { appBaseUrl, esc } from '@/lib/email-templates';
import { esc as tgEsc, notifyCustomerTelegram } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

const STATUSES: SupportTicket['status'][] = ['open', 'pending', 'waiting_customer', 'resolved', 'closed'];
const PRIORITIES: SupportTicket['priority'][] = ['low', 'medium', 'high', 'urgent'];

function replyEmail(ticket: SupportTicket, message: string) {
  const url = `${appBaseUrl()}/account/support`;
  const subject = `Re: ${ticket.subject} [${ticket.ticketNumber}]`;
  const html = `<!doctype html><html><body style="margin:0;background:#F8FBF4;font-family:Arial,Helvetica,sans-serif;color:#2B3328">
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="font-size:20px;font-weight:800;color:#2B3328;margin-bottom:16px">Soft4u</div>
<div style="background:#fff;border:1px solid #DDE7D3;border-radius:16px;padding:24px">
<p style="margin:0 0 8px;font-size:15px">Hi ${esc(ticket.customerName)},</p>
<p style="margin:0 0 16px;font-size:14px;color:#4D5848">Our support team replied to your ticket <strong>${esc(ticket.ticketNumber)}</strong> (${esc(ticket.subject)}):</p>
<div style="background:#F1F7EA;border-radius:12px;padding:16px;font-size:14px;line-height:1.6;white-space:pre-wrap">${esc(message)}</div>
<p style="margin:20px 0 0"><a href="${url}" style="display:inline-block;background:#93C572;color:#2B3328;font-weight:700;text-decoration:none;padding:12px 20px;border-radius:12px">View and reply</a></p>
</div>
<p style="font-size:12px;color:#687263;margin-top:16px">This is an automated message. Please do not reply to this email. Reply from your Soft4u account or contact us at ${appBaseUrl()}/contact.</p>
</div></body></html>`;
  const text = `Hi ${ticket.customerName},\n\nOur support team replied to your ticket ${ticket.ticketNumber} (${ticket.subject}):\n\n${message}\n\nView and reply: ${url}\n\nThis is an automated message. Please do not reply to this email.`;
  return { subject, html, text };
}

/**
 * POST { action, ... }
 *   reply     { message, isInternalNote? }  customer is emailed (and told on Telegram) unless it is an internal note
 *   status    { status }
 *   priority  { priority }
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;
  try {
    const ticket = await db.getTicketById(id);
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    const body = await readJson(req);
    if (body.action === 'reply') {
      const message = String(body.message || '').trim().slice(0, 5000);
      if (!message) return NextResponse.json({ error: 'Write a message' }, { status: 400 });
      const internal = Boolean(body.isInternalNote);
      const updated = await db.addTicketMessage(ticket.id, {
        senderId: admin.id,
        senderName: internal ? admin.name : 'Soft4u Support',
        senderRole: 'ADMIN',
        message,
        isInternalNote: internal,
      });
      if (!internal) {
        queueEmail(ticket.customerEmail, replyEmail(ticket, message), 'other');
        if (ticket.customerId) await notifyCustomerTelegram(ticket.customerId, `💬 Support replied to <code>${tgEsc(ticket.ticketNumber)}</code>:\n\n${tgEsc(message.slice(0, 1500))}`);
      }
      return NextResponse.json({ ok: true, ticket: updated });
    }
    if (body.action === 'status') {
      if (!STATUSES.includes(body.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      return NextResponse.json({ ok: true, ticket: await db.updateTicketStatus(ticket.id, body.status) });
    }
    if (body.action === 'priority') {
      if (!PRIORITIES.includes(body.priority)) return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
      await query(`UPDATE support_tickets SET priority = $2, updated_at = now() WHERE id = $1`, [ticket.id, body.priority]);
      return NextResponse.json({ ok: true, ticket: await db.getTicketById(ticket.id) });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return errorResponse(err);
  }
}
