'use client';

import React, { useState } from 'react';
import { NavigationItem } from '@/lib/db/types';
import { Compass, Plus, Trash2, Check, X, Eye, EyeOff } from 'lucide-react';

export function NavigationClient({ initialNavigation }: { initialNavigation: NavigationItem[] }) {
  const [navItems, setNavItems] = useState<NavigationItem[]>(initialNavigation);
  const [modalOpen, setModalOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [position, setPosition] = useState<'header' | 'footer' | 'mobile'>('header');
  const [notice, setNotice] = useState('');

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
  };

  const handleToggle = (item: NavigationItem) => {
    const updated = { ...item, visible: !item.visible };
    setNavItems(prev => prev.map(n => (n.id === item.id ? updated : n)));
    showNotice(`Menu link "${item.label}" visibility updated!`);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || !url) return;

    const newItem: NavigationItem = {
      id: `nav_${Date.now()}`,
      label,
      url,
      position,
      displayOrder: navItems.length + 1,
      visible: true,
      targetBlank: false
    };

    setNavItems([...navItems, newItem]);
    setModalOpen(false);
    setLabel('');
    setUrl('');
    showNotice(`Added "${newItem.label}" to ${position} menu!`);
  };

  const handleDelete = (id: string) => {
    setNavItems(prev => prev.filter(n => n.id !== id));
    showNotice('Navigation link removed.');
  };

  const headerItems = navItems.filter(n => n.position === 'header');
  const footerItems = navItems.filter(n => n.position === 'footer');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">
            INFORMATION ARCHITECTURE
          </div>
          <h1 className="text-3xl font-extrabold text-charcoal">Navigation Menu Management</h1>
          <p className="text-xs text-charcoal-subtle mt-0.5">
            Add custom links to Header, Footer, and Mobile navigation drawers without editing code.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-pista text-charcoal hover:bg-pista-hover text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Link</span>
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-pista-lighter border border-pista text-xs font-semibold text-pista-dark rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Header Links */}
        <div className="bg-white border border-charcoal-border rounded-2xl p-6 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-charcoal uppercase tracking-wider pb-2 border-b border-surface-muted">
            Header Navbar Links ({headerItems.length})
          </h2>

          <div className="divide-y divide-surface-muted">
            {headerItems.map(item => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-charcoal">{item.label}</div>
                  <div className="text-[11px] text-charcoal-subtle font-mono">{item.url}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(item)}
                    className="p-1 text-charcoal-subtle hover:text-charcoal"
                  >
                    {item.visible ? <Eye className="w-4 h-4 text-pista-dark" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1 text-charcoal-subtle hover:text-charcoal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Links */}
        <div className="bg-white border border-charcoal-border rounded-2xl p-6 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold text-charcoal uppercase tracking-wider pb-2 border-b border-surface-muted">
            Footer Navigation Links ({footerItems.length})
          </h2>

          <div className="divide-y divide-surface-muted">
            {footerItems.map(item => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-charcoal">{item.label}</div>
                  <div className="text-[11px] text-charcoal-subtle font-mono">{item.url}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(item)}
                    className="p-1 text-charcoal-subtle hover:text-charcoal"
                  >
                    {item.visible ? <Eye className="w-4 h-4 text-pista-dark" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1 text-charcoal-subtle hover:text-charcoal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-charcoal-border rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-muted">
              <h2 className="text-base font-bold text-charcoal">Add Navigation Link</h2>
              <button onClick={() => setModalOpen(false)} className="text-charcoal-subtle hover:text-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-charcoal block mb-1">Link Title / Label *</label>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  placeholder="e.g. VIP Discord Channel"
                  className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
                />
              </div>

              <div>
                <label className="font-semibold text-charcoal block mb-1">Target URL *</label>
                <input
                  type="text"
                  required
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="/shop or https://..."
                  className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-charcoal block mb-1">Menu Position</label>
                <select
                  value={position}
                  onChange={e => setPosition(e.target.value as any)}
                  className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
                >
                  <option value="header">Header Top Menu</option>
                  <option value="footer">Footer Directory</option>
                  <option value="mobile">Mobile Menu Only</option>
                </select>
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
                  className="px-5 py-2 bg-pista text-charcoal hover:bg-pista-hover font-bold rounded-lg"
                >
                  Save Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
