import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const customerEmail = req.nextUrl.searchParams.get('email');
  const allTickets = await db.getTickets();
  if (customerEmail) {
    const filtered = allTickets.filter(t => t.customerEmail.toLowerCase() === customerEmail.toLowerCase());
    return NextResponse.json({ tickets: filtered });
  }
  return NextResponse.json({ tickets: allTickets });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ticketId, subject, message, customerEmail, customerName, customerId, orderId, category, priority } = body;

    if (action === 'reply' && ticketId && message) {
      const senderRole = body.senderRole || 'CUSTOMER';
      const senderName = body.senderName || customerName || 'Customer';
      const senderId = body.senderId || customerId || 'user_anon';
      const isInternalNote = !!body.isInternalNote;

      const updated = await db.addTicketMessage(ticketId, {
        senderId,
        senderName,
        senderRole,
        message,
        isInternalNote
      });
      return NextResponse.json({ success: true, ticket: updated });
    }

    if (!subject || !message || !customerEmail) {
      return NextResponse.json({ error: 'Subject, message, and customer email are required' }, { status: 400 });
    }

    const newTicket = await db.createTicket({
      customerId: customerId || undefined,
      customerName: customerName || 'Customer',
      customerEmail,
      subject,
      orderId: orderId || undefined,
      category: category || 'General Support',
      priority: priority || 'medium',
      status: 'open',
      messages: [
        {
          id: `msg_${Date.now()}`,
          senderId: customerId || 'customer',
          senderName: customerName || 'Customer',
          senderRole: 'CUSTOMER',
          message,
          isInternalNote: false,
          timestamp: new Date().toISOString()
        }
      ]
    });

    return NextResponse.json({ success: true, ticket: newTicket }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Support ticket failed' }, { status: 500 });
  }
}
