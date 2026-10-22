'use client';

import React, { useState } from 'react';
import { Coupon } from '@/lib/db/types';
import { Tag, Plus, Trash2, Check, X, Percent, DollarSign } from 'lucide-react';

export function CouponsClient({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [modalOpen, setModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState(15);
  const [minSpend, setMinSpend] = useState(10);
  const [notice, setNotice] = useState('');

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
  };

  const handleToggle = async (coupon: Coupon) => {
    const updated = await dbUpdateCoupon(coupon.id, { enabled: !coupon.enabled });
    if (updated) {
      setCoupons(prev => prev.map(c => (c.id === coupon.id ? updated : c)));
      showNotice(`Coupon ${coupon.code} ${!coupon.enabled ? 'activated' : 'disabled'}!`);
    }
  };

  const dbUpdateCoupon = async (id: string, updates: Partial<Coupon>) => {
    // In our simplified API we can handle this locally or through api
    return { ...coupons.find(c => c.id === id)!, ...updates };
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    const newCoupon: Coupon = {
      id: `coup_${Date.now()}`,
      code: code.trim().toUpperCase(),
      description,
      type,
      value: Number(value),
      minOrderAmount: Number(minSpend) || 0,
      usageCount: 0,
      enabled: true,
      createdAt: new Date().toISOString()
    };

    setCoupons([newCoupon, ...coupons]);
    setModalOpen(false);
    setCode('');
    setDescription('');
    showNotice(`Created coupon ${newCoupon.code}!`);
  };

  const handleDelete = (id: string) => {
    setCoupons(prev => prev.filter(c => c.id !== id));
    showNotice('Coupon removed.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">
            PROMOTIONAL ENGINE
          </div>
          <h1 className="text-3xl font-extrabold text-charcoal">Discount Coupons & Vouchers</h1>
          <p className="text-xs text-charcoal-subtle mt-0.5">
            Configure promotional percentage codes, flat cash discounts, and minimum order rules.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-pista text-charcoal hover:bg-pista-hover text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-pista-lighter border border-pista text-xs font-semibold text-pista-dark rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map(coupon => (
          <div
            key={coupon.id}
            className="bg-white border border-charcoal-border rounded-2xl p-6 flex flex-col justify-between shadow-xs hover:border-pista-hover transition-colors"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-surface-muted">
                <span className="font-mono text-base font-extrabold text-charcoal tracking-wider">
                  {coupon.code}
                </span>
                <button
                  onClick={() => handleToggle(coupon)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                    coupon.enabled ? 'bg-pista-lighter text-pista-dark' : 'bg-surface-muted text-charcoal-subtle'
                  }`}
                >
                  {coupon.enabled ? 'Active' : 'Disabled'}
                </button>
              </div>

              <div className="mt-3 flex items-baseline gap-1 text-2xl font-black font-mono text-charcoal">
                {coupon.type === 'percentage' ? (
                  <>
                    <span>{coupon.value}%</span>
                    <span className="text-xs font-normal text-charcoal-subtle font-sans">OFF</span>
                  </>
                ) : (
                  <>
                    <span>${coupon.value}</span>
                    <span className="text-xs font-normal text-charcoal-subtle font-sans">FLAT OFF</span>
                  </>
                )}
              </div>

              <p className="text-xs text-charcoal-muted mt-1.5 leading-relaxed">
                {coupon.description || 'Promotional checkout discount code.'}
              </p>

              <div className="mt-4 pt-3 border-t border-surface-muted space-y-1 text-xs text-charcoal-subtle">
                <div>Min Order: <span className="font-mono font-semibold text-charcoal">${coupon.minOrderAmount || 0}</span></div>
                <div>Times Used: <span className="font-mono font-semibold text-charcoal">{coupon.usageCount} times</span></div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-surface-muted flex justify-end">
              <button
                onClick={() => handleDelete(coupon.id)}
                className="p-1.5 text-charcoal-subtle hover:text-charcoal hover:bg-surface-muted rounded"
                title="Delete coupon"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-charcoal-border rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-muted">
              <h2 className="text-base font-bold text-charcoal">Create Promo Coupon</h2>
              <button onClick={() => setModalOpen(false)} className="text-charcoal-subtle hover:text-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-charcoal block mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FLASH30"
                  className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg font-mono uppercase"
                />
              </div>

              <div>
                <label className="font-semibold text-charcoal block mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. 30% discount on all subscriptions"
                  className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-charcoal block mb-1">Discount Type</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Cash ($)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-charcoal block mb-1">Discount Value</label>
                  <input
                    type="number"
                    required
                    value={value}
                    onChange={e => setValue(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-charcoal block mb-1">Minimum Order Amount ($)</label>
                <input
                  type="number"
                  value={minSpend}
                  onChange={e => setMinSpend(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-surface-muted">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-charcoal-border rounded-lg font-semibold text-charcoal-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-pista text-charcoal hover:bg-pista-hover font-bold rounded-lg shadow-sm"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
