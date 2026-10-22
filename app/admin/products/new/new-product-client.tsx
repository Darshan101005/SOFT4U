'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Category, ProductVariant } from '@/lib/db/types';
import { ArrowLeft, Plus, Trash2, Check, ArrowRight } from 'lucide-react';

export function NewProductClient({ categories }: { categories: Category[] }) {
  const router = useRouter();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('PK-8492');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [price, setPrice] = useState(12.99);
  const [comparePrice, setComparePrice] = useState(25.00);
  const [badge, setBadge] = useState('NEW');
  const [shortDesc, setShortDesc] = useState('');
  const [longDesc, setLongDesc] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('Instant (2 - 5 mins)');
  const [deliveryMethod, setDeliveryMethod] = useState('Automated Dashboard Vault & Email');
  const [inventoryModel, setInventoryModel] = useState<any>('credential');
  const [features, setFeatures] = useState<string[]>([
    'Full access with dedicated account warranty',
    'Compatible across Web, iOS, and Android'
  ]);
  const [newFeature, setNewFeature] = useState('');

  // Variants list
  const [variants, setVariants] = useState<Omit<ProductVariant, 'id' | 'productId'>[]>([
    {
      name: '1 Month Pass (30 Days)',
      price: 12.99,
      compareAtPrice: 25.00,
      sku: `${sku}-1M`,
      stock: 50,
      status: 'active',
      expiryDays: 30
    },
    {
      name: '3 Months Pass (90 Days)',
      price: 32.99,
      compareAtPrice: 75.00,
      sku: `${sku}-3M`,
      stock: 30,
      status: 'active',
      expiryDays: 90
    }
  ]);

  const [loading, setLoading] = useState(false);

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  };

  const addFeature = () => {
    if (!newFeature.trim()) return;
    setFeatures([...features, newFeature.trim()]);
    setNewFeature('');
  };

  const removeFeature = (idx: number) => {
    setFeatures(features.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug || !categoryId) return;

    setLoading(true);

    try {
      const payload = {
        name,
        slug,
        sku,
        shortDescription: shortDesc || `${name} verified subscription license.`,
        longDescription: longDesc || `${name} provides legitimate access with 24/7 warranty and automated instant fulfillment.`,
        images: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'],
        categoryId,
        tags: [name, 'Software', 'Subscription'],
        price: Number(price),
        compareAtPrice: Number(comparePrice),
        discount: comparePrice > price ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0,
        status: 'active',
        featured: true,
        bestseller: false,
        isNew: true,
        trending: true,
        badge,
        deliveryTime,
        deliveryMethod,
        productType: 'Digital Subscription Account',
        inventoryModel,
        features,
        requirements: ['Compatible with all desktop and mobile browsers.'],
        usageInstructions: 'Sign in using credentials or click invite link dispatched to your dashboard.',
        refundInfo: 'Full replacement warranty for active duration.',
        variants: variants.map((v, i) => ({
          ...v,
          id: `var_${Date.now()}_${i}`,
          productId: ''
        }))
      };

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', productData: payload })
      });

      const data = await res.json();
      if (data.product) {
        router.push('/admin/products');
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/products"
          className="text-xs text-pista-dark font-semibold hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Products</span>
        </Link>
      </div>

      <div>
        <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">
          PRODUCT AUTHORING ENGINE
        </div>
        <h1 className="text-3xl font-extrabold text-charcoal">Create Digital Product</h1>
        <p className="text-xs text-charcoal-subtle mt-0.5">
          Configure title, pricing tiers, fulfillment automation model, and duration plans.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-charcoal-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs text-xs">
        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-charcoal-subtle uppercase tracking-wider pb-2 border-b border-surface-muted">
            1. General Identity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-charcoal block mb-1">Product Title *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="e.g. Cursor AI Pro Annual"
                className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg focus:bg-white"
              />
            </div>

            <div>
              <label className="font-semibold text-charcoal block mb-1">URL Slug *</label>
              <input
                type="text"
                required
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder="cursor-ai-pro-annual"
                className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-charcoal block mb-1">Category *</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-charcoal block mb-1">SKU</label>
              <input
                type="text"
                value={sku}
                onChange={e => setSku(e.target.value)}
                className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-charcoal block mb-1">Badge</label>
              <input
                type="text"
                value={badge}
                onChange={e => setBadge(e.target.value)}
                placeholder="NEW or BEST SELLER"
                className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg uppercase font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-charcoal block mb-1">Short Summary (1-2 sentences)</label>
            <input
              type="text"
              value={shortDesc}
              onChange={e => setShortDesc(e.target.value)}
              placeholder="High-speed AI code editor with Copilot features..."
              className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
            />
          </div>

          <div>
            <label className="font-semibold text-charcoal block mb-1">Long Description & Details</label>
            <textarea
              rows={4}
              value={longDesc}
              onChange={e => setLongDesc(e.target.value)}
              placeholder="Provide complete breakdown of account features, privacy guarantee, and usage instructions..."
              className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
            />
          </div>
        </div>

        {/* Pricing & Fulfillment Model */}
        <div className="space-y-4 pt-4 border-t border-surface-muted">
          <h2 className="text-xs font-bold text-charcoal-subtle uppercase tracking-wider pb-2 border-b border-surface-muted">
            2. Pricing & Fulfillment Automation
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-charcoal block mb-1">Base Price ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={e => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-charcoal block mb-1">Compare-At Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={comparePrice}
                onChange={e => setComparePrice(Number(e.target.value))}
                className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-charcoal block mb-1">Fulfillment Model</label>
              <select
                value={inventoryModel}
                onChange={e => setInventoryModel(e.target.value)}
                className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
              >
                <option value="credential">Digital Credentials (Email + Pass + PIN)</option>
                <option value="license_key">Software License Key / Invite URL</option>
                <option value="manual">Manual Admin Fulfillment</option>
                <option value="generated">Automated System Vault</option>
              </select>
            </div>
          </div>
        </div>

        {/* Features Checklist */}
        <div className="space-y-3 pt-4 border-t border-surface-muted">
          <h2 className="text-xs font-bold text-charcoal-subtle uppercase tracking-wider pb-1">
            3. Key Features List
          </h2>

          <div className="space-y-2">
            {features.map((feat, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-surface-bg rounded-lg border border-charcoal-border">
                <span className="font-medium text-charcoal">{feat}</span>
                <button
                  type="button"
                  onClick={() => removeFeature(i)}
                  className="text-charcoal-subtle hover:text-charcoal p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newFeature}
              onChange={e => setNewFeature(e.target.value)}
              placeholder="Add feature bullet (e.g. 100% replacement warranty)"
              className="flex-1 px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
            />
            <button
              type="button"
              onClick={addFeature}
              className="px-4 py-2 bg-pista-dark text-white font-semibold rounded-lg"
            >
              Add Bullet
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-6 border-t border-surface-muted flex justify-end gap-3">
          <Link
            href="/admin/products"
            className="px-5 py-2.5 border border-charcoal-border rounded-lg font-semibold text-charcoal-muted hover:bg-surface-muted"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-pista text-charcoal hover:bg-pista-hover font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <span>{loading ? 'Creating...' : 'Create & Publish Product'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
