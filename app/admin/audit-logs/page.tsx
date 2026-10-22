import React from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { db } from '@/lib/db';
import { ClipboardList, Clock, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminAuditLogsPage() {
  const logs = await db.getAuditLogs();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <div className="text-xs font-bold text-pista-dark uppercase tracking-wider mb-1">
            SECURITY & COMPLIANCE LOGS
          </div>
          <h1 className="text-3xl font-extrabold text-charcoal">Audit Trails & Activity Logs</h1>
          <p className="text-xs text-charcoal-subtle mt-0.5">
            Immutable log of all administrative actions, product edits, legal publications, and order fulfillments.
          </p>
        </div>

        <div className="bg-white border border-charcoal-border rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-bg text-charcoal-subtle uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3.5">Action Tag</th>
                  <th className="p-3.5">Target Entity</th>
                  <th className="p-3.5">Administrator</th>
                  <th className="p-3.5">Audit Details</th>
                  <th className="p-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-muted">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-surface-bg/60">
                    <td className="p-3.5">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-pista-lighter text-pista-dark font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-charcoal font-mono">{log.entity}</td>
                    <td className="p-3.5">
                      <div className="font-semibold text-charcoal">{log.adminName}</div>
                      <div className="text-[10px] text-charcoal-subtle font-mono">{log.adminEmail}</div>
                    </td>
                    <td className="p-3.5 text-charcoal-muted">{log.details || '—'}</td>
                    <td className="p-3.5 text-charcoal-subtle font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
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
