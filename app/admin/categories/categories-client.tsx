'use client';

import React, { useState } from 'react';
import { Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Category, Product } from '@/lib/db/types';
import { Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Select, Textarea, Toggle, api, errMsg, toast, useDialog } from '../_components/ui';
import { ImagePicker } from '../_components/image-picker';
import { slugify } from '../_components/format';

type Form = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  status: 'active' | 'disabled';
  featured: boolean;
  displayOrder: string;
  seoTitle: string;
  seoDescription: string;
};

const blank = (order: number): Form => ({
  name: '',
  slug: '',
  description: '',
  image: '',
  status: 'active',
  featured: false,
  displayOrder: String(order),
  seoTitle: '',
  seoDescription: '',
});

export function CategoriesClient({ initialCategories, products }: { initialCategories: Category[]; products: Product[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [form, setForm] = useState<Form | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const { confirm, dialog } = useDialog();

  const countFor = (id: string) => products.filter(p => p.categoryId === id).length;

  const edit = (c: Category) => {
    setSlugTouched(true);
    setForm({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      image: c.image || '',
      status: c.status,
      featured: c.featured,
      displayOrder: String(c.displayOrder ?? 0),
      seoTitle: c.seoTitle || '',
      seoDescription: c.seoDescription || '',
    });
  };

  const save = async () => {
    if (!form) return;
    if (form.name.trim().length < 2) return toast.error('Enter a category name');
    if (!form.slug) return toast.error('Enter a URL slug');
    setSaving(true);
    const data = {
      name: form.name.trim(),
      slug: form.slug,
      description: form.description.trim() || undefined,
      image: form.image || undefined,
      status: form.status,
      featured: form.featured,
      displayOrder: Math.floor(Number(form.displayOrder) || 0),
      seoTitle: form.seoTitle.trim() || undefined,
      seoDescription: form.seoDescription.trim() || undefined,
    };
    try {
      if (form.id) {
        const res = await api<{ category: Category }>('/api/admin/categories', { body: { action: 'update', id: form.id, updates: data } });
        setCategories(prev => prev.map(c => (c.id === form.id ? res.category : c)));
        toast.success('Category saved');
      } else {
        const res = await api<{ category: Category }>('/api/admin/categories', { body: { action: 'create', categoryData: { ...data, parentId: null } } });
        setCategories(prev => [...prev, res.category]);
        toast.success('Category created');
      }
      setForm(null);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (c: Category) => {
    try {
      const res = await api<{ category: Category }>('/api/admin/categories', { body: { action: 'update', id: c.id, updates: { status: c.status === 'active' ? 'disabled' : 'active' } } });
      setCategories(prev => prev.map(x => (x.id === c.id ? res.category : x)));
      toast.success(res.category.status === 'active' ? 'Category is visible' : 'Category hidden');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const remove = async (c: Category) => {
    const n = countFor(c.id);
    const ok = await confirm({
      title: `Delete ${c.name}?`,
      message: n ? `${n} product(s) use this category and will become uncategorised. Consider disabling it instead.` : 'This cannot be undone.',
      confirmLabel: 'Delete category',
      danger: true,
    });
    if (!ok) return;
    try {
      await api('/api/admin/categories', { body: { action: 'delete', id: c.id } });
      setCategories(prev => prev.filter(x => x.id !== c.id));
      toast.success('Category deleted');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const sorted = [...categories].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  return (
    <div>
      <PageHeader
        kicker="Commerce"
        title="Categories"
        description="Each category has a 3D-style icon shown on the homepage and the categories page. Change it by uploading or picking one from the library."
        actions={
          <Button icon={Plus} onClick={() => { setSlugTouched(false); setForm(blank(categories.length + 1)); }}>
            Add category
          </Button>
        }
      />
      {sorted.length === 0 ? (
        <Card>
          <EmptyState icon={Layers} title="No categories yet" />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map(c => (
            <Card key={c.id} bodyClassName="p-4">
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pista-50 to-pista-100 border border-charcoal-border flex items-center justify-center overflow-hidden shrink-0">
                  {c.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image} alt="" className="w-full h-full object-contain p-2" />
                  ) : (
                    <span className="text-2xl font-extrabold text-pista-dark">{c.name.charAt(0)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-charcoal truncate">{c.name}</div>
                  <div className="text-[11px] font-mono text-charcoal-subtle truncate">/categories/{c.slug}</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge tone={c.status === 'active' ? 'green' : 'gray'}>{c.status === 'active' ? 'Visible' : 'Hidden'}</Badge>
                    {c.featured && <Badge tone="blue">Featured</Badge>}
                    <Badge tone="gray">{countFor(c.id)} products</Badge>
                  </div>
                </div>
              </div>
              {c.description && <p className="text-xs text-charcoal-muted mt-3 line-clamp-2">{c.description}</p>}
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-surface-muted">
                <Button size="sm" variant="secondary" icon={Pencil} onClick={() => edit(c)}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void toggle(c)}>
                  {c.status === 'active' ? 'Hide' : 'Show'}
                </Button>
                <Button size="sm" variant="ghost" icon={Trash2} onClick={() => void remove(c)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(form)}
        onClose={() => setForm(null)}
        title={form?.id ? 'Edit category' : 'New category'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{form?.id ? 'Save category' : 'Create category'}</Button>
          </>
        }
      >
        {form && (
          <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
            <div className="space-y-4">
              <Field label="Name" required>
                <Input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value, slug: slugTouched ? form.slug : slugify(e.target.value) })}
                />
              </Field>
              <Field label="URL slug" required>
                <Input
                  value={form.slug}
                  className="font-mono"
                  onChange={e => {
                    setSlugTouched(true);
                    setForm({ ...form, slug: slugify(e.target.value) });
                  }}
                />
              </Field>
              <Field label="Description">
                <Textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Status">
                  <Select value={form.status} onChange={v => setForm({ ...form, status: v as Form['status'] })} options={[{ value: 'active', label: 'Visible' }, { value: 'disabled', label: 'Hidden' }]} />
                </Field>
                <Field label="Display order">
                  <Input type="number" value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: e.target.value })} />
                </Field>
              </div>
              <Toggle checked={form.featured} onChange={v => setForm({ ...form, featured: v })} label="Featured" description="Highlight on the homepage" />
              <Field label="SEO title">
                <Input value={form.seoTitle} onChange={e => setForm({ ...form, seoTitle: e.target.value })} placeholder={form.name ? `${form.name} | Soft4u` : ''} />
              </Field>
              <Field label="SEO description">
                <Textarea rows={2} value={form.seoDescription} onChange={e => setForm({ ...form, seoDescription: e.target.value })} />
              </Field>
            </div>
            <ImagePicker
              value={form.image}
              onChange={url => setForm(f => (f ? { ...f, image: url } : f))}
              kind="categories"
              name={form.name}
              label="Category icon"
              hint="Pick a 3D icon from the library or upload one. PNG, JPG, WebP or SVG up to 5 MB, saved as 512×512 PNG."
            />
          </div>
        )}
      </Modal>
      {dialog}
    </div>
  );
}
