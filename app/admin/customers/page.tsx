import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { CustomersClient } from './customers-client';
import { requireAdminPage } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage() {
  await requireAdminPage();
  return (
    <AdminLayout>
      <CustomersClient />
    </AdminLayout>
  );
}
