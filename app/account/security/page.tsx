'use client';

import React, { useState } from 'react';
import { AccountLayout } from '@/components/account-layout';
import { Shield, Key, Smartphone, Check, Lock } from 'lucide-react';

export default function AccountSecurityPage() {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [saved, setSaved] = useState(false);

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <AccountLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">
            CREDENTIAL & VAULT PROTECTION
          </div>
          <h1 className="text-2xl font-extrabold text-charcoal">Security Settings</h1>
          <p className="text-xs text-charcoal-subtle mt-0.5">
            Manage your account password, active sessions, and multi-factor authorization.
          </p>
        </div>

        <div className="bg-white border border-charcoal-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-surface-muted">
            <Key className="w-4 h-4 text-pista-dark" />
            <h2 className="text-sm font-bold text-charcoal">Change Password</h2>
          </div>

          {saved && (
            <div className="p-3 bg-pista-lighter border border-pista text-xs font-semibold text-pista-dark rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Password updated successfully across all sessions.</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-charcoal block mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPass}
                onChange={e => setCurrentPass(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg focus:bg-white focus:outline-none focus:border-pista-hover"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-charcoal block mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg focus:bg-white focus:outline-none focus:border-pista-hover"
                />
              </div>

              <div>
                <label className="font-semibold text-charcoal block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg focus:bg-white focus:outline-none focus:border-pista-hover"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-pista-dark text-white hover:bg-pista-darker text-xs font-semibold rounded-lg transition-colors"
            >
              Update Password
            </button>
          </form>

          {/* Active Sessions */}
          <div className="pt-6 border-t border-surface-muted space-y-3">
            <h3 className="text-xs font-bold text-charcoal-subtle uppercase tracking-wider">
              Active Authorized Devices
            </h3>

            <div className="p-3 bg-surface-bg rounded-xl border border-charcoal-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-pista-dark" />
                <div>
                  <div className="font-bold text-charcoal">Chrome on macOS · Current Session</div>
                  <div className="text-[11px] text-charcoal-subtle">Active now · IP: 192.168.1.1</div>
                </div>
              </div>
              <span className="text-[10px] text-pista-dark font-bold font-mono">ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </AccountLayout>
  );
}
