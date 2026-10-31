import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { requireAdminPage } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { botUsername, telegramEnabled } from '@/lib/telegram';
import { ProfileClient } from './profile-client';

export const dynamic = 'force-dynamic';

export default async function AdminProfilePage() {
  const current = await requireAdminPage();
  const admin = (await db.getAdminById(current.id)) || current;
  return (
    <AdminLayout>
      <ProfileClient admin={admin} telegramReady={telegramEnabled()} botName={botUsername()} />
    </AdminLayout>
  );
}
