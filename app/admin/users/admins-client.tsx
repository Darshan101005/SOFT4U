'use client';

import React, { useState } from 'react';
import { KeyRound, Pause, Pencil, Play, Plus, RefreshCcw, ShieldCheck, ShieldOff, Trash2, Wand2 } from 'lucide-react';
import type { AdminUser } from '@/lib/db/types';
import { checkPassword, EMAIL_RE } from '@/lib/password-policy';
import { Badge, Button, Card, CopyButton, Field, Input, Modal, PageHeader, Table, api, errMsg, toast, useDialog } from '../_components/ui';
import { PasswordMeter, generatePassword } from '../_components/password-meter';
import { fmtDateTime } from '../_components/format';
import { formatPersonName } from '@/lib/format-name';

export function AdminsClient({ initialAdmins, meId }: { initialAdmins: AdminUser[]; meId: string }) {
  const [admins, setAdmins] = useState(initialAdmins);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [adding, setAdding] = useState(false);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [pwTarget, setPwTarget] = useState<AdminUser | null>(null);
  const [newPw, setNewPw] = useState('');
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '' });
  const [editing, setEditing] = useState(false);
  const { confirm, dialog } = useDialog();

  const activeCount = admins.filter(a => a.status === 'active').length;
  const isLastActive = (a: AdminUser) => a.status === 'active' && activeCount <= 1;

  const reload = async () => {
    try {
      const res = await api<{ admins: AdminUser[] }>('/api/admin/admins');
      setAdmins(res.admins);
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return toast.error('Enter a name');
    if (!EMAIL_RE.test(form.email.trim())) return toast.error('Enter a valid email address');
    const check = checkPassword(form.password);
    if (!check.ok) return toast.error(check.error!);
    setAdding(true);
    try {
      await api('/api/admin/admins', { body: { ...form, email: form.email.trim() } });
      setCreated({ email: form.email.trim().toLowerCase(), password: form.password });
      setForm({ name: '', email: '', password: '' });
      setAddOpen(false);
      await reload();
      toast.success('Admin added');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setAdding(false);
    }
  };

  const patch = async (a: AdminUser, body: Record<string, unknown>, okMsg: string) => {
    setBusyId(a.id);
    try {
      await api(`/api/admin/admins/${a.id}`, { method: 'PATCH', body });
      toast.success(okMsg);
      if (a.id === meId && body.status === 'paused') {
        window.location.assign('/admin/login');
        return;
      }
      await reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusyId(null);
    }
  };

  const pause = async (a: AdminUser) => {
    if (isLastActive(a)) return toast.error('At least one active admin must remain. Add or re-activate another admin first.');
    const ok = await confirm({
      title: `Pause ${a.name}?`,
      message: a.id === meId ? 'This is your own account. You will be signed out right away.' : 'They are signed out immediately and cannot sign in until an admin re-activates them.',
      confirmLabel: 'Pause admin',
      danger: true,
    });
    if (ok) await patch(a, { status: 'paused' }, `${a.name} is paused`);
  };

  const remove = async (a: AdminUser) => {
    if (isLastActive(a)) return toast.error('At least one active admin must remain. Add or re-activate another admin first.');
    const ok = await confirm({
      title: `Delete ${a.name}?`,
      message: `This permanently removes the admin account ${a.email}. ${a.id === meId ? 'This is your own account and you will be signed out.' : ''}`,
      confirmLabel: 'Delete admin',
      danger: true,
    });
    if (!ok) return;
    setBusyId(a.id);
    try {
      const res = await api<{ selfDeleted?: boolean }>(`/api/admin/admins/${a.id}`, { method: 'DELETE' });
      if (res.selfDeleted) {
        await fetch('/api/admin/logout', { method: 'POST' }).catch(() => undefined);
        window.location.assign('/admin/login');
        return;
      }
      toast.success('Admin deleted');
      await reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusyId(null);
    }
  };

  const reset2fa = async (a: AdminUser) => {
    const ok = await confirm({
      title: `Reset two-factor for ${a.name}?`,
      message: 'Use this when the admin lost their phone. They can sign in with only their password and set up two-factor again.',
      confirmLabel: 'Reset two-factor',
      danger: true,
    });
    if (ok) await patch(a, { resetTwoFactor: true }, 'Two-factor removed');
  };

  const setPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwTarget) return;
    const check = checkPassword(newPw);
    if (!check.ok) return toast.error(check.error!);
    await patch(pwTarget, { password: newPw }, `New password set for ${pwTarget.name}. Their sessions were signed out.`);
    setCreated({ email: pwTarget.email, password: newPw });
    setPwTarget(null);
    setNewPw('');
  };

  const openEdit = (a: AdminUser) => {
    setEditTarget(a);
    setEditForm({ name: a.name, email: a.email });
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    const name = formatPersonName(editForm.name);
    const email = editForm.email.trim().toLowerCase();
    if (name.length < 2 || name.length > 80) return toast.error('Enter a name (2-80 characters)');
    if (!EMAIL_RE.test(email)) return toast.error('Enter a valid email address');
    setEditing(true);
    try {
      await api(`/api/admin/admins/${editTarget.id}`, { method: 'PATCH', body: { name, email } });
      toast.success(editTarget.id === meId ? 'Your details are saved' : `Saved ${name}`);
      setEditTarget(null);
      await reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setEditing(false);
    }
  };

  return (
    <div>
      <PageHeader
        kicker="Settings"
        title="Admins"
        description="Everyone here can sign in at /admin. Any admin can add, pause or delete other admins, but at least one active admin always remains."
        actions={
          <Button icon={Plus} onClick={() => { setForm({ name: '', email: '', password: generatePassword() }); setAddOpen(true); }}>
            Add admin
          </Button>
        }
      />

      {created && (
        <div className="mb-5 p-4 rounded-2xl border border-pista bg-pista-lighter text-sm space-y-2">
          <div className="font-bold text-pista-darker">Share these sign-in details privately</div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <span className="flex items-center gap-1">Email: <code className="font-mono font-bold">{created.email}</code><CopyButton value={created.email} label="Email" /></span>
            <span className="flex items-center gap-1">Password: <code className="font-mono font-bold">{created.password}</code><CopyButton value={created.password} label="Password" /></span>
          </div>
          <div className="text-xs text-charcoal-muted">Sign in at /admin/login. Ask them to change the password in My profile and turn on two-factor.</div>
          <Button size="sm" variant="secondary" onClick={() => setCreated(null)}>Done</Button>
        </div>
      )}

      <Card bodyClassName="p-0">
        <Table head={['Admin', 'Status', 'Two-factor', 'Telegram', 'Last sign-in', '']}>
          {admins.map(a => {
            const last = isLastActive(a);
            return (
              <tr key={a.id} className="hover:bg-surface-bg/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-pista text-charcoal font-extrabold flex items-center justify-center shrink-0">{a.name.charAt(0).toUpperCase()}</span>
                    <div className="min-w-0">
                      <div className="font-bold text-charcoal flex items-center gap-2">
                        {a.name} {a.id === meId && <Badge tone="dark">You</Badge>}
                      </div>
                      <div className="text-xs text-charcoal-subtle">{a.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{a.status === 'active' ? <Badge tone="green">Active</Badge> : <Badge tone="amber">Paused</Badge>}</td>
                <td className="px-4 py-3">{a.twoFactorEnabled ? <Badge tone="green"><ShieldCheck className="w-3 h-3" />On</Badge> : <Badge tone="gray">Off</Badge>}</td>
                <td className="px-4 py-3">{a.telegramLinked ? <Badge tone="blue">Alerts on</Badge> : <span className="text-xs text-charcoal-subtle">—</span>}</td>
                <td className="px-4 py-3 text-xs text-charcoal-subtle whitespace-nowrap">{fmtDateTime(a.lastLoginAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <Button size="sm" variant="secondary" icon={Pencil} onClick={() => openEdit(a)}>
                      Edit
                    </Button>
                    {a.status === 'active' ? (
                      <Button size="sm" variant="secondary" icon={Pause} disabled={last || busyId === a.id} title={last ? 'The last active admin cannot be paused' : undefined} onClick={() => pause(a)}>
                        Pause
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" icon={Play} loading={busyId === a.id} onClick={() => patch(a, { status: 'active' }, `${a.name} is active again`)}>
                        Re-activate
                      </Button>
                    )}
                    {a.id !== meId && (
                      <Button size="sm" variant="secondary" icon={KeyRound} onClick={() => { setPwTarget(a); setNewPw(generatePassword()); }}>
                        Set password
                      </Button>
                    )}
                    {a.twoFactorEnabled && a.id !== meId && (
                      <Button size="sm" variant="secondary" icon={ShieldOff} onClick={() => reset2fa(a)}>
                        Reset 2FA
                      </Button>
                    )}
                    <Button size="sm" variant="outline-danger" icon={Trash2} disabled={last || busyId === a.id} title={last ? 'The last active admin cannot be deleted' : undefined} onClick={() => remove(a)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
        {activeCount <= 1 && (
          <p className="px-4 py-3 text-xs text-charcoal-subtle border-t border-surface-muted">
            Only one admin is active, so that admin cannot be paused or deleted. Add another admin first.
          </p>
        )}
      </Card>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add admin"
        description="The new admin signs in with this email and temporary password."
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={add} loading={adding}>Add admin</Button>
          </>
        }
      >
        <form onSubmit={add} className="space-y-4">
          <Field label="Name" required>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus />
          </Field>
          <Field label="Email" required>
            <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Temporary password" required>
            <div className="flex gap-2">
              <Input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="font-mono" />
              <Button variant="secondary" icon={Wand2} onClick={() => setForm({ ...form, password: generatePassword() })} title="Generate">
                <span className="sr-only">Generate</span>
              </Button>
            </div>
          </Field>
          <PasswordMeter password={form.password} />
          <button type="submit" className="hidden" />
        </form>
      </Modal>

      <Modal
        open={Boolean(pwTarget)}
        onClose={() => setPwTarget(null)}
        title={pwTarget ? `New password for ${pwTarget.name}` : ''}
        description="Their current sessions are signed out. Share the new password privately."
        footer={
          <>
            <Button variant="secondary" onClick={() => setPwTarget(null)}>Cancel</Button>
            <Button onClick={setPassword} loading={busyId === pwTarget?.id}>Set password</Button>
          </>
        }
      >
        <form onSubmit={setPassword} className="space-y-3">
          <div className="flex gap-2">
            <Input value={newPw} onChange={e => setNewPw(e.target.value)} className="font-mono" />
            <Button variant="secondary" icon={RefreshCcw} onClick={() => setNewPw(generatePassword())} title="Generate">
              <span className="sr-only">Generate</span>
            </Button>
          </div>
          <PasswordMeter password={newPw} />
        </form>
      </Modal>
      <Modal
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title={editTarget ? `Edit ${editTarget.name}` : ''}
        description={editTarget?.id === meId ? 'This is your own account. You stay signed in.' : 'Names are saved in proper name case. Emails are saved in lowercase.'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={saveEdit} loading={editing}>Save</Button>
          </>
        }
      >
        <form onSubmit={saveEdit} className="space-y-4">
          <Field label="Name" required>
            <Input value={editForm.name} maxLength={80} onChange={e => setEditForm({ ...editForm, name: e.target.value })} autoFocus />
          </Field>
          <Field label="Email" required>
            <Input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
          </Field>
          <button type="submit" className="hidden" />
        </form>
      </Modal>
      {dialog}
    </div>
  );
}
