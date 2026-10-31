import { NextResponse } from 'next/server';
import { AuthError } from '@/lib/auth';
import { OrderError } from '@/lib/order-lifecycle';
import { CheckoutError } from '@/lib/checkout';
import { getSessionUser } from '@/lib/session';
import type { User } from '@/lib/db/types';

/** Shared helpers for route handlers. */

export async function readJson<T = Record<string, any>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}

/** Maps known errors to JSON responses; anything else becomes a generic 500 (details only in logs). */
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.message, code: err.code, ...err.extra }, { status: err.status });
  }
  if (err instanceof OrderError || err instanceof CheckoutError) {
    return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
  }
  console.error('[api] unexpected error:', err);
  return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
}

/** `const user = await requireUser(); if (user instanceof NextResponse) return user;` */
export async function requireUser(): Promise<User | NextResponse> {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Please sign in' }, { status: 401 });
  return user;
}
