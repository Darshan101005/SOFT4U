'use client';

import React from 'react';
import { CalendarClock, ExternalLink, FileText, Hash, Info, Key, KeyRound, Link2, Lock, Mail, Phone, ShieldCheck, User, UserRound, type LucideIcon } from 'lucide-react';
import type { DeliveryField, OrderItem } from '@/lib/db/types';
import { CopyButton } from '@/components/ui/copy-button';

/** Picks an icon from the field label: envelope = email, key = password, shield = 2FA / OTP, link = URL, ... */
export function iconForField(label: string, value: string): LucideIcon {
  const l = label.toLowerCase();
  if (/^https?:\/\//i.test(value.trim()) || /\b(link|url|website|login page)\b/.test(l)) return Link2;
  if (/(2fa|two.?factor|otp|authenticator|backup code|recovery|verification)/.test(l)) return ShieldCheck;
  if (/(pass(word)?|pwd)/.test(l)) return KeyRound;
  if (/(e-?mail|gmail)/.test(l)) return Mail;
  if (/(user ?name|login|user id|account id)/.test(l)) return User;
  if (/(licen[cs]e|serial|activation|product key|redeem|gift ?card|voucher|\bkey\b|\bcode\b)/.test(l)) return Key;
  if (/\bpin\b/.test(l)) return Hash;
  if (/profile/.test(l)) return UserRound;
  if (/(phone|mobile|whatsapp|number)/.test(l)) return Phone;
  if (/(expir|valid|renew|date|until)/.test(l)) return CalendarClock;
  if (/(note|instruction|how to|steps)/.test(l)) return Info;
  return FileText;
}

/** Normalises every delivery format (key/value fields, legacy credentials, licence keys) into fields. */
export function deliveryFields(item: OrderItem): DeliveryField[] {
  const f = item.fulfillmentData;
  if (!f) return [];
  const out: DeliveryField[] = [...(f.fields || [])];
  for (const c of f.credentials || []) {
    if (c.email) out.push({ label: 'Email', value: c.email });
    if (c.password) out.push({ label: 'Password', value: c.password });
    if (c.profile) out.push({ label: 'Profile', value: c.profile });
    if (c.pin) out.push({ label: 'PIN', value: c.pin });
  }
  for (const k of f.licenseKeys || []) out.push({ label: 'Licence key', value: k });
  return out.filter(x => x.value && String(x.value).trim());
}

/** "Your digital access": a card per delivered field with a matching icon, monospace value and Copy button. */
export function DeliveryPanel({ items }: { items: OrderItem[] }) {
  const delivered = items.filter(i => deliveryFields(i).length > 0 || i.fulfillmentData?.instructions);
  if (delivered.length === 0) return null;
  return (
    <section aria-labelledby="access-title" className="rounded-2xl border border-pista-300 bg-gradient-to-b from-pista-50 to-white p-4 sm:p-6 space-y-5">
      <div>
        <h2 id="access-title" className="text-lg font-extrabold text-charcoal flex items-center gap-2">
          <Lock className="w-5 h-5 text-pista-dark" aria-hidden="true" />
          Your digital access
        </h2>
        <p className="text-sm text-charcoal-muted mt-1">Copy each value below to sign in or activate your product.</p>
      </div>

      {delivered.map(item => {
        const fields = deliveryFields(item);
        return (
          <div key={item.id} className="space-y-3">
            <div className="text-sm font-bold text-charcoal">
              {item.productName} <span className="font-medium text-charcoal-subtle">· {item.variantName}</span>
            </div>
            {fields.length > 0 && (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fields.map((field, idx) => {
                  const Icon = iconForField(field.label, field.value);
                  const isUrl = /^https?:\/\//i.test(field.value.trim());
                  return (
                    <li key={`${field.label}-${idx}`} className="rounded-xl border border-charcoal-border bg-white p-3 flex items-start gap-3 min-w-0">
                      <span className="w-10 h-10 shrink-0 rounded-xl bg-pista-100 text-pista-darker flex items-center justify-center">
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold uppercase tracking-wide text-charcoal-subtle">{field.label}</div>
                        <div className="mt-0.5 font-mono text-sm font-semibold text-charcoal break-all select-all">{field.value}</div>
                        <div className="mt-2 flex items-center gap-2">
                          <CopyButton value={field.value} label="Copy value" />
                          {isUrl && (
                            <a
                              href={field.value.trim()}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              className="inline-flex items-center gap-1.5 min-h-11 px-3 rounded-xl border border-charcoal-border text-xs font-bold text-charcoal-muted hover:border-pista hover:text-pista-darker"
                            >
                              <ExternalLink className="w-4 h-4" aria-hidden="true" />
                              Open
                            </a>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {item.fulfillmentData?.instructions && (
              <div className="rounded-xl border border-charcoal-border bg-white p-3 text-sm text-charcoal-muted whitespace-pre-line flex gap-2">
                <Info className="w-4 h-4 text-pista-dark shrink-0 mt-0.5" aria-hidden="true" />
                <span>{item.fulfillmentData.instructions}</span>
              </div>
            )}
          </div>
        );
      })}

      <div className="rounded-xl bg-night text-pista-100 p-3 sm:p-4 text-xs sm:text-sm flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-pista-300 shrink-0 mt-0.5" aria-hidden="true" />
        <p>
          <strong className="text-white">Keep this delivery private.</strong> Do not share these details or change the account password, email or profile unless the product page allows it. Sharing or changes can void your warranty.
        </p>
      </div>
    </section>
  );
}
