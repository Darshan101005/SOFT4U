import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const users = await db.getUsers();
  const admins = users.filter(u => u.role === 'ADMIN');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">
            Admin Access
          </div>
          <h1 className="text-3xl font-extrabold text-charcoal">Admin Users</h1>
          <p className="text-xs text-charcoal-subtle mt-0.5">
            Accounts that can sign in to the admin panel at /admin.
          </p>
        </div>

        <div className="bg-white border border-charcoal-border rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 bg-surface-bg border-b border-charcoal-border text-xs font-bold text-charcoal-subtle uppercase tracking-wider">
            Admin Accounts ({admins.length})
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white text-charcoal-subtle uppercase font-bold text-[10px] border-b border-surface-muted">
                <tr>
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-muted">
                {admins.map(u => (
                  <tr key={u.id} className="hover:bg-surface-bg/60">
                    <td className="p-3.5 font-bold text-charcoal">{u.name}</td>
                    <td className="p-3.5 font-mono text-charcoal-muted">{u.email}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-pista-lighter text-pista-dark text-[10px] font-mono font-bold uppercase">
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
