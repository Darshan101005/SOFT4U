'use client';

import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Home, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { HomepageSection } from '@/lib/db/types';
import { Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Select, Textarea, Toggle, api, errMsg, toast, useDialog } from '../_components/ui';
import { ImagePicker } from '../_components/image-picker';

const TYPE_LABELS: Record<HomepageSection['type'], string> = {
  hero: 'Hero (top of page)',
  trust_bar: 'Trust bar',
  categories: 'Categories',
  featured_products: 'Featured products',
  bestsellers: 'Best sellers',
  new_arrivals: 'New arrivals',
  all_products: 'All products',
  banner: 'Banner',
  benefits: 'Why choose us',
  how_it_works: 'How it works',
  testimonials: 'Testimonials',
  reviews: 'Customer reviews',
  faq: 'FAQ',
  cta: 'Call to action',
  newsletter: 'Newsletter',
};

const TEMPLATES: Record<HomepageSection['type'], Record<string, unknown>> = {
  hero: { kicker: '', headline: '', subheadline: '', primaryCtaText: 'Browse products', primaryCtaUrl: '/shop', secondaryCtaText: '', secondaryCtaUrl: '', highlights: [] },
  trust_bar: { items: [{ icon: 'BadgeCheck', title: '', desc: '' }] },
  categories: { title: 'Shop by category', subtitle: '' },
  featured_products: { title: 'Featured', subtitle: '', limit: 8 },
  bestsellers: { title: 'Best sellers', subtitle: '', limit: 8 },
  new_arrivals: { title: 'Newly added', subtitle: '', limit: 8 },
  all_products: { title: 'All products', subtitle: '' },
  banner: { title: '', subtitle: '', image: '', ctaText: '', ctaUrl: '' },
  benefits: { title: '', subtitle: '', items: [{ icon: 'BadgeCheck', title: '', desc: '' }] },
  how_it_works: { title: 'How ordering works', subtitle: '', steps: [{ step: '01', title: '', desc: '' }] },
  testimonials: { title: 'What customers say', subtitle: '', hideWhenEmpty: true },
  reviews: { title: 'What customers say', subtitle: '', limit: 6, hideWhenEmpty: true },
  faq: { title: 'Frequently asked questions', subtitle: '', limit: 6 },
  cta: { title: '', subtitle: '', ctaText: 'Browse products', ctaUrl: '/shop' },
  newsletter: { title: '', subtitle: '' },
};

const KEY_LABELS: Record<string, string> = {
  kicker: 'Small label above the headline',
  headline: 'Headline',
  subheadline: 'Text under the headline',
  primaryCtaText: 'Main button text',
  primaryCtaUrl: 'Main button link',
  secondaryCtaText: 'Second button text',
  secondaryCtaUrl: 'Second button link',
  highlights: 'Highlight chips',
  ctaText: 'Button text',
  ctaUrl: 'Button link',
  limit: 'How many products to show',
  hideWhenEmpty: 'Hide when there is nothing to show',
  desc: 'Description',
  icon: 'Icon name (lucide)',
  step: 'Step',
};

