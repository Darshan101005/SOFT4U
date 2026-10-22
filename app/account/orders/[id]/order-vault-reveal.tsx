'use client';

import React, { useState } from 'react';
import { Order } from '@/lib/db/types';
import { Copy, Check, Eye, EyeOff, ShieldCheck, Zap } from 'lucide-react';

export function OrderVaultReveal({ order }: { order: Order }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const togglePassword = (key: string) => {
    setRevealedPasswords(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-charcoal-subtle uppercase tracking-wider">
          Digital Fulfillment Credentials & Access Keys
        </h3>
        <span className="text-[11px] text-pista-dark font-semibold flex items-center gap-1">
          <Zap className="w-3.5 h-3.5" />
          Active In Customer Vault
        </span>
      </div>

      <div className="space-y-4">
        {order.items.map((item, idx) => (
          <div key={item.id} className="p-5 bg-surface-bg border border-charcoal-border rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-charcoal">{item.productName}</h4>
                <div className="text-xs text-charcoal-subtle">{item.variantName} (Qty: {item.quantity})</div>
              </div>
              <span className="text-xs font-mono font-bold text-pista-dark">
                STATUS: UNLOCKED
              </span>
            </div>

            {/* Revealed Credentials */}
            {item.fulfillmentData?.credentials && item.fulfillmentData.credentials.length > 0 && (
              <div className="space-y-3 pt-2">
                {item.fulfillmentData.credentials.map((cred, cIdx) => {
                  const passKey = `${item.id}_${cIdx}`;
                  const isRevealed = revealedPasswords[passKey];
                  return (
                    <div key={cIdx} className="bg-white p-4 rounded-lg border border-charcoal-border space-y-3">
                      <div className="text-[11px] font-bold text-charcoal-subtle uppercase tracking-wider">
                        {cred.profile || 'Dedicated Account'}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                        {cred.email && (
                          <div className="p-2.5 bg-surface-bg rounded border border-charcoal-border flex items-center justify-between">
                            <div>
                              <div className="text-[10px] text-charcoal-subtle font-sans">Account Login / Email:</div>
                              <div className="font-bold text-charcoal select-all">{cred.email}</div>
                            </div>
                            <button
                              onClick={() => handleCopy(cred.email || '', `email_${idx}_${cIdx}`)}
                              className="text-charcoal-subtle hover:text-charcoal p-1"
                              title="Copy"
                            >
                              {copiedKey === `email_${idx}_${cIdx}` ? <Check className="w-3.5 h-3.5 text-pista-dark" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        )}

                        {cred.password && (
                          <div className="p-2.5 bg-surface-bg rounded border border-charcoal-border flex items-center justify-between">
                            <div>
                              <div className="text-[10px] text-charcoal-subtle font-sans">Password:</div>
                              <div className="font-bold text-charcoal">
                                {isRevealed ? cred.password : '••••••••••••'}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => togglePassword(passKey)}
                                className="text-charcoal-subtle hover:text-charcoal p-1"
                                title={isRevealed ? 'Hide' : 'Reveal'}
                              >
                                {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => handleCopy(cred.password || '', `pwd_${idx}_${cIdx}`)}
                                className="text-charcoal-subtle hover:text-charcoal p-1"
                                title="Copy"
                              >
                                {copiedKey === `pwd_${idx}_${cIdx}` ? <Check className="w-3.5 h-3.5 text-pista-dark" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        )}

                        {cred.pin && (
                          <div className="p-2.5 bg-surface-bg rounded border border-charcoal-border flex items-center justify-between">
                            <div>
                              <div className="text-[10px] text-charcoal-subtle font-sans">Profile PIN:</div>
                              <div className="font-bold text-charcoal">{cred.pin}</div>
                            </div>
                            <button
                              onClick={() => handleCopy(cred.pin || '', `pin_${idx}_${cIdx}`)}
                              className="text-charcoal-subtle hover:text-charcoal p-1"
                            >
                              {copiedKey === `pin_${idx}_${cIdx}` ? <Check className="w-3.5 h-3.5 text-pista-dark" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Revealed License Keys */}
            {item.fulfillmentData?.licenseKeys && item.fulfillmentData.licenseKeys.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="text-[11px] font-bold text-charcoal-subtle uppercase tracking-wider">
                  License Keys & Direct Invite Links
                </div>
                {item.fulfillmentData.licenseKeys.map((key, kIdx) => (
                  <div key={kIdx} className="p-3 bg-white rounded border border-charcoal-border flex items-center justify-between font-mono text-xs">
                    <span className="font-bold text-charcoal select-all truncate max-w-md">{key}</span>
                    <button
                      onClick={() => handleCopy(key, `key_${idx}_${kIdx}`)}
                      className="px-3 py-1 bg-pista-lighter text-pista-dark hover:bg-pista hover:text-charcoal rounded text-xs font-semibold flex items-center gap-1 font-sans"
                    >
                      {copiedKey === `key_${idx}_${kIdx}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === `key_${idx}_${kIdx}` ? 'Copied' : 'Copy Key'}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Instructions */}
            {item.fulfillmentData?.instructions && (
              <div className="p-3 bg-white rounded border border-charcoal-border text-xs text-charcoal-muted leading-relaxed">
                <span className="font-bold text-charcoal block mb-0.5">Activation Guide:</span>
                {item.fulfillmentData.instructions}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
