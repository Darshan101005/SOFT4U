import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { BannersClient } from './banners-client';
import { requireAdminPage } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminBannersPage() {
  await requireAdminPage();
  const banners = await db.getBanners();
  return (
    <AdminLayout>
      <BannersClient initialItems={banners} />
    </AdminLayout>
  );
}
