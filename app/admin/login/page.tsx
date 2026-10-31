import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/admin-auth';
import { AdminLoginClient } from './login-client';

export const metadata: Metadata = {
  title: 'Admin sign in',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith('/admin') && !next.startsWith('/admin/login') ? next : '/admin';
  if (await getCurrentAdmin()) redirect(safeNext);
  return <AdminLoginClient next={safeNext} />;
}
