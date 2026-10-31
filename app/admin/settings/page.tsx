import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { SettingsClient } from './settings-client';
import { requireAdminPage } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  await requireAdminPage();
  const settings = await db.getSiteSettings();

  return (
    <AdminLayout>
      <SettingsClient initialSettings={settings} />
    </AdminLayout>
  );
}
