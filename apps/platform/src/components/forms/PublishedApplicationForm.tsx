'use client';

import { useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, LoaderCircle, UploadCloud } from 'lucide-react';

export type ApplicationField = { key?: string; label: string; type: string; required?: boolean; placeholder?: string; options?: string[] };
export type ApplicationSection = { section?: string; title?: string; fields?: ApplicationField[] };

export function applicationSections(schema: unknown): ApplicationSection[] {
  const source = Array.isArray(schema) ? schema : schema && typeof schema === 'object' && Array.isArray((schema as { sections?: unknown }).sections) ? (schema as { sections: unknown[] }).sections : [];
  return (source as ApplicationSection[]).map((section) => ({ ...section, fields: (section.fields ?? []).filter((field) => !['hidden field', 'automation', 'section heading', 'divider'].includes(field.type.toLowerCase())) })).filter((section) => section.fields?.length);
}

export function applicationFieldKey(field: ApplicationField) {
  return field.key ?? field.label.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function applicationValuePresent(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'boolean') return value;
  if (value && typeof value === 'object') return true;
  return String(value ?? '').trim().length > 0;
}

const sectionName = (section: ApplicationSection, index: number) => section.section ?? section.title ?? `Section ${index + 1}`;

function uploadedName(value: unknown) {
  if (typeof value === 'string') return value ? 'Uploaded' : '';
  if (!value || typeof value !== 'object') return '';
  const record = value as Record<string, unknown>;
  return String(record.originalFilename ?? record.fileName ?? record.name ?? 'Uploaded');
}

