import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { NavigationClient } from './navigation-client';

export const dynamic = 'force-dynamic';

export default async function AdminNavigationPage() {
  const navigation = await db.getNavigation();

  return (
    <AdminLayout>
      <NavigationClient initialNavigation={navigation} />
    </AdminLayout>
  );
}
