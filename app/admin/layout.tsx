import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// The admin panel is reached only by typing /admin. It is hidden from search engines.
// TODO: add admin authentication before any real data (Neon, payments, customers) is connected.
export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
