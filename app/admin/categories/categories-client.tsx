'use client';

import React, { useState } from 'react';
import { Category, Product } from '@/lib/db/types';
import { Layers, Plus, Pencil, Trash2, Check, X, ArrowRight } from 'lucide-react';

export function CategoriesClient({
  initialCategories,
  products
}: {
  initialCategories: Category[];
  products: Product[];
}) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Layers');
  const [notice, setNotice] = useState('');

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return;

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          categoryData: {
            name,
            slug,
            description,
            icon,
            status: 'active',
            displayOrder: categories.length + 1,
            featured: true
          }
        })
      });
      const data = await res.json();
      if (data.category) {
        setCategories([...categories, data.category]);
        setModalOpen(false);
        setName('');
        setSlug('');
        setDescription('');
        showNotice(`Created category "${data.category.name}"!`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      });
      setCategories(prev => prev.filter(c => c.id !== id));
      showNotice('Category removed.');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">
            TAXONOMY MANAGEMENT
          </div>
          <h1 className="text-3xl font-extrabold text-charcoal">Categories & Taxonomy</h1>
          <p className="text-xs text-charcoal-subtle mt-0.5">
            Organize catalog groupings, navigation placement, icons, and storefront display order.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-pista text-charcoal hover:bg-pista-hover text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-pista-lighter border border-pista text-xs font-semibold text-pista-dark rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(cat => {
          const productCount = products.filter(p => p.categoryId === cat.id).length;
          return (
            <div
              key={cat.id}
              className="bg-white border border-charcoal-border rounded-2xl p-6 flex flex-col justify-between shadow-xs hover:border-pista-hover transition-colors"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-surface-muted">
                  <span className="font-mono text-xs text-charcoal-subtle">/{cat.slug}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-pista-lighter text-pista-dark font-bold uppercase font-mono">
                    {cat.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-charcoal mt-3">{cat.name}</h3>
                <p className="text-xs text-charcoal-muted mt-1.5 line-clamp-2 leading-relaxed">
                  {cat.description || 'No description added.'}
                </p>

                <div className="mt-4 pt-3 border-t border-surface-muted text-xs text-charcoal-subtle">
                  Assigned Subscriptions: <span className="font-bold text-charcoal">{productCount} items</span>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-surface-muted flex items-center justify-between">
                <span className="text-[11px] text-charcoal-subtle">Order #{cat.displayOrder}</span>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="p-1.5 text-charcoal-subtle hover:text-charcoal hover:bg-surface-muted rounded"
                  title="Delete category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-charcoal-border rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-muted">
              <h2 className="text-base font-bold text-charcoal">Add New Category</h2>
              <button onClick={() => setModalOpen(false)} className="text-charcoal-subtle hover:text-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-charcoal block mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="e.g. Cloud Storage & Backups"
                  className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
                />
              </div>

              <div>
                <label className="font-semibold text-charcoal block mb-1">Slug *</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  placeholder="cloud-storage-backups"
                  className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-charcoal block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Short description for category overview and SEO..."
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
                  className="px-5 py-2 bg-pista text-charcoal hover:bg-pista-hover font-bold rounded-lg shadow-sm"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
