import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/admin-auth';
import { getSessionUser } from '@/lib/session';
import { errorResponse } from '@/lib/api';

export const dynamic = 'force-dynamic';

/** GET -> admins: every ticket; signed-in customers: their own tickets. */
export async function GET() {
  const admin = await getCurrentAdmin();
  if (admin) return NextResponse.json({ tickets: await db.getTickets() });
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Please sign in' }, { status: 401 });
  const tickets = (await db.getTickets({ customerId: user.id })).map(t => ({ ...t, messages: t.messages.filter(m => !m.isInternalNote) }));
  return NextResponse.json({ tickets });
}

/**
 * POST { subject, message, orderId?, category?, priority? }       -> new ticket (signed-in customer)
 * POST { action: 'reply', ticketId, message, isInternalNote? }      -> reply (owner or admin; internal notes admin only)
 * POST { action: 'status', ticketId, status }                       -> admin only
 * The sender identity always comes from the session, never from the body.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ticketId, subject, message, orderId, category, priority } = body;
    const admin = await getCurrentAdmin();
    const user = admin ? null : await getSessionUser();

    if (action === 'status') {
      if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (!['open', 'pending', 'waiting_customer', 'resolved', 'closed'].includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      return NextResponse.json({ success: true, ticket: await db.updateTicketStatus(ticketId, body.status) });
    }

    if (action === 'reply') {
      const text = String(message || '').trim();
      if (!ticketId || !text) return NextResponse.json({ error: 'Message is required' }, { status: 400 });
      const ticket = await db.getTicketById(ticketId);
      if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      if (admin) {
        const updated = await db.addTicketMessage(ticket.id, {
          senderId: admin.id,
          senderName: 'Soft4u Support',
          senderRole: 'ADMIN',
          message: text,
          isInternalNote: Boolean(body.isInternalNote),
        });
        return NextResponse.json({ success: true, ticket: updated });
      }
      if (!user || ticket.customerId !== user.id) return NextResponse.json({ error: 'Please sign in' }, { status: 401 });
      const updated = await db.addTicketMessage(ticket.id, { senderId: user.id, senderName: user.name, senderRole: 'CUSTOMER', message: text });
      return NextResponse.json({ success: true, ticket: updated ? { ...updated, messages: updated.messages.filter(m => !m.isInternalNote) } : null });
    }

    if (!user) return NextResponse.json({ error: 'Please sign in to open a ticket' }, { status: 401 });
    const text = String(message || '').trim();
    if (!subject || !text) return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
    const newTicket = await db.createTicket({
      customerId: user.id,
      customerName: user.name,
      customerEmail: user.email,
      subject: String(subject).slice(0, 160),
      orderId: orderId || undefined,
      category: category || 'General Support',
      priority: ['low', 'medium', 'high', 'urgent'].includes(priority) ? priority : 'medium',
      status: 'open',
      messages: [{ senderId: user.id, senderName: user.name, senderRole: 'CUSTOMER', message: text.slice(0, 5000) }],
    });
    return NextResponse.json({ success: true, ticket: newTicket }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
