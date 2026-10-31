'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Coins, RefreshCw, Save } from 'lucide-react';
import type { UsdPricingDefaults, UsdPricingMode } from '@/lib/db/types';
import { usdPriceFor } from '@/lib/pricing';
import { formatMoney } from '@/lib/money';
import { Badge, Button, Card, Field, Input, PageHeader, SearchInput, Select, Stat, Table, Toggle, api, errMsg, toast } from '../_components/ui';
import { fmtDateTime } from '../_components/format';

interface Row {
  productId: string;
  product: string;
  productStatus: string;
  variant: string;
  variantStatus: string;
  price: number;
  compareAtPrice?: number;
  usdPricingMode: UsdPricingMode;
  usdPrice?: number;
  usdMarkupPercent?: number;
  usdMarkupAmount?: number;
}

const MODE_LABELS: Record<UsdPricingMode, string> = { auto: 'Auto', percent: 'Auto + %', amount: 'Auto + USD', fixed: 'Fixed USD' };
const SOURCE_LABELS: Record<string, string> = { frankfurter: 'Frankfurter (ECB)', 'er-api': 'open.er-api.com', stored: 'Last stored rate', fallback: 'Your fallback rate' };

export function CurrencyClient({
  initial,
  fx,
  rows,
}: {
  initial: { usdEnabled: boolean; fallbackUsdRate: number; usdPricing: UsdPricingDefaults };
  fx: { rate: number; source: string; fetchedAt: string; stale: boolean } | null;
  rows: Row[];
}) {
  const [usdEnabled, setUsdEnabled] = useState(initial.usdEnabled);
  const [fallback, setFallback] = useState(String(initial.fallbackUsdRate));
  const [mode, setMode] = useState<UsdPricingDefaults['mode']>(initial.usdPricing.mode);
  const [percent, setPercent] = useState(String(initial.usdPricing.percent || ''));
  const [amount, setAmount] = useState(String(initial.usdPricing.amount || ''));
  const [roundTo, setRoundTo] = useState(String(initial.usdPricing.roundTo || 0.01));
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const rate = fx?.rate || Number(fallback) || 0;
  const defaults: UsdPricingDefaults = { mode, percent: Number(percent) || 0, amount: Number(amount) || 0, roundTo: Number(roundTo) || 0.01 };
  const shown = rows.filter(r => !search.trim() || `${r.product} ${r.variant}`.toLowerCase().includes(search.trim().toLowerCase()));

  const save = async () => {
    setSaving(true);
    try {
      await api('/api/admin/settings', { body: { usdEnabled, fallbackUsdRate: Number(fallback), usdPricing: defaults } });
      toast.success('Currency settings saved');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-10">
      <PageHeader
        kicker="Settings"
        title="Currency & pricing"
        description="Prices are set in PKR. Customers outside Pakistan see USD by default and can switch. Each plan chooses how its USD price is made; this page sets the store-wide default for plans on Auto."
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Stat label="Live rate" value={fx ? `1 USD = ${fx.rate.toFixed(2)} PKR` : 'Unavailable'} hint={fx ? `${SOURCE_LABELS[fx.source] || fx.source}${fx.stale ? ' (stale)' : ''}` : 'Using the fallback rate'} icon={Coins} />
        <Stat label="Rate fetched" value={fx ? fmtDateTime(fx.fetchedAt) : '—'} hint="Refreshed hourly when customers browse" icon={RefreshCw} />
        <Stat label="Plans with custom USD" value={rows.filter(r => r.usdPricingMode !== 'auto').length} hint={`of ${rows.length} plans`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-12 mb-6">
        <Card className="lg:col-span-7" title="Store-wide USD rules">
          <div className="space-y-4">
            <Toggle checked={usdEnabled} onChange={setUsdEnabled} label="Accept USD orders" description="Shows the PKR / USD switcher. When off, everyone pays in PKR." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Margin for plans on Auto">
                <Select
                  value={mode}
                  onChange={v => setMode(v as UsdPricingDefaults['mode'])}
                  options={[
                    { value: 'auto', label: 'No margin (plain conversion)' },
                    { value: 'percent', label: 'Add a percentage' },
                    { value: 'amount', label: 'Add a fixed USD amount' },
                  ]}
                />
              </Field>
              {mode === 'percent' && (
                <Field label="Margin %">
                  <Input type="number" step="0.1" value={percent} onChange={e => setPercent(e.target.value)} placeholder="e.g. 10" />
                </Field>
              )}
              {mode === 'amount' && (
                <Field label="Margin (USD)">
                  <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 1.00" />
                </Field>
              )}
              <Field label="Round USD prices up to">
                <Select
                  value={roundTo}
                  onChange={setRoundTo}
                  options={[
                    { value: '0.01', label: 'Nearest cent (0.01)' },
                    { value: '0.05', label: '0.05' },
                    { value: '0.1', label: '0.10' },
                    { value: '0.25', label: '0.25' },
                    { value: '0.5', label: '0.50' },
                    { value: '1', label: 'Whole dollars (1.00)' },
                  ]}
                />
              </Field>
              <Field label="Fallback rate (PKR per USD)" hint="Used only if every live source fails">
                <Input type="number" step="0.01" value={fallback} onChange={e => setFallback(e.target.value)} />
              </Field>
            </div>
            <Button icon={Save} loading={saving} onClick={save}>
              Save currency settings
            </Button>
          </div>
        </Card>
        <Card className="lg:col-span-5" title="How a plan's USD price is set">
          <ul className="text-sm text-charcoal-muted space-y-2">
            <li><strong className="text-charcoal">Auto:</strong> PKR ÷ live rate, plus the store-wide margin on the left.</li>
            <li><strong className="text-charcoal">Auto + %:</strong> PKR ÷ rate plus that plan&apos;s own percentage.</li>
            <li><strong className="text-charcoal">Auto + USD:</strong> PKR ÷ rate plus a fixed USD amount.</li>
            <li><strong className="text-charcoal">Fixed USD:</strong> exactly the USD price you type, e.g. PKR 299 → USD 5.00.</li>
          </ul>
          <p className="text-xs text-charcoal-subtle mt-3">Change a plan&apos;s mode in Products → edit → Plans and prices. Orders lock the price at checkout.</p>
        </Card>
      </div>

      <Card title="USD price of every plan" description="Live preview with the rules above (before saving)." actions={<SearchInput value={search} onChange={setSearch} placeholder="Filter" className="w-56" />} bodyClassName="p-0">
        <Table head={['Product', 'Plan', 'PKR', 'Mode', 'Customer pays (USD)', '']}>
          {shown.map((r, i) => {
            const usd = rate ? usdPriceFor(r, rate, defaults) : 0;
            return (
              <tr key={`${r.productId}-${i}`} className={r.productStatus !== 'active' || r.variantStatus !== 'active' ? 'opacity-50' : ''}>
                <td className="px-4 py-2.5 font-semibold">{r.product}</td>
                <td className="px-4 py-2.5 text-charcoal-muted">{r.variant}</td>
                <td className="px-4 py-2.5 whitespace-nowrap">{formatMoney(r.price, 'PKR')}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={r.usdPricingMode === 'auto' ? 'gray' : 'blue'}>
                    {MODE_LABELS[r.usdPricingMode]}
                    {r.usdPricingMode === 'percent' ? ` ${r.usdMarkupPercent ?? 0}%` : r.usdPricingMode === 'amount' ? ` +${r.usdMarkupAmount ?? 0}` : ''}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 font-bold whitespace-nowrap">{rate ? formatMoney(usd, 'USD') : '—'}</td>
                <td className="px-4 py-2.5 text-right">
                  <Link href={`/admin/products/${r.productId}`} className="text-xs font-bold text-pista-dark hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </div>
  );
}