function labelFor(key: string): string {
  if (KEY_LABELS[key]) return KEY_LABELS[key];
  const s = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const isLong = (key: string, v: string) => /sub|desc|text$|body|content/i.test(key) && !/cta|button/i.test(key) ? true : v.length > 90;

function ValueEditor({ name, value, onChange }: { name: string; value: unknown; onChange: (v: unknown) => void }) {
  if (typeof value === 'boolean') return <Toggle checked={value} onChange={onChange} label={labelFor(name)} />;
  if (typeof value === 'number')
    return (
      <Field label={labelFor(name)}>
        <Input type="number" value={value} onChange={e => onChange(Number(e.target.value) || 0)} />
      </Field>
    );
  if (typeof value === 'string') {
    if (/image|logo|photo/i.test(name)) return <ImagePicker value={value} onChange={onChange} kind="banners" label={labelFor(name)} wide />;
    return (
      <Field label={labelFor(name)}>
        {isLong(name, value) ? <Textarea rows={3} value={value} onChange={e => onChange(e.target.value)} /> : <Input value={value} onChange={e => onChange(e.target.value)} />}
      </Field>
    );
  }
  if (Array.isArray(value)) {
    const objects = value.length > 0 && typeof value[0] === 'object' && value[0] !== null;
    if (!objects) {
      const list = value as string[];
      return (
        <Field label={labelFor(name)}>
          <div className="space-y-2">
            {list.map((item, i) => (
              <div key={i} className="flex gap-2">
                <Input value={String(item)} onChange={e => onChange(list.map((x, j) => (j === i ? e.target.value : x)))} />
                <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))} className="p-2 text-charcoal-subtle hover:text-accent-rose" aria-label="Remove">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <Button size="sm" variant="secondary" icon={Plus} onClick={() => onChange([...list, ''])}>
              Add
            </Button>
          </div>
        </Field>
      );
    }
    const list = value as Array<Record<string, unknown>>;
    const keys = Object.keys(list[0] || {});
    return (
      <div className="space-y-2">
        <div className="text-xs font-bold text-charcoal">{labelFor(name)}</div>
        {list.map((obj, i) => (
          <div key={i} className="rounded-xl border border-charcoal-border p-3 bg-surface-bg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-charcoal-subtle">Item {i + 1}</span>
              <div className="flex gap-1">
                <button type="button" disabled={i === 0} onClick={() => { const n = [...list]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; onChange(n); }} className="p-1 text-charcoal-subtle disabled:opacity-30" aria-label="Move up">
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button type="button" disabled={i === list.length - 1} onClick={() => { const n = [...list]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; onChange(n); }} className="p-1 text-charcoal-subtle disabled:opacity-30" aria-label="Move down">
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))} className="p-1 text-charcoal-subtle hover:text-accent-rose" aria-label="Remove">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {keys.map(k => (
                <div key={k} className={typeof obj[k] === 'string' && isLong(k, String(obj[k])) ? 'sm:col-span-2' : ''}>
                  <ValueEditor name={k} value={obj[k] ?? ''} onChange={v => onChange(list.map((x, j) => (j === i ? { ...x, [k]: v } : x)))} />
                </div>
              ))}
            </div>
          </div>
        ))}
        <Button size="sm" variant="secondary" icon={Plus} onClick={() => onChange([...list, Object.fromEntries(keys.map(k => [k, typeof list[0]?.[k] === 'number' ? 0 : '']))])}>
          Add item
        </Button>
      </div>
    );
  }
  return null;
}

