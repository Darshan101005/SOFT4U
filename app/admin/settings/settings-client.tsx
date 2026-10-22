'use client';

import React, { useState } from 'react';
import { SiteSettings } from '@/lib/db/types';
import { Settings, Check, Shield, Bot, AlertTriangle, Globe } from 'lucide-react';

export function SettingsClient({ initialSettings }: { initialSettings: SiteSettings }) {
  const [settings, setSettings] = useState<SiteSettings>(initialSettings);
  const [siteName, setSiteName] = useState(settings.siteName);
  const [tagline, setTagline] = useState(settings.tagline);
  const [contactEmail, setContactEmail] = useState(settings.contactEmail);
  const [contactPhone, setContactPhone] = useState(settings.contactPhone);
  const [maintenanceMode, setMaintenanceMode] = useState(settings.maintenanceMode);
  const [maintenanceMessage, setMaintenanceMessage] = useState(settings.maintenanceMessage);
  const [guestCheckout, setGuestCheckout] = useState(settings.guestCheckoutEnabled);
  const [aiSupportEnabled, setAiSupportEnabled] = useState(settings.aiSupportEnabled);
  const [aiSupportName, setAiSupportName] = useState(settings.aiSupportName);
  const [seoTitle, setSeoTitle] = useState(settings.seoDefaults.title);
  const [seoDesc, setSeoDesc] = useState(settings.seoDefaults.description);
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const updates: Partial<SiteSettings> = {
      siteName,
      tagline,
      contactEmail,
      contactPhone,
      maintenanceMode,
      maintenanceMessage,
      guestCheckoutEnabled: guestCheckout,
      aiSupportEnabled,
      aiSupportName,
      seoDefaults: {
        ...settings.seoDefaults,
        title: seoTitle,
        description: seoDesc
      }
    };

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
        showNotice('Global site settings and policies successfully saved!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">
          PLATFORM GOVERNANCE
        </div>
        <h1 className="text-3xl font-extrabold text-charcoal">Site Settings & Security</h1>
        <p className="text-xs text-charcoal-subtle mt-0.5">
          Configure site identity, maintenance mode, checkout policies, and automated AI assistance.
        </p>
      </div>

      {notice && (
        <div className="p-3 bg-pista-lighter border border-pista text-xs font-semibold text-pista-dark rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Section 1: General Branding */}
        <div className="bg-white border border-charcoal-border rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-surface-muted">
            <Globe className="w-4 h-4 text-pista-dark" />
            <h2 className="text-sm font-bold text-charcoal">General Identity & Brand</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-charcoal block mb-1">Site Title</label>
              <input
                type="text"
                required
                value={siteName}
                onChange={e => setSiteName(e.target.value)}
                className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
              />
            </div>
            <div>
              <label className="font-semibold text-charcoal block mb-1">Brand Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-charcoal block mb-1">Support Contact Email</label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
              />
            </div>
            <div>
              <label className="font-semibold text-charcoal block mb-1">Support Contact Phone</label>
              <input
                type="text"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Maintenance Mode Control */}
        <div className="bg-white border border-charcoal-border rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-surface-muted">
            <AlertTriangle className="w-4 h-4 text-pista-dark" />
            <h2 className="text-sm font-bold text-charcoal">Maintenance Mode (Section 48)</h2>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-surface-bg rounded-xl border border-charcoal-border">
            <div>
              <div className="font-bold text-charcoal">Enable Storefront Maintenance Mode</div>
              <div className="text-[11px] text-charcoal-subtle">
                When enabled, visitors are shown a clean maintenance notice. Administrators can still access the admin panel.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`px-3 py-1.5 rounded text-xs font-bold font-mono transition-colors uppercase ${
                maintenanceMode
                  ? 'bg-pista-light text-pista-darker'
                  : 'bg-pista-lighter text-pista-dark'
              }`}
            >
              {maintenanceMode ? 'ENABLED (OFFLINE)' : 'DISABLED (LIVE)'}
            </button>
          </div>

          {maintenanceMode && (
            <div>
              <label className="font-semibold text-charcoal block mb-1">Custom Maintenance Message</label>
              <textarea
                rows={3}
                value={maintenanceMessage}
                onChange={e => setMaintenanceMessage(e.target.value)}
                className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
              />
            </div>
          )}
        </div>

        {/* Section 3: AI Concierge Assistant (Section 61) */}
        <div className="bg-white border border-charcoal-border rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-surface-muted">
            <Bot className="w-4 h-4 text-pista-dark" />
            <h2 className="text-sm font-bold text-charcoal">AI Support Assistant (Gemini 3.8 Flash)</h2>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-surface-bg rounded-xl border border-charcoal-border">
            <div>
              <div className="font-bold text-charcoal">Storefront AI Concierge Floating Widget</div>
              <div className="text-[11px] text-charcoal-subtle">
                Answers customer inquiries using product catalog, FAQs, and policies. Automatically guards private vault credentials.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAiSupportEnabled(!aiSupportEnabled)}
              className={`px-3 py-1.5 rounded text-xs font-bold font-mono transition-colors uppercase ${
                aiSupportEnabled ? 'bg-pista-lighter text-pista-dark' : 'bg-surface-muted text-charcoal-subtle'
              }`}
            >
              {aiSupportEnabled ? 'ACTIVE' : 'OFFLINE'}
            </button>
          </div>

          <div>
            <label className="font-semibold text-charcoal block mb-1">Assistant Display Name</label>
            <input
              type="text"
              value={aiSupportName}
              onChange={e => setAiSupportName(e.target.value)}
              className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
            />
          </div>
        </div>

        {/* Section 4: SEO Metadata Defaults */}
        <div className="bg-white border border-charcoal-border rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-surface-muted">
            <Shield className="w-4 h-4 text-pista-dark" />
            <h2 className="text-sm font-bold text-charcoal">Global SEO Defaults</h2>
          </div>

          <div>
            <label className="font-semibold text-charcoal block mb-1">Default Meta Title</label>
            <input
              type="text"
              value={seoTitle}
              onChange={e => setSeoTitle(e.target.value)}
              className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
            />
          </div>

          <div>
            <label className="font-semibold text-charcoal block mb-1">Default Meta Description</label>
            <textarea
              rows={2}
              value={seoDesc}
              onChange={e => setSeoDesc(e.target.value)}
              className="w-full px-3 py-2 border border-charcoal-border rounded-lg bg-surface-bg"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-pista text-charcoal hover:bg-pista-hover text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
