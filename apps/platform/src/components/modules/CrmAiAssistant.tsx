'use client';

import { useMemo, useState } from 'react';
import { ArrowUp, FileSearch, ListChecks, LoaderCircle, MessageSquareText, Sparkles, WandSparkles } from 'lucide-react';
import { askCrmAssistant, type CrmAssistantIntent } from '@/lib/crm-api';

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

export function CrmAiAssistant() {
  const [intent, setIntent] = useState<CrmAssistantIntent>('general');
  const [input, setInput] = useState('');
  const [answer, setAnswer] = useState('');
  const [model, setModel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const characterCount = useMemo(() => Array.from(input).length, [input]);

  const submit = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setLoading(true);
    setError(null);
    setAnswer('');
    try {
      const response = await askCrmAssistant(text, intent);
      setAnswer(response.data.content);
      setModel(response.data.model);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The AI assistant could not complete this request.');
    } finally {
      setLoading(false);
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
            <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--crm-muted)]">Paste enquiry text or counselor notes. The assistant only works with the information you provide and will mark anything that still needs verification.</p>
          </div>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-[270px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-3 shadow-sm">
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
          </aside>

          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-4 shadow-sm sm:p-5">
              <label htmlFor="crm-ai-input" className="text-xs font-extrabold text-[var(--crm-text)]">What should the assistant work on?</label>
              <textarea id="crm-ai-input" value={input} maxLength={12000} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') void submit(); }} placeholder={EXAMPLES[intent]} className="mt-3 min-h-56 w-full resize-y rounded-xl border border-[var(--crm-border)] bg-[var(--crm-bg)] p-4 text-sm leading-6 text-[var(--crm-text)] outline-none transition placeholder:text-[var(--crm-muted)] focus:border-[var(--tenant-primary)] focus:ring-2 focus:ring-[var(--tenant-primary)]/10" />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className="text-[10px] text-[var(--crm-muted)]">{characterCount.toLocaleString()} / 12,000 · Ctrl/⌘ + Enter to send</span>
                <div className="flex items-center gap-2">
                  {(input || answer) && <button type="button" onClick={() => { setInput(''); setAnswer(''); setError(null); setModel(''); }} className="h-10 rounded-xl border border-[var(--crm-border)] px-4 text-xs font-bold text-[var(--crm-muted)] hover:bg-[var(--crm-panel)]">Clear</button>}
                  <button type="button" disabled={!input.trim() || loading} onClick={() => void submit()} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--tenant-primary)] px-5 text-xs font-extrabold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-40">
                    {loading ? <LoaderCircle size={15} className="animate-spin" /> : <ArrowUp size={15} />}{loading ? 'Working…' : 'Generate'}
                  </button>
                </div>
              </div>
            </div>

            {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold leading-5 text-red-700">{error}</div>}
            {(answer || loading) && <div className="rounded-2xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--crm-border)] pb-3"><div className="flex items-center gap-2 text-xs font-extrabold"><Sparkles size={15} className="text-[var(--tenant-primary)]" /> Assistant result</div>{model && <span className="text-[9px] text-[var(--crm-muted)]">{model}</span>}</div>
              {loading ? <div className="flex min-h-32 items-center justify-center gap-2 text-xs text-[var(--crm-muted)]"><LoaderCircle size={16} className="animate-spin" /> Preparing the response…</div> : <div className="whitespace-pre-wrap py-4 text-sm leading-7 text-[var(--crm-text)]">{answer}</div>}
            </div>}
          </div>
        </div>
      </div>
    </section>
  );
}
