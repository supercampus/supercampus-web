'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowUp, CheckCircle2, Clock3, Database, FileSearch, History, ListChecks, LoaderCircle, MessageSquareText, Plus, ShieldCheck, Sparkles, WandSparkles } from 'lucide-react';
import {
  askCrmAssistant,
  executeCrmAssistantAction,
  getCrmAssistantHistory,
  saveCrmAssistantHistory,
  type CrmAssistantActionProposal,
  type CrmAssistantHistoryEntry,
  type CrmAssistantIntent,
} from '@/lib/crm-api';

const TASKS: Array<{ id: CrmAssistantIntent; label: string; description: string; icon: typeof Sparkles }> = [
  { id: 'general', label: 'Ask anything', description: 'Get practical admissions CRM help', icon: Sparkles },
  { id: 'summarize', label: 'Summarize', description: 'Turn notes into a clear brief', icon: MessageSquareText },
  { id: 'extract', label: 'Extract details', description: 'Identify lead information', icon: FileSearch },
  { id: 'follow_up', label: 'Draft follow-up', description: 'Write a counselor message', icon: WandSparkles },
  { id: 'next_actions', label: 'Next actions', description: 'Create a prioritized task list', icon: ListChecks },
];

const EXAMPLES: Record<CrmAssistantIntent, string> = {
  general: 'Ask a question or paste admissions notes here…',
  summarize: 'Paste a call transcript, enquiry message, or counselor notes…',
  extract: 'Paste an enquiry and I will identify the student, contact, course, source, and missing information…',
  follow_up: 'Paste the enquiry and any counselor notes to draft a suitable follow-up…',
  next_actions: 'Paste the current lead situation and I will suggest the next counselor actions…',
};

function validIntent(value: string): value is CrmAssistantIntent {
  return TASKS.some((task) => task.id === value);
}

function shortPrompt(value: string) {
  const compact = value.replace(/\s+/g, ' ').trim();
  return compact.length > 54 ? `${compact.slice(0, 54)}…` : compact;
}

function historyTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
}

