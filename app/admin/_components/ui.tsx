'use client';

import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Check, CheckCircle2, ChevronDown, Copy, Info, Loader2, Search, X, XCircle } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export { cx, PageHeader, Card, Stat, EmptyState, Badge, OrderStatusBadge, ORDER_STATUS_LABELS, Table } from './primitives';
export type { BadgeTone } from './primitives';
import { cx } from './primitives';

/** JSON fetch for admin APIs. Throws an Error carrying the server message. */
export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(path, {
    method: opts.method || (opts.body !== undefined ? 'POST' : 'GET'),
    headers: opts.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: 'no-store',
  });
  let data: any = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (res.status === 401 && typeof window !== 'undefined' && !path.includes('/login')) {
    window.location.assign(`/admin/login?next=${encodeURIComponent(window.location.pathname)}`);
  }
  if (!res.ok || data?.error) {
    const err = new Error(data?.error || `Request failed (${res.status})`) as Error & { code?: string; status?: number };
    err.code = data?.code;
    err.status = res.status;
    throw err;
  }
  return data as T;
}

export function errMsg(err: unknown, fallback = 'Something went wrong'): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/* ------------------------------------------------------------------ */
/* Toasts                                                              */
/* ------------------------------------------------------------------ */

type ToastItem = { id: number; tone: 'success' | 'error' | 'info'; message: string };
let toastItems: ToastItem[] = [];
let toastSeq = 1;
const toastListeners = new Set<() => void>();
function emitToasts() {
  for (const l of toastListeners) l();
}
function pushToast(tone: ToastItem['tone'], message: string) {
  const id = toastSeq++;
  toastItems = [...toastItems, { id, tone, message }];
  emitToasts();
  setTimeout(() => {
    toastItems = toastItems.filter(t => t.id !== id);
    emitToasts();
  }, tone === 'error' ? 6000 : 3500);
}
export const toast = {
  success: (m: string) => pushToast('success', m),
  error: (m: string) => pushToast('error', m),
  info: (m: string) => pushToast('info', m),
};
const EMPTY_TOASTS: ToastItem[] = [];
function subscribeToasts(l: () => void) {
  toastListeners.add(l);
  return () => {
    toastListeners.delete(l);
  };
}

export function Toaster() {
  const items = useSyncExternalStore(subscribeToasts, () => toastItems, () => EMPTY_TOASTS);
  return (
    <div className="fixed z-[200] bottom-4 right-4 left-4 sm:left-auto flex flex-col gap-2 items-end pointer-events-none" aria-live="polite">
      {items.map(t => (
        <div
          key={t.id}
          className={cx(
            'pointer-events-auto w-full sm:w-auto sm:max-w-sm flex items-start gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold bg-white',
            t.tone === 'success' && 'border-pista text-pista-darker',
            t.tone === 'error' && 'border-accent-rose/40 text-accent-rose',
            t.tone === 'info' && 'border-charcoal-border text-charcoal',
          )}
        >
          {t.tone === 'success' ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : t.tone === 'error' ? <XCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <Info className="w-4 h-4 mt-0.5 shrink-0" />}
          <span className="leading-snug">{t.message}</span>
        </div>
      ))}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cx('animate-spin text-pista-dark', className || 'w-5 h-5')} />;
}

