import React from 'react';
import { botLink, botUsername, telegramEnabled } from '@/lib/telegram';
import { getTelegramLinkForUser } from '@/lib/telegram-link';
import { safe } from '@/app/_store/storefront';
import { requireAccountUser } from '../require-user';
import { TelegramClient } from './telegram-client';

export const dynamic = 'force-dynamic';

export default async function AccountTelegramPage() {
  const user = await requireAccountUser('/account/telegram');
  const linked = await safe(() => getTelegramLinkForUser(user.id), null);
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">Telegram</div>
        <h1 className="text-2xl font-extrabold text-charcoal">SOFT4U ASSISTANT on Telegram</h1>
        <p className="text-sm text-charcoal-subtle mt-0.5">Connect our Telegram bot to get order updates and deliveries, check your orders and ask questions in chat.</p>
      </div>
      <TelegramClient enabled={telegramEnabled()} botUsername={botUsername()} botUrl={botLink()} linked={linked ? { username: linked.username || '', linkedAt: linked.linkedAt } : null} />
    </div>
  );
}
