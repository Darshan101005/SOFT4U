import React from 'react';
import { listSessions } from '@/lib/session';
import { deviceName } from '@/lib/request-meta';
import { safe } from '@/app/_store/storefront';
import { requireAccountUser } from '../require-user';
import { SecurityClient } from './security-client';

export const dynamic = 'force-dynamic';

export default async function AccountSecurityPage() {
  const user = await requireAccountUser('/account/security');
  const sessions = await safe(() => listSessions(user.id), []);
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">Security</div>
        <h1 className="text-2xl font-extrabold text-charcoal">Account security</h1>
        <p className="text-sm text-charcoal-subtle mt-0.5">Protect your account with two-factor authentication and review signed-in devices.</p>
      </div>
      <SecurityClient
        twoFactorEnabled={user.twoFactorEnabled}
        sessions={sessions.map(s => ({ id: s.id, device: s.userAgent ? deviceName(s.userAgent) : 'Unknown device', ip: s.ip || '', lastUsedAt: s.lastUsedAt, createdAt: s.createdAt, current: s.current }))}
      />
    </div>
  );
}
