'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, KeyRound, ListPlus, Pencil, Plus, Trash2 } from 'lucide-react';
import type { InventoryItem, Product } from '@/lib/db/types';
import { Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Select, Table, Textarea, api, errMsg, toast, useDialog } from '../_components/ui';
import { KvBuilder, cleanRows, toRows, type KvRow } from '../_components/kv-builder';
import { fmtDateTime } from '../_components/format';

const TYPES = [
  { value: 'credential', label: 'Account (email + password)' },
  { value: 'license_key', label: 'Licence key / code' },
  { value: 'manual', label: 'Invite link / other' },
  { value: 'generated', label: 'Generated' },
];

const BULK_FORMATS = [
  { value: 'email:password', label: 'email:password (one per line)' },
  { value: 'email|password|pin', label: 'email|password|pin|profile (one per line)' },
  { value: 'key', label: 'Licence key or link (one per line)' },
];

type ItemForm = {
  id?: string;
  productId: string;
  variantId: string;
  type: string;
  email: string;
  password: string;
  pin: string;
  profileName: string;
  licenseKey: string;
  notes: string;
  rows: KvRow[];
};

function summary(item: InventoryItem): string {
  const d = item.data || {};
  return [d.email, d.licenseKey, d.profileName, ...(d.fields || []).map(f => `${f.label}: ${f.value}`)].filter(Boolean).join(' · ') || d.notes || '—';
}

