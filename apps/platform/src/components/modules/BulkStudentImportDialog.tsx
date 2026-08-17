'use client';

import React, { useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Upload, X } from 'lucide-react';
import { importStudentMaster, type StudentImportRow } from '@/lib/student-master-api';

const STUDENT_HEADERS = ['Name', 'Roll No', 'Department', 'Mobile number', 'Email'] as const;
const TEMPLATE_LIBRARY = [
  { name: 'Students', file: 'students-import-template.csv', headers: STUDENT_HEADERS },
  { name: 'Users and roles', file: 'users-and-roles-import-template.csv', headers: ['Name', 'Email', 'Role', 'Team', 'Temporary password'] },
  { name: 'Subjects', file: 'subjects-import-template.csv', headers: ['Subject Code', 'Subject Name', 'Department', 'Semester', 'Credits'] },
  { name: 'Fee assignments', file: 'fee-assignments-import-template.csv', headers: ['Roll No', 'Fee Type', 'Amount', 'Due Date', 'Academic Year'] },
] as const;

type ParsedRow = StudentImportRow & { sourceRow: number };

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') { value += '"'; index += 1; } else { quoted = !quoted; }
    } else if (character === ',' && !quoted) {
      row.push(value.trim()); value = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(value.trim()); value = '';
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else {
      value += character;
    }
  }
  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function downloadTemplate(file: string, headers: readonly string[]) {
  const sample = headers.map((header) => {
    const values: Record<string, string> = {
      Name: 'Aarav Kumar', 'Roll No': 'SC2026001', Department: 'Computer Science',
      'Mobile number': '9876543210', Email: 'aarav@college.edu', Role: 'student', Team: 'Students',
      'Temporary password': 'ChangeMe@2026', 'Subject Code': 'CS301', 'Subject Name': 'Data Structures',
      Semester: '3', Credits: '4', 'Fee Type': 'Tuition', Amount: '42500', 'Due Date': '2026-09-15',
      'Academic Year': '2026-27',
    };
    return values[header] ?? '';
  });
  const blob = new Blob([`${headers.join(',')}\r\n${sample.join(',')}\r\n`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function BulkStudentImportDialog({ onClose, onImported }: { onClose: () => void; onImported: (message: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const duplicateRolls = useMemo(() => {
    const seen = new Set<string>();
    return new Set(rows.map((row) => row.rollNo.toLowerCase()).filter((roll) => seen.has(roll) || !seen.add(roll)));
  }, [rows]);

  const selectFile = async (file?: File) => {
    if (!file) return;
    setFileName(file.name); setResult(null);
    const parsed = parseCsv(await file.text());
    if (!parsed.length) { setRows([]); setErrors(['The selected file is empty.']); return; }
    const headers = parsed[0].map((header) => header.replace(/^\uFEFF/, '').trim().toLowerCase());
    const expected = STUDENT_HEADERS.map((header) => header.toLowerCase());
    if (expected.some((header, index) => headers[index] !== header)) {
      setRows([]);
      setErrors([`Use the exact columns: ${STUDENT_HEADERS.join(', ')}.`]);
      return;
    }

    const nextRows = parsed.slice(1).map((values, index) => ({
      name: values[0]?.trim() ?? '', rollNo: values[1]?.trim() ?? '', department: values[2]?.trim() ?? '',
      mobileNumber: values[3]?.trim() ?? '', email: values[4]?.trim().toLowerCase() ?? '', sourceRow: index + 2,
    }));
    const nextErrors: string[] = [];
    const seen = new Set<string>();
    nextRows.forEach((row) => {
      const missing = STUDENT_HEADERS.filter((_, index) => ![row.name, row.rollNo, row.department, row.mobileNumber, row.email][index]);
      if (missing.length) nextErrors.push(`Row ${row.sourceRow}: missing ${missing.join(', ')}.`);
      if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) nextErrors.push(`Row ${row.sourceRow}: invalid email address.`);
      if (row.mobileNumber && !/^\+?[0-9][0-9 -]{7,14}$/.test(row.mobileNumber)) nextErrors.push(`Row ${row.sourceRow}: invalid mobile number.`);
      const roll = row.rollNo.toLowerCase();
      if (roll && seen.has(roll)) nextErrors.push(`Row ${row.sourceRow}: duplicate roll number ${row.rollNo}.`);
      seen.add(roll);
    });
    if (nextRows.length > 1000) nextErrors.push('A single upload can contain at most 1000 students.');
    setRows(nextRows); setErrors(nextErrors);
  };

  const runImport = async () => {
    if (!rows.length || errors.length || duplicateRolls.size) return;
    setBusy(true); setResult(null);
    try {
      const response = await importStudentMaster(rows.map((row) => ({
        name: row.name,
        rollNo: row.rollNo,
        department: row.department,
        mobileNumber: row.mobileNumber,
        email: row.email,
      })));
      const message = `${response.data.inserted} added, ${response.data.updated} updated`;
      setResult(message);
      onImported(message);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'The students could not be imported.']);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Bulk import students" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] shadow-2xl">
        <header className="flex items-center justify-between border-b border-[var(--crm-border)] px-5 py-4">
          <div><h2 className="text-lg font-semibold">Bulk import students</h2><p className="mt-1 text-xs text-[var(--crm-muted)]">Existing students are updated by Roll No. New roll numbers are added to Student Master.</p></div>
          <button type="button" onClick={onClose} title="Close" aria-label="Close" className="grid h-9 w-9 place-items-center rounded-md border border-[var(--crm-border)] hover:bg-[var(--crm-panel)]"><X size={17} /></button>
        </header>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => downloadTemplate('students-import-template.csv', STUDENT_HEADERS)} className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--crm-border)] px-3 text-xs font-semibold hover:bg-[var(--crm-panel)]"><Download size={15} />Download student template</button>
              <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-md bg-black px-4 text-xs font-semibold text-white"><Upload size={15} />Choose CSV</button>
              <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => void selectFile(event.target.files?.[0])} />
              {fileName && <span className="text-xs text-[var(--crm-muted)]">{fileName}</span>}
            </div>

            {errors.length > 0 && <div className="mt-4 border-l-2 border-red-500 bg-red-50 px-4 py-3 text-xs text-red-700"><p className="flex items-center gap-2 font-semibold"><AlertCircle size={15} />Fix {errors.length} issue{errors.length === 1 ? '' : 's'}</p><ul className="mt-2 space-y-1">{errors.slice(0, 8).map((error) => <li key={error}>{error}</li>)}</ul>{errors.length > 8 && <p className="mt-2">And {errors.length - 8} more.</p>}</div>}
            {result && <div className="mt-4 flex items-center gap-2 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700"><CheckCircle2 size={15} />Import complete: {result}</div>}

            {rows.length > 0 ? <div className="mt-5 overflow-x-auto border-y border-[var(--crm-border)]"><table className="w-full min-w-[720px] text-left text-xs"><thead><tr className="text-[10px] uppercase text-[var(--crm-muted)]">{STUDENT_HEADERS.map((header) => <th key={header} className="px-3 py-3 font-semibold">{header}</th>)}</tr></thead><tbody>{rows.slice(0, 10).map((row) => <tr key={`${row.sourceRow}-${row.rollNo}`} className="border-t border-[var(--crm-border)]"><td className="px-3 py-3 font-medium">{row.name}</td><td className="px-3 py-3">{row.rollNo}</td><td className="px-3 py-3">{row.department}</td><td className="px-3 py-3">{row.mobileNumber}</td><td className="px-3 py-3">{row.email}</td></tr>)}</tbody></table>{rows.length > 10 && <p className="border-t border-[var(--crm-border)] px-3 py-2 text-[10px] text-[var(--crm-muted)]">Previewing 10 of {rows.length} rows</p>}</div> : <button type="button" onClick={() => inputRef.current?.click()} className="mt-5 flex min-h-52 w-full flex-col items-center justify-center border border-dashed border-[var(--crm-border)] text-center hover:bg-[var(--crm-panel)]"><FileSpreadsheet size={28} className="text-[var(--crm-muted)]" /><strong className="mt-3 text-sm">Select the completed CSV</strong><span className="mt-1 text-xs text-[var(--crm-muted)]">All five columns are required.</span></button>}
          </div>

          <aside className="border-t border-[var(--crm-border)] bg-[var(--crm-panel)] p-5 lg:border-l lg:border-t-0">
            <h3 className="text-xs font-semibold">Template library</h3><p className="mt-1 text-[10px] text-[var(--crm-muted)]">Standard files for the next bulk-data surfaces.</p>
            <div className="mt-4 space-y-2">{TEMPLATE_LIBRARY.map((template) => <button key={template.file} type="button" onClick={() => downloadTemplate(template.file, template.headers)} className="flex w-full items-center justify-between gap-3 rounded-md border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 py-3 text-left text-xs hover:border-black"><span><strong className="block font-medium">{template.name}</strong><small className="text-[10px] text-[var(--crm-muted)]">{template.headers.length} columns</small></span><Download size={14} /></button>)}</div>
          </aside>
        </div>

        <footer className="flex items-center justify-between border-t border-[var(--crm-border)] px-5 py-4"><span className="text-xs text-[var(--crm-muted)]">{rows.length ? `${rows.length} rows ready` : 'No file selected'}</span><div className="flex gap-2"><button type="button" onClick={onClose} className="h-9 rounded-md border border-[var(--crm-border)] px-4 text-xs font-medium">Cancel</button><button type="button" disabled={!rows.length || errors.length > 0 || busy || Boolean(result)} onClick={() => void runImport()} className="h-9 rounded-md bg-black px-5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-35">{busy ? 'Importing...' : 'Import students'}</button></div></footer>
      </section>
    </div>
  );
}
