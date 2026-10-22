'use client';

import React, { useState } from 'react';
import { Announcement } from '@/lib/db/types';
import { Megaphone, Plus, Trash2, Check, X, Eye, EyeOff } from 'lucide-react';

export function AnnouncementsClient({ initialAnnouncements }: { initialAnnouncements: Announcement[] }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [modalOpen, setModalOpen] = useState(false);
  const [text, setText] = useState('');
  const [link, setLink] = useState('/shop');
  const [ctaText, setCtaText] = useState('Claim Discount');
  const [notice, setNotice] = useState('');

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
  };

  const handleToggle = async (ann: Announcement) => {
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', id: ann.id, text: ann.text, link: ann.link, ctaText: ann.ctaText, enabled: !ann.enabled })
      });
      const data = await res.json();
      if (data.announcement) {
        setAnnouncements(prev => prev.map(a => (a.id === ann.id ? data.announcement : a)));
        showNotice(`Announcement ${!ann.enabled ? 'activated' : 'disabled'}!`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text) return;

    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', text, link, ctaText })
      });
      const data = await res.json();
      if (data.announcement) {
        setAnnouncements([data.announcement, ...announcements]);
        setModalOpen(false);
        setText('');
        showNotice('New announcement published to top bar!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">
            SITE NOTIFICATIONS
          </div>
          <h1 className="text-3xl font-extrabold text-charcoal">Announcement Top Bar</h1>
          <p className="text-xs text-charcoal-subtle mt-0.5">
            Configure header banner announcements, seasonal discount promotions, and urgency timers.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-pista text-charcoal hover:bg-pista-hover text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Announcement</span>
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-pista-lighter border border-pista text-xs font-semibold text-pista-dark rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      <div className="space-y-4">
        {announcements.map(ann => (
          <div
            key={ann.id}
            className="p-5 bg-white border border-charcoal-border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-charcoal">{ann.text}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                  ann.enabled ? 'bg-pista-lighter text-pista-dark' : 'bg-surface-muted text-charcoal-subtle'
                }`}>
                  {ann.enabled ? 'Live on Store' : 'Inactive'}
                </span>
              </div>
              {ann.link && (
                <div className="text-xs text-charcoal-subtle">
                  Target Link: <span className="font-mono text-charcoal">{ann.link}</span> ({ann.ctaText || 'CTA'})
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggle(ann)}
                className="px-3 py-1.5 bg-surface-bg hover:bg-pista-lighter text-xs font-semibold rounded-lg border border-charcoal-border flex items-center gap-1.5 transition-colors"
              >
                {ann.enabled ? <EyeOff className="w-3.5 h-3.5 text-charcoal-subtle" /> : <Eye className="w-3.5 h-3.5 text-pista-dark" />}
                <span>{ann.enabled ? 'Deactivate' : 'Activate'}</span>
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
              <h2 className="text-base font-bold text-charcoal">Create Announcement</h2>
              <button onClick={() => setModalOpen(false)} className="text-charcoal-subtle hover:text-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-charcoal block mb-1">Announcement Message *</label>
                <input
                  type="text"
                  required
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="e.g. FLASH SALE: 20% OFF all AI tools using code SOFT20"
                  className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-charcoal block mb-1">Target URL</label>
                  <input
                    type="text"
                    value={link}
                    onChange={e => setLink(e.target.value)}
                    placeholder="/shop"
                    className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-charcoal block mb-1">Button Text</label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={e => setCtaText(e.target.value)}
                    placeholder="Claim Discount"
                    className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
                  />
                </div>
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
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
