'use client';

import React, { useState } from 'react';
import { CreditCard, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Currency, PaymentMethod } from '@/lib/db/types';
import { Badge, Button, Card, Checkbox, CopyButton, EmptyState, Field, Input, Modal, PageHeader, Select, Textarea, Toggle, api, errMsg, toast, useDialog } from '../_components/ui';
import { ImagePicker } from '../_components/image-picker';

type Form = Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt' | 'displayOrder'> & { id?: string; displayOrder: string };

const blank = (order: number): Form => ({
  key: '',
  name: '',
  type: 'bank',
  description: '',
  accountTitle: '',
  accountNumber: '',
  iban: '',
  bankName: '',
  branch: '',
  instructions: 'Transfer the exact total to the account above, then upload a screenshot of the payment and enter the transaction ID.',
  logo: '',
  currencies: ['PKR', 'USD'],
  enabled: true,
  displayOrder: String(order),
});

export function PaymentMethodsClient({ initialMethods }: { initialMethods: PaymentMethod[] }) {
  const [methods, setMethods] = useState(initialMethods);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const { confirm, dialog } = useDialog();

  const sorted = [...methods].sort((a, b) => a.displayOrder - b.displayOrder);

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const res = await api<{ method: PaymentMethod }>('/api/admin/payment-methods', { body: { action: form.id ? 'update' : 'create', id: form.id, method: form } });
      setMethods(prev => (form.id ? prev.map(m => (m.id === form.id ? res.method : m)) : [...prev, res.method]));
      setForm(null);
      toast.success('Payment method saved. Checkout shows it right away.');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (m: PaymentMethod) => {
    try {
      const res = await api<{ method: PaymentMethod }>('/api/admin/payment-methods', { body: { action: 'toggle', id: m.id, enabled: !m.enabled } });
      setMethods(prev => prev.map(x => (x.id === m.id ? res.method : x)));
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const remove = async (m: PaymentMethod) => {
    if (!(await confirm({ title: `Delete ${m.name}?`, message: 'Existing orders keep their payment details. To stop using it for now, switch it off instead.', confirmLabel: 'Delete', danger: true }))) return;
    try {
      await api('/api/admin/payment-methods', { body: { action: 'delete', id: m.id } });
      setMethods(prev => prev.filter(x => x.id !== m.id));
      toast.success('Payment method deleted');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const toggleCurrency = (c: Currency, on: boolean) => form && setForm({ ...form, currencies: on ? [...new Set([...form.currencies, c])] : form.currencies.filter(x => x !== c) });

  return (
    <div>
      <PageHeader
        kicker="Settings"
        title="Payment methods"
        description="The accounts customers pay into (bank transfer, Easypaisa, JazzCash). Checkout shows the enabled ones in this order, with copy buttons for every detail. There is no card gateway; you verify each payment by hand."
        actions={
          <Button icon={Plus} onClick={() => setForm(blank(methods.length + 1))}>
            Add method
          </Button>
        }
      />
      {sorted.length === 0 ? (
        <Card>
          <EmptyState icon={CreditCard} title="No payment methods" description="Add at least one account so customers can pay." />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sorted.map(m => (
            <Card key={m.id} bodyClassName="p-5">
              <div className="flex items-start gap-4">
                <div className="w-24 h-14 rounded-xl border border-charcoal-border bg-white flex items-center justify-center overflow-hidden shrink-0">
                  {m.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.logo} alt={m.name} className="max-w-full max-h-full object-contain p-1.5" />
                  ) : (
                    <CreditCard className="w-6 h-6 text-pista-dark" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-charcoal">{m.name}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {m.currencies.map(c => (
                      <Badge key={c} tone="gray">{c} orders</Badge>
                    ))}
                    {!m.enabled && <Badge tone="amber">Off</Badge>}
                  </div>
                </div>
                <Toggle checked={m.enabled} onChange={() => void toggle(m)} />
              </div>
              <div className="mt-4 space-y-1.5 text-sm">
                {(
                  [
                    ['Account title', m.accountTitle],
                    ['Account number', m.accountNumber],
                    ['IBAN', m.iban],
                    ['Bank', m.bankName],
                    ['Branch', m.branch],
                  ] as const
                )
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2">
                      <span className="text-xs text-charcoal-subtle w-28 shrink-0">{k}</span>
                      <span className="font-mono font-semibold break-all flex-1">{v}</span>
                      <CopyButton value={v} label={k} />
                    </div>
                  ))}
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t border-surface-muted">
                <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setForm({ ...m, logo: m.logo || '', displayOrder: String(m.displayOrder) })}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" icon={Trash2} onClick={() => void remove(m)}>
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
        title={form?.id ? `Edit ${form.name}` : 'New payment method'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
            <Button onClick={save} loading={saving}>Save method</Button>
          </>
        }
      >
        {form && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Name shown to customers" required className="sm:col-span-2">
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Bank Transfer (Meezan Bank)" />
              </Field>
              <Field label="Type">
                <Select
                  value={form.type}
                  onChange={v => setForm({ ...form, type: v as PaymentMethod['type'] })}
                  options={[
                    { value: 'bank', label: 'Bank transfer' },
                    { value: 'easypaisa', label: 'Easypaisa' },
                    { value: 'jazzcash', label: 'JazzCash' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
              </Field>
            </div>
            {!form.id && (
              <Field label="Key" required hint="Short internal id, cannot change later. e.g. meezan_bank">
                <Input value={form.key} onChange={e => setForm({ ...form, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })} className="font-mono" />
              </Field>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Account title" required>
                <Input value={form.accountTitle} onChange={e => setForm({ ...form, accountTitle: e.target.value })} />
              </Field>
              <Field label="Account / mobile number" required>
                <Input value={form.accountNumber} onChange={e => setForm({ ...form, accountNumber: e.target.value })} className="font-mono" />
              </Field>
              <Field label="IBAN">
                <Input value={form.iban} onChange={e => setForm({ ...form, iban: e.target.value })} className="font-mono" />
              </Field>
              <Field label="Bank name">
                <Input value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} />
              </Field>
              <Field label="Branch" className="sm:col-span-2">
                <Input value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} />
              </Field>
            </div>
            <Field label="Instructions for the customer">
              <Textarea rows={3} value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} />
            </Field>
            <Field label="Short description (optional)">
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <ImagePicker value={form.logo} onChange={v => setForm(f => (f ? { ...f, logo: v } : f))} kind="banners" name={form.name} label="Logo" hint="Shown on the checkout card. Wide logos keep their shape. PNG, JPG, WebP or SVG up to 5 MB." wide />
              <div className="space-y-4">
                <Field label="Usable for orders in">
                  <div className="flex gap-6 pt-1">
                    <Checkbox checked={form.currencies.includes('PKR')} onChange={v => toggleCurrency('PKR', v)} label="PKR" />
                    <Checkbox checked={form.currencies.includes('USD')} onChange={v => toggleCurrency('USD', v)} label="USD" />
                  </div>
                </Field>
                <Field label="Display order">
                  <Input type="number" value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: e.target.value })} />
                </Field>
                <Toggle checked={form.enabled} onChange={v => setForm({ ...form, enabled: v })} label="Shown at checkout" />
              </div>
            </div>
          </div>
        )}
      </Modal>
      {dialog}
    </div>
  );
}
