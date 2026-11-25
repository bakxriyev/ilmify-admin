'use client';

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, Sparkles, Trash2, X } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface Turn {
  role: 'user' | 'assistant';
  content: string;
  error?: boolean;
}

const STORE_KEY = 'ilmify.assistant.chat';
const SUGGESTIONS = [
  'Bugun kassaga qancha pul tushdi?',
  'Bu oy eng katta qarzdorlar kimlar?',
  'Bugun qaysi guruhlarda davomat qilinmagan?',
  'Ketish xavfi bor studentlar',
];

/** Floating AI assistant for admins. Answers come from the backend, scoped to the admin's center. */
export default function AssistantPanel() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Per-tab convenience only: the conversation survives page changes in this tab.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORE_KEY);
      if (raw) setTurns(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(turns.slice(-30))); } catch {}
  }, [turns]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns, busy]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const send = useCallback(async (text: string) => {
    const question = text.trim();
    if (!question || busy) return;
    const history = turns.filter((t) => !t.error).map(({ role, content }) => ({ role, content }));
    setTurns((prev) => [...prev, { role: 'user', content: question }]);
    setDraft('');
    setBusy(true);
    try {
      const { data } = await api.post('/ai/chat', { message: question, history }, { timeout: 90_000 });
      setTurns((prev) => [...prev, { role: 'assistant', content: data?.message || 'Javob kelmadi.' }]);
    } catch (err: any) {
      const msg = err?.response?.data?.message || (err?.code === 'ECONNABORTED'
        ? "Javob juda uzoq kutildi. Savolni qisqaroq qilib qayta yuboring."
        : "Yordamchi bilan bog'lanib bo'lmadi. Keyinroq urinib ko'ring.");
      setTurns((prev) => [...prev, { role: 'assistant', content: String(msg), error: true }]);
    } finally {
      setBusy(false);
    }
  }, [busy, turns]);

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            type="button"
            onClick={() => setOpen(true)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            aria-label="AI yordamchini ochish"
            className="lg-chrome fixed right-4 z-40 flex h-12 items-center gap-2 rounded-full pl-3.5 pr-4 text-[14px] font-semibold text-[var(--foreground)] bottom-[calc(86px+env(safe-area-inset-bottom))] md:bottom-6 md:right-6"
          >
            <span className="grid size-7 place-items-center rounded-full bg-[linear-gradient(140deg,#7c5cff,#0a6cff)] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3)]">
              <Sparkles className="size-4" strokeWidth={2} />
            </span>
            <span className="hidden sm:inline">AI yordamchi</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.section
            key="panel"
            role="dialog"
            aria-label="AI yordamchi"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className={cn(
              'lg-panel fixed z-50 flex flex-col overflow-hidden',
              'inset-x-2 top-2 bottom-2 rounded-[26px]',
              'sm:inset-auto sm:right-6 sm:bottom-6 sm:h-[min(640px,calc(100dvh-48px))] sm:w-[420px]',
            )}
          >
            <header className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
              <span className="grid size-9 place-items-center rounded-[12px] bg-[linear-gradient(140deg,#7c5cff,#0a6cff)] text-white">
                <Sparkles className="size-[18px]" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold leading-tight">AI yordamchi</p>
                <p className="text-[12px] leading-tight text-[var(--muted-foreground)]">Markazingiz ma&apos;lumotlari bo&apos;yicha javob beradi</p>
              </div>
              {turns.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTurns([])}
                  aria-label="Suhbatni tozalash"
                  title="Suhbatni tozalash"
                  className="grid size-8 place-items-center rounded-full text-[var(--muted-foreground)] hover:bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)]"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Yopish"
                className="grid size-8 place-items-center rounded-full text-[var(--muted-foreground)] hover:bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)]"
              >
                <X className="size-[18px]" />
              </button>
            </header>

            <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">
              {turns.length === 0 ? (
                <div className="flex h-full flex-col justify-end gap-3 pb-1">
                  <div>
                    <p className="text-[17px] font-semibold tracking-[-0.01em]">Nima bilmoqchisiz?</p>
                    <p className="mt-1 text-[13px] text-[var(--muted-foreground)]">
                      Kassa, qarzdorlar, davomat, studentlar, leadlar va o&apos;qituvchilar haqida so&apos;rang. Javoblar faqat sizning markazingiz ma&apos;lumotidan olinadi.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => send(s)}
                        className="lg-control rounded-full px-3 py-1.5 text-left text-[13px] font-medium"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                turns.map((t, i) => (
                  <div key={i} className={cn('flex', t.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'max-w-[88%] rounded-[18px] px-3.5 py-2.5 text-[14px] leading-relaxed',
                        t.role === 'user'
                          ? 'rounded-br-[6px] bg-[var(--accent)] text-white'
                          : t.error
                            ? 'rounded-bl-[6px] bg-[color-mix(in_oklab,var(--bad)_12%,transparent)] text-[var(--bad)]'
                            : 'rounded-bl-[6px] bg-[color-mix(in_oklab,var(--card)_85%,transparent)] ring-1 ring-[var(--border)]',
                      )}
                    >
                      {t.role === 'user' ? <p className="whitespace-pre-wrap">{t.content}</p> : <RichText text={t.content} />}
                    </div>
                  </div>
                ))
              )}
              {busy && (
                <div className="flex justify-start" aria-live="polite" aria-label="Javob tayyorlanmoqda">
                  <div className="flex items-center gap-1 rounded-[18px] rounded-bl-[6px] px-3.5 py-3 ring-1 ring-[var(--border)]">
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        className="size-1.5 rounded-full bg-[var(--muted-foreground)]"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: d * 0.18 }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <form
              className="border-t border-[var(--border)] p-3"
              onSubmit={(e) => { e.preventDefault(); send(draft); }}
            >
              <div className="flex items-end gap-2 rounded-[18px] border border-[var(--border-strong)] bg-[color-mix(in_oklab,var(--card)_88%,transparent)] p-1.5 pl-3.5 focus-within:border-[var(--accent)] focus-within:ring-4 focus-within:ring-[var(--accent-soft)]">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={draft}
                  maxLength={2000}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(draft); }
                  }}
                  placeholder="Savolingizni yozing"
                  aria-label="Savol"
                  className="max-h-32 min-h-[36px] flex-1 resize-none bg-transparent py-2 text-[14px] outline-none placeholder:text-[var(--faint)] [field-sizing:content]"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || busy}
                  aria-label="Yuborish"
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-white transition-opacity disabled:opacity-35"
                >
                  <ArrowUp className="size-[18px]" strokeWidth={2.4} />
                </button>
              </div>
              <p className="mt-1.5 px-1 text-[11px] text-[var(--faint)]">
                AI faqat ma&apos;lumotni o&apos;qiydi, hech narsani o&apos;zgartirmaydi. Muhim raqamlarni sahifada tekshiring.
              </p>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Minimal, safe markdown: paragraphs, bullets, numbered lists, **bold**,     */
