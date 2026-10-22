'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, User, RefreshCw } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
}

export function AiSupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hello! I am your Soft4u Concierge. Ask me about our subscription plans, 2-minute instant delivery, 100% warranty, or order assistance!'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || isLoading) return;

    const msgId = `usr_${messages.length + 1}`;
    const userMsg: ChatMessage = {
      id: msgId,
      sender: 'user',
      text: textToSend
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai-support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend })
      });
      const data = await res.json();
      const aiId = `ai_${messages.length + 2}`;
      const aiMsg: ChatMessage = {
        id: aiId,
        sender: 'ai',
        text: data.reply || 'Thank you for asking! You can also check our full FAQ page at /faq or track your active orders at /track-order.'
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      const errId = `ai_err_${messages.length + 2}`;
      setMessages(prev => [
        ...prev,
        {
          id: errId,
          sender: 'ai',
          text: 'Our AI concierge is momentarily busy. Please browse our product catalog at /shop or reach out via /contact.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'How does instant delivery work?',
    'What is your refund guarantee?',
    'Do you have ChatGPT Plus in stock?',
    'How do I track my order?'
  ];

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 bg-pista-dark text-white hover:bg-pista-darker shadow-lg rounded-full border border-pista/40 transition-all hover:scale-105 active:scale-95 group"
          aria-label="Open AI Concierge"
        >
          <div className="w-6 h-6 rounded-full bg-pista-light text-pista-darker flex items-center justify-center font-bold text-xs">
            <Bot className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold tracking-wide">Soft4u AI Support</span>
          <span className="w-2 h-2 rounded-full bg-pista-light animate-pulse"></span>
        </button>
      )}

      {isOpen && (
        <div className="w-[90vw] sm:w-[380px] h-[520px] bg-white border border-charcoal-border rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-4 py-3.5 bg-pista-50 text-charcoal flex items-center justify-between border-b border-charcoal-border">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-pista text-charcoal flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-charcoal leading-none">Soft4u Concierge</h3>
                <p className="text-[11px] text-pista-dark mt-0.5">Automated Product & Order Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-charcoal-subtle hover:text-charcoal p-1 rounded-md transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-surface-bg/60">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2 text-xs leading-relaxed ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-6 h-6 rounded-md bg-pista-light text-pista-darker flex-shrink-0 flex items-center justify-center mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-lg max-w-[82%] ${
                    msg.sender === 'user'
                      ? 'bg-pista text-charcoal font-medium'
                      : 'bg-white text-charcoal border border-charcoal-border shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
                {msg.sender === 'user' && (
                  <div className="w-6 h-6 rounded-md bg-pista text-charcoal flex-shrink-0 flex items-center justify-center mt-0.5 font-bold text-[10px]">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 text-xs items-center text-charcoal-subtle italic pl-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-pista-dark" />
                Checking product catalog and policies...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Quick Prompts */}
          <div className="p-2 border-t border-charcoal-border bg-white flex gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map(prompt => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="text-[11px] px-2.5 py-1 rounded bg-surface-muted text-charcoal-muted hover:text-charcoal hover:bg-surface-subtle whitespace-nowrap transition-colors border border-charcoal-border"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input form */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 border-t border-charcoal-border bg-white flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything about plans, delivery, warranty..."
              className="flex-1 text-xs px-3 py-2 border border-charcoal-border rounded-md focus:outline-none focus:border-pista-hover bg-surface-bg"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-3 py-2 bg-pista-dark text-white rounded-md hover:bg-pista-darker disabled:opacity-40 transition-colors flex items-center justify-center"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
