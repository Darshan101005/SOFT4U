import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { OrderDetailClient } from './order-detail-client';
import { requireAdminPage } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  return (
    <AdminLayout>
      <OrderDetailClient orderRef={id} />
    </AdminLayout>
  );
}
