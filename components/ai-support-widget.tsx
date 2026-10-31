'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bot, X, Send, RefreshCw, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/context/auth-context';

const ASSISTANT_NAME = 'SOFT4U ASSISTANT';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
}

/** Paths where the launcher stays hidden (admin has its own UI; cart/checkout keep their CTAs clear). */
function hiddenOn(path: string): boolean {
  return path.startsWith('/admin') || path.startsWith('/checkout') || path.startsWith('/cart');
}

/** Renders **bold**, "- " bullets and links (full URLs and site paths) in assistant replies. */
function RichText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => {
        const bullet = /^\s*[-*•]\s+/.test(line);
        const content = bullet ? line.replace(/^\s*[-*•]\s+/, '') : line;
        return (
          <span key={i} className={bullet ? 'flex gap-1.5' : 'block'}>
            {bullet && <span aria-hidden="true">•</span>}
            <span className={line.trim() ? '' : 'block h-2'}>{inline(content)}</span>
          </span>
        );
      })}
    </>
  );
}

function SafeLink({ href, label }: { href: string; label: string }) {
  const external = /^https?:/.test(href) && typeof window !== 'undefined' && !href.startsWith(window.location.origin);
  return (
    <a
      href={href}
      className="text-pista-dark underline underline-offset-2 break-all hover:text-pista-darker"
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {label}
    </a>
  );
}

const SITE_PATHS = 'shop|products|categories|track-order|account|contact|faq|login|register|terms|privacy|refund-policy|delivery-policy|cookie-policy';

