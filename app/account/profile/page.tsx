'use client';

import React, { useState } from 'react';
import { AccountLayout } from '@/components/account-layout';
import { useAuth } from '@/lib/context/auth-context';
import { Check, User, Mail, Phone, MessageSquare } from 'lucide-react';

export default function AccountProfilePage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || 'Demo Customer');
  const [email] = useState(user?.email || 'customer@example.com');
  const [phone, setPhone] = useState(user?.phone || '+92 300 0000000');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || '+923000000000');
  const [telegram, setTelegram] = useState(user?.telegram || '@demo_customer');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <AccountLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">
            ACCOUNT PREFERENCES
          </div>
          <h1 className="text-2xl font-extrabold text-charcoal">Customer Profile</h1>
          <p className="text-xs text-charcoal-subtle mt-0.5">
            Manage your personal contact info and automated delivery notification channels.
          </p>
        </div>

        <div className="bg-white border border-charcoal-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          {saved && (
            <div className="p-3 bg-pista-lighter border border-pista text-xs font-semibold text-pista-dark rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Profile preferences updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-charcoal block mb-1">Full Legal Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg focus:bg-white focus:outline-none focus:border-pista-hover"
              />
            </div>

            <div>
              <label className="font-semibold text-charcoal block mb-1">Primary Email (Locked for security)</label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-subtle text-charcoal-subtle cursor-not-allowed"
              />
              <span className="text-[10px] text-charcoal-subtle mt-1 block">
                To alter primary account ownership, open a support ticket with identity verification.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-charcoal block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg focus:bg-white focus:outline-none focus:border-pista-hover"
                />
              </div>

              <div>
                <label className="font-semibold text-charcoal block mb-1">WhatsApp Identifier</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg focus:bg-white focus:outline-none focus:border-pista-hover"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-charcoal block mb-1">Telegram Handle</label>
              <input
                type="text"
                value={telegram}
                onChange={e => setTelegram(e.target.value)}
                placeholder="@username"
                className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg focus:bg-white focus:outline-none focus:border-pista-hover"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-pista text-charcoal hover:bg-pista-hover text-xs font-bold rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </AccountLayout>
  );
}
