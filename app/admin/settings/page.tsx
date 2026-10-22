import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { SettingsClient } from './settings-client';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const settings = await db.getSiteSettings();

  return (
    <AdminLayout>
      <SettingsClient initialSettings={settings} />
    </AdminLayout>
  );
}
