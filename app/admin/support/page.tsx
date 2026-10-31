import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { AdminSupportClient } from './admin-support-client';
import { requireAdminPage } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminSupportPage() {
  await requireAdminPage();
  const tickets = await db.getTickets();
  return (
    <AdminLayout>
      <AdminSupportClient initialTickets={tickets} />
    </AdminLayout>
  );
}
