import { db } from '@/lib/db';
import { User } from '@/lib/db/types';

export async function verifyUserCredentials(email: string, password: string): Promise<User | null> {
  const user = await db.getUserByEmail(email);
  if (!user) return null;
  // Compare password (plain/hashed)
  if (user.passwordHash === password || user.passwordHash === `hash_${password}`) {
    return user;
  }
  return null;
}
