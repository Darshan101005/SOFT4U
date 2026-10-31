'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Clock, ExternalLink, FileText, RotateCcw, Save, Send } from 'lucide-react';
import type { LegalPage } from '@/lib/db/types';
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, SegmentChips, api, errMsg, toast, useDialog } from '../_components/ui';
import { fmtDateTime } from '../_components/format';
import { MarkdownEditor, MarkdownView } from '../_components/markdown-editor';

export function LegalCmsClient({ initialPages }: { initialPages: LegalPage[] }) {
  const [pages, setPages] = useState(initialPages);
  const [slug, setSlug] = useState<string>(initialPages.find(p => p.slug === 'terms')?.slug || initialPages[0]?.slug || '');
  const current = pages.find(p => p.slug === slug);
  const [content, setContent] = useState(current?.draftContent || current?.content || '');
  const [title, setTitle] = useState(current?.title || '');
  const [note, setNote] = useState('');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const { confirm, dialog } = useDialog();

  if (!current) {
    return (
      <div>
        <PageHeader kicker="Content & CMS" title="Legal pages" />
        <Card>
          <EmptyState icon={FileText} title="No legal pages found" description="Run the database seed to create Terms, Privacy, Refund, Cookie and Delivery policies." />
        </Card>
      </div>
    );
  }

  const choose = (s: string) => {
    const p = pages.find(x => x.slug === s);
    setSlug(s);
    setContent(p?.draftContent || p?.content || '');
    setTitle(p?.title || '');
    setNote('');
    setEditing(false);
  };

  const call = async (action: string, extra: Record<string, unknown>, ok: string) => {
    setBusy(action);
    try {
      const res = await api<{ page: LegalPage }>('/api/cms/legal', { body: { slug: current.slug, action, ...extra } });
      setPages(prev => prev.map(p => (p.slug === res.page.slug ? res.page : p)));
      if (action === 'restore_version') setContent(res.page.content);
      toast.success(ok);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(null);
    }
  };

  const publish = async () => {
    if (title.trim() && title.trim() !== current.title) await call('rename', { title: title.trim(), content: current.content }, 'Title saved');
    await call('publish', { content, note: note.trim() || 'Updated by admin' }, `Published. Live at /${current.slug}`);
    setNote('');
  };

  const restore = async (version: number) => {
    if (await confirm({ title: `Restore version ${version}?`, message: 'It is published as a new version straight away.', confirmLabel: 'Restore and publish' })) {
      await call('restore_version', { version }, `Version ${version} restored`);
    }
  };

  const hasDraft = Boolean(current.draftContent && current.draftContent !== current.content);

  return (
    <div>
      <PageHeader
        kicker="Content & CMS"
        title="Legal pages"
        description="Terms, privacy, refund, cookie and delivery policies. Write in Markdown (# Heading, **bold**, - list). Save a draft or publish; every published version is kept."
        actions={
          <Link href={`/${current.slug}`} target="_blank" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-charcoal-border bg-white text-sm font-bold hover:border-pista">
            View live page <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        }
      />
      <div className="mb-4">
        <SegmentChips options={pages.map(p => ({ key: p.slug, label: p.title }))} value={slug} onChange={choose} />
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <Card
          className="lg:col-span-8"
          title={
            <span className="flex items-center gap-2">
              {current.title} {hasDraft && <Badge tone="amber">Unpublished draft</Badge>}
            </span>
          }
          description={<>/{current.slug} · last published {fmtDateTime(current.lastPublishedAt)}</>}
          actions={
            <Button size="sm" variant="secondary" onClick={() => setEditing(v => !v)}>
              {editing ? 'Done editing' : 'Edit'}
            </Button>
          }
        >
          <div className="space-y-4">
            <Field label="Page title">
              <Input value={title} onChange={e => setTitle(e.target.value)} />
            </Field>
            {editing ? (
              <MarkdownEditor value={content} onChange={setContent} rows={20} />
            ) : (
              <MarkdownView source={content} className="min-h-[420px]" />
            )}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center pt-3 border-t border-surface-muted">
              <Input value={note} onChange={e => setNote(e.target.value)} placeholder="What changed? e.g. Updated refund window" className="sm:flex-1" />
              <div className="flex gap-2">
                <Button variant="secondary" icon={Save} loading={busy === 'save_draft'} onClick={() => call('save_draft', { content }, 'Draft saved (not live yet)')}>
                  Save draft
                </Button>
                <Button icon={Send} loading={busy === 'publish'} onClick={() => void publish()}>
                  Publish
                </Button>
              </div>
            </div>
          </div>
        </Card>
        <Card className="lg:col-span-4" title={<span className="flex items-center gap-2"><Clock className="w-4 h-4 text-pista-dark" />Version history</span>}>
          {current.revisions.length === 0 ? (
            <p className="text-xs text-charcoal-subtle">No earlier versions yet.</p>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto">
              {[...current.revisions].sort((a, b) => b.version - a.version).map((rev, i) => (
                <div key={rev.version} className="p-3 rounded-xl border border-charcoal-border bg-surface-bg text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Version {rev.version}</span>
                    {i === 0 ? <Badge tone="green">Live</Badge> : <span className="text-charcoal-subtle">{fmtDateTime(rev.publishedAt)}</span>}
                  </div>
                  {rev.note && <div className="text-charcoal-muted italic">{rev.note}</div>}
                  {i > 0 && (
                    <Button size="sm" variant="secondary" icon={RotateCcw} loading={busy === 'restore_version'} onClick={() => void restore(rev.version)}>
                      Restore
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
      {dialog}
    </div>
  );
}