export function LoadingBlock() {
  return (
    <div className="flex items-center justify-center py-16">
      <Spinner className="w-7 h-7" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons + form controls                                             */
/* ------------------------------------------------------------------ */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark' | 'outline-danger';

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon: Icon,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
  loading?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const v: Record<ButtonVariant, string> = {
    primary: 'bg-pista text-charcoal hover:bg-pista-hover border border-pista',
    secondary: 'bg-white text-charcoal border border-charcoal-border hover:border-pista hover:bg-pista-50',
    ghost: 'bg-transparent text-charcoal-muted hover:bg-pista-lighter hover:text-charcoal border border-transparent',
    danger: 'bg-accent-rose text-white hover:bg-accent-rose/90 border border-accent-rose',
    'outline-danger': 'bg-white text-accent-rose border border-accent-rose/30 hover:bg-accent-rose/5',
    dark: 'bg-pista-dark text-white hover:bg-pista-darker border border-pista-dark',
  };
  const s = size === 'sm' ? 'px-3 py-1.5 text-xs gap-1.5 rounded-lg' : 'px-4 py-2.5 text-sm gap-2 rounded-xl';
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cx(
        'inline-flex items-center justify-center font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-pista focus-visible:ring-offset-1 whitespace-nowrap',
        v[variant],
        s,
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className={cx('animate-spin', size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4')} /> : Icon ? <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} /> : null}
      {children}
    </button>
  );
}

export const inputCls =
  'w-full px-3 py-2.5 text-sm border border-charcoal-border rounded-xl bg-white text-charcoal placeholder:text-charcoal-subtle/70 focus:outline-none focus:border-pista-hover focus:ring-2 focus:ring-pista/25 disabled:bg-surface-muted disabled:text-charcoal-subtle transition-colors';

export function Input({ className, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(inputCls, className)} {...rest} />;
}

export function Textarea({ className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(inputCls, 'leading-relaxed', className)} {...rest} />;
}

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
  counter,
}: {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  counter?: { value: number; max: number };
}) {
  return (
    <div className={cx('space-y-1.5', className)}>
      {(label || counter) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <label className="text-xs font-bold text-charcoal">
              {label}
              {required && <span className="text-accent-rose"> *</span>}
            </label>
          )}
          {counter && (
            <span className={cx('text-[10px] font-mono', counter.value > counter.max ? 'text-accent-rose' : 'text-charcoal-subtle')}>
              {counter.value}/{counter.max}
            </span>
          )}
        </div>
      )}
      {children}
      {error ? <p className="text-[11px] font-semibold text-accent-rose">{error}</p> : hint ? <p className="text-[11px] text-charcoal-subtle">{hint}</p> : null}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cx('relative', className)}>
      <Search className="w-4 h-4 text-charcoal-subtle absolute left-3 top-1/2 -translate-y-1/2" />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cx(inputCls, 'pl-9 pr-9')} />
      {value && (
        <button type="button" onClick={() => onChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-charcoal-subtle hover:text-charcoal" aria-label="Clear search">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className={cx('flex items-start gap-3 select-none', disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pista focus-visible:ring-offset-1',
          checked ? 'bg-pista-dark' : 'bg-charcoal-border-dark',
        )}
      >
        <span className={cx('pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5' : 'translate-x-0')} />
      </button>
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-sm font-semibold text-charcoal">{label}</span>}
          {description && <span className="block text-xs text-charcoal-subtle mt-0.5">{description}</span>}
        </span>
      )}
    </label>
  );
}

