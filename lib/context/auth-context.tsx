'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User } from '@/lib/db/types';

/**
 * Client auth state backed by the httpOnly session cookie (see lib/session.ts).
 * The user is loaded from GET /api/auth/session; nothing sensitive is kept in
 * localStorage. Each method returns { success, error?, ... } for forms.
 */

export interface AuthResult {
  success: boolean;
  error?: string;
  code?: string;
  /** login: 'ok' | 'two_factor_required' | 'verification_required' */
  status?: 'ok' | 'two_factor_required' | 'verification_required';
  email?: string;
  resendInSeconds?: number;
  retryAfterSeconds?: number;
  attemptsLeft?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  refresh: () => Promise<User | null>;
  login: (email: string, password: string) => Promise<AuthResult>;
  verifyLogin2fa: (code: string) => Promise<AuthResult>;
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<AuthResult>;
  verifyEmail: (email: string, code: string) => Promise<AuthResult>;
  resendCode: (email: string, purpose?: 'signup' | 'password_reset') => Promise<AuthResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACTIVITY_FLAG = 'soft4u:session-logged-for';

async function post(url: string, body?: unknown): Promise<{ ok: boolean; data: any }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: { error: 'Network error. Check your connection and try again.' } };
  }
}

function toResult(ok: boolean, data: any): AuthResult {
  return {
    success: ok,
    error: ok ? undefined : data?.error || 'Something went wrong',
    code: data?.code,
    status: data?.status,
    email: data?.email,
    resendInSeconds: data?.resendInSeconds,
    retryAfterSeconds: data?.retryAfterSeconds,
    attemptsLeft: data?.attemptsLeft,
  };
}

/** One "session" activity row (IP / device) per signed-in user per browser tab. */
function logSessionActivity(user: User) {
  try {
    if (sessionStorage.getItem(ACTIVITY_FLAG) === user.id) return;
    sessionStorage.setItem(ACTIVITY_FLAG, user.id);
  } catch {
    // sessionStorage unavailable: log anyway
  }
  fetch('/api/auth/activity', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {});
}

async function loadSessionUser(): Promise<User | null> {
  try {
    const res = await fetch('/api/auth/session', { cache: 'no-store' });
    const data = await res.json();
    const next: User | null = data?.user ?? null;
    if (next) logSessionActivity(next);
    return next;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const next = await loadSessionUser();
    setUser(next);
    setIsLoading(false);
    return next;
  }, []);

  useEffect(() => {
    let active = true;
    loadSessionUser().then(next => {
      if (!active) return;
      setUser(next);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { ok, data } = await post('/api/auth/login', { email, password });
    if (ok && data.status === 'ok') await refresh();
    return toResult(ok, data);
  };

  const verifyLogin2fa = async (code: string) => {
    const { ok, data } = await post('/api/auth/login/2fa', { code });
    if (ok) await refresh();
    return toResult(ok, data);
  };

  const register = async (name: string, email: string, password: string, confirmPassword: string) => {
    const { ok, data } = await post('/api/auth/signup', { name, email, password, confirmPassword });
    return toResult(ok, data);
  };

  const verifyEmail = async (email: string, code: string) => {
    const { ok, data } = await post('/api/auth/verify-email', { email, code });
    if (ok) await refresh();
    return toResult(ok, data);
  };

  const resendCode = async (email: string, purpose: 'signup' | 'password_reset' = 'signup') => {
    const { ok, data } = await post('/api/auth/resend-code', { email, purpose });
    return toResult(ok, data);
  };

  const logout = async () => {
    await post('/api/auth/logout');
    try {
      sessionStorage.removeItem(ACTIVITY_FLAG);
    } catch {
      // ignore
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, refresh, login, verifyLogin2fa, register, verifyEmail, resendCode, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