export function InventoryClient({ initialInventory, products, initialProductId }: { initialInventory: InventoryItem[]; products: Product[]; initialProductId: string }) {
  const [items, setItems] = useState(initialInventory);
  const [productId, setProductId] = useState(products.some(p => p.id === initialProductId) ? initialProductId : 'all');
  const [variantId, setVariantId] = useState('all');
  const [status, setStatus] = useState<'all' | InventoryItem['status']>('available');
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [form, setForm] = useState<ItemForm | null>(null);
  const [bulk, setBulk] = useState<{ productId: string; variantId: string; format: string; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const { confirm, dialog } = useDialog();

  const productById = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);
  const productOptions = products.map(p => ({ value: p.id, label: p.name }));
  const variantOptions = (pid: string) => [
    { value: '', label: 'Any plan of this product' },
    ...(productById.get(pid)?.variants || []).map(v => ({ value: v.id, label: v.name, hint: v.stockMode === 'vault' ? 'Vault stock' : 'Stock mode is not vault' })),
  ];

  const filtered = items.filter(i => {
    if (productId !== 'all' && i.productId !== productId) return false;
    if (variantId !== 'all' && (i.variantId || '') !== variantId) return false;
    if (status !== 'all' && i.status !== status) return false;
    return true;
  });

  const counts = useMemo(() => {
    const out = { available: 0, sold: 0, disabled: 0 };
    for (const i of items) {
      if (productId !== 'all' && i.productId !== productId) continue;
      if (i.status === 'available') out.available++;
      else if (i.status === 'sold') out.sold++;
      else if (i.status === 'disabled') out.disabled++;
    }
    return out;
  }, [items, productId]);

  const reload = async () => {
    try {
      const res = await api<{ inventory: InventoryItem[] }>('/api/admin/inventory');
      setItems(res.inventory);
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const openNew = () => {
    const pid = productId !== 'all' ? productId : products[0]?.id || '';
    setForm({ productId: pid, variantId: variantId !== 'all' ? variantId : '', type: 'credential', email: '', password: '', pin: '', profileName: '', licenseKey: '', notes: '', rows: [] });
  };

  const openEdit = (i: InventoryItem) => {
    const d = i.data || {};
    setForm({
      id: i.id,
      productId: i.productId,
      variantId: i.variantId || '',
      type: i.type,
      email: d.email || '',
      password: d.password || '',
      pin: d.pin || '',
      profileName: d.profileName || '',
      licenseKey: d.licenseKey || '',
      notes: d.notes || '',
      rows: toRows(d.fields),
    });
  };

  const saveItem = async () => {
    if (!form) return;
    const data = { email: form.email, password: form.password, pin: form.pin, profileName: form.profileName, licenseKey: form.licenseKey, notes: form.notes, fields: cleanRows(form.rows) };
    setSaving(true);
    try {
      if (form.id) {
        await api('/api/admin/inventory', { body: { action: 'update', id: form.id, updates: { data, variantId: form.variantId } } });
        toast.success('Vault item saved');
      } else {
        await api('/api/admin/inventory', { body: { action: 'create', itemData: { productId: form.productId, variantId: form.variantId || undefined, type: form.type, data } } });
        toast.success('Added to the vault');
      }
      setForm(null);
      await reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const parseBulk = (b: NonNullable<typeof bulk>) =>
    b.text
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean)
      .map(line => {
        if (b.format === 'key') return { type: 'license_key', data: { licenseKey: line } };
        const parts = b.format === 'email:password' ? [line.slice(0, line.indexOf(':')), line.slice(line.indexOf(':') + 1)] : line.split('|');
        const [email, password, pin, profileName] = parts.map(p => (p || '').trim());
        return { type: 'credential', data: { email, password, pin, profileName } };
      });

  const saveBulk = async () => {
    if (!bulk) return;
    const rows = parseBulk(bulk);
    if (!rows.length) return toast.error('Paste at least one line');
    if (bulk.format === 'email:password' && rows.some(r => !r.data.email || !(r.data as { password?: string }).password)) return toast.error('Every line needs email:password');
    setSaving(true);
    try {
      const res = await api<{ count: number }>('/api/admin/inventory', {
        body: { action: 'bulk_create', items: rows.map(r => ({ ...r, productId: bulk.productId, variantId: bulk.variantId || undefined })) },
      });
      toast.success(`${res.count} item(s) added to the vault`);
      setBulk(null);
      await reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const setItemStatus = async (i: InventoryItem, s: 'available' | 'disabled') => {
    try {
      await api('/api/admin/inventory', { body: { action: 'update', id: i.id, updates: { status: s } } });
      setItems(prev => prev.map(x => (x.id === i.id ? { ...x, status: s } : x)));
      toast.success(s === 'disabled' ? 'Item disabled (will not be delivered)' : 'Item available again');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const remove = async (i: InventoryItem) => {
    const ok = await confirm({ title: 'Delete this vault item?', message: 'It will never be delivered. This cannot be undone.', confirmLabel: 'Delete', danger: true });
    if (!ok) return;
    try {
      await api('/api/admin/inventory', { body: { action: 'delete', id: i.id } });
      setItems(prev => prev.filter(x => x.id !== i.id));
      toast.success('Vault item deleted');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const toggleReveal = (id: string) =>
    setRevealed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const bulkCount = bulk ? parseBulk(bulk).length : 0;

  return (
    <div>
      <PageHeader
        kicker="Commerce"
        title="Vault / Inventory"
        description="Stock of ready-to-send accounts and keys. When you deliver an order, an unused item is assigned and marked as used. One item can never go to two orders."
        actions={
          <>
            <Button variant="secondary" icon={ListPlus} disabled={!products.length} onClick={() => setBulk({ productId: productId !== 'all' ? productId : products[0]?.id || '', variantId: '', format: 'email:password', text: '' })}>
              Bulk add
            </Button>
            <Button icon={Plus} disabled={!products.length} onClick={openNew}>
              Add item
            </Button>
          </>
        }
      />

      <Card className="mb-4" bodyClassName="p-4 grid gap-3 md:grid-cols-3">
        <Select
          value={productId}
          onChange={v => {
            setProductId(v);
            setVariantId('all');
          }}
          options={[{ value: 'all', label: 'All products' }, ...productOptions]}
          searchable
        />
        <Select
          value={variantId}
          onChange={setVariantId}
          disabled={productId === 'all'}
          options={[{ value: 'all', label: 'All plans' }, ...(productId !== 'all' ? variantOptions(productId).map(o => (o.value === '' ? { ...o, label: 'Items for any plan' } : o)) : [])]}
        />
        <Select
          value={status}
          onChange={v => setStatus(v as typeof status)}
          options={[
            { value: 'available', label: `Unused (${counts.available})` },
            { value: 'sold', label: `Delivered (${counts.sold})` },
            { value: 'disabled', label: `Disabled (${counts.disabled})` },
            { value: 'all', label: 'All statuses' },
          ]}
        />
      </Card>

      <Card bodyClassName="p-0">
        {filtered.length === 0 ? (
          <EmptyState icon={KeyRound} title="No vault items here" description="Add accounts or keys so orders can be delivered in one click. Set the plan's stock to Vault stock in the product form to show live availability." />
        ) : (
          <Table head={['Product / plan', 'Details', 'Status', 'Order', 'Added', '']}>
            {filtered.map(i => {
              const p = productById.get(i.productId);
              const v = p?.variants.find(x => x.id === i.variantId);
              const show = revealed.has(i.id);
              return (
                <tr key={i.id} className="hover:bg-surface-bg/60 align-top">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{p?.name || 'Deleted product'}</div>
                    <div className="text-xs text-charcoal-subtle">{v?.name || 'Any plan'}</div>
                  </td>
                  <td className="px-4 py-3 max-w-[360px]">
                    <div className="text-xs font-mono break-all">{summary(i)}</div>
                    {i.data.password && (
                      <div className="text-xs font-mono flex items-center gap-1 mt-0.5">
                        <span className="text-charcoal-subtle">Password:</span> {show ? i.data.password : '••••••••'}
                        <button type="button" onClick={() => toggleReveal(i.id)} className="p-0.5 text-charcoal-subtle hover:text-charcoal" aria-label={show ? 'Hide' : 'Show'}>
                          {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                    {i.data.pin && <div className="text-xs font-mono"><span className="text-charcoal-subtle">PIN:</span> {show ? i.data.pin : '••••'}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={i.status === 'available' ? 'green' : i.status === 'sold' ? 'blue' : 'gray'}>{i.status === 'available' ? 'Unused' : i.status === 'sold' ? 'Delivered' : i.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {i.orderId ? (
                      <Link href={`/admin/orders/${i.orderId}`} className="font-bold text-pista-dark hover:underline">
                        View order
                      </Link>
                    ) : (
                      '—'
                    )}
                    {i.soldAt && <div className="text-charcoal-subtle">{fmtDateTime(i.soldAt)}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs text-charcoal-subtle whitespace-nowrap">{fmtDateTime(i.createdAt)}</td>
                  <td className="px-4 py-3">
                    {i.status !== 'sold' && (
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => openEdit(i)} className="p-2 rounded-lg text-charcoal-muted hover:bg-pista-lighter" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <Button size="sm" variant="ghost" onClick={() => void setItemStatus(i, i.status === 'available' ? 'disabled' : 'available')}>
                          {i.status === 'available' ? 'Disable' : 'Enable'}
                        </Button>
                        <button type="button" onClick={() => void remove(i)} className="p-2 rounded-lg text-charcoal-subtle hover:text-accent-rose hover:bg-accent-rose/5" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
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
        title={form?.id ? 'Edit vault item' : 'Add vault item'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
            <Button onClick={saveItem} loading={saving}>{form?.id ? 'Save' : 'Add to vault'}</Button>
          </>
        }
      >
        {form && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Product" required>
                <Select value={form.productId} onChange={v => setForm({ ...form, productId: v, variantId: '' })} options={productOptions} disabled={Boolean(form.id)} searchable />
              </Field>
              <Field label="Plan">
                <Select value={form.variantId} onChange={v => setForm({ ...form, variantId: v })} options={variantOptions(form.productId)} />
              </Field>
              <Field label="Type">
                <Select value={form.type} onChange={v => setForm({ ...form, type: v })} options={TYPES} disabled={Boolean(form.id)} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Email / username">
                <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} autoComplete="off" />
              </Field>
              <Field label="Password">
                <Input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} autoComplete="off" className="font-mono" />
              </Field>
              <Field label="Profile name">
                <Input value={form.profileName} onChange={e => setForm({ ...form, profileName: e.target.value })} />
              </Field>
              <Field label="PIN">
                <Input value={form.pin} onChange={e => setForm({ ...form, pin: e.target.value })} className="font-mono" />
              </Field>
            </div>
            <Field label="Licence key / link">
              <Input value={form.licenseKey} onChange={e => setForm({ ...form, licenseKey: e.target.value })} className="font-mono" />
            </Field>
            <Field label="Extra fields" hint="Sent to the customer with the item, e.g. 2FA backup code, recovery email">
              <KvBuilder rows={form.rows} onChange={rows => setForm({ ...form, rows })} />
            </Field>
            <Field label="Internal notes" hint="Not sent to the customer">
              <Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </Field>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(bulk)}
        onClose={() => setBulk(null)}
        title="Bulk add to vault"
        description="Paste one item per line."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setBulk(null)}>Cancel</Button>
            <Button onClick={saveBulk} loading={saving} disabled={!bulkCount}>Add {bulkCount || ''} item(s)</Button>
          </>
        }
      >
        {bulk && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Product" required>
                <Select value={bulk.productId} onChange={v => setBulk({ ...bulk, productId: v, variantId: '' })} options={productOptions} searchable />
              </Field>
              <Field label="Plan">
                <Select value={bulk.variantId} onChange={v => setBulk({ ...bulk, variantId: v })} options={variantOptions(bulk.productId)} />
              </Field>
              <Field label="Format">
                <Select value={bulk.format} onChange={v => setBulk({ ...bulk, format: v })} options={BULK_FORMATS} />
              </Field>
            </div>
            <Textarea
              rows={10}
              value={bulk.text}
              onChange={e => setBulk({ ...bulk, text: e.target.value })}
              className="font-mono text-xs"
              placeholder={bulk.format === 'key' ? 'XXXX-XXXX-XXXX\nhttps://invite.example.com/abc' : bulk.format === 'email:password' ? 'user1@mail.com:Pass123\nuser2@mail.com:Pass456' : 'user1@mail.com|Pass123|1234|Profile 1'}
            />
            <p className="text-xs text-charcoal-subtle">{bulkCount} line(s) detected.</p>
          </div>
        )}
      </Modal>
      {dialog}
    </div>
  );
}