export function CrmAiAssistant({ userId }: { userId: string }) {
  const draftKey = useMemo(() => `supercampus:crm-ai-draft:${userId}`, [userId]);
  const historyKey = useMemo(() => `supercampus:crm-ai-history:${userId}`, [userId]);
  const [intent, setIntent] = useState<CrmAssistantIntent>('general');
  const [input, setInput] = useState('');
  const [answer, setAnswer] = useState('');
  const [model, setModel] = useState('');
  const [grounded, setGrounded] = useState(false);
  const [action, setAction] = useState<CrmAssistantActionProposal | null>(null);
  const [actionStatus, setActionStatus] = useState<'idle' | 'working' | 'done'>('idle');
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [history, setHistory] = useState<CrmAssistantHistoryEntry[]>([]);
  const [historyReady, setHistoryReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const characterCount = useMemo(() => Array.from(input).length, [input]);

  useEffect(() => {
    let cancelled = false;
    const localDraft = window.localStorage.getItem(draftKey) ?? '';
    let localHistory: CrmAssistantHistoryEntry[] = [];
    try {
      const parsed = JSON.parse(window.localStorage.getItem(historyKey) ?? '[]');
      if (Array.isArray(parsed)) localHistory = parsed.slice(-100);
    } catch {
      window.localStorage.removeItem(historyKey);
    }
    if (localDraft) setInput(localDraft);
    if (localHistory.length) setHistory(localHistory);
    void getCrmAssistantHistory()
      .then(({ data }) => {
        if (cancelled) return;
        const serverHistory = Array.isArray(data.messages) ? data.messages : [];
        const serverIds = new Set(serverHistory.map((entry) => entry.id));
        setHistory([...serverHistory, ...localHistory.filter((entry) => !serverIds.has(entry.id))].slice(-100));
        if (!localDraft && data.draft) setInput(data.draft);
        if (validIntent(data.intent)) setIntent(data.intent);
      })
      .catch(() => {
        // Local draft recovery still works during a temporary API outage.
      })
      .finally(() => {
        if (!cancelled) setHistoryReady(true);
      });
    return () => { cancelled = true; };
  }, [draftKey, historyKey]);

  useEffect(() => {
    window.localStorage.setItem(draftKey, input);
    window.localStorage.setItem(historyKey, JSON.stringify(history));
    if (!historyReady) return;
    const timer = window.setTimeout(() => {
      void saveCrmAssistantHistory({ draft: input, intent, messages: history }).catch(() => undefined);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [draftKey, history, historyKey, historyReady, input, intent]);

  const showEntry = (entry: CrmAssistantHistoryEntry) => {
    setActiveEntryId(entry.id);
    setInput(entry.input);
    setIntent(entry.intent);
    setAnswer(entry.answer);
    setModel(entry.model);
    setGrounded(entry.grounded);
    setAction(entry.action);
    setActionStatus(entry.actionStatus === 'done' ? 'done' : 'idle');
    setError(null);
  };

  const startNew = () => {
    setInput('');
    setAnswer('');
    setError(null);
    setModel('');
    setGrounded(false);
    setAction(null);
    setActionStatus('idle');
    setActiveEntryId(null);
    window.localStorage.removeItem(draftKey);
  };

  const submit = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setLoading(true);
    setError(null);
    setAnswer('');
    setAction(null);
    setActionStatus('idle');
    try {
      const response = await askCrmAssistant(text, intent);
      const entry: CrmAssistantHistoryEntry = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        input: text,
        intent,
        answer: response.data.content,
        model: response.data.model,
        grounded: response.data.grounded,
        action: response.data.action,
        actionStatus: 'idle',
      };
      const nextHistory = [...history, entry].slice(-100);
      setHistory(nextHistory);
      setActiveEntryId(entry.id);
      setAnswer(entry.answer);
      setModel(entry.model);
      setGrounded(entry.grounded);
      setAction(entry.action);
      try {
        await saveCrmAssistantHistory({ draft: input, intent, messages: nextHistory });
      } catch {
        setError('The answer is ready and saved on this device, but cloud history sync will retry automatically.');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The AI assistant could not complete this request.');
    } finally {
      setLoading(false);
    }
  };

  const confirmAction = async () => {
    if (!action || actionStatus === 'working') return;
    setActionStatus('working');
    setError(null);
    try {
      await executeCrmAssistantAction(action);
      setActionStatus('done');
      if (activeEntryId) {
        setHistory((entries) => entries.map((entry) => entry.id === activeEntryId ? { ...entry, actionStatus: 'done' } : entry));
      }
    } catch (cause) {
      setActionStatus('idle');
      setError(cause instanceof Error ? cause.message : 'The requested portal action could not be completed.');
    }
  };

  return (
    <section className="flex-1 overflow-y-auto bg-[var(--crm-bg)] p-5 sm:p-7">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-start gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--tenant-primary)] text-white shadow-sm"><Sparkles size={20} /></div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[var(--tenant-primary)]">Admissions workspace</p>
            <h1 className="mt-1 text-2xl font-extrabold text-[var(--crm-text)]">AI Assistant</h1>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--crm-muted)]">Drafts save automatically. Every completed chat is stored privately for your account and can be reopened here.</p>
          </div>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-[270px_minmax(0,1fr)]">
          <aside className="self-start rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-3 shadow-sm lg:sticky lg:top-0">
            <button type="button" onClick={startNew} className="mb-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[var(--tenant-primary)] px-4 text-xs font-extrabold text-white"><Plus size={15} /> New chat</button>
            <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--crm-muted)]">Choose a task</p>
            <div className="space-y-1.5">
              {TASKS.map(({ id, label, description, icon: Icon }) => {
                const active = intent === id;
                return <button key={id} type="button" onClick={() => { setIntent(id); setError(null); }} className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition ${active ? 'bg-[var(--tenant-surface)] text-[var(--tenant-primary)] ring-1 ring-[var(--tenant-primary)]/20' : 'text-[var(--crm-text)] hover:bg-[var(--crm-panel)]'}`}>
                  <Icon size={17} className="mt-0.5 shrink-0" />
                  <span><strong className="block text-xs">{label}</strong><small className={`mt-1 block text-[10px] leading-4 ${active ? 'text-[var(--tenant-primary)]/80' : 'text-[var(--crm-muted)]'}`}>{description}</small></span>
                </button>;
              })}
            </div>
            <div className="mt-4 border-t border-[var(--crm-border)] pt-4">
              <p className="flex items-center gap-2 px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--crm-muted)]"><History size={13} /> Saved chats</p>
              {!historyReady ? <div className="flex items-center gap-2 px-2 py-3 text-[10px] text-[var(--crm-muted)]"><LoaderCircle size={13} className="animate-spin" /> Loading…</div> : history.length === 0 ? <p className="px-2 py-3 text-[10px] leading-4 text-[var(--crm-muted)]">Your completed chats will appear here.</p> : <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                {[...history].reverse().slice(0, 20).map((entry) => <button key={entry.id} type="button" onClick={() => showEntry(entry)} className={`w-full rounded-xl px-3 py-2.5 text-left transition ${activeEntryId === entry.id ? 'bg-[var(--tenant-surface)] ring-1 ring-[var(--tenant-primary)]/20' : 'hover:bg-[var(--crm-panel)]'}`}><span className="block truncate text-[11px] font-bold text-[var(--crm-text)]">{shortPrompt(entry.input)}</span><span className="mt-1 flex items-center gap-1 text-[9px] text-[var(--crm-muted)]"><Clock3 size={10} /> {historyTime(entry.createdAt)}</span></button>)}
              </div>}
            </div>
          </aside>

          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-4 shadow-sm sm:p-5">
              <label htmlFor="crm-ai-input" className="text-xs font-extrabold text-[var(--crm-text)]">What should the assistant work on?</label>
              <textarea id="crm-ai-input" value={input} maxLength={12000} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') void submit(); }} placeholder={EXAMPLES[intent]} className="mt-3 min-h-56 w-full resize-y rounded-xl border border-[var(--crm-border)] bg-[var(--crm-bg)] p-4 text-sm leading-6 text-[var(--crm-text)] outline-none transition placeholder:text-[var(--crm-muted)] focus:border-[var(--tenant-primary)] focus:ring-2 focus:ring-[var(--tenant-primary)]/10" />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className="text-[10px] text-[var(--crm-muted)]">{characterCount.toLocaleString()} / 12,000 · Draft autosaved · Ctrl/⌘ + Enter to send</span>
                <div className="flex items-center gap-2">
                  {(input || answer) && <button type="button" onClick={startNew} className="h-10 rounded-xl border border-[var(--crm-border)] px-4 text-xs font-bold text-[var(--crm-muted)] hover:bg-[var(--crm-panel)]">Clear</button>}
                  <button type="button" disabled={!input.trim() || loading} onClick={() => void submit()} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--tenant-primary)] px-5 text-xs font-extrabold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-40">
                    {loading ? <LoaderCircle size={15} className="animate-spin" /> : <ArrowUp size={15} />}{loading ? 'Working…' : 'Generate'}
                  </button>
                </div>
              </div>
            </div>

            {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold leading-5 text-red-700">{error}</div>}
            {(answer || loading) && <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--crm-border)] pb-3"><div className="flex items-center gap-2 text-xs font-extrabold"><Sparkles size={15} className="text-[var(--tenant-primary)]" /> Assistant result {grounded && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700"><Database size={11} /> Live CRM data</span>}</div>{model && <span className="text-[9px] text-[var(--crm-muted)]">{model}</span>}</div>
              {loading ? <div className="flex min-h-32 items-center justify-center gap-2 text-xs text-[var(--crm-muted)]"><LoaderCircle size={16} className="animate-spin" /> Preparing the response…</div> : <div className="whitespace-pre-wrap py-4 text-sm leading-7 text-[var(--crm-text)]">{answer}</div>}
              {action && !loading && <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-amber-700" /><div className="min-w-0 flex-1"><p className="text-xs font-extrabold text-amber-950">Confirmation required</p><p className="mt-1 text-xs leading-5 text-amber-800">{action.description}. The assistant has not changed the portal yet.</p></div></div>
                <div className="mt-3 flex justify-end">{actionStatus === 'done' ? <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-2 text-xs font-extrabold text-emerald-700"><CheckCircle2 size={15} /> Completed</span> : <button type="button" disabled={actionStatus === 'working'} onClick={() => void confirmAction()} className="inline-flex items-center gap-2 rounded-xl bg-amber-700 px-4 py-2 text-xs font-extrabold text-white disabled:opacity-50">{actionStatus === 'working' && <LoaderCircle size={14} className="animate-spin" />}{actionStatus === 'working' ? 'Completing…' : 'Confirm action'}</button>}</div>
              </div>}
            </div>}
          </div>
        </div>
      </div>
    </section>
  );
}
