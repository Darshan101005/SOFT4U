'use client';

import React, { useState } from 'react';
import { PaymentGateway } from '@/lib/db/types';
import { CreditCard, Check, ShieldCheck, ToggleLeft, ToggleRight, X } from 'lucide-react';

export function PaymentGatewaysClient({ initialGateways }: { initialGateways: PaymentGateway[] }) {
  const [gateways, setGateways] = useState<PaymentGateway[]>(initialGateways);
  const [editingGw, setEditingGw] = useState<PaymentGateway | null>(null);
  const [name, setName] = useState('');
  const [fee, setFee] = useState(0);
  const [instructions, setInstructions] = useState('');
  const [isSandbox, setIsSandbox] = useState(true);
  const [notice, setNotice] = useState('');

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
  };

  const handleToggle = (gw: PaymentGateway) => {
    const updated = { ...gw, enabled: !gw.enabled };
    setGateways(prev => prev.map(g => (g.id === gw.id ? updated : g)));
    showNotice(`Gateway ${gw.name} is now ${updated.enabled ? 'Enabled' : 'Disabled'}!`);
  };

  const openEdit = (gw: PaymentGateway) => {
    setEditingGw(gw);
    setName(gw.name);
    setFee(gw.feePercentage);
    setInstructions(gw.instructions);
    setIsSandbox(gw.isSandbox);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGw) return;
    const updated: PaymentGateway = {
      ...editingGw,
      name,
      feePercentage: Number(fee),
      instructions,
      isSandbox
    };
    setGateways(prev => prev.map(g => (g.id === editingGw.id ? updated : g)));
    setEditingGw(null);
    showNotice(`Payment gateway ${name} configuration updated.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">
          FINANCIAL SETTLEMENT ARCHITECTURE
        </div>
        <h1 className="text-3xl font-extrabold text-charcoal">Payment Gateway Providers</h1>
        <p className="text-xs text-charcoal-subtle mt-0.5">
          Configure multi-provider checkout routing (Credit Cards, Crypto, PayPal, Wire Transfers).
        </p>
      </div>

      {notice && (
        <div className="p-3 bg-pista-lighter border border-pista text-xs font-semibold text-pista-dark rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {gateways.map(gw => (
          <div
            key={gw.id}
            className="bg-white border border-charcoal-border rounded-2xl p-6 flex flex-col justify-between shadow-xs space-y-4"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-surface-muted">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-pista-dark" />
                  <span className="font-bold text-sm text-charcoal">{gw.name}</span>
                </div>
                <button
                  onClick={() => handleToggle(gw)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono uppercase ${
                    gw.enabled ? 'bg-pista-lighter text-pista-dark' : 'bg-surface-muted text-charcoal-subtle'
                  }`}
                >
                  {gw.enabled ? 'Active' : 'Disabled'}
                </button>
              </div>

              <p className="text-xs text-charcoal-muted mt-3 leading-relaxed">
                {gw.description}
              </p>

              <div className="mt-4 p-3 bg-surface-bg rounded-xl border border-charcoal-border space-y-1.5 text-xs text-charcoal-muted">
                <div className="flex justify-between">
                  <span>Environment Mode:</span>
                  <span className="font-bold font-mono text-charcoal">
                    {gw.isSandbox ? 'SANDBOX / TEST' : 'PRODUCTION LIVE'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Processing Fee:</span>
                  <span className="font-mono text-charcoal">{gw.feePercentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Supported Currencies:</span>
                  <span className="font-mono text-charcoal-subtle">{gw.currencies.join(', ')}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-surface-muted flex justify-end">
              <button
                onClick={() => openEdit(gw)}
                className="px-4 py-2 border border-charcoal-border bg-white hover:bg-surface-muted rounded-lg text-xs font-semibold text-charcoal transition-colors"
              >
                Configure Settings
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingGw && (
        <div className="fixed inset-0 z-50 bg-charcoal/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-charcoal-border rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-muted">
              <h2 className="text-base font-bold text-charcoal">Configure {editingGw.name}</h2>
              <button onClick={() => setEditingGw(null)} className="text-charcoal-subtle hover:text-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-charcoal block mb-1">Display Label</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
                />
              </div>

              <div>
                <label className="font-semibold text-charcoal block mb-1">Environment Mode</label>
                <select
                  value={isSandbox ? 'sandbox' : 'live'}
                  onChange={e => setIsSandbox(e.target.value === 'sandbox')}
                  className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
                >
                  <option value="sandbox">Sandbox / Testing Simulation</option>
                  <option value="live">Live Production Settlement</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-charcoal block mb-1">Fee Percentage (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={fee}
                  onChange={e => setFee(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-charcoal block mb-1">Payment Instructions</label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-surface-muted">
                <button
                  type="button"
                  onClick={() => setEditingGw(null)}
                  className="px-4 py-2 border border-charcoal-border rounded-lg font-semibold text-charcoal-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-pista text-charcoal hover:bg-pista-hover font-bold rounded-lg shadow-sm"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
