'use client';

import React, { useState } from 'react';
import { InventoryItem, Product } from '@/lib/db/types';
import { Key, Plus, Trash2, Check, Search, Filter, X } from 'lucide-react';

export function InventoryClient({
  initialInventory,
  products
}: {
  initialInventory: InventoryItem[];
  products: Product[];
}) {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState('');

  // Form states
  const [formProductId, setFormProductId] = useState(products[0]?.id || '');
  const [formType, setFormType] = useState<any>('credential');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPin, setFormPin] = useState('');
  const [formProfile, setFormProfile] = useState('');
  const [formKey, setFormKey] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
  };

  const filteredInventory = inventory.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (selectedProduct !== 'all' && item.productId !== selectedProduct) return false;
    return true;
  });

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const itemData = {
      productId: formProductId,
      type: formType,
      data: formType === 'credential'
        ? {
            email: formEmail,
            password: formPassword,
            pin: formPin || undefined,
            profileName: formProfile || undefined,
            notes: formNotes || undefined
          }
        : {
            licenseKey: formKey,
            notes: formNotes || undefined
          },
      status: 'available'
    };

    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', itemData })
      });
      const data = await res.json();
      if (data.item) {
        setInventory([data.item, ...inventory]);
        setModalOpen(false);
        setFormEmail('');
        setFormPassword('');
        setFormPin('');
        setFormKey('');
        setFormNotes('');
        showNotice('Digital asset added to inventory vault!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this digital inventory asset?')) return;
    try {
      await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      });
      setInventory(prev => prev.filter(i => i.id !== id));
      showNotice('Item removed from vault.');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">
            DIGITAL CREDENTIAL & KEY REPOSITORY
          </div>
          <h1 className="text-3xl font-extrabold text-charcoal">Digital Asset Inventory</h1>
          <p className="text-xs text-charcoal-subtle mt-0.5">
            Pre-stock verified private accounts, license keys, and invite tokens for instant automatic dispatch.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-pista text-charcoal hover:bg-pista-hover text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Stock to Vault</span>
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-pista-lighter border border-pista text-xs font-semibold text-pista-dark rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      {/* Filter Row */}
      <div className="bg-white border border-charcoal-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs text-xs">
        <div className="flex items-center gap-3">
          <select
            value={selectedProduct}
            onChange={e => setSelectedProduct(e.target.value)}
            className="px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
          >
            <option value="all">All Products</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available (Ready to fulfill)</option>
            <option value="sold">Sold</option>
            <option value="reserved">Reserved</option>
          </select>
        </div>

        <div className="text-charcoal-subtle text-xs">
          Showing <span className="font-bold text-charcoal">{filteredInventory.length}</span> vault items
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-charcoal-border rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-bg text-charcoal-subtle uppercase font-bold text-[10px]">
              <tr>
                <th className="p-3.5">Assigned Product</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Fulfillment Data (Credentials / Key)</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Order Association</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-muted">
              {filteredInventory.map(item => {
                const prod = products.find(p => p.id === item.productId);
                return (
                  <tr key={item.id} className="hover:bg-surface-bg/60 transition-colors">
                    <td className="p-3.5 font-bold text-charcoal">
                      {prod?.name || item.productId}
                    </td>

                    <td className="p-3.5">
                      <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 bg-surface-muted rounded">
                        {item.type}
                      </span>
                    </td>

                    <td className="p-3.5 font-mono text-[11px] text-charcoal">
                      {item.type === 'credential' ? (
                        <div>
                          <div><span className="text-charcoal-subtle">User:</span> {item.data.email}</div>
                          <div><span className="text-charcoal-subtle">Pass:</span> {item.data.password}</div>
                        </div>
                      ) : (
                        <div className="truncate max-w-xs">{item.data.licenseKey}</div>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                        item.status === 'available'
                          ? 'bg-pista-lighter text-pista-dark'
                          : 'bg-surface-muted text-charcoal-subtle'
                      }`}>
                        {item.status}
                      </span>
                    </td>

                    <td className="p-3.5 font-mono text-charcoal-subtle text-[11px]">
                      {item.orderId || '—'}
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-charcoal-subtle hover:text-charcoal hover:bg-surface-muted rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Stock Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-charcoal-border rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-muted">
              <h2 className="text-base font-bold text-charcoal">Add Stock to Digital Vault</h2>
              <button onClick={() => setModalOpen(false)} className="text-charcoal-subtle hover:text-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-charcoal block mb-1">Target Product *</label>
                <select
                  value={formProductId}
                  onChange={e => setFormProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-charcoal block mb-1">Asset Model</label>
                <select
                  value={formType}
                  onChange={e => setFormType(e.target.value)}
                  className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
                >
                  <option value="credential">Digital Account (Email / Pass / PIN)</option>
                  <option value="license_key">License Key / Invite Link</option>
                </select>
              </div>

              {formType === 'credential' ? (
                <>
                  <div>
                    <label className="font-semibold text-charcoal block mb-1">Email / Username *</label>
                    <input
                      type="text"
                      required
                      value={formEmail}
                      onChange={e => setFormEmail(e.target.value)}
                      placeholder="e.g. account@example.com"
                      className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-charcoal block mb-1">Password *</label>
                      <input
                        type="text"
                        required
                        value={formPassword}
                        onChange={e => setFormPassword(e.target.value)}
                        placeholder="SecretPassword$2026"
                        className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-charcoal block mb-1">Profile PIN (Optional)</label>
                      <input
                        type="text"
                        value={formPin}
                        onChange={e => setFormPin(e.target.value)}
                        placeholder="e.g. 8492"
                        className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-charcoal block mb-1">Profile Label (Optional)</label>
                    <input
                      type="text"
                      value={formProfile}
                      onChange={e => setFormProfile(e.target.value)}
                      placeholder="e.g. Profile 2 (Dedicated)"
                      className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="font-semibold text-charcoal block mb-1">License Key or Activation URL *</label>
                  <input
                    type="text"
                    required
                    value={formKey}
                    onChange={e => setFormKey(e.target.value)}
                    placeholder="XXXX-XXXX-XXXX-XXXX or https://invite.url/..."
                    className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg font-mono"
                  />
                </div>
              )}

              <div>
                <label className="font-semibold text-charcoal block mb-1">Fulfillment Notes / Instructions</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="e.g. Log in at chatgpt.com and check Plus status"
                  className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
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
                  disabled={submitting}
                  className="px-5 py-2 bg-pista text-charcoal hover:bg-pista-hover font-bold rounded-lg shadow-sm"
                >
                  {submitting ? 'Adding...' : 'Add Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
