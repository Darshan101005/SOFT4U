'use client';

import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Select, Textarea, Toggle, api, errMsg, toast, useDialog } from './ui';
import { ImagePicker } from './image-picker';

export type FieldDef = {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'toggle' | 'image' | 'banner-image' | 'date' | 'rating';
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  full?: boolean;
  default?: unknown;
};

type Item = Record<string, any> & { id: string };

/**
 * List + modal editor for simple CMS records (FAQs, testimonials, banners,
 * announcements, navigation). Talks to /api/cms/<resource>.
 */
export function CrudList({
  resource,
  kicker = 'Content & CMS',
  title,
  description,
  noun,
  initialItems,
  fields,
  primary,
  secondary,
  badges,
  activeKey,
  orderKey,
  icon,
  groupBy,
}: {
  resource: string;
  kicker?: string;
  title: string;
  description?: React.ReactNode;
  noun: string;
  initialItems: Item[];
  fields: FieldDef[];
  primary: (i: Item) => React.ReactNode;
  secondary?: (i: Item) => React.ReactNode;
  badges?: (i: Item) => React.ReactNode;
  /** Key of the on/off flag and how to read it, e.g. ['status','active'] or ['enabled', true]. */
  activeKey?: [string, unknown, unknown];
  orderKey?: 'displayOrder' | 'priority';
  icon?: React.ComponentType<{ className?: string }>;
  /** `empty` gives a per-group message for groups without items. */
  groupBy?: { key: string; labels: Record<string, string>; empty?: Record<string, string> };
}) {
  const [items, setItems] = useState(initialItems);
  const [form, setForm] = useState<Record<string, any> | null>(null);
  const [saving, setSaving] = useState(false);
  const { confirm, dialog } = useDialog();

  const sorted = orderKey ? [...items].sort((a, b) => (Number(a[orderKey]) || 0) - (Number(b[orderKey]) || 0)) : items;

  const blank = () => {
    const f: Record<string, any> = {};
    for (const d of fields) f[d.key] = d.default ?? (d.type === 'toggle' ? false : d.type === 'rating' ? 5 : d.type === 'number' ? 0 : '');
    if (orderKey) f[orderKey] = items.length + 1;
    if (activeKey) f[activeKey[0]] = activeKey[1];
    return f;
  };

  const open = (item?: Item, group?: string) => {
    if (!item) return setForm(groupBy && group ? { ...blank(), [groupBy.key]: group } : blank());
    const f: Record<string, any> = { id: item.id };
    if (orderKey) f[orderKey] = item[orderKey];
    if (activeKey) f[activeKey[0]] = item[activeKey[0]];
    for (const d of fields) {
      const v = item[d.key];
      f[d.key] = d.type === 'date' ? (v ? String(v).slice(0, 10) : '') : v ?? (d.type === 'toggle' ? false : '');
    }
    setForm(f);
  };

  const save = async () => {
    if (!form) return;
    for (const d of fields) if (d.required && (form[d.key] === '' || form[d.key] === undefined || form[d.key] === null)) return toast.error(`${d.label} is required`);
    setSaving(true);
    try {
      const data = { ...form };
      for (const d of fields) if (d.type === 'date' && data[d.key]) data[d.key] = `${data[d.key]}T00:00:00`;
      const res = await api<{ item: Item }>(`/api/cms/${resource}`, { body: { action: form.id ? 'update' : 'create', id: form.id, data } });
      setItems(prev => (form.id ? prev.map(x => (x.id === form.id ? res.item : x)) : [...prev, res.item]));
      setForm(null);
      toast.success(`${noun} saved`);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (item: Item) => {
    if (!activeKey) return;
    const [key, on, off] = activeKey;
    const next = item[key] === on ? off : on;
    try {
      const res = await api<{ item: Item }>(`/api/cms/${resource}`, { body: { action: 'patch', id: item.id, data: { [key]: next } } });
      setItems(prev => prev.map(x => (x.id === item.id ? res.item : x)));
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const remove = async (item: Item) => {
    if (!(await confirm({ title: `Delete this ${noun.toLowerCase()}?`, message: 'This cannot be undone.', confirmLabel: 'Delete', danger: true }))) return;
    try {
      await api(`/api/cms/${resource}`, { body: { action: 'delete', id: item.id } });
      setItems(prev => prev.filter(x => x.id !== item.id));
      toast.success(`${noun} deleted`);
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const move = async (list: Item[], index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    const ids = list.map(i => i.id);
    [ids[index], ids[j]] = [ids[j], ids[index]];
    try {
      const res = await api<{ items: Item[] }>(`/api/cms/${resource}`, { body: { action: 'reorder', ids } });
      // Keep items outside this group untouched.
      const updated = new Map(res.items.map(i => [i.id, i]));
      setItems(prev => prev.map(x => updated.get(x.id) || x));
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const groups: Array<{ key: string; label: string; list: Item[] }> = groupBy
    ? Object.entries(groupBy.labels).map(([key, label]) => ({ key, label, list: sorted.filter(i => String(i[groupBy.key]) === key) }))
    : [{ key: 'all', label: '', list: sorted }];

  const renderField = (d: FieldDef) => {
    if (!form) return null;
    const v = form[d.key];
    const set = (val: unknown) => setForm(f => (f ? { ...f, [d.key]: val } : f));
    switch (d.type) {
      case 'textarea':
        return <Textarea rows={4} value={v || ''} onChange={e => set(e.target.value)} placeholder={d.placeholder} />;
      case 'number':
        return <Input type="number" value={v ?? ''} onChange={e => set(e.target.value)} />;
      case 'date':
        return <Input type="date" value={v || ''} onChange={e => set(e.target.value)} />;
      case 'select':
        return <Select value={String(v ?? '')} onChange={set} options={d.options || []} />;
      case 'toggle':
        return <Toggle checked={Boolean(v)} onChange={set} label={d.hint} />;
      case 'rating':
        return <Select value={String(v || 5)} onChange={x => set(Number(x))} options={[5, 4, 3, 2, 1].map(n => ({ value: String(n), label: `${n} star${n > 1 ? 's' : ''}` }))} />;
      case 'image':
      case 'banner-image':
        return <ImagePicker value={v || ''} onChange={set} kind={d.type === 'banner-image' ? 'banners' : 'library'} label={d.label} hint={d.hint} wide={d.type === 'banner-image'} />;
      default:
        return <Input value={v ?? ''} onChange={e => set(e.target.value)} placeholder={d.placeholder} />;
    }
  };

  return (
    <div>
      <PageHeader
        kicker={kicker}
        title={title}
        description={description}
        actions={
          <Button icon={Plus} onClick={() => open()}>
            Add {noun.toLowerCase()}
          </Button>
        }
      />
      {items.length === 0 ? (
        <Card>
          <EmptyState icon={icon} title={`No ${noun.toLowerCase()} yet`} description="Items you add here appear on the website straight away. Empty sections are hidden from customers." />
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map(g => (
            <div key={g.key}>
              {g.label && <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-2">{g.label}</div>}
              {g.list.length === 0 ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-dashed border-pista-200 bg-pista-50 px-4 py-3">
                  <p className="text-xs text-charcoal-muted">{groupBy?.empty?.[g.key] || `No ${noun.toLowerCase()}s yet. Click Add ${noun.toLowerCase()}.`}</p>
                  <Button size="sm" variant="secondary" icon={Plus} onClick={() => open(undefined, g.key)}>
                    Add {noun.toLowerCase()}
                  </Button>
                </div>
              ) : (
                <Card bodyClassName="p-0">
                  <div className="divide-y divide-surface-muted">
                    {g.list.map((item, idx) => {
                      const on = activeKey ? item[activeKey[0]] === activeKey[1] : true;
                      return (
                        <div key={item.id} className={`flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 ${on ? '' : 'opacity-60'}`}>
                          {orderKey && (
                            <div className="flex sm:flex-col gap-1 shrink-0">
                              <button type="button" disabled={idx === 0} onClick={() => void move(g.list, idx, -1)} className="p-1 rounded text-charcoal-subtle hover:text-charcoal hover:bg-surface-muted disabled:opacity-30" aria-label="Move up">
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button type="button" disabled={idx === g.list.length - 1} onClick={() => void move(g.list, idx, 1)} className="p-1 rounded text-charcoal-subtle hover:text-charcoal hover:bg-surface-muted disabled:opacity-30" aria-label="Move down">
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-sm text-charcoal">{primary(item)}</div>
                            {secondary && <div className="text-xs text-charcoal-muted mt-0.5 line-clamp-2">{secondary(item)}</div>}
                            {badges && <div className="flex flex-wrap gap-1 mt-1.5">{badges(item)}</div>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {activeKey && <Toggle checked={on} onChange={() => void toggle(item)} />}
                            {!on && <Badge tone="gray">Hidden</Badge>}
                            <button type="button" onClick={() => open(item)} className="p-2 rounded-lg text-charcoal-muted hover:bg-pista-lighter" title="Edit">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button type="button" onClick={() => void remove(item)} className="p-2 rounded-lg text-charcoal-subtle hover:text-accent-rose hover:bg-accent-rose/5" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(form)}
        onClose={() => setForm(null)}
        title={form?.id ? `Edit ${noun.toLowerCase()}` : `New ${noun.toLowerCase()}`}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
            <Button onClick={save} loading={saving}>Save</Button>
          </>
        }
      >
        {form && (
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map(d =>
              d.type === 'image' || d.type === 'banner-image' ? (
                <div key={d.key} className="sm:col-span-2">
                  {renderField(d)}
                </div>
              ) : (
                <Field key={d.key} label={d.type === 'toggle' ? undefined : d.label} required={d.required} hint={d.type === 'toggle' ? undefined : d.hint} className={d.full || d.type === 'textarea' ? 'sm:col-span-2' : ''}>
                  {d.type === 'toggle' ? <div className="pt-1"><div className="text-xs font-bold mb-2">{d.label}</div>{renderField(d)}</div> : renderField(d)}
                </Field>
              ),
            )}
          </div>
        )}
      </Modal>
      {dialog}
    </div>
  );
}
