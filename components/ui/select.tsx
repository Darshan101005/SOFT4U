'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

/**
 * Pistachio-styled dropdown (listbox). Used everywhere instead of the native
 * <select>, so no OS-blue menus appear in the storefront. Keyboard: arrows,
 * Home/End, Enter/Space to pick, Escape to close, letters to jump.
 */
export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  hint?: string;
  disabled?: boolean;
}

export function Select<T extends string = string>({
  value,
  onChange,
  options,
  id,
  ariaLabel,
  ariaLabelledBy,
  placeholder = 'Select',
  className = '',
  buttonClassName = '',
  align = 'left',
  icon,
  disabled,
}: {
  value: T | '';
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  id?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  align?: 'left' | 'right';
  icon?: React.ReactNode;
  disabled?: boolean;
}) {
  const autoId = useId();
  const buttonId = id || `sel-${autoId}`;
  const listId = `${buttonId}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedIndex = options.findIndex(o => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [open]);

  useEffect(() => {
    if (open && active >= 0) {
      const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, active]);

  const openList = () => {
    if (disabled) return;
    setActive(selectedIndex >= 0 ? selectedIndex : options.findIndex(o => !o.disabled));
    setOpen(true);
  };

  const pick = (i: number) => {
    const opt = options[i];
    if (!opt || opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const move = (from: number, step: 1 | -1) => {
    let i = from;
    for (let n = 0; n < options.length; n++) {
      i = (i + step + options.length) % options.length;
      if (!options[i].disabled) return i;
    }
    return from;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive(a => move(a < 0 ? -1 : a, 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive(a => move(a < 0 ? 0 : a, -1));
        break;
      case 'Home':
        e.preventDefault();
        setActive(move(-1, 1));
        break;
      case 'End':
        e.preventDefault();
        setActive(move(0, -1));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        pick(active);
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        if (e.key.length === 1) {
          const ch = e.key.toLowerCase();
          const start = active < 0 ? 0 : active + 1;
          for (let n = 0; n < options.length; n++) {
            const i = (start + n) % options.length;
            if (!options[i].disabled && options[i].label.toLowerCase().startsWith(ch)) {
              setActive(i);
              break;
            }
          }
        }
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy ? `${ariaLabelledBy} ${buttonId}` : undefined}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={`w-full min-h-11 inline-flex items-center justify-between gap-2 px-3.5 rounded-xl border bg-white text-sm font-semibold text-charcoal transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pista-500 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
          open ? 'border-pista-500 bg-pista-50' : 'border-charcoal-border hover:border-pista'
        } ${buttonClassName}`}
      >
        <span className="flex items-center gap-2 min-w-0">
          {icon}
          <span className={`truncate ${selected ? '' : 'text-charcoal-subtle font-medium'}`}>{selected ? selected.label : placeholder}</span>
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-pista-dark transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={buttonId}
          className={`absolute z-50 mt-1.5 min-w-full w-max max-w-[calc(100vw-2rem)] max-h-72 overflow-auto rounded-xl border border-pista-200 bg-white p-1.5 shadow-[0_16px_40px_rgba(47,74,31,0.16)] animate-fade ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            const isActive = i === active;
            return (
              <li
                key={opt.value}
                id={`${listId}-${i}`}
                data-index={i}
                role="option"
                aria-selected={isSelected}
                aria-disabled={opt.disabled || undefined}
                onMouseEnter={() => !opt.disabled && setActive(i)}
                onMouseDown={e => e.preventDefault()}
                onClick={() => pick(i)}
                className={`flex items-center justify-between gap-3 min-h-11 px-3 rounded-lg text-sm cursor-pointer select-none ${
                  opt.disabled
                    ? 'text-charcoal-subtle/60 cursor-not-allowed'
                    : isActive
                      ? 'bg-pista-100 text-charcoal'
                      : 'text-charcoal-muted'
                } ${isSelected ? 'font-bold text-pista-darker' : 'font-medium'}`}
              >
                <span className="flex flex-col">
                  <span>{opt.label}</span>
                  {opt.hint && <span className="text-[11px] font-normal text-charcoal-subtle">{opt.hint}</span>}
                </span>
                {isSelected && <Check className="w-4 h-4 text-pista-dark shrink-0" aria-hidden="true" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default Select;
