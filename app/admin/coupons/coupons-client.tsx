'use client';

import React, { useState } from 'react';
import { Pencil, Plus, Tag, Trash2, X } from 'lucide-react';
import type { Coupon } from '@/lib/db/types';
import { formatMoney } from '@/lib/money';
import { Badge, Button, Card, CopyButton, EmptyState, Field, Input, Modal, PageHeader, Select, Table, Textarea, Toggle, api, errMsg, toast, useDialog } from '../_components/ui';
import { fmtDate } from '../_components/format';

type Opt = { id: string; name: string };

type Form = {
  id?: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: string;
  minOrderAmount: string;
  maxDiscount: string;
  usageLimit: string;
  perUserLimit: string;
  startDate: string;
  expiryDate: string;
  enabled: boolean;
  productIds: string[];
  categoryIds: string[];
};

const blank: Form = {
  code: '',
  description: '',
  type: 'percentage',
  value: '',
  minOrderAmount: '',
  maxDiscount: '',
  usageLimit: '',
  perUserLimit: '1',
  startDate: '',
  expiryDate: '',
  enabled: true,
  productIds: [],
  categoryIds: [],
};

const toLocal = (iso?: string) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');

function MultiPick({ label, all, value, onChange }: { label: string; all: Opt[]; value: string[]; onChange: (v: string[]) => void }) {
  const remaining = all.filter(o => !value.includes(o.id));
  return (
    <Field label={label} hint="Empty means every item">
      <Select value="" onChange={v => v && onChange([...value, v])} options={remaining.map(o => ({ value: o.id, label: o.name }))} placeholder="Add…" searchable />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {value.map(id => (
            <span key={id} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-pista-lighter text-pista-darker text-xs font-bold">
              {all.find(o => o.id === id)?.name || id}
              <button type="button" onClick={() => onChange(value.filter(x => x !== id))} className="p-0.5 rounded-full hover:bg-white" aria-label="Remove">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </Field>
  );
}

function couponState(c: Coupon): { label: string; tone: 'green' | 'gray' | 'amber' | 'rose' } {
  if (!c.enabled) return { label: 'Off', tone: 'gray' };
  const now = new Date().toISOString();
  if (c.startDate && c.startDate > now) return { label: 'Scheduled', tone: 'amber' };
  if (c.expiryDate && c.expiryDate < now) return { label: 'Expired', tone: 'rose' };
  if (c.usageLimit && c.usageCount >= c.usageLimit) return { label: 'Used up', tone: 'rose' };
  return { label: 'Live', tone: 'green' };
}

export function CouponsClient({ initialCoupons, products, categories }: { initialCoupons: Coupon[]; products: Opt[]; categories: Opt[] }) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const { confirm, dialog } = useDialog();

  const edit = (c: Coupon) =>
    setForm({
      id: c.id,
      code: c.code,
      description: c.description || '',
      type: c.type,
      value: String(c.value),
      minOrderAmount: c.minOrderAmount ? String(c.minOrderAmount) : '',
      maxDiscount: c.maxDiscount ? String(c.maxDiscount) : '',
      usageLimit: c.usageLimit ? String(c.usageLimit) : '',
      perUserLimit: c.perUserLimit ? String(c.perUserLimit) : '',
      startDate: toLocal(c.startDate),
      expiryDate: toLocal(c.expiryDate),
      enabled: c.enabled,
      productIds: c.productIds || [],
      categoryIds: c.categoryIds || [],
    });

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const coupon = { ...form, expiryDate: form.expiryDate ? `${form.expiryDate}T23:59:59` : '', startDate: form.startDate ? `${form.startDate}T00:00:00` : '' };
      const res = await api<{ coupon: Coupon }>('/api/admin/coupons', { body: { action: form.id ? 'update' : 'create', id: form.id, coupon } });
      setCoupons(prev => (form.id ? prev.map(c => (c.id === form.id ? res.coupon : c)) : [res.coupon, ...prev]));
      setForm(null);
      toast.success(form.id ? 'Coupon saved' : 'Coupon created');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (c: Coupon) => {
    try {
      const res = await api<{ coupon: Coupon }>('/api/admin/coupons', { body: { action: 'toggle', id: c.id, enabled: !c.enabled } });
      setCoupons(prev => prev.map(x => (x.id === c.id ? res.coupon : x)));
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const remove = async (c: Coupon) => {
    if (!(await confirm({ title: `Delete coupon ${c.code}?`, message: 'Orders that already used it are not affected.', confirmLabel: 'Delete', danger: true }))) return;
    try {
      await api('/api/admin/coupons', { body: { action: 'delete', id: c.id } });
      setCoupons(prev => prev.filter(x => x.id !== c.id));
      toast.success('Coupon deleted');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div>
      <PageHeader
        kicker="Commerce"
        title="Coupons"
        description="Percentage or fixed discounts. Fixed amounts and minimum order are in PKR and are converted for USD orders."
        actions={
          <Button icon={Plus} onClick={() => setForm({ ...blank })}>
            New coupon
          </Button>
        }
      />
      <Card bodyClassName="p-0">
        {coupons.length === 0 ? (
          <EmptyState icon={Tag} title="No coupons yet" description="Create a code customers can enter at checkout." />
        ) : (
          <Table head={['Code', 'Discount', 'Rules', 'Used', 'Valid', 'Status', '']}>
            {coupons.map(c => {
              const st = couponState(c);
              return (
                <tr key={c.id} className="hover:bg-surface-bg/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <code className="font-mono font-extrabold">{c.code}</code>
                      <CopyButton value={c.code} label="Code" />
                    </div>
                    {c.description && <div className="text-xs text-charcoal-subtle">{c.description}</div>}
                  </td>
                  <td className="px-4 py-3 font-bold whitespace-nowrap">{c.type === 'percentage' ? `${c.value}% off` : `${formatMoney(c.value, 'PKR')} off`}</td>
                  <td className="px-4 py-3 text-xs text-charcoal-muted">
                    {c.minOrderAmount ? <div>Min {formatMoney(c.minOrderAmount, 'PKR')}</div> : null}
                    {c.maxDiscount ? <div>Max {formatMoney(c.maxDiscount, 'PKR')}</div> : null}
                    {c.perUserLimit ? <div>{c.perUserLimit} per customer</div> : null}
                    {c.productIds?.length || c.categoryIds?.length ? <div>Limited to {(c.productIds?.length || 0) + (c.categoryIds?.length || 0)} item(s)</div> : null}
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    {c.usageCount}
                    {c.usageLimit ? ` / ${c.usageLimit}` : ''}
                  </td>
                  <td className="px-4 py-3 text-xs text-charcoal-subtle whitespace-nowrap">
                    {c.startDate ? fmtDate(c.startDate) : 'Now'} → {c.expiryDate ? fmtDate(c.expiryDate) : 'No end'}
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => void toggle(c)} title="Turn on or off">
                      <Badge tone={st.tone}>{st.label}</Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => edit(c)} className="p-2 rounded-lg text-charcoal-muted hover:bg-pista-lighter" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => void remove(c)} className="p-2 rounded-lg text-charcoal-subtle hover:text-accent-rose hover:bg-accent-rose/5" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>

      <Modal
        open={Boolean(form)}
        onClose={() => setForm(null)}
        title={form?.id ? `Edit ${form.code}` : 'New coupon'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{form?.id ? 'Save coupon' : 'Create coupon'}</Button>
          </>
        }
      >
        {form && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Code" required>
                <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })} className="font-mono" placeholder="WELCOME10" />
              </Field>
              <Field label="Type">
                <Select value={form.type} onChange={v => setForm({ ...form, type: v as Form['type'] })} options={[{ value: 'percentage', label: 'Percentage off' }, { value: 'fixed', label: 'Fixed amount off (PKR)' }]} />
              </Field>
              <Field label={form.type === 'percentage' ? 'Percent' : 'Amount (PKR)'} required>
                <Input type="number" min={0} value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} />
              </Field>
            </div>
            <Field label="Description (internal)">
              <Textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Minimum order (PKR)">
                <Input type="number" min={0} value={form.minOrderAmount} onChange={e => setForm({ ...form, minOrderAmount: e.target.value })} />
              </Field>
              <Field label="Max discount (PKR)">
                <Input type="number" min={0} value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })} />
              </Field>
              <Field label="Total uses">
                <Input type="number" min={0} value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })} placeholder="Unlimited" />
              </Field>
              <Field label="Uses per customer">
                <Input type="number" min={0} value={form.perUserLimit} onChange={e => setForm({ ...form, perUserLimit: e.target.value })} placeholder="Unlimited" />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Starts">
                <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
              </Field>
              <Field label="Ends">
                <Input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <MultiPick label="Only these products" all={products} value={form.productIds} onChange={v => setForm({ ...form, productIds: v })} />
              <MultiPick label="Only these categories" all={categories} value={form.categoryIds} onChange={v => setForm({ ...form, categoryIds: v })} />
            </div>
            <Toggle checked={form.enabled} onChange={v => setForm({ ...form, enabled: v })} label="Enabled" />
          </div>
        )}
      </Modal>
      {dialog}
    </div>
  );
}
