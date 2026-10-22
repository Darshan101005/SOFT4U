'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LegalPage, LegalPageRevision } from '@/lib/db/types';
import {
  FileText,
  Clock,
  ExternalLink,
  Check,
  RotateCcw,
  Sparkles,
  Save,
  Send
} from 'lucide-react';

export function LegalCmsClient({ initialPages }: { initialPages: LegalPage[] }) {
  const [pages, setPages] = useState<LegalPage[]>(initialPages);
  const [selectedSlug, setSelectedSlug] = useState<string>('terms');

  const currentPage = pages.find(p => p.slug === selectedSlug) || pages[0];

  const [content, setContent] = useState(currentPage?.content || '');
  const [publishNote, setPublishNote] = useState('');
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 4000);
  };

  const handleSelectPage = (slug: string) => {
    setSelectedSlug(slug);
    const target = pages.find(p => p.slug === slug);
    if (target) {
      setContent(target.draftContent || target.content);
    }
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/cms/legal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: currentPage.slug,
          action: 'save_draft',
          content
        })
      });
      const data = await res.json();
      if (data.page) {
        setPages(prev => prev.map(p => (p.slug === data.page.slug ? data.page : p)));
        showNotice(`Draft saved for "${currentPage.title}". (Not published yet)`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/cms/legal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: currentPage.slug,
          action: 'publish',
          content,
          note: publishNote || 'Admin update'
        })
      });
      const data = await res.json();
      if (data.page) {
        setPages(prev => prev.map(p => (p.slug === data.page.slug ? data.page : p)));
        setPublishNote('');
        showNotice(`Published v${data.page.revisions.length} of "${currentPage.title}"! Changes are live at /${currentPage.slug}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestoreVersion = async (version: number) => {
    if (!confirm(`Restore and publish revision version v${version}?`)) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/cms/legal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: currentPage.slug,
          action: 'restore_version',
          version
        })
      });
      const data = await res.json();
      if (data.page) {
        setPages(prev => prev.map(p => (p.slug === data.page.slug ? data.page : p)));
        setContent(data.page.content);
        showNotice(`Successfully restored and published revision v${version}!`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">
            VERSIONED LEGAL CMS
          </div>
          <h1 className="text-3xl font-extrabold text-charcoal">Legal Policies & Terms Management</h1>
          <p className="text-xs text-charcoal-subtle mt-0.5">
            Save drafts, inspect live previews, publish official revisions, and restore previous legal versions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/${currentPage.slug}`}
            target="_blank"
            className="px-4 py-2 bg-white border border-charcoal-border hover:border-pista-hover text-charcoal text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <span>View Live Page</span>
            <ExternalLink className="w-3.5 h-3.5 text-pista-dark" />
          </Link>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-pista-lighter border border-pista text-xs font-semibold text-pista-dark rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      {/* Page Tabs */}
      <div className="flex gap-2 border-b border-charcoal-border pb-2 overflow-x-auto no-scrollbar">
        {pages.map(page => (
          <button
            key={page.slug}
            onClick={() => handleSelectPage(page.slug)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-2 ${
              selectedSlug === page.slug
                ? 'bg-pista-light text-pista-darker'
                : 'bg-white border border-charcoal-border text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{page.title}</span>
            <span className="text-[10px] font-mono opacity-80">v{page.revisions.length}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Editor Main Canvas */}
        <div className="lg:col-span-8 bg-white border border-charcoal-border rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-surface-muted">
            <div>
              <div className="text-sm font-bold text-charcoal">
                Editing: {currentPage.title}
              </div>
              <div className="text-[11px] text-charcoal-subtle">
                Slug: <span className="font-mono">/{currentPage.slug}</span> · Last Published:{' '}
                {new Date(currentPage.lastPublishedAt).toLocaleString()}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewOpen(!previewOpen)}
                className="px-3 py-1.5 bg-surface-muted text-charcoal hover:bg-surface-subtle rounded text-xs font-semibold transition-colors"
              >
                {previewOpen ? 'Edit Raw' : 'Preview Formatted'}
              </button>
            </div>
          </div>

          {previewOpen ? (
            <div className="p-6 bg-surface-bg border border-charcoal-border rounded-xl prose prose-sm max-w-none min-h-[420px] whitespace-pre-wrap font-sans text-xs">
              {content}
            </div>
          ) : (
            <textarea
              rows={18}
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full p-4 font-mono text-xs border border-charcoal-border rounded-xl bg-surface-bg focus:bg-white focus:outline-none focus:border-pista-hover leading-relaxed"
            />
          )}

          {/* Action Row */}
          <div className="pt-4 border-t border-surface-muted flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 max-w-sm">
              <input
                type="text"
                value={publishNote}
                onChange={e => setPublishNote(e.target.value)}
                placeholder="Change summary / revision note (e.g. Updated Section 4 warranty terms)"
                className="w-full text-xs px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveDraft}
                className="px-4 py-2 border border-charcoal-border bg-white hover:bg-surface-muted text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Save className="w-3.5 h-3.5 text-charcoal-subtle" />
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handlePublish}
                className="px-5 py-2 bg-pista text-charcoal hover:bg-pista-hover text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Publishing...' : 'Publish to Live Store'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Revision History Sidebar */}
        <div className="lg:col-span-4 bg-white border border-charcoal-border rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-surface-muted">
            <Clock className="w-4 h-4 text-pista-dark" />
            <h2 className="text-sm font-bold text-charcoal">Version Revision History</h2>
          </div>

          <p className="text-[11px] text-charcoal-subtle">
            Every published change is versioned. You can revert to any prior state with one click.
          </p>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {/* Current version */}
            <div className="p-3 bg-pista-lighter border border-pista rounded-xl text-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-pista-dark">
                <span>Version v{currentPage.revisions.length || 1} (LIVE CURRENT)</span>
                <span className="text-[10px] font-mono">Active</span>
              </div>
              <div className="text-[11px] text-charcoal-muted">
                Published {new Date(currentPage.lastPublishedAt).toLocaleDateString()}
              </div>
            </div>

            {/* Past revisions */}
            {currentPage.revisions.map((rev, rIdx) => (
              <div
                key={rIdx}
                className="p-3 bg-surface-bg border border-charcoal-border rounded-xl text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-charcoal">Revision v{rev.version}</span>
                  <span className="text-[10px] text-charcoal-subtle font-mono">
                    {new Date(rev.publishedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-[11px] text-charcoal-muted italic line-clamp-2">
                  &ldquo;{rev.note || 'Prior revision snapshot'}&rdquo;
                </div>
                <button
                  type="button"
                  onClick={() => handleRestoreVersion(rev.version)}
                  className="w-full py-1.5 px-2 bg-white hover:bg-pista-lighter border border-charcoal-border text-charcoal text-[11px] font-semibold rounded flex items-center justify-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3 text-pista-dark" />
                  <span>Restore Version v{rev.version}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
