'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Copy, Plus, Save, Trash2, X } from 'lucide-react';
import type { Category, Product, ProductVariant, StockMode, UsdPricingDefaults, UsdPricingMode } from '@/lib/db/types';
import { usdPriceFor } from '@/lib/pricing';
import { formatMoney } from '@/lib/money';
import { Badge, Button, Card, Field, Input, PageHeader, Select, Textarea, Toggle, api, cx, errMsg, toast, useDialog } from '../_components/ui';
import { ImagePicker } from '../_components/image-picker';
import { slugify } from '../_components/format';

interface VariantForm {
  key: string;
  id?: string;
  name: string;
  duration: string;
  customDays: string;
  price: string;
  compareAtPrice: string;
  sku: string;
  stockMode: StockMode;
  stock: string;
  status: 'active' | 'disabled';
  usdPricingMode: UsdPricingMode;
  usdPrice: string;
  usdMarkupPercent: string;
  usdMarkupAmount: string;
  deliveryTime: string;
  description: string;
  vaultCount: number;
}

const DURATIONS = [
  { value: '30', label: '1 month (30 days)' },
  { value: '90', label: '3 months (90 days)' },
  { value: '180', label: '6 months (180 days)' },
  { value: '365', label: '12 months (365 days)' },
  { value: 'lifetime', label: 'Lifetime / no expiry' },
  { value: 'custom', label: 'Custom number of days' },
];

const STOCK_MODES: Array<{ value: StockMode; label: string; hint: string }> = [
  { value: 'preorder', label: 'Manual delivery (always orderable)', hint: 'Shown as "Pre-order / manual delivery"' },
  { value: 'vault', label: 'Vault stock', hint: 'Available = unused vault items for this plan' },
  { value: 'manual', label: 'Manual count', hint: 'You type how many are available' },
];

const USD_MODES: Array<{ value: UsdPricingMode; label: string; hint: string }> = [
  { value: 'auto', label: 'Auto: PKR converted at the live rate', hint: 'Store-wide margin from Currency & pricing applies' },
  { value: 'percent', label: 'Auto + margin %', hint: 'e.g. +10% on top of the converted price' },
  { value: 'amount', label: 'Auto + margin in USD', hint: 'e.g. +1.50 USD on top of the converted price' },
  { value: 'fixed', label: 'Fixed USD price', hint: 'e.g. PKR 299 plan sold at exactly USD 5.00' },
];

const PRODUCT_STATUSES = [
  { value: 'active', label: 'Active (visible in the store)' },
  { value: 'draft', label: 'Draft (hidden)' },
  { value: 'disabled', label: 'Disabled (hidden)' },
  { value: 'archived', label: 'Archived (hidden)' },
];

const INVENTORY_MODELS = [
  { value: 'credential', label: 'Account credentials (email + password)' },
  { value: 'license_key', label: 'Licence key / activation code' },
  { value: 'manual', label: 'Manual (invite link, family slot, …)' },
  { value: 'generated', label: 'Generated / other' },
];

let keySeq = 0;
const newKey = () => `v${++keySeq}`;

function durationOf(days?: number): { duration: string; customDays: string } {
  if (days === undefined || days === null) return { duration: 'lifetime', customDays: '' };
  if (['30', '90', '180', '365'].includes(String(days))) return { duration: String(days), customDays: '' };
  return { duration: 'custom', customDays: String(days) };
}

function toForm(v: ProductVariant): VariantForm {
  return {
    key: newKey(),
    id: v.id,
    name: v.name,
    ...durationOf(v.expiryDays),
    price: v.price ? String(v.price) : '',
    compareAtPrice: v.compareAtPrice ? String(v.compareAtPrice) : '',
    sku: v.sku || '',
    stockMode: v.stockMode || 'preorder',
    stock: String(v.stock ?? 0),
    status: v.status,
    usdPricingMode: v.usdPricingMode || 'auto',
    usdPrice: v.usdPrice ? String(v.usdPrice) : '',
    usdMarkupPercent: v.usdMarkupPercent !== undefined && v.usdMarkupPercent !== null ? String(v.usdMarkupPercent) : '',
    usdMarkupAmount: v.usdMarkupAmount !== undefined && v.usdMarkupAmount !== null ? String(v.usdMarkupAmount) : '',
    deliveryTime: v.deliveryTime || '',
    description: v.description || '',
    vaultCount: v.stockMode === 'vault' ? v.stock : 0,
  };
}

