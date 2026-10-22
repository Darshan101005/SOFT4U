'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { HomepageSection } from '@/lib/db/types';
import {
  Compass,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Plus,
  ExternalLink,
  Check,
  X,
  Sparkles
} from 'lucide-react';

export function HomepageCmsClient({ initialSections }: { initialSections: HomepageSection[] }) {
  const [sections, setSections] = useState<HomepageSection[]>(initialSections);
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);
  const [headline, setHeadline] = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [kicker, setKicker] = useState('');
  const [primaryCtaText, setPrimaryCtaText] = useState('');
  const [primaryCtaUrl, setPrimaryCtaUrl] = useState('');
  const [notice, setNotice] = useState('');

  // Add section modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newType, setNewType] = useState<HomepageSection['type']>('cta');
  const [newName, setNewName] = useState('Promotional Callout');

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
  };

  const handleToggle = async (sectionId: string) => {
    try {
      const res = await fetch('/api/cms/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_enabled', sectionId })
      });
      const data = await res.json();
      if (data.section) {
        setSections(prev => prev.map(s => (s.id === sectionId ? data.section : s)));
        showNotice(`Section "${data.section.name}" visibility updated!`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    setSections(newSections);

    try {
      const orderedIds = newSections.map(s => s.id);
      await fetch('/api/cms/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reorder', orderedIds })
      });
      showNotice('Homepage sections reordered successfully!');
    } catch (e) {
      console.error(e);
    }
  };

  const openEditor = (sec: HomepageSection) => {
    setEditingSection(sec);
    setHeadline(sec.settings?.headline || sec.settings?.title || '');
    setSubheadline(sec.settings?.subheadline || sec.settings?.subtitle || sec.settings?.description || '');
    setKicker(sec.settings?.kicker || '');
    setPrimaryCtaText(sec.settings?.primaryCtaText || sec.settings?.ctaText || '');
    setPrimaryCtaUrl(sec.settings?.primaryCtaUrl || sec.settings?.ctaUrl || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection) return;

    const updatedSettings = {
      ...editingSection.settings,
      headline: headline || undefined,
      title: headline || undefined,
      subheadline: subheadline || undefined,
      subtitle: subheadline || undefined,
      description: subheadline || undefined,
      kicker: kicker || undefined,
      primaryCtaText: primaryCtaText || undefined,
      ctaText: primaryCtaText || undefined,
      primaryCtaUrl: primaryCtaUrl || undefined,
      ctaUrl: primaryCtaUrl || undefined,
    };

    try {
      const res = await fetch('/api/cms/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          sectionId: editingSection.id,
          updates: { settings: updatedSettings }
        })
      });
      const data = await res.json();
      if (data.section) {
        setSections(prev => prev.map(s => (s.id === data.section.id ? data.section : s)));
        setEditingSection(null);
        showNotice(`Section "${data.section.name}" published to homepage!`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section from homepage?')) return;
    try {
      await fetch('/api/cms/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', sectionId })
      });
      setSections(prev => prev.filter(s => s.id !== sectionId));
      showNotice('Section removed from homepage.');
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/cms/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          newSection: {
            type: newType,
            name: newName,
            enabled: true,
            order: sections.length + 1,
            settings: {
              title: newName,
              subtitle: 'Customized content block configured from Soft4u admin panel.',
              ctaText: 'Learn More',
              ctaUrl: '/shop'
            }
          }
        })
      });
      const data = await res.json();
      if (data.section) {
        setSections([...sections, data.section]);
        setAddModalOpen(false);
        showNotice(`Added new section "${data.section.name}"!`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">
            HEADLESS CMS ENGINE
          </div>
          <h1 className="text-3xl font-extrabold text-charcoal">Homepage Section Management</h1>
          <p className="text-xs text-charcoal-subtle mt-0.5">
            Full zero-code administrative control over all homepage components, titles, buttons, and display sequence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="px-4 py-2 bg-white border border-charcoal-border hover:border-pista-hover text-charcoal text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <span>Live Preview</span>
            <ExternalLink className="w-3.5 h-3.5 text-pista-dark" />
          </Link>
          <button
            onClick={() => setAddModalOpen(true)}
            className="px-4 py-2 bg-pista text-charcoal hover:bg-pista-hover text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Section</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-pista-lighter border border-pista text-xs font-semibold text-pista-dark rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      {/* Sections Table & Reorder Controls */}
      <div className="bg-white border border-charcoal-border rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 bg-surface-bg border-b border-charcoal-border flex items-center justify-between text-xs font-bold text-charcoal-subtle uppercase tracking-wider">
          <span>Homepage Content Order ({sections.length} Sections)</span>
          <span>Status & Reorder</span>
        </div>

        <div className="divide-y divide-surface-muted">
          {sections.map((sec, idx) => (
            <div
              key={sec.id}
              className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                sec.enabled ? 'bg-white' : 'bg-surface-bg/60 opacity-60'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="w-6 h-6 rounded bg-surface-muted text-charcoal flex items-center justify-center font-mono font-bold text-xs">
                  {idx + 1}
                </span>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-charcoal">{sec.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-muted text-charcoal-muted">
                      type: {sec.type}
                    </span>
                    {!sec.enabled && (
                      <span className="text-[10px] font-semibold text-charcoal-subtle">
                        (Hidden from storefront)
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-charcoal-subtle mt-1 line-clamp-1 max-w-xl">
                    {sec.settings?.headline || sec.settings?.title || sec.settings?.description || 'Active CMS Block'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 self-end sm:self-center">
                {/* Reorder Up/Down */}
                <button
                  disabled={idx === 0}
                  onClick={() => handleMove(idx, 'up')}
                  className="p-1.5 text-charcoal-muted hover:text-charcoal hover:bg-surface-muted rounded disabled:opacity-30"
                  title="Move Up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  disabled={idx === sections.length - 1}
                  onClick={() => handleMove(idx, 'down')}
                  className="p-1.5 text-charcoal-muted hover:text-charcoal hover:bg-surface-muted rounded disabled:opacity-30"
                  title="Move Down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>

                {/* Edit Section Content */}
                <button
                  onClick={() => openEditor(sec)}
                  className="p-1.5 text-charcoal-muted hover:text-charcoal hover:bg-surface-muted rounded"
                  title="Edit Text & Buttons"
                >
                  <Pencil className="w-4 h-4" />
                </button>

                {/* Toggle Visibility */}
                <button
                  onClick={() => handleToggle(sec.id)}
                  className="p-1.5 text-charcoal-muted hover:text-charcoal hover:bg-surface-muted rounded"
                  title={sec.enabled ? 'Hide Section' : 'Show Section'}
                >
                  {sec.enabled ? <Eye className="w-4 h-4 text-pista-dark" /> : <EyeOff className="w-4 h-4 text-charcoal-subtle" />}
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(sec.id)}
                  className="p-1.5 text-charcoal-subtle hover:text-charcoal hover:bg-surface-muted rounded"
                  title="Delete Section"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Section Modal */}
      {editingSection && (
        <div className="fixed inset-0 z-50 bg-charcoal/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-charcoal-border rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-muted">
              <div>
                <h2 className="text-base font-bold text-charcoal">Edit Section: {editingSection.name}</h2>
                <p className="text-[11px] text-charcoal-subtle">Modifications will immediately reflect on the customer storefront.</p>
              </div>
              <button onClick={() => setEditingSection(null)} className="text-charcoal-subtle hover:text-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {editingSection.settings?.kicker !== undefined && (
                <div>
                  <label className="font-semibold text-charcoal block mb-1">Kicker / Top Subtitle</label>
                  <input
                    type="text"
                    value={kicker}
                    onChange={e => setKicker(e.target.value)}
                    className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg focus:bg-white"
                  />
                </div>
              )}

              <div>
                <label className="font-semibold text-charcoal block mb-1">Headline / Main Title</label>
                <input
                  type="text"
                  required
                  value={headline}
                  onChange={e => setHeadline(e.target.value)}
                  className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg focus:bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-charcoal block mb-1">Subheadline / Description Body</label>
                <textarea
                  rows={3}
                  value={subheadline}
                  onChange={e => setSubheadline(e.target.value)}
                  className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-charcoal block mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    value={primaryCtaText}
                    onChange={e => setPrimaryCtaText(e.target.value)}
                    placeholder="e.g. Browse Catalog"
                    className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-charcoal block mb-1">CTA URL</label>
                  <input
                    type="text"
                    value={primaryCtaUrl}
                    onChange={e => setPrimaryCtaUrl(e.target.value)}
                    placeholder="e.g. /shop"
                    className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-surface-muted">
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 border border-charcoal-border rounded-lg font-semibold text-charcoal-muted hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-pista text-charcoal hover:bg-pista-hover font-bold rounded-lg shadow-sm"
                >
                  Publish Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Section Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-charcoal-border rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-muted">
              <h2 className="text-base font-bold text-charcoal">Add New Homepage Section</h2>
              <button onClick={() => setAddModalOpen(false)} className="text-charcoal-subtle hover:text-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSection} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-charcoal block mb-1">Section Display Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Seasonal Holiday Banner"
                  className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
                />
              </div>

              <div>
                <label className="font-semibold text-charcoal block mb-1">Block Type</label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
                >
                  <option value="cta">Conversion Call To Action</option>
                  <option value="banner">Promotional Banner</option>
                  <option value="benefits">Benefits / Why Choose Us Grid</option>
                  <option value="testimonials">Customer Testimonials</option>
                  <option value="faq">FAQ Accordion</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-surface-muted">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 border border-charcoal-border rounded-lg font-semibold text-charcoal-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pista text-charcoal hover:bg-pista-hover font-bold rounded-lg"
                >
                  Add To Homepage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
