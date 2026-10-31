import React from 'react';
import { db } from '@/lib/db';
import type { Order, SupportTicket } from '@/lib/db/types';
import { safe } from '@/app/_store/storefront';
import { requireAccountUser } from '../require-user';
import { SupportClient } from './support-client';

export const dynamic = 'force-dynamic';

export default async function AccountSupportPage() {
  const user = await requireAccountUser('/account/support');
  const [tickets, orders] = await Promise.all([
    safe(() => db.getTickets({ customerId: user.id }), [] as SupportTicket[]),
    safe(() => db.getOrders({ customerId: user.id, limit: 50 }), [] as Order[]),
  ]);
  const visible = tickets.map(t => ({ ...t, messages: t.messages.filter(m => !m.isInternalNote) }));
  return <SupportClient initialTickets={visible} orderNumbers={orders.map(o => o.orderNumber)} />;
}
