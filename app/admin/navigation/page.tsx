import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { NavigationClient } from './navigation-client';
import { requireAdminPage } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminNavigationPage() {
  await requireAdminPage();
  const navigation = await db.getNavigation();

  return (
    <AdminLayout>
      <NavigationClient initialNavigation={navigation} />
    </AdminLayout>
  );
}
