import React from 'react';
import { requireAccountUser } from '../require-user';
import { ProfileForms } from './profile-forms';

export const dynamic = 'force-dynamic';

export default async function AccountProfilePage() {
  const user = await requireAccountUser('/account/profile');
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">Profile</div>
        <h1 className="text-2xl font-extrabold text-charcoal">Your details</h1>
        <p className="text-sm text-charcoal-subtle mt-0.5">Contact details are used only to reach you about your orders. They are not verified.</p>
      </div>
      <ProfileForms user={{ name: user.name, email: user.email, phone: user.phone || '', whatsapp: user.whatsapp || '', telegram: user.telegram || '', createdAt: user.createdAt }} />
    </div>
  );
}