function blankVariant(name = '1 Month', days = '30'): VariantForm {
  return {
    key: newKey(),
    name,
    duration: days,
    customDays: '',
    price: '',
    compareAtPrice: '',
    sku: '',
    stockMode: 'preorder',
    stock: '0',
    status: 'active',
    usdPricingMode: 'auto',
    usdPrice: '',
    usdMarkupPercent: '',
    usdMarkupAmount: '',
    deliveryTime: '',
    description: '',
    vaultCount: 0,
  };
}

const n = (s: string) => (s.trim() === '' ? undefined : Number(s));

function ListEditor({ items, onChange, placeholder }: { items: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...items, v]);
    setDraft('');
  };
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input value={it} onChange={e => onChange(items.map((x, idx) => (idx === i ? e.target.value : x)))} className="!py-2" />
          <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="p-2 text-charcoal-subtle hover:text-accent-rose" aria-label="Remove">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder={placeholder}
          className="!py-2"
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button variant="secondary" icon={Plus} onClick={add}>
          Add
        </Button>
      </div>
    </div>
  );
}

export function ProductForm({
  product,
  categories,
  rate,
  usdDefaults,
}: {
  product?: Product;
  categories: Category[];
  rate: number;
  usdDefaults: UsdPricingDefaults;
}) {
  const router = useRouter();
  const editing = Boolean(product);
  const { confirm, dialog } = useDialog();

  const [name, setName] = useState(product?.name || '');
  const [slug, setSlug] = useState(product?.slug || '');
  const [slugTouched, setSlugTouched] = useState(editing);
  const [brand, setBrand] = useState(product?.brand || '');
  const [categoryId, setCategoryId] = useState(product?.categoryId || categories[0]?.id || '');
  const [sku, setSku] = useState(product?.sku || '');
  const [status, setStatus] = useState<Product['status']>(product?.status || 'active');
  const [badge, setBadge] = useState(product?.badge || '');
  const [image, setImage] = useState(product?.logo || product?.images?.[0] || '');
  const [shortDescription, setShort] = useState(product?.shortDescription || '');
  const [longDescription, setLong] = useState(product?.longDescription || '');
  const [tags, setTags] = useState((product?.tags || []).join(', '));
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [trending, setTrending] = useState(product?.trending ?? false);
  const [bestseller, setBestseller] = useState(product?.bestseller ?? false);
  const [isNew, setIsNew] = useState(product?.isNew ?? !editing);
  const [deliveryTime, setDeliveryTime] = useState(product?.deliveryTime || 'Within 5 to 30 minutes after payment approval');
  const [deliveryMethod, setDeliveryMethod] = useState(product?.deliveryMethod || 'Order page, email, WhatsApp or Telegram');
  const [productType, setProductType] = useState(product?.productType || 'Subscription');
  const [inventoryModel, setInventoryModel] = useState<Product['inventoryModel']>(product?.inventoryModel || 'credential');
  const [features, setFeatures] = useState<string[]>(product?.features || []);
  const [requirements, setRequirements] = useState<string[]>(product?.requirements || []);
  const [usageInstructions, setUsage] = useState(product?.usageInstructions || '');
  const [refundInfo, setRefund] = useState(product?.refundInfo || '');
  const [seoTitle, setSeoTitle] = useState(product?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(product?.seoDescription || '');
  const [displayOrder, setDisplayOrder] = useState(String(product?.displayOrder ?? 0));
  const [variants, setVariants] = useState<VariantForm[]>(() =>
    product?.variants?.length ? product.variants.map(toForm) : [blankVariant('1 Month', '30'), blankVariant('3 Months', '90')],
  );
  const [saving, setSaving] = useState(false);

  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name, hint: c.status === 'active' ? undefined : 'Disabled category' }));

  const setVariant = (key: string, patch: Partial<VariantForm>) => setVariants(prev => prev.map(v => (v.key === key ? { ...v, ...patch } : v)));

  const preview = (v: VariantForm) => {
    const price = Number(v.price) || 0;
    if (!price || !rate) return null;
    return usdPriceFor(
      {
        price,
        compareAtPrice: n(v.compareAtPrice),
        usdPricingMode: v.usdPricingMode,
        usdPrice: n(v.usdPrice),
        usdMarkupPercent: n(v.usdMarkupPercent),
        usdMarkupAmount: n(v.usdMarkupAmount),
      },
      rate,
      usdDefaults,
    );
  };

  const autoSeoTitle = useMemo(() => (name ? `Buy ${name} | Soft4u` : ''), [name]);

  const buildPayload = () => {
    const vs = variants.map((v, i) => {
      const expiryDays = v.duration === 'lifetime' ? undefined : v.duration === 'custom' ? Math.max(1, Math.floor(Number(v.customDays) || 0)) : Number(v.duration);
      return {
        ...(v.id ? { id: v.id } : {}),
        name: v.name.trim(),
        price: Number(v.price) || 0,
        compareAtPrice: n(v.compareAtPrice) && Number(v.compareAtPrice) > 0 ? Number(v.compareAtPrice) : undefined,
        sku: v.sku.trim() || `${(sku || slug).toUpperCase()}-${i + 1}`,
        stockMode: v.stockMode,
        stock: v.stockMode === 'manual' ? Math.max(0, Math.floor(Number(v.stock) || 0)) : 0,
        status: v.status,
        expiryDays,
        usdPricingMode: v.usdPricingMode,
        usdPrice: v.usdPricingMode === 'fixed' ? n(v.usdPrice) : undefined,
        usdMarkupPercent: v.usdPricingMode === 'percent' ? n(v.usdMarkupPercent) : undefined,
        usdMarkupAmount: v.usdPricingMode === 'amount' ? n(v.usdMarkupAmount) : undefined,
        deliveryTime: v.deliveryTime.trim() || undefined,
        description: v.description.trim() || undefined,
        displayOrder: i,
      };
    });
    return {
      name: name.trim(),
      slug: slug.trim(),
      brand: brand.trim() || undefined,
      categoryId,
      sku: sku.trim(),
      status,
      badge: badge.trim() || undefined,
      logo: image || undefined,
      images: image ? [image] : [],
      shortDescription: shortDescription.trim(),
      longDescription: longDescription.trim(),
      tags: tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean),
      featured,
      trending,
      bestseller,
      isNew,
      deliveryTime: deliveryTime.trim(),
      deliveryMethod: deliveryMethod.trim(),
      productType: productType.trim(),
      inventoryModel,
      features: features.map(f => f.trim()).filter(Boolean),
      requirements: requirements.map(f => f.trim()).filter(Boolean),
      usageInstructions: usageInstructions.trim(),
      refundInfo: refundInfo.trim(),
      seoTitle: seoTitle.trim() || undefined,
      seoDescription: seoDescription.trim() || undefined,
      displayOrder: Math.floor(Number(displayOrder) || 0),
      variants: vs,
    };
  };

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (name.trim().length < 2) return toast.error('Enter a product name');
    if (!slug.trim()) return toast.error('Enter a URL slug');
    if (!categoryId) return toast.error('Choose a category');
    if (variants.length === 0) return toast.error('Add at least one plan');
    for (const v of variants) {
      if (!v.name.trim()) return toast.error('Every plan needs a name');
      if (!(Number(v.price) > 0)) return toast.error(`Enter a PKR price for "${v.name}"`);
      if (v.usdPricingMode === 'fixed' && !(Number(v.usdPrice) > 0)) return toast.error(`Enter the fixed USD price for "${v.name}"`);
      if (v.duration === 'custom' && !(Number(v.customDays) > 0)) return toast.error(`Enter the number of days for "${v.name}"`);
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (editing && product) {
        await api('/api/admin/products', { body: { action: 'update', id: product.id, updates: payload } });
        toast.success('Product saved');
        router.refresh();
      } else {
        const res = await api<{ product: Product }>('/api/admin/products', { body: { action: 'create', productData: payload } });
        toast.success('Product created');
        router.push(`/admin/products/${res.product.id}`);
      }
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const removeVariant = async (v: VariantForm) => {
    if (variants.length === 1) return toast.error('A product needs at least one plan. Disable the product instead.');
    if (v.id) {
      const ok = await confirm({
        title: `Remove plan "${v.name}"?`,
        message: 'The plan is removed when you save. Past orders keep their details. To hide it temporarily, set the plan status to Disabled instead.',
        confirmLabel: 'Remove plan',
        danger: true,
      });
      if (!ok) return;
    }
    setVariants(prev => prev.filter(x => x.key !== v.key));
  };

  return (
    <form onSubmit={save} className="max-w-5xl pb-24">
      <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-xs font-bold text-pista-dark hover:underline mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> All products
      </Link>
      <PageHeader
        kicker="Commerce"
        title={editing ? `Edit ${product!.name}` : 'New product'}
        description="PKR is the base price on every plan. Choose per plan how the USD price is set."
        actions={
          editing ? (
            <Link href={`/products/${product!.slug}`} target="_blank" className="text-xs font-bold text-pista-dark hover:underline">
              View in store
            </Link>
          ) : undefined
        }
      />

      <div className="space-y-6">
        <Card title="Basics">
          <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Product name" required className="sm:col-span-2">
                <Input
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    if (!slugTouched) setSlug(slugify(e.target.value));
                  }}
                  placeholder="e.g. Disney+ Hotstar Premium"
                />
              </Field>
              <Field label="URL slug" required hint={`soft4u.top/products/${slug || 'your-product'}`}>
                <Input
                  value={slug}
                  onChange={e => {
                    setSlugTouched(true);
                    setSlug(slugify(e.target.value));
                  }}
                  className="font-mono"
                />
              </Field>
              <Field label="Brand" hint="Used by the brand filter, e.g. Netflix, Adobe">
                <Input value={brand} onChange={e => setBrand(e.target.value)} />
              </Field>
              <Field label="Category" required>
                <Select value={categoryId} onChange={setCategoryId} options={categoryOptions} placeholder="Choose a category" />
              </Field>
              <Field label="Status">
                <Select value={status} onChange={v => setStatus(v as Product['status'])} options={PRODUCT_STATUSES} />
              </Field>
              <Field label="SKU">
                <Input value={sku} onChange={e => setSku(e.target.value.toUpperCase())} className="font-mono" placeholder="e.g. HOTSTAR" />
              </Field>
              <Field label="Badge" hint="Short label on the card, e.g. BEST SELLER">
                <Input value={badge} onChange={e => setBadge(e.target.value.toUpperCase())} maxLength={20} />
              </Field>
            </div>
            <ImagePicker value={image} onChange={setImage} kind="products" name={brand || name} label="Product logo" />
          </div>
          <div className="grid gap-4 mt-4">
            <Field label="Short description" counter={{ value: shortDescription.length, max: 200 }}>
              <Input value={shortDescription} onChange={e => setShort(e.target.value)} placeholder="One sentence shown on product cards" />
            </Field>
            <Field label="Full description">
              <Textarea rows={5} value={longDescription} onChange={e => setLong(e.target.value)} placeholder="What the customer gets, how it works, devices, limits…" />
            </Field>
            <Field label="Tags" hint="Comma separated. Helps search, e.g. ott, streaming, cricket">
              <Input value={tags} onChange={e => setTags(e.target.value)} />
            </Field>
          </div>
        </Card>

        <Card title="Highlights" description="Where the product shows up on the homepage and in filters.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Toggle checked={featured} onChange={setFeatured} label="Featured" description="Shown in the Featured section" />
            <Toggle checked={trending} onChange={setTrending} label="Trending" description="Marked as trending" />
            <Toggle checked={bestseller} onChange={setBestseller} label="Best seller" description="Shown in Best sellers" />
            <Toggle checked={isNew} onChange={setIsNew} label="New arrival" description="Shown in Newly added" />
          </div>
          <Field label="Display order" hint="Lower numbers show first" className="mt-4 max-w-[160px]">
            <Input type="number" value={displayOrder} onChange={e => setDisplayOrder(e.target.value)} />
          </Field>
        </Card>

        <Card
          title="Plans and prices"
          description={rate ? `Live rate: 1 USD = ${rate.toFixed(2)} PKR. The USD preview updates as you type.` : 'The live rate is unavailable, USD preview hidden.'}
          actions={
            <Button size="sm" variant="secondary" icon={Plus} onClick={() => setVariants(prev => [...prev, blankVariant('', '30')])}>
              Add plan
            </Button>
          }
        >
          <div className="space-y-4">
            {variants.map((v, idx) => {
              const usd = preview(v);
              const converted = rate && Number(v.price) ? Number(v.price) / rate : 0;
              return (
                <div key={v.key} className={cx('rounded-2xl border p-4 space-y-4', v.status === 'active' ? 'border-charcoal-border' : 'border-dashed border-charcoal-border-dark bg-surface-bg')}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-pista-lighter text-pista-darker text-xs font-extrabold flex items-center justify-center">{idx + 1}</span>
                      <span className="font-bold text-sm">{v.name || 'New plan'}</span>
                      {v.status === 'disabled' && <Badge tone="gray">Disabled</Badge>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" icon={Copy} onClick={() => setVariants(prev => [...prev.slice(0, idx + 1), { ...v, key: newKey(), id: undefined, name: `${v.name} copy`, sku: '' }, ...prev.slice(idx + 1)])}>
                        Duplicate
                      </Button>
                      <Button size="sm" variant="ghost" icon={Trash2} onClick={() => void removeVariant(v)}>
                        Remove
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Plan name" required>
                      <Input value={v.name} onChange={e => setVariant(v.key, { name: e.target.value })} placeholder="e.g. 1 Month Premium" />
                    </Field>
                    <Field label="Duration">
                      <Select value={v.duration} onChange={d => setVariant(v.key, { duration: d })} options={DURATIONS} />
                    </Field>
                    {v.duration === 'custom' && (
                      <Field label="Days" required>
                        <Input type="number" min={1} value={v.customDays} onChange={e => setVariant(v.key, { customDays: e.target.value })} />
                      </Field>
                    )}
                    <Field label="Price (PKR)" required>
                      <Input type="number" min={0} step="1" value={v.price} onChange={e => setVariant(v.key, { price: e.target.value })} placeholder="e.g. 299" />
                    </Field>
                    <Field label="Compare at (PKR)" hint="Old price, shown struck through">
                      <Input type="number" min={0} step="1" value={v.compareAtPrice} onChange={e => setVariant(v.key, { compareAtPrice: e.target.value })} />
                    </Field>
                  </div>

                  <div className="rounded-xl bg-pista-50 border border-pista-light p-3 grid gap-3 lg:grid-cols-[1.3fr_1fr_1fr] items-end">
                    <Field label="USD price">
                      <Select value={v.usdPricingMode} onChange={m => setVariant(v.key, { usdPricingMode: m as UsdPricingMode })} options={USD_MODES} />
                    </Field>
                    {v.usdPricingMode === 'percent' && (
                      <Field label="Margin %" required>
                        <Input type="number" step="0.1" value={v.usdMarkupPercent} onChange={e => setVariant(v.key, { usdMarkupPercent: e.target.value })} placeholder="e.g. 10" />
                      </Field>
                    )}
                    {v.usdPricingMode === 'amount' && (
                      <Field label="Margin (USD)" required>
                        <Input type="number" step="0.01" value={v.usdMarkupAmount} onChange={e => setVariant(v.key, { usdMarkupAmount: e.target.value })} placeholder="e.g. 1.50" />
                      </Field>
                    )}
                    {v.usdPricingMode === 'fixed' && (
                      <Field label="Fixed price (USD)" required>
                        <Input type="number" step="0.01" min={0} value={v.usdPrice} onChange={e => setVariant(v.key, { usdPrice: e.target.value })} placeholder="e.g. 5.00" />
                      </Field>
                    )}
                    {v.usdPricingMode === 'auto' && <div className="hidden lg:block" />}
                    <div className="text-sm">
                      <div className="text-[11px] font-bold text-charcoal-subtle uppercase">Customer pays in USD</div>
                      <div className="text-xl font-extrabold text-pista-darker whitespace-nowrap">{usd !== null ? formatMoney(usd, 'USD') : '—'}</div>
                      {converted > 0 && <div className="text-[11px] text-charcoal-subtle">Plain conversion: {formatMoney(converted, 'USD')}</div>}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Stock" hint={STOCK_MODES.find(s => s.value === v.stockMode)?.hint}>
                      <Select value={v.stockMode} onChange={m => setVariant(v.key, { stockMode: m as StockMode })} options={STOCK_MODES.map(s => ({ value: s.value, label: s.label }))} />
                    </Field>
                    {v.stockMode === 'manual' && (
                      <Field label="Available units">
                        <Input type="number" min={0} value={v.stock} onChange={e => setVariant(v.key, { stock: e.target.value })} />
                      </Field>
                    )}
                    {v.stockMode === 'vault' && (
                      <div className="text-sm self-end pb-2">
                        <span className="font-bold">{v.vaultCount}</span> unused vault item(s).{' '}
                        {v.id ? (
                          <Link href={`/admin/inventory?productId=${product?.id}`} className="text-pista-dark font-bold hover:underline">
                            Add to vault
                          </Link>
                        ) : (
                          <span className="text-charcoal-subtle">Save first, then add vault items.</span>
                        )}
                      </div>
                    )}
                    <Field label="Plan status">
                      <Select value={v.status} onChange={s => setVariant(v.key, { status: s as 'active' | 'disabled' })} options={[{ value: 'active', label: 'Active' }, { value: 'disabled', label: 'Disabled (hidden)' }]} />
                    </Field>
                    <Field label="Plan SKU">
                      <Input value={v.sku} onChange={e => setVariant(v.key, { sku: e.target.value.toUpperCase() })} className="font-mono" placeholder="Auto" />
                    </Field>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Delivery time (optional)" hint="Overrides the product delivery time for this plan">
                      <Input value={v.deliveryTime} onChange={e => setVariant(v.key, { deliveryTime: e.target.value })} />
                    </Field>
                    <Field label="Plan note (optional)" hint="e.g. 1 screen, HD, shared profile">
                      <Input value={v.description} onChange={e => setVariant(v.key, { description: e.target.value })} />
                    </Field>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Delivery and details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Delivery time">
              <Input value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} />
            </Field>
            <Field label="Delivery method">
              <Input value={deliveryMethod} onChange={e => setDeliveryMethod(e.target.value)} />
            </Field>
            <Field label="Product type">
              <Input value={productType} onChange={e => setProductType(e.target.value)} placeholder="Subscription, Licence key, Account…" />
            </Field>
            <Field label="What you deliver">
              <Select value={inventoryModel} onChange={m => setInventoryModel(m as Product['inventoryModel'])} options={INVENTORY_MODELS} />
            </Field>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 mt-5">
            <Field label="Features (bullet points)">
              <ListEditor items={features} onChange={setFeatures} placeholder="e.g. Full HD streaming" />
            </Field>
            <Field label="Requirements">
              <ListEditor items={requirements} onChange={setRequirements} placeholder="e.g. Works on Android, iOS, Smart TV" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 mt-5">
            <Field label="How to use">
              <Textarea rows={4} value={usageInstructions} onChange={e => setUsage(e.target.value)} />
            </Field>
            <Field label="Warranty / refund note">
              <Textarea rows={4} value={refundInfo} onChange={e => setRefund(e.target.value)} />
            </Field>
          </div>
        </Card>

        <Card title="Search engine (SEO)" description="Leave empty to use the defaults shown in grey.">
          <div className="grid gap-4">
            <Field label="SEO title" counter={{ value: (seoTitle || autoSeoTitle).length, max: 60 }}>
              <Input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} placeholder={autoSeoTitle || 'Buy … | Soft4u'} />
            </Field>
            <Field label="Meta description" counter={{ value: (seoDescription || shortDescription).length, max: 160 }}>
              <Textarea rows={2} value={seoDescription} onChange={e => setSeoDescription(e.target.value)} placeholder={shortDescription || 'One or two sentences for Google results'} />
            </Field>
            <div className="rounded-xl border border-charcoal-border p-3 bg-white">
              <div className="text-[11px] text-charcoal-subtle">Google preview</div>
              <div className="text-[#1a0dab] text-base truncate">{seoTitle || autoSeoTitle || 'Product title'}</div>
              <div className="text-[12px] text-[#006621]">soft4u.top/products/{slug || '…'}</div>
              <div className="text-[13px] text-charcoal-muted line-clamp-2">{seoDescription || shortDescription || 'Description'}</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-30 bg-white/95 backdrop-blur border-t border-charcoal-border px-4 sm:px-8 py-3 flex items-center justify-end gap-2">
        <Link href="/admin/products" className="px-4 py-2.5 rounded-xl border border-charcoal-border text-sm font-bold hover:border-pista">
          Cancel
        </Link>
        <Button type="submit" icon={Save} loading={saving}>
          {editing ? 'Save changes' : 'Create product'}
        </Button>
      </div>
      {dialog}
    </form>
  );
}
