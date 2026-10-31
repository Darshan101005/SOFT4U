'use client';

import React from 'react';
import { Info } from 'lucide-react';
import { CopyButton, CopyRow } from '@/components/ui/copy-button';

export interface PaymentAccount {
  key: string;
  name: string;
  type?: string;
  description?: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  bankName: string;
  branch: string;
  sortCode?: string;
  /** Currency the account receives (GBP for UK bank accounts). */
  payCurrency?: string;
  instructions: string;
  logo?: string;
}

const DEFAULT_INSTRUCTIONS = 'Transfer the exact total to the account above, then upload a screenshot of the payment and enter the transaction ID.';

/** Amount to transfer + account details with copy buttons (checkout and the order page). */
export function PaymentDetails({
  method,
  amountLabel,
  amountValue,
  sendLabel,
  sendValue,
}: {
  method: PaymentAccount;
  amountLabel: string;
  amountValue?: string;
  /** "GBP 7.90" when the account receives another currency than the order. */
  sendLabel?: string;
  sendValue?: string;
}) {
  const isWallet = method.type === 'easypaisa' || method.type === 'jazzcash';
  return (
    <div className="rounded-2xl border border-charcoal-border bg-white p-4 space-y-4">
      <div className="rounded-xl bg-pista-lighter border border-pista-light p-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-pista-darker">Amount to transfer</p>
          <p className="text-xl sm:text-2xl font-extrabold text-charcoal leading-tight whitespace-nowrap">{amountLabel}</p>
        </div>
        {amountValue && <CopyButton value={amountValue} label="Copy amount" compact />}
      </div>

      {sendLabel && (
        <div className="rounded-xl border border-pista-light p-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-pista-darker">Amount to send</p>
            <p className="text-lg sm:text-xl font-extrabold text-charcoal leading-tight whitespace-nowrap">{sendLabel}</p>
          </div>
          {sendValue && <CopyButton value={sendValue} label="Copy amount to send" compact />}
        </div>
      )}

      <div className="rounded-xl border border-surface-muted px-3">
        <CopyRow label="Account title" value={method.accountTitle} mono={false} />
        <CopyRow label={isWallet ? `${method.name} number` : 'Account number'} value={method.accountNumber} />
        <CopyRow label="Sort code" value={method.sortCode || ''} />
        <CopyRow label="IBAN" value={method.iban} />
        {method.bankName && <CopyRow label="Bank" value={method.bankName} mono={false} />}
        {method.branch && <CopyRow label="Branch" value={method.branch} mono={false} />}
      </div>

      <div className="flex items-start gap-2 text-xs sm:text-sm text-charcoal-muted leading-relaxed">
        <Info className="w-4 h-4 text-pista-dark shrink-0 mt-0.5" aria-hidden="true" />
        <p className="whitespace-pre-line">{method.instructions || DEFAULT_INSTRUCTIONS}</p>
      </div>
    </div>
  );
}

/** Small brand logo for a payment method (falls back to the method name). */
export function PaymentLogo({ method, className = 'h-7' }: { method: Pick<PaymentAccount, 'logo' | 'name'>; className?: string }) {
  if (!method.logo) return <span className="text-sm font-extrabold text-charcoal">{method.name}</span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={method.logo} alt={method.name} className={`${className} w-auto max-w-[140px] object-contain`} loading="lazy" />;
}
