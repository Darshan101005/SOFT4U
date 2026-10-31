import { redirect } from 'next/navigation';
import type { User } from '@/lib/db/types';
import { getSessionUser } from '@/lib/session';
import { safe } from '@/app/_store/storefront';

/** Signed-in customer for an account page, or a redirect to /login that returns here. */
export async function requireAccountUser(path: string): Promise<User> {
  const user = await safe(() => getSessionUser(), null);
  if (!user) redirect(`/login?next=${encodeURIComponent(path)}`);
  return user;
}
