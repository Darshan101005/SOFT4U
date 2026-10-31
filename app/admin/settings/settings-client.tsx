'use client';

import React, { useState } from 'react';
import { Save } from 'lucide-react';
import type { SiteSettings } from '@/lib/db/types';
import { EMAIL_RE } from '@/lib/password-policy';
import { Button, Card, Field, Input, PageHeader, Textarea, Toggle, api, errMsg, toast } from '../_components/ui';
import { ImagePicker } from '../_components/image-picker';

type Social = keyof SiteSettings['socialLinks'];
const SOCIALS: Array<[Social, string, string]> = [
  ['whatsapp', 'WhatsApp link', 'https://wa.me/923001234567'],
  ['telegram', 'Telegram', 'https://t.me/soft4u'],
  ['instagram', 'Instagram', 'https://instagram.com/…'],
  ['facebook', 'Facebook', 'https://facebook.com/…'],
  ['tiktok', 'TikTok', 'https://tiktok.com/@…'],
  ['youtube', 'YouTube', 'https://youtube.com/@…'],
  ['twitter', 'X (Twitter)', 'https://x.com/…'],
  ['discord', 'Discord', 'https://discord.gg/…'],
];

export function SettingsClient({ initialSettings }: { initialSettings: SiteSettings }) {
  const [s, setS] = useState<SiteSettings>(initialSettings);
  const [alertEmails, setAlertEmails] = useState((initialSettings.orderAlertEmails || []).join(', '));
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => setS(prev => ({ ...prev, [k]: v }));
  const setSocial = (k: Social, v: string) => setS(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, [k]: v } }));
  const setSeo = (k: keyof SiteSettings['seoDefaults'], v: string) => setS(prev => ({ ...prev, seoDefaults: { ...prev.seoDefaults, [k]: v } }));

  const save = async () => {
    const emails = alertEmails
      .split(/[,\s]+/)
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);
    const bad = emails.find(e => !EMAIL_RE.test(e));
    if (bad) return toast.error(`"${bad}" is not a valid email`);
    if (s.contactEmail && !EMAIL_RE.test(s.contactEmail)) return toast.error('Enter a valid contact email');
    setSaving(true);
    try {
      const res = await api<{ settings: SiteSettings }>('/api/admin/settings', {
        body: {
          siteName: s.siteName,
          tagline: s.tagline,
          description: s.description,
          logoUrl: s.logoUrl,
          faviconUrl: s.faviconUrl,
          contactEmail: s.contactEmail,
          contactPhone: s.contactPhone,
          contactWhatsapp: s.contactWhatsapp,
          contactTelegram: s.contactTelegram,
          contactAddress: s.contactAddress,
          businessHours: s.businessHours,
          socialLinks: s.socialLinks,
          seoDefaults: s.seoDefaults,
          orderAlertEmails: emails,
          maintenanceMode: s.maintenanceMode,
          maintenanceMessage: s.maintenanceMessage,
          requirePhone: s.requirePhone,
          requireWhatsapp: s.requireWhatsapp,
          aiSupportEnabled: s.aiSupportEnabled,
          aiSupportName: s.aiSupportName,
          aiWelcomeMessage: s.aiWelcomeMessage,
        },
      });
      setS(res.settings);
      setAlertEmails((res.settings.orderAlertEmails || []).join(', '));
      toast.success('Settings saved. Checkout uses them right away; other pages within a minute.');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl pb-24">
      <PageHeader kicker="Settings" title="Store & contact details" description="Everything customers see about your business: name, contact channels, address, hours, social links and search engine defaults." />
      <div className="space-y-6">
        <Card title="Store identity">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Store name" required>
              <Input value={s.siteName} onChange={e => set('siteName', e.target.value)} />
            </Field>
            <Field label="Tagline">
              <Input value={s.tagline} onChange={e => set('tagline', e.target.value)} />
            </Field>
            <Field label="Short description" className="sm:col-span-2" hint="Used in the footer and as the default meta description">
              <Textarea rows={2} value={s.description} onChange={e => set('description', e.target.value)} />
            </Field>
            <ImagePicker value={s.logoUrl} onChange={v => set('logoUrl', v)} kind="banners" label="Logo image (optional)" hint="The text logo is used when empty. PNG, JPG, WebP or SVG up to 5 MB." wide />
            <ImagePicker value={s.faviconUrl} onChange={v => set('faviconUrl', v)} kind="library" label="Favicon (optional)" hint="Square image, saved as 512×512 PNG." />
          </div>
        </Card>

        <Card title="Contact details" description="Shown on the Contact page, footer, emails, order pages and used by the SOFT4U ASSISTANT.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Support email">
              <Input type="email" value={s.contactEmail} onChange={e => set('contactEmail', e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={s.contactPhone} onChange={e => set('contactPhone', e.target.value)} placeholder="+92 3xx xxxxxxx" />
            </Field>
            <Field label="WhatsApp number" hint="Customers tap it to open a chat">
              <Input value={s.contactWhatsapp} onChange={e => set('contactWhatsapp', e.target.value)} placeholder="+92 3xx xxxxxxx" />
            </Field>
            <Field label="Telegram username or link">
              <Input value={s.contactTelegram} onChange={e => set('contactTelegram', e.target.value)} placeholder="@soft4u" />
            </Field>
            <Field label="Business address" className="sm:col-span-2">
              <Textarea rows={2} value={s.contactAddress} onChange={e => set('contactAddress', e.target.value)} />
            </Field>
            <Field label="Business hours" className="sm:col-span-2">
              <Input value={s.businessHours} onChange={e => set('businessHours', e.target.value)} placeholder="Mon – Sat, 10:00 AM – 10:00 PM (PKT)" />
            </Field>
          </div>
        </Card>

        <Card title="Social links" description="Leave empty to hide an icon.">
          <div className="grid gap-4 sm:grid-cols-2">
            {SOCIALS.map(([k, label, ph]) => (
              <Field key={k} label={label}>
                <Input value={s.socialLinks?.[k] || ''} onChange={e => setSocial(k, e.target.value)} placeholder={ph} />
              </Field>
            ))}
          </div>
        </Card>

        <Card title="Search engines (SEO)" description="Defaults for pages without their own SEO text.">
          <div className="grid gap-4">
            <Field label="Default title" counter={{ value: (s.seoDefaults?.title || '').length, max: 60 }}>
              <Input value={s.seoDefaults?.title || ''} onChange={e => setSeo('title', e.target.value)} />
            </Field>
            <Field label="Default description" counter={{ value: (s.seoDefaults?.description || '').length, max: 160 }}>
              <Textarea rows={2} value={s.seoDefaults?.description || ''} onChange={e => setSeo('description', e.target.value)} />
            </Field>
            <Field label="Keywords" hint="Comma separated">
              <Input value={s.seoDefaults?.keywords || ''} onChange={e => setSeo('keywords', e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Google site verification" hint='Paste only the content value of the Google meta tag, e.g. "abc123…"'>
                <Input value={s.seoDefaults?.googleSiteVerification || ''} onChange={e => setSeo('googleSiteVerification', e.target.value.replace(/^.*content="([^"]+)".*$/, '$1'))} className="font-mono" />
              </Field>
              <ImagePicker value={s.seoDefaults?.ogImage} onChange={v => setSeo('ogImage', v)} kind="banners" label="Social share image" hint="Shown when a link is shared on WhatsApp or Facebook. About 1200×630." wide />
            </div>
          </div>
        </Card>

        <Card title="Orders and checkout">
          <div className="grid gap-4">
            <Field label="Extra emails for new-order alerts" hint="Active admins always get alerts. Add more, separated by commas.">
              <Input value={alertEmails} onChange={e => setAlertEmails(e.target.value)} placeholder="orders@soft4u.top, owner@gmail.com" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Toggle checked={s.requireWhatsapp} onChange={v => set('requireWhatsapp', v)} label="Ask for WhatsApp" description={s.requireWhatsapp ? 'Required at checkout' : 'Optional at checkout'} />
              <Toggle checked={s.requirePhone} onChange={v => set('requirePhone', v)} label="Ask for phone" description={s.requirePhone ? 'Required at checkout' : 'Optional at checkout'} />
            </div>
          </div>
        </Card>

        <Card title="SOFT4U ASSISTANT (AI chat)">
          <div className="grid gap-4 sm:grid-cols-2">
            <Toggle checked={s.aiSupportEnabled} onChange={v => set('aiSupportEnabled', v)} label="Show the chat assistant" description="On the website and in the Telegram bot" />
            <Field label="Assistant name">
              <Input value={s.aiSupportName} onChange={e => set('aiSupportName', e.target.value)} />
            </Field>
            <Field label="Welcome message" className="sm:col-span-2">
              <Textarea rows={2} value={s.aiWelcomeMessage} onChange={e => set('aiWelcomeMessage', e.target.value)} />
            </Field>
          </div>
        </Card>

        <Card title="Maintenance mode" description="Shows a maintenance page to customers. You can still use the admin panel.">
          <div className="grid gap-4">
            <Toggle checked={s.maintenanceMode} onChange={v => set('maintenanceMode', v)} label="Store is under maintenance" />
            <Field label="Message">
              <Textarea rows={2} value={s.maintenanceMessage} onChange={e => set('maintenanceMessage', e.target.value)} />
            </Field>
          </div>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-30 bg-white/95 backdrop-blur border-t border-charcoal-border px-4 sm:px-8 py-3 flex justify-end">
        <Button icon={Save} loading={saving} onClick={save}>
          Save settings
        </Button>
      </div>
    </div>
  );
}
