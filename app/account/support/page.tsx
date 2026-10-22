import React from 'react';
import { AccountLayout } from '@/components/account-layout';
import { db } from '@/lib/db';
import { SupportClient } from './support-client';

export const dynamic = 'force-dynamic';

export default async function AccountSupportPage() {
  const tickets = await db.getTickets();

  return (
    <AccountLayout>
      <SupportClient initialTickets={tickets} />
    </AccountLayout>
  );
}
