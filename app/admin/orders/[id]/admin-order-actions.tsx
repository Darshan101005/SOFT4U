'use client';

import React, { useState } from 'react';
import { Order } from '@/lib/db/types';
import { Check, ShieldCheck, Zap, Copy, RotateCcw } from 'lucide-react';

export function AdminOrderDetailActions({ order }: { order: Order }) {
  const [currentOrder, setCurrentOrder] = useState<Order>(order);
  const [copied, setCopied] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleProcessRefund = () => {
    if (!confirm('Issue a full refund for this digital order?')) return;
    const updated: Order = {
      ...currentOrder,
      paymentStatus: 'refunded',
      orderStatus: 'refunded',
      timeline: [
        ...currentOrder.timeline,
        {
          status: 'Refund Processed',
          note: `Refund of $${currentOrder.total} processed by administrator`,
          timestamp: new Date().toISOString()
        }
      ]
    };
    setCurrentOrder(updated);
    showNotice('Order refunded and logged in audit trail.');
  };

  return (
    <div className="space-y-6">
      {notice && (
        <div className="p-3 bg-pista-lighter border border-pista text-xs font-semibold text-pista-dark rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      {/* Dispatched Vault Credentials */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-charcoal-subtle uppercase tracking-wider">
          Fulfilled Digital Credentials & Keys
        </h3>

        <div className="space-y-4">
          {currentOrder.items.map((item, idx) => (
            <div key={item.id} className="p-4 bg-surface-bg border border-charcoal-border rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-charcoal text-sm">{item.productName}</span>
                  <span className="text-charcoal-subtle ml-2">({item.variantName})</span>
                </div>
                <span className="font-mono text-pista-dark font-bold">QTY: {item.quantity}</span>
              </div>

              {item.fulfillmentData?.credentials && item.fulfillmentData.credentials.map((cred, cIdx) => (
                <div key={cIdx} className="bg-white p-3 rounded-lg border border-charcoal-border space-y-2 font-mono">
                  <div className="text-[10px] text-charcoal-subtle uppercase font-sans font-bold">
                    Profile: {cred.profile || 'Dedicated'}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-charcoal-subtle">User: </span>
                      <span className="font-bold text-charcoal">{cred.email}</span>
                      <span className="mx-2 text-charcoal-border">|</span>
                      <span className="text-charcoal-subtle">Pass: </span>
                      <span className="font-bold text-charcoal">{cred.password}</span>
                      {cred.pin && (
                        <>
                          <span className="mx-2 text-charcoal-border">|</span>
                          <span className="text-charcoal-subtle">PIN: </span>
                          <span className="font-bold text-charcoal">{cred.pin}</span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => handleCopy(`${cred.email}:${cred.password}`, `c_${idx}_${cIdx}`)}
                      className="px-2 py-1 bg-surface-muted text-charcoal rounded hover:bg-surface-subtle text-[11px] font-sans"
                    >
                      {copied === `c_${idx}_${cIdx}` ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              ))}

              {item.fulfillmentData?.licenseKeys && item.fulfillmentData.licenseKeys.map((key, kIdx) => (
                <div key={kIdx} className="bg-white p-2.5 rounded-lg border border-charcoal-border flex items-center justify-between font-mono">
                  <span className="font-bold text-charcoal">{key}</span>
                  <button
                    onClick={() => handleCopy(key, `k_${idx}_${kIdx}`)}
                    className="px-2 py-1 bg-surface-muted text-charcoal rounded hover:bg-surface-subtle text-[11px]"
                  >
                    {copied === `k_${idx}_${kIdx}` ? 'Copied' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Audit Timeline */}
      <div className="pt-4 border-t border-charcoal-border space-y-3">
        <h3 className="text-xs font-bold text-charcoal-subtle uppercase tracking-wider">
          Audit Timeline Events
        </h3>
        <div className="space-y-3 text-xs">
          {currentOrder.timeline.map((evt, i) => (
            <div key={i} className="flex items-start gap-3 p-2.5 bg-surface-bg rounded-lg">
              <span className="w-2 h-2 rounded-full bg-pista-hover mt-1.5 flex-shrink-0" />
              <div>
                <div className="font-bold text-charcoal">{evt.status}</div>
                <div className="text-charcoal-muted">{evt.note}</div>
                <div className="text-[10px] text-charcoal-subtle font-mono mt-0.5">
                  {new Date(evt.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Action Buttons */}
      <div className="pt-4 border-t border-charcoal-border flex justify-end gap-3">
        {currentOrder.paymentStatus !== 'refunded' && (
          <button
            onClick={handleProcessRefund}
            className="px-4 py-2 border border-charcoal-border bg-white hover:bg-surface-muted text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-charcoal-subtle" />
            <span>Process Full Refund</span>
          </button>
        )}
      </div>
    </div>
  );
}