function inline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  // Tokens: [label](url), **bold**, bare URLs, bare site paths. Only http(s) and site paths become links.
  // No lookbehind: older iOS Safari cannot parse it. The prefix group keeps "a/shop" from matching.
  const re = new RegExp(
    `(^|[\\s(])?(\\[[^\\]]+\\]\\((?:https?:\\/\\/[^\\s)]+|\\/[^\\s)]*)\\)|\\*\\*[^*]+\\*\\*|https?:\\/\\/[^\\s)]+|\\/(?:${SITE_PATHS})[^\\s),]*)`,
    'g',
  );
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    const prefix = m[1] || '';
    const token = m[2];
    const start = m.index + prefix.length;
    if (token.startsWith('/') && !prefix && m.index > 0) continue;
    if (start > last) out.push(text.slice(last, start));
    if (token.startsWith('**')) {
      out.push(<strong key={k++}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('[')) {
      const split = token.indexOf('](');
      out.push(<SafeLink key={k++} href={token.slice(split + 2, -1)} label={token.slice(1, split)} />);
    } else {
      const href = token.replace(/[.,;:!?]+$/, '');
      const tail = token.slice(href.length);
      out.push(<SafeLink key={k++} href={href} label={href.replace(/^https?:\/\/(www\.)?/, '')} />);
      if (tail) out.push(tail);
    }
    last = start + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function AiSupportWidget() {
  const pathname = usePathname() || '/';
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const counter = useRef(0);

  const welcome: ChatMessage = {
    id: 'welcome',
    sender: 'ai',
    text: user
      ? `Hi ${user.name.split(' ')[0]}! I'm ${ASSISTANT_NAME}. Ask me about products and prices, how to pay, or the status of your orders.`
      : `Hi! I'm ${ASSISTANT_NAME}. Ask me about products, prices, payment and delivery. Sign in to ask about your orders.`,
  };

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isLoading]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false);
    window.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
    };
  }, [isOpen]);

  // The conversation belongs to one account; reset it when the user signs in or out.
  const [owner, setOwner] = useState<string | null>(user?.id ?? null);
  if (owner !== (user?.id ?? null)) {
    setOwner(user?.id ?? null);
    setMessages([]);
  }

  if (hiddenOn(pathname)) return null;

  const nextId = (p: string) => `${p}_${++counter.current}`;

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText ?? input).trim();
    if (!textToSend || isLoading) return;
    const history = messages.slice(-10).map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', text: m.text }));
    setMessages(prev => [...prev, { id: nextId('usr'), sender: 'user', text: textToSend }]);
    setInput('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai-support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend, history }),
      });
      const data = await res.json().catch(() => ({}));
      setMessages(prev => [
        ...prev,
        { id: nextId('ai'), sender: 'ai', text: data.reply || data.error || 'Sorry, I could not answer that. Please try again or visit /contact.' },
      ]);
    } catch {
      setMessages(prev => [...prev, { id: nextId('ai'), sender: 'ai', text: 'I could not reach the server. Check your connection and try again, or visit /contact.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = user
    ? ['Where is my latest order?', 'How do I pay for my order?', 'What products do you have?', 'Refund policy']
    : ['What products do you have?', 'How does payment work?', 'How fast is delivery?', 'Refund policy'];

  const shown = [welcome, ...messages];

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed z-40 right-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] sm:right-5 sm:bottom-5 flex items-center gap-2 h-12 w-12 sm:w-auto justify-center sm:px-4 bg-pista-dark text-white hover:bg-pista-darker shadow-lg rounded-full border border-pista/40 transition-transform hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-pista focus-visible:ring-offset-2"
          aria-label={`Open ${ASSISTANT_NAME} chat`}
        >
          <Bot className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline text-xs font-semibold tracking-wide">{ASSISTANT_NAME}</span>
        </button>
      )}

      {isOpen && (
        <div
          role="dialog"
          aria-label={`${ASSISTANT_NAME} chat`}
          className="fixed z-50 inset-0 sm:inset-auto sm:right-5 sm:bottom-5 sm:w-[380px] sm:h-[560px] sm:max-h-[calc(100vh-2.5rem)] bg-white sm:border sm:border-charcoal-border sm:rounded-xl shadow-2xl flex flex-col overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] sm:p-0"
        >
          <div className="px-4 py-3 bg-pista-50 text-charcoal flex items-center justify-between border-b border-charcoal-border">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-pista text-charcoal flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-charcoal leading-none tracking-wide">{ASSISTANT_NAME}</h3>
                <p className="text-[11px] text-pista-dark mt-1 truncate">{user ? 'Products, payments and your orders' : 'Products, prices, payment and delivery'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-charcoal-subtle hover:text-charcoal p-2 -mr-1 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pista"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 p-3.5 overflow-y-auto overscroll-contain space-y-3 bg-surface-bg/60" aria-live="polite">
            {shown.map(msg => (
              <div key={msg.id} className={`flex gap-2 text-sm leading-relaxed ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'ai' && (
                  <div className="w-6 h-6 rounded-md bg-pista-light text-pista-darker flex-shrink-0 flex items-center justify-center mt-0.5">
                    <Bot className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                )}
                <div
                  className={`px-3 py-2 rounded-lg max-w-[85%] break-words ${
                    msg.sender === 'user' ? 'bg-pista text-charcoal font-medium whitespace-pre-line' : 'bg-white text-charcoal border border-charcoal-border shadow-xs'
                  }`}
                >
                  {msg.sender === 'ai' ? <RichText text={msg.text} /> : msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 text-xs items-center text-charcoal-subtle pl-8">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-pista-dark" aria-hidden="true" />
                Looking that up...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 0 && (
            <div className="px-2 py-2 border-t border-charcoal-border bg-white flex gap-1.5 overflow-x-auto no-scrollbar">
              {quickPrompts.map(prompt => (
                <button
                  type="button"
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  disabled={isLoading}
                  className="text-xs px-3 py-1.5 rounded-full bg-surface-muted text-charcoal-muted hover:text-charcoal hover:bg-pista-50 whitespace-nowrap transition-colors border border-charcoal-border"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 border-t border-charcoal-border bg-white flex gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about products, payment, orders..."
              maxLength={1500}
              enterKeyHint="send"
              aria-label="Message"
              className="flex-1 min-w-0 text-[16px] leading-6 px-3 py-2 border border-charcoal-border rounded-md focus:outline-none focus:border-pista-hover focus:ring-2 focus:ring-pista/30 bg-surface-bg"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-3.5 bg-pista-dark text-white rounded-md hover:bg-pista-darker disabled:opacity-40 transition-colors flex items-center justify-center"
              aria-label="Send message"
              aria-busy={isLoading || undefined}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
