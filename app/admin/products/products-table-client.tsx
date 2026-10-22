'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product, Category } from '@/lib/db/types';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Check,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  ExternalLink,
  Pencil,
  Zap,
  X
} from 'lucide-react';

export function ProductsTableClient({
  initialProducts,
  categories
}: {
  initialProducts: Product[];
  categories: Category[];
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [notice, setNotice] = useState('');

  // Quick Edit Modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editPrice, setEditPrice] = useState(0);
  const [editBadge, setEditBadge] = useState('');
  const [editStatus, setEditStatus] = useState<Product['status']>('active');

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
  };

  const filteredProducts = products.filter(p => {
    if (selectedCat !== 'all' && p.categoryId !== selectedCat) return false;
    if (selectedStatus !== 'all' && p.status !== selectedStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    }
    return true;
  });

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_status', id })
      });
      const data = await res.json();
      if (data.product) {
        setProducts(prev => prev.map(p => (p.id === id ? data.product : p)));
        showNotice(`Product "${data.product.name}" status changed to ${data.product.status}!`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'duplicate', id })
      });
      const data = await res.json();
      if (data.product) {
        setProducts([data.product, ...products]);
        showNotice(`Duplicated product "${data.product.name}"!`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this product?')) return;
    try {
      await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      });
      setProducts(prev => prev.filter(p => p.id !== id));
      showNotice('Product deleted successfully.');
    } catch (e) {
      console.error(e);
    }
  };

  const openQuickEdit = (p: Product) => {
    setEditingProduct(p);
    setEditPrice(p.price);
    setEditBadge(p.badge || '');
    setEditStatus(p.status);
  };

  const handleSaveQuickEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: editingProduct.id,
          updates: {
            price: Number(editPrice),
            badge: editBadge || undefined,
            status: editStatus
          }
        })
      });
      const data = await res.json();
      if (data.product) {
        setProducts(prev => prev.map(p => (p.id === data.product.id ? data.product : p)));
        setEditingProduct(null);
        showNotice(`Updated "${data.product.name}" successfully!`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">
            CATALOG MANAGEMENT
          </div>
          <h1 className="text-3xl font-extrabold text-charcoal">Digital Products & Subscriptions</h1>
          <p className="text-xs text-charcoal-subtle mt-0.5">
            Administer products, variants, fulfillment models, pricing, and live inventory.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="px-4 py-2.5 bg-pista text-charcoal hover:bg-pista-hover text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </Link>
      </div>

      {notice && (
        <div className="p-3 bg-pista-lighter border border-pista text-xs font-semibold text-pista-dark rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      {/* Filter Row */}
      <div className="bg-white border border-charcoal-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex-1 max-w-sm relative">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, SKU..."
            className="w-full text-xs px-3 py-2 pl-8 border border-charcoal-border rounded-lg bg-surface-bg focus:bg-white focus:outline-none focus:border-pista-hover"
          />
          <Search className="w-3.5 h-3.5 text-charcoal-subtle absolute left-2.5 top-2.5" />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCat}
            onChange={e => setSelectedCat(e.target.value)}
            className="text-xs px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="text-xs px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-charcoal-border rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-bg text-charcoal-subtle uppercase font-bold text-[10px]">
              <tr>
                <th className="p-3.5">Product & SKU</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Plans & Price</th>
                <th className="p-3.5">Fulfillment Model</th>
                <th className="p-3.5">Badge</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-muted">
              {filteredProducts.map(p => {
                const catName = categories.find(c => c.id === p.categoryId)?.name || 'General';
                return (
                  <tr key={p.id} className="hover:bg-surface-bg/60 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-charcoal">{p.name}</div>
                        <Link href={`/products/${p.slug}`} target="_blank" className="text-charcoal-subtle hover:text-charcoal">
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                      <div className="text-[10px] text-charcoal-subtle font-mono mt-0.5">{p.sku}</div>
                    </td>

                    <td className="p-3.5 text-charcoal-muted">{catName}</td>

                    <td className="p-3.5">
                      <div className="font-mono font-bold text-charcoal">${p.price}</div>
                      <div className="text-[10px] text-charcoal-subtle">{p.variants.length} plan options</div>
                    </td>

                    <td className="p-3.5">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-surface-muted text-charcoal font-semibold uppercase">
                        {p.inventoryModel}
                      </span>
                    </td>

                    <td className="p-3.5">
                      {p.badge ? (
                        <span className="text-[10px] font-bold text-pista-dark uppercase font-mono">
                          {p.badge}
                        </span>
                      ) : (
                        <span className="text-[10px] text-charcoal-subtle">—</span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleStatus(p.id)}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono transition-colors uppercase ${
                          p.status === 'active'
                            ? 'bg-pista-lighter text-pista-dark'
                            : 'bg-surface-muted text-charcoal-subtle'
                        }`}
                        title="Click to toggle status"
                      >
                        {p.status}
                      </button>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openQuickEdit(p)}
                          className="p-1.5 text-charcoal-muted hover:text-charcoal hover:bg-surface-muted rounded"
                          title="Quick Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(p.id)}
                          className="p-1.5 text-charcoal-muted hover:text-charcoal hover:bg-surface-muted rounded"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-charcoal-subtle hover:text-charcoal hover:bg-surface-muted rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-charcoal/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-charcoal-border rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-muted">
              <div>
                <h2 className="text-base font-bold text-charcoal">Quick Edit: {editingProduct.name}</h2>
                <p className="text-[11px] text-charcoal-subtle">Update base price, promotional badge, and status.</p>
              </div>
              <button onClick={() => setEditingProduct(null)} className="text-charcoal-subtle hover:text-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickEdit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-charcoal block mb-1">Base Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editPrice}
                  onChange={e => setEditPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-charcoal block mb-1">Badge (e.g. BEST SELLER, NEW, INSTANT)</label>
                <input
                  type="text"
                  value={editBadge}
                  onChange={e => setEditBadge(e.target.value)}
                  placeholder="BEST SELLER"
                  className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg uppercase"
                />
              </div>

              <div>
                <label className="font-semibold text-charcoal block mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
                >
                  <option value="active">Active (Visible in Store)</option>
                  <option value="disabled">Disabled (Hidden from Store)</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-surface-muted">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 border border-charcoal-border rounded-lg font-semibold text-charcoal-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-pista text-charcoal hover:bg-pista-hover font-bold rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
