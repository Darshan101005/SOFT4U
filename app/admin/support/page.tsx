import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { AdminSupportClient } from './admin-support-client';

export const dynamic = 'force-dynamic';

export default async function AdminSupportPage() {
  const tickets = await db.getTickets();

  return (
    <AdminLayout>
      <AdminSupportClient initialTickets={tickets} />
    </AdminLayout>
  );
}
