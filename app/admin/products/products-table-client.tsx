'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Boxes, Copy, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Category, Product, UsdPricingDefaults } from '@/lib/db/types';
import { formatMoney } from '@/lib/money';
import { usdPriceFor } from '@/lib/pricing';
import { Badge, Button, Card, EmptyState, PageHeader, SearchInput, Select, Table, api, errMsg, toast, useDialog } from '../_components/ui';

function stockSummary(p: Product): { label: string; tone: 'green' | 'amber' | 'rose' | 'gray' } {
  const active = p.variants.filter(v => v.status === 'active');
  if (active.length === 0) return { label: 'No active plan', tone: 'rose' };
  if (active.every(v => v.stockMode === 'preorder')) return { label: 'Manual delivery', tone: 'gray' };
  const counted = active.filter(v => v.stockMode !== 'preorder');
  const total = counted.reduce((n, v) => n + (v.stock || 0), 0);
  if (total === 0 && active.every(v => v.stockMode !== 'preorder')) return { label: 'Out of stock', tone: 'rose' };
  return { label: `${total} in stock`, tone: total <= 2 ? 'amber' : 'green' };
}

export function ProductsTableClient({
  initialProducts,
  categories,
  rate,
  usdDefaults,
}: {
  initialProducts: Product[];
  categories: Category[];
  rate: number;
  usdDefaults: UsdPricingDefaults;
}) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');
  const [status, setStatus] = useState('all');
  const [busy, setBusy] = useState<string | null>(null);
  const { confirm, dialog } = useDialog();

  const catName = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);

  const filtered = products.filter(p => {
    if (cat !== 'all' && p.categoryId !== cat) return false;
    if (status !== 'all' && p.status !== status) return false;
    const q = search.trim().toLowerCase();
    if (q) return [p.name, p.sku, p.brand || '', p.slug].some(s => s.toLowerCase().includes(q));
    return true;
  });

  const call = async (p: Product, body: Record<string, unknown>, ok: string) => {
    setBusy(p.id);
    try {
      const res = await api<{ product?: Product; success?: boolean }>('/api/admin/products', { body: { id: p.id, ...body } });
      if (body.action === 'delete') setProducts(prev => prev.filter(x => x.id !== p.id));
      else if (body.action === 'duplicate' && res.product) setProducts(prev => [res.product!, ...prev]);
      else if (res.product) setProducts(prev => prev.map(x => (x.id === p.id ? res.product! : x)));
      toast.success(ok);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(null);
    }
  };

  const remove = async (p: Product) => {
    const ok = await confirm({
      title: `Delete ${p.name} permanently?`,
      message: (
        <>
          <p>This removes the product, its plans, its vault items and its reviews. Past orders keep their copy of the details.</p>
          <p className="mt-2 font-semibold">To hide it for now, use Disable instead. You can turn it back on any time.</p>
        </>
      ),
      confirmLabel: 'Delete permanently',
      danger: true,
    });
    if (ok) await call(p, { action: 'delete' }, 'Product deleted');
  };

  return (
    <div>
      <PageHeader
        kicker="Commerce"
        title="Products"
        description="Disable a product to hide it from the store without losing it. Prices are PKR with the USD price per plan."
        actions={
          <Link href="/admin/products/new" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pista text-charcoal font-bold text-sm hover:bg-pista-hover">
            <Plus className="w-4 h-4" /> Add product
          </Link>
        }
      />

      <Card className="mb-4" bodyClassName="p-4 flex flex-col md:flex-row gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, brand, SKU" className="flex-1" />
        <div className="grid grid-cols-2 gap-3 md:w-[420px]">
          <Select value={cat} onChange={setCat} options={[{ value: 'all', label: 'All categories' }, ...categories.map(c => ({ value: c.id, label: c.name }))]} />
          <Select
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'active', label: 'Active' },
              { value: 'disabled', label: 'Disabled' },
              { value: 'draft', label: 'Draft' },
              { value: 'archived', label: 'Archived' },
            ]}
          />
        </div>
      </Card>

      <Card bodyClassName="p-0">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title={products.length ? 'No product matches' : 'No products yet'}
            action={
              !products.length ? (
                <Link href="/admin/products/new" className="text-sm font-bold text-pista-dark hover:underline">
                  Add your first product
                </Link>
              ) : undefined
            }
          />
        ) : (
          <Table head={['Product', 'Category', 'From', 'Plans', 'Stock', 'Flags', 'Status', '']}>
            {filtered.map(p => {
              const active = p.variants.filter(v => v.status === 'active');
              const cheapest = [...active].sort((a, b) => a.price - b.price)[0];
              const usd = cheapest && rate ? usdPriceFor(cheapest, rate, usdDefaults) : null;
              const stock = stockSummary(p);
              const img = p.logo || p.images[0];
              return (
                <tr key={p.id} className="hover:bg-surface-bg/60">
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => router.push(`/admin/products/${p.id}`)} className="flex items-center gap-3 text-left">
                      <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-pista-50 to-pista-100 border border-charcoal-border flex items-center justify-center overflow-hidden shrink-0">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt="" className="w-full h-full object-contain p-1" />
                        ) : (
                          <span className="font-extrabold text-pista-dark">{p.name.charAt(0)}</span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-bold text-charcoal hover:text-pista-dark">{p.name}</span>
                        <span className="block text-[11px] text-charcoal-subtle font-mono">{p.brand ? `${p.brand} · ` : ''}{p.sku || p.slug}</span>
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-charcoal-muted whitespace-nowrap">{catName.get(p.categoryId) || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {cheapest ? (
                      <>
                        <div className="font-bold">{formatMoney(cheapest.price, 'PKR')}</div>
                        {usd !== null && <div className="text-[11px] text-charcoal-subtle">{formatMoney(usd, 'USD')}</div>}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-charcoal-muted">{active.length}/{p.variants.length}</td>
                  <td className="px-4 py-3">
                    <Badge tone={stock.tone}>{stock.label}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.featured && <Badge tone="green">Featured</Badge>}
                      {p.trending && <Badge tone="blue">Trending</Badge>}
                      {p.bestseller && <Badge tone="teal">Best seller</Badge>}
                      {p.isNew && <Badge tone="amber">New</Badge>}
                      {p.badge && <Badge tone="dark">{p.badge}</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={p.status === 'active' ? 'green' : p.status === 'draft' ? 'amber' : 'gray'}>{p.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link href={`/admin/products/${p.id}`} className="p-2 rounded-lg text-charcoal-muted hover:bg-pista-lighter hover:text-charcoal" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        type="button"
                        disabled={busy === p.id}
                        onClick={() => call(p, { action: 'set_status', status: p.status === 'active' ? 'disabled' : 'active' }, p.status === 'active' ? 'Product disabled (hidden from store)' : 'Product is live')}
                        className="p-2 rounded-lg text-charcoal-muted hover:bg-pista-lighter hover:text-charcoal disabled:opacity-40"
                        title={p.status === 'active' ? 'Disable (hide)' : 'Enable (show)'}
                      >
                        {p.status === 'active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button type="button" disabled={busy === p.id} onClick={() => call(p, { action: 'duplicate' }, 'Copy created as draft')} className="p-2 rounded-lg text-charcoal-muted hover:bg-pista-lighter hover:text-charcoal disabled:opacity-40" title="Duplicate">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button type="button" disabled={busy === p.id} onClick={() => void remove(p)} className="p-2 rounded-lg text-charcoal-subtle hover:bg-accent-rose/5 hover:text-accent-rose disabled:opacity-40" title="Delete permanently">
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
      <div className="mt-3 flex justify-end">
        <Button size="sm" variant="ghost" onClick={() => router.refresh()}>
          Refresh
        </Button>
      </div>
      {dialog}
    </div>
  );
}