export default function PublishedApplicationForm({ schema, initialValues, submitLabel = 'Submit application', onSubmit, onUpload }: {
  schema: unknown;
  initialValues?: Record<string, unknown>;
  submitLabel?: string;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  onUpload?: (file: File) => Promise<unknown>;
}) {
  const sections = useMemo(() => applicationSections(schema), [schema]);
  const [values, setValues] = useState<Record<string, unknown>>(initialValues ?? {});
  const [activeStep, setActiveStep] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const inputClass = 'mt-1.5 w-full rounded-lg border border-[var(--crm-border,#d8dde6)] bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-black focus:ring-2 focus:ring-black/10';
  const activeSection = sections[activeStep];
  const setValue = (key: string, value: unknown) => setValues((current) => ({ ...current, [key]: value }));
  const sectionCompletion = (section: ApplicationSection) => {
    const required = (section.fields ?? []).filter((field) => field.required);
    return { complete: required.filter((field) => applicationValuePresent(values[applicationFieldKey(field)])).length, total: required.length };
  };
  const continueToNext = () => {
    if (!formRef.current?.reportValidity()) return;
    setError('');
    if (activeStep === sections.length - 1) setReviewing(true);
    else setActiveStep((current) => current + 1);
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!reviewing) { continueToNext(); return; }
    const incompleteSection = sections.findIndex((section) => (section.fields ?? []).some((field) => field.required && !applicationValuePresent(values[applicationFieldKey(field)])));
    if (incompleteSection >= 0) {
      setActiveStep(incompleteSection);
      setReviewing(false);
      setError(`Complete the required fields in ${sectionName(sections[incompleteSection], incompleteSection)} before submitting.`);
      return;
    }
    setBusy(true); setError('');
    try { await onSubmit(values); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not submit the application'); }
    finally { setBusy(false); }
  };

  if (!sections.length) return <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">The published application form has no fields.</p>;
  const progress = reviewing ? 100 : Math.round(((activeStep + 1) / (sections.length + 1)) * 100);

  return (
    <form ref={formRef} onSubmit={submit} className="mx-auto w-full max-w-5xl text-black">
      <header className="border-b border-neutral-200 pb-5">
        <div className="flex items-end justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">{reviewing ? 'Final review' : `Step ${activeStep + 1} of ${sections.length}`}</p><h1 className="mt-1 text-xl font-bold">{reviewing ? 'Review your application' : sectionName(activeSection, activeStep)}</h1></div><span className="text-xs font-semibold text-neutral-500">{progress}%</span></div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-neutral-200"><div className="h-full rounded-full bg-black transition-[width] duration-300" style={{ width: `${progress}%` }} /></div>
        <nav aria-label="Application sections" className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {sections.map((section, index) => { const completion = sectionCompletion(section); const selected = !reviewing && activeStep === index; return <button key={`${sectionName(section, index)}-${index}`} type="button" onClick={() => { setActiveStep(index); setReviewing(false); }} className={`flex shrink-0 items-center gap-2 border-b-2 px-1 py-2 text-xs font-semibold ${selected ? 'border-black text-black' : 'border-transparent text-neutral-500 hover:text-black'}`}><span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${completion.total === completion.complete ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-700'}`}>{completion.total === completion.complete ? <Check size={12} /> : index + 1}</span>{sectionName(section, index)}</button>; })}
        </nav>
      </header>

      <div className="py-6">
        {reviewing ? <div className="divide-y divide-neutral-200 border-y border-neutral-200">
          {sections.map((section, index) => { const completion = sectionCompletion(section); return <button key={`${sectionName(section, index)}-review`} type="button" onClick={() => { setActiveStep(index); setReviewing(false); }} className="flex w-full items-center gap-4 py-4 text-left hover:bg-neutral-50"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100"><CheckCircle2 size={17} /></span><span className="min-w-0 flex-1"><strong className="block text-sm">{sectionName(section, index)}</strong><span className="mt-0.5 block text-xs text-neutral-500">{completion.total ? `${completion.complete} of ${completion.total} required fields complete` : 'No required fields'}</span></span><span className="text-xs font-semibold text-neutral-600">Edit</span></button>; })}
        </div> : <section>
          <p className="mb-5 max-w-2xl text-sm leading-6 text-neutral-500">Complete this section before continuing. Your entered information is retained when you move between sections.</p>
          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            {activeSection.fields?.map((field) => {
              const key = applicationFieldKey(field); const kind = field.type.toLowerCase(); const value = values[key]; const label = <span className="text-xs font-semibold text-neutral-700">{field.label}{field.required ? ' *' : ''}</span>;
              if (kind.includes('checkbox') || kind.includes('consent')) return <label key={key} className="flex items-start gap-3 border-y border-neutral-200 py-4 text-sm sm:col-span-2"><input type="checkbox" required={field.required} checked={value === true} onChange={(event) => setValue(key, event.target.checked)} className="mt-0.5 h-4 w-4" /><span className="leading-5">{field.label}{field.required ? ' *' : ''}</span></label>;
              if (kind.includes('dropdown') || kind.includes('radio') || kind.includes('select')) return <label key={key}>{label}<select required={field.required} value={String(value ?? '')} onChange={(event) => setValue(key, event.target.value)} className={inputClass}><option value="">Select</option>{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
              if (kind.includes('multiselect')) return <label key={key}>{label}<select multiple required={field.required} value={Array.isArray(value) ? value.map(String) : []} onChange={(event) => setValue(key, Array.from(event.target.selectedOptions, (option) => option.value))} className={`${inputClass} min-h-28`}>{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
              if (kind.includes('upload') || kind.includes('document') || kind.includes('file')) return <label key={key} className="sm:col-span-2">{label}<span className={`${inputClass} flex min-h-12 items-center gap-3`}><UploadCloud size={17} /><input type="file" required={field.required && !value} accept="image/*,.pdf" disabled={!onUpload || uploading === key} onChange={async (event) => { const file = event.target.files?.[0]; if (!file || !onUpload) return; setUploading(key); setError(''); try { setValue(key, await onUpload(file)); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Upload failed'); } finally { setUploading(null); } }} />{uploading === key && <LoaderCircle size={16} className="animate-spin" />}</span>{applicationValuePresent(value) && <span className="mt-1 block text-xs font-semibold text-emerald-700">{uploadedName(value)}</span>}</label>;
              if (kind.includes('paragraph') || kind.includes('textarea') || kind.includes('address')) return <label key={key} className="sm:col-span-2">{label}<textarea required={field.required} rows={4} value={String(value ?? '')} placeholder={field.placeholder} onChange={(event) => setValue(key, event.target.value)} className={inputClass} /></label>;
              const type = kind.includes('email') ? 'email' : kind.includes('phone') || kind.includes('mobile') ? 'tel' : kind.includes('date') ? 'date' : kind.includes('number') || kind.includes('currency') ? 'number' : 'text';
              return <label key={key}>{label}<input type={type} required={field.required} value={String(value ?? '')} placeholder={field.placeholder} onChange={(event) => setValue(key, event.target.value)} className={inputClass} /></label>;
            })}
          </div>
        </section>}
      </div>

      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <footer className="flex items-center justify-between gap-3 border-t border-neutral-200 pt-5">
        <button type="button" disabled={!reviewing && activeStep === 0} onClick={() => reviewing ? setReviewing(false) : setActiveStep((current) => Math.max(0, current - 1))} className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-semibold disabled:invisible"><ArrowLeft size={16} />Back</button>
        {reviewing ? <button type="submit" disabled={busy || uploading !== null} className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-6 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />}{submitLabel}</button> : <button type="button" disabled={uploading !== null} onClick={continueToNext} className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-6 py-3 text-sm font-bold text-white disabled:opacity-50">{activeStep === sections.length - 1 ? 'Review application' : 'Continue'}<ArrowRight size={16} /></button>}
      </footer>
    </form>
  );
}
