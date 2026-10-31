import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { AdminOrdersClient } from './admin-orders-client';
import { requireAdminPage } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; search?: string }> }) {
  await requireAdminPage();
  const sp = await searchParams;
  return (
    <AdminLayout>
      <AdminOrdersClient initialStatus={sp.status || 'all'} initialSearch={sp.search || ''} />
    </AdminLayout>
  );
}
