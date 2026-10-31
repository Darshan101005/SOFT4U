import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { requireAdminPage } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { AdminsClient } from './admins-client';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const me = await requireAdminPage();
  const admins = await db.getAdmins();
  return (
    <AdminLayout>
      <AdminsClient initialAdmins={admins} meId={me.id} />
    </AdminLayout>
  );
}