export function HomepageCmsClient({ initialSections }: { initialSections: HomepageSection[] }) {
  const [sections, setSections] = useState([...initialSections].sort((a, b) => a.order - b.order));
  const [editing, setEditing] = useState<HomepageSection | null>(null);
  const [adding, setAdding] = useState<HomepageSection['type'] | null>(null);
  const [saving, setSaving] = useState(false);
  const { confirm, dialog } = useDialog();

  const post = (body: Record<string, unknown>) => api<{ section?: HomepageSection; sections?: HomepageSection[] }>('/api/cms/homepage', { body });

  const toggle = async (s: HomepageSection) => {
    try {
      const res = await post({ action: 'toggle_enabled', sectionId: s.id });
      if (res.section) setSections(prev => prev.map(x => (x.id === s.id ? res.section! : x)));
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[i], next[j]] = [next[j], next[i]];
    setSections(next);
    try {
      await post({ action: 'reorder', orderedIds: next.map(s => s.id) });
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await post({ action: 'update', sectionId: editing.id, updates: { name: editing.name, settings: editing.settings } });
      if (res.section) setSections(prev => prev.map(x => (x.id === editing.id ? res.section! : x)));
      setEditing(null);
      toast.success('Section saved. The homepage updates within a minute.');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const add = async () => {
    if (!adding) return;
    setSaving(true);
    try {
      const res = await post({ action: 'add', newSection: { type: adding, name: TYPE_LABELS[adding].replace(/ \(.*\)$/, ''), enabled: false, order: sections.length + 1, settings: TEMPLATES[adding] } });
      if (res.section) {
        setSections(prev => [...prev, res.section!]);
        setEditing(res.section);
      }
      setAdding(null);
      toast.success('Section added (switched off). Fill it in, then switch it on.');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s: HomepageSection) => {
    if (!(await confirm({ title: `Delete the "${s.name}" section?`, message: 'To hide it for now, switch it off instead.', confirmLabel: 'Delete', danger: true }))) return;
    try {
      await post({ action: 'delete', sectionId: s.id });
      setSections(prev => prev.filter(x => x.id !== s.id));
      toast.success('Section deleted');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const summary = (s: HomepageSection) => {
    const st = s.settings || {};
    return String(st.headline || st.title || st.subheadline || st.subtitle || (Array.isArray(st.items) ? `${st.items.length} items` : Array.isArray(st.steps) ? `${st.steps.length} steps` : ''));
  };

  return (
    <div>
      <PageHeader
        kicker="Content & CMS"
        title="Homepage"
        description="Every block on the homepage, top to bottom. Edit the text, reorder with the arrows, or switch a block off. Product, category, review and FAQ blocks fill themselves from your catalogue."
        actions={
          <Button icon={Plus} onClick={() => setAdding('banner')}>
            Add section
          </Button>
        }
      />
      <Card bodyClassName="p-0">
        {sections.length === 0 ? (
          <EmptyState icon={Home} title="No homepage sections" />
        ) : (
          <div className="divide-y divide-surface-muted">
            {sections.map((s, i) => (
              <div key={s.id} className={`flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 ${s.enabled ? '' : 'opacity-60'}`}>
                <div className="flex sm:flex-col gap-1 shrink-0">
                  <button type="button" disabled={i === 0} onClick={() => void move(i, -1)} className="p-1 rounded text-charcoal-subtle hover:bg-surface-muted disabled:opacity-30" aria-label="Move up">
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" disabled={i === sections.length - 1} onClick={() => void move(i, 1)} className="p-1 rounded text-charcoal-subtle hover:bg-surface-muted disabled:opacity-30" aria-label="Move down">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm">{s.name}</span>
                    <Badge tone="gray">{TYPE_LABELS[s.type] || s.type}</Badge>
                  </div>
                  <div className="text-xs text-charcoal-subtle truncate mt-0.5">{summary(s)}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Toggle checked={s.enabled} onChange={() => void toggle(s)} />
                  <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setEditing(JSON.parse(JSON.stringify(s)))}>
                    Edit
                  </Button>
                  <button type="button" onClick={() => void remove(s)} className="p-2 rounded-lg text-charcoal-subtle hover:text-accent-rose hover:bg-accent-rose/5" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing ? `Edit: ${editing.name}` : ''}
        description={editing ? TYPE_LABELS[editing.type] : ''}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} loading={saving}>Save section</Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <Field label="Section name (admin only)">
              <Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
            </Field>
            {Object.keys(editing.settings || {}).length === 0 && <p className="text-sm text-charcoal-subtle">This block has no text settings. It fills itself from your catalogue.</p>}
            {Object.entries(editing.settings || {}).map(([k, v]) => (
              <ValueEditor key={k} name={k} value={v} onChange={nv => setEditing(e => (e ? { ...e, settings: { ...e.settings, [k]: nv } } : e))} />
            ))}
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(adding)}
        onClose={() => setAdding(null)}
        title="Add a homepage section"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdding(null)}>Cancel</Button>
            <Button onClick={add} loading={saving}>Add section</Button>
          </>
        }
      >
        <Field label="Section type">
          <Select value={adding || 'banner'} onChange={v => setAdding(v as HomepageSection['type'])} options={Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))} />
        </Field>
      </Modal>
      {dialog}
    </div>
  );
}
