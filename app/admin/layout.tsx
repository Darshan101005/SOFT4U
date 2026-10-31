import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { requireAdminPage } from '@/lib/admin-auth';

// The admin panel is reached only by typing /admin and is hidden from search engines.
// middleware.ts checks the admin JWT; this layout and every admin page re-check the
// admin against the database (paused / deleted / signed-out / revoked sessions).
// Layouts do not re-render on client navigation, so each page calls requireAdminPage() too.
export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminRootLayout({ children }: { children: ReactNode }) {
  const pathname = (await headers()).get('x-pathname') || '';
  if (pathname !== '/admin/login') {
    await requireAdminPage();
  }
  return <>{children}</>;
}