export function Checkbox({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: React.ReactNode; disabled?: boolean }) {
  return (
    <label className={cx('inline-flex items-center gap-2 select-none text-sm', disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer')}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx(
          'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pista',
          checked ? 'bg-pista-dark border-pista-dark text-white' : 'bg-white border-charcoal-border-dark',
        )}
      >
        {checked && <Check className="w-3.5 h-3.5" />}
      </button>
      {label && <span className="text-charcoal font-medium">{label}</span>}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Styled select (pistachio, no native dropdown)                       */
/* ------------------------------------------------------------------ */

export interface SelectOption {
  value: string;
  label: string;
  hint?: string;
  disabled?: boolean;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  disabled,
  size = 'md',
  className,
  searchable,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  searchable?: boolean;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [rect, setRect] = useState<{ top: number; left: number; width: number; up: boolean } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);
  const showSearch = searchable ?? options.length > 8;
  const filtered = query ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase())) : options;

  const place = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const up = spaceBelow < 280 && r.top > spaceBelow;
    setRect({ top: up ? r.top : r.bottom, left: r.left, width: r.width, up });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onScroll = (e: Event) => {
      if (menuRef.current && e.target instanceof Node && menuRef.current.contains(e.target)) return;
      place();
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, place]);

  const openMenu = () => {
    if (disabled) return;
    setQuery('');
    setActive(Math.max(0, options.findIndex(o => o.value === value)));
    place();
    setOpen(true);
  };

  const choose = (o: SelectOption) => {
    if (o.disabled) return;
    onChange(o.value);
    setOpen(false);
    btnRef.current?.focus();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(a => Math.min(filtered.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(a => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const o = filtered[active];
      if (o) choose(o);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  const pad = size === 'sm' ? 'px-3 py-1.5 text-xs rounded-lg' : 'px-3 py-2.5 text-sm rounded-xl';

  return (
    <div className={cx('relative', className)}>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKey}
        className={cx(
          'w-full flex items-center justify-between gap-2 bg-white border text-left transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none',
          pad,
          open ? 'border-pista-hover ring-2 ring-pista/25' : 'border-charcoal-border hover:border-pista',
        )}
      >
        <span className={cx('truncate', selected ? 'text-charcoal font-medium' : 'text-charcoal-subtle')}>{selected ? selected.label : placeholder}</span>
        <ChevronDown className={cx('w-4 h-4 text-pista-dark shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open &&
        rect &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            onKeyDown={onKey}
            style={{
              position: 'fixed',
              left: rect.left,
              width: Math.max(rect.width, 180),
              ...(rect.up ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.top + 6 }),
            }}
            className="z-[300] max-h-72 overflow-hidden flex flex-col rounded-xl bg-white border border-pista-light shadow-xl"
          >
            {showSearch && (
              <div className="p-2 border-b border-surface-muted">
                <input
                  autoFocus
                  value={query}
                  onChange={e => {
                    setQuery(e.target.value);
                    setActive(0);
                  }}
                  onKeyDown={onKey}
                  placeholder="Type to filter…"
                  className="w-full px-2.5 py-1.5 text-xs border border-charcoal-border rounded-lg focus:outline-none focus:border-pista-hover"
                />
              </div>
            )}
            <div className="overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-xs text-charcoal-subtle">No options</p>
              ) : (
                filtered.map((o, i) => {
                  const isSel = o.value === value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      role="option"
                      aria-selected={isSel}
                      disabled={o.disabled}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => choose(o)}
                      className={cx(
                        'w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors disabled:opacity-40',
                        isSel ? 'bg-pista-lighter text-pista-darker font-bold' : i === active ? 'bg-pista-50 text-charcoal' : 'text-charcoal',
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate">{o.label}</span>
                        {o.hint && <span className="block text-[11px] text-charcoal-subtle truncate font-normal">{o.hint}</span>}
                      </span>
                      {isSel && <Check className="w-4 h-4 shrink-0 text-pista-dark" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Chips / segments                                                    */
/* ------------------------------------------------------------------ */

export function SegmentChips<K extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ key: K; label: string; count?: number }>;
  value: K;
  onChange: (k: K) => void;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {options.map(o => {
        const isActive = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className={cx(
              'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border',
              isActive ? 'bg-pista text-charcoal border-pista shadow-xs' : 'bg-white text-charcoal-muted border-charcoal-border hover:border-pista hover:text-charcoal',
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span className={cx('px-1.5 py-0.5 rounded-full text-[10px]', isActive ? 'bg-white/60 text-charcoal' : 'bg-surface-muted text-charcoal-subtle')}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal + confirm / prompt                                            */
/* ------------------------------------------------------------------ */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open || typeof document === 'undefined') return null;
  const w = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];
  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-[2px]" onClick={onClose} />
      <div role="dialog" aria-modal="true" className={cx('relative w-full bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col', w)}>
        {(title || description) && (
          <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-surface-muted">
            <div className="min-w-0">
              {title && <h3 className="text-base font-bold text-charcoal">{title}</h3>}
              {description && <p className="text-xs text-charcoal-subtle mt-0.5">{description}</p>}
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-charcoal-subtle hover:bg-surface-muted hover:text-charcoal" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="px-5 py-4 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-surface-muted flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

type DialogState =
  | null
  | {
      kind: 'confirm' | 'prompt';
      title: string;
      message?: React.ReactNode;
      confirmLabel?: string;
      danger?: boolean;
      inputLabel?: string;
      placeholder?: string;
      required?: boolean;
      multiline?: boolean;
      initial?: string;
      resolve: (v: any) => void;
    };

/** `const { confirm, prompt, dialog } = useDialog();` render `{dialog}` once. */
export function useDialog() {
  const [state, setState] = useState<DialogState>(null);
  const [text, setText] = useState('');

  const confirm = useCallback(
    (o: { title: string; message?: React.ReactNode; confirmLabel?: string; danger?: boolean }) =>
      new Promise<boolean>(resolve => setState({ kind: 'confirm', ...o, resolve })),
    [],
  );
  const prompt = useCallback(
    (o: { title: string; message?: React.ReactNode; confirmLabel?: string; danger?: boolean; inputLabel?: string; placeholder?: string; required?: boolean; multiline?: boolean; initial?: string }) =>
      new Promise<string | null>(resolve => {
        setText(o.initial || '');
        setState({ kind: 'prompt', ...o, resolve });
      }),
    [],
  );

  const close = (v: any) => {
    state?.resolve(v);
    setState(null);
  };

  const canSubmit = state?.kind !== 'prompt' || !state.required || text.trim().length >= 3;

  const dialog = (
    <Modal
      open={Boolean(state)}
      onClose={() => close(state?.kind === 'prompt' ? null : false)}
      title={
        state ? (
          <span className="flex items-center gap-2">
            {state.danger && <AlertTriangle className="w-4 h-4 text-accent-rose" />}
            {state.title}
          </span>
        ) : undefined
      }
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={() => close(state?.kind === 'prompt' ? null : false)}>
            Cancel
          </Button>
          <Button variant={state?.danger ? 'danger' : 'primary'} disabled={!canSubmit} onClick={() => close(state?.kind === 'prompt' ? text.trim() : true)}>
            {state?.confirmLabel || 'Confirm'}
          </Button>
        </>
      }
    >
      {state?.message && <div className="text-sm text-charcoal-muted leading-relaxed">{state.message}</div>}
      {state?.kind === 'prompt' && (
        <Field label={state.inputLabel} className="mt-3" hint={state.required ? 'Required, at least 3 characters.' : undefined}>
          {state.multiline ? (
            <Textarea autoFocus rows={3} value={text} placeholder={state.placeholder} onChange={e => setText(e.target.value)} />
          ) : (
            <Input
              autoFocus
              value={text}
              placeholder={state.placeholder}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && canSubmit) close(text.trim());
              }}
            />
          )}
        </Field>
      )}
    </Modal>
  );

  return { confirm, prompt, dialog };
}

/* ------------------------------------------------------------------ */
/* Copy                                                                */
/* ------------------------------------------------------------------ */

export async function copyText(value: string, label = 'Copied'): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(label);
    return true;
  } catch {
    toast.error('Could not copy. Select the text and copy it manually.');
    return false;
  }
}

export function CopyButton({ value, label, className }: { value: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      title="Copy"
      onClick={async () => {
        if (await copyText(value, label ? `${label} copied` : 'Copied')) {
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        }
      }}
      className={cx('inline-flex items-center gap-1 p-1 rounded-md text-charcoal-subtle hover:text-pista-dark hover:bg-pista-lighter', className)}
    >
      {done ? <Check className="w-3.5 h-3.5 text-pista-dark" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export function KeyValue({ label, value, copy, mono }: { label: string; value?: React.ReactNode; copy?: string; mono?: boolean }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="text-xs text-charcoal-subtle w-32 shrink-0 pt-0.5">{label}</span>
      <span className={cx('text-sm font-semibold text-charcoal min-w-0 break-words flex-1', mono && 'font-mono')}>{value}</span>
      {copy && <CopyButton value={copy} label={label} />}
    </div>
  );
}

export function Pager({ page, pages, total, onPage, noun = 'items' }: { page: number; pages: number; total: number; onPage: (p: number) => void; noun?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-surface-muted text-xs text-charcoal-subtle">
      <span>
        Page {page} of {Math.max(1, pages)} · {total} {noun}
      </span>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
