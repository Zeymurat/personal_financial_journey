import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, AlertTriangle, Loader2 } from 'lucide-react';
import { useTokenValidation } from '../../hooks/useTokenValidation';
import { aiAPI } from '../../services/apiService';
import PageHeader from '../common/PageHeader';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  role: ChatRole;
  content: string;
}

const Assistant: React.FC = () => {
  const { t } = useTranslation('assistant');
  useTokenValidation();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const nextHistory = [...messages, { role: 'user' as const, content: text }];
    setMessages(nextHistory);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await aiAPI.chat(
        text,
        messages.map((m) => ({ role: m.role, content: m.content }))
      );
      if (!res?.success || !res?.data?.reply) {
        throw new Error(res?.error || res?.message || t('errors.generic'));
      }
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.data.reply },
      ]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('errors.generic');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 min-h-screen space-y-6">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <div className="flex items-start gap-2 rounded-xl border border-amber-200/80 dark:border-amber-800/50 bg-amber-50/80 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-gold-deep" />
        <span>{t('disclaimer')}</span>
      </div>

      <div className="flex flex-col min-h-[480px] rounded-2xl border border-brand-ink/10 dark:border-white/10 bg-brand-surface dark:bg-brand-surface-dark shadow-warm overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-3 p-6 min-h-[360px]">
          {messages.length === 0 && !loading && (
            <p className="text-slate-500 dark:text-slate-400 text-sm">{t('emptyHint')}</p>
          )}
          {messages.map((m, i) => (
            <div
              key={`${m.role}-${i}`}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-brand-ink text-brand-champagne ring-1 ring-gold/25'
                    : 'bg-muted text-foreground'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('thinking')}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-brand-ink/10 dark:border-white/10 p-4 bg-muted/30 space-y-2">
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder={t('placeholder')}
              className="flex-1 rounded-xl border border-border bg-brand-surface dark:bg-brand-surface-dark px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-gold/40"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={loading || !input.trim()}
              className="rounded-xl bg-brand-gradient hover:shadow-gold ring-1 ring-gold/30 disabled:opacity-50 text-brand-champagne px-5 py-3 flex items-center gap-2 font-semibold transition-all"
            >
              <Send className="w-4 h-4" />
              {t('send')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assistant;