/* `code`, and pipe tables. Builds React nodes; never injects HTML.           */
/* -------------------------------------------------------------------------- */

function inline(text: string, keyBase: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|_[^_]+_)/g).filter(Boolean);
  return parts.map((p, i) => {
    const k = `${keyBase}-${i}`;
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={k} className="font-semibold">{p.slice(2, -2)}</strong>;
    if (p.startsWith('`') && p.endsWith('`')) return <code key={k} className="rounded bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)] px-1 text-[12.5px]">{p.slice(1, -1)}</code>;
    if (p.startsWith('_') && p.endsWith('_') && p.length > 2) return <em key={k} className="text-[var(--muted-foreground)]">{p.slice(1, -1)}</em>;
    return <Fragment key={k}>{p}</Fragment>;
  });
}

function RichText({ text }: { text: string }) {
  const lines = text.replace(/\r/g, '').split('\n');
  const out: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*\|.*\|\s*$/.test(line)) {
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        const cells = lines[i].trim().slice(1, -1).split('|').map((c) => c.trim());
        if (!cells.every((c) => /^:?-{2,}:?$/.test(c))) rows.push(cells);
        i++;
      }
      const [head, ...body] = rows;
      out.push(
        <div key={`t${i}`} className="my-2 overflow-x-auto rounded-[12px] ring-1 ring-[var(--border)]">
          <table className="w-full text-[12.5px]">
            {head && (
              <thead className="bg-[color-mix(in_oklab,var(--foreground)_4%,transparent)]">
                <tr>{head.map((c, j) => <th key={j} className="px-2.5 py-1.5 text-left font-semibold">{inline(c, `h${i}${j}`)}</th>)}</tr>
              </thead>
            )}
            <tbody>
              {body.map((r, ri) => (
                <tr key={ri} className="border-t border-[var(--border)]">
                  {r.map((c, j) => <td key={j} className="tabular px-2.5 py-1.5 align-top">{inline(c, `c${i}${ri}${j}`)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (/^\s*([-*•]|\d+[.)])\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]/.test(line);
      const items: string[] = [];
      while (i < lines.length && /^\s*([-*•]|\d+[.)])\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*([-*•]|\d+[.)])\s+/, ''));
        i++;
      }
      const ListTag = ordered ? 'ol' : 'ul';
      out.push(
        <ListTag key={`l${i}`} className={cn('my-1.5 space-y-1 pl-5', ordered ? 'list-decimal' : 'list-disc')}>
          {items.map((it, j) => <li key={j}>{inline(it, `li${i}${j}`)}</li>)}
        </ListTag>,
      );
      continue;
    }
    if (!line.trim()) { i++; continue; }
    const heading = /^#{1,4}\s+/.test(line);
    out.push(
      <p key={`p${i}`} className={cn('my-1', heading && 'mt-2 font-semibold')}>
        {inline(line.replace(/^#{1,4}\s+/, ''), `p${i}`)}
      </p>,
    );
    i++;
  }
  return <div className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{out}</div>;
}
