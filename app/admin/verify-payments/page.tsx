import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { VerifyPaymentsClient } from './verify-payments-client';
import { requireAdminPage } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminVerifyPaymentsPage() {
  await requireAdminPage();
  return (
    <AdminLayout>
      <VerifyPaymentsClient />
    </AdminLayout>
  );
}
