'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownToLine,
  Bus,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  FileBarChart,
  FileText,
  Filter,
  GraduationCap,
  KeyRound,
  Library,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp,
  Upload,
  UserCheck,
  Users,
  WalletCards,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import { BulkStudentImportDialog } from './BulkStudentImportDialog';
import { ApiRequestError } from '@/lib/api';
import { listStudentMaster, type StudentMasterRow } from '@/lib/student-master-api';

export type OperationsSection = 'students' | 'academics' | 'fees' | 'erp' | 'reports' | 'users';

type DirectoryUser = {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: string;
  team: string;
  access: string[];
};

type WorkspaceProps = {
  section: OperationsSection;
  users?: DirectoryUser[];
  canCreateUsers?: boolean;
  onAddUser?: () => void;
};

type Metric = { label: string; value: string; note: string; icon: LucideIcon; tone?: 'good' | 'warn' | 'bad' };

const SECTION_META: Record<OperationsSection, { eyebrow: string; title: string; subtitle: string; action: string; tabs: string[] }> = {
  students: { eyebrow: '', title: 'Students', subtitle: '', action: 'Add student', tabs: ['All students', 'Needs attention', 'New intake'] },
  academics: { eyebrow: 'Academic operations', title: 'Academics', subtitle: 'Run classes, timetable, faculty allocation, attendance, and assessments.', action: 'Create schedule', tabs: ['Timetable', 'Subjects', 'Assessments'] },
  fees: { eyebrow: 'Finance operations', title: 'Fees & Finance', subtitle: 'Track collections, dues, approvals, refunds, and settlement exceptions.', action: 'Generate invoice', tabs: ['Transactions', 'Dues', 'Approvals'] },
  erp: { eyebrow: 'Campus services', title: 'ERP Services', subtitle: 'Coordinate service requests, ownership, priority, and operational SLAs.', action: 'New request', tabs: ['Service desk', 'Catalogue', 'SLA monitor'] },
  reports: { eyebrow: 'Institution intelligence', title: 'Reports & BI', subtitle: 'Build, schedule, and inspect reports across every operational domain.', action: 'Create report', tabs: ['Overview', 'Saved reports', 'Schedules'] },
  users: { eyebrow: 'Identity & access', title: 'Users & Roles', subtitle: 'Control accounts, role coverage, module access, and account health.', action: 'Add user', tabs: ['Directory', 'Roles', 'Access review'] },
};

const STUDENTS = [
  { id: 'SC260184', name: 'Aarav Patel', programme: 'B.Tech CSE', semester: 'Semester 3', attendance: 91, fees: 'Clear', app: 'Active', risk: 'On track', guardian: '+91 98421 45380' },
  { id: 'SC260207', name: 'Meera Nair', programme: 'B.Tech ECE', semester: 'Semester 3', attendance: 73, fees: 'Due ₹24,000', app: 'Active', risk: 'Attendance', guardian: '+91 97884 12077' },
  { id: 'SC260231', name: 'Kavin Raj', programme: 'BCA', semester: 'Semester 1', attendance: 84, fees: 'Due ₹8,500', app: 'Invite sent', risk: 'Fee due', guardian: '+91 99440 61234' },
  { id: 'SC260245', name: 'Nila George', programme: 'MBA', semester: 'Semester 1', attendance: 96, fees: 'Clear', app: 'Active', risk: 'On track', guardian: '+91 98841 77642' },
  { id: 'SC260266', name: 'Sara Khan', programme: 'BBA', semester: 'Semester 5', attendance: 67, fees: 'Clear', app: 'Suspended', risk: 'High risk', guardian: '+91 90031 44829' },
];

const CLASSES = [
  { period: 'P1', time: '08:45', subject: 'Data Structures', code: 'CS301', group: 'CSE · III A', staff: 'Dr. S. Raman', room: 'LH-302', state: 'Ready' },
  { period: 'P2', time: '09:40', subject: 'Digital Electronics', code: 'EC214', group: 'ECE · II B', staff: 'Prof. Meera Das', room: 'LH-204', state: 'Ready' },
  { period: 'P3', time: '10:50', subject: 'Database Systems Lab', code: 'CS322', group: 'CSE · III A', staff: 'Mr. Arun K', room: 'LAB-04', state: 'Conflict' },
  { period: 'P4', time: '11:45', subject: 'Corporate Finance', code: 'MB112', group: 'MBA · I', staff: 'Dr. Neha Jain', room: 'MBA-12', state: 'Ready' },
  { period: 'P5', time: '13:30', subject: 'Operating Systems', code: 'CS304', group: 'CSE · III B', staff: 'Dr. S. Raman', room: 'LH-306', state: 'Substitute' },
  { period: 'P6', time: '14:25', subject: 'Engineering Design', code: 'ME208', group: 'MECH · II', staff: 'Prof. John M', room: 'STUDIO-2', state: 'Ready' },
  { period: 'P7', time: '15:20', subject: 'Quantitative Methods', code: 'MB118', group: 'MBA · I', staff: 'Dr. Neha Jain', room: 'MBA-12', state: 'Ready' },
];

const PAYMENTS = [
  { id: 'TXN-84291', student: 'Aarav Patel', item: 'Tuition fee · Installment 2', amount: '₹42,500', channel: 'UPI', time: 'Today, 10:42', status: 'Reconciled' },
  { id: 'TXN-84288', student: 'Meera Nair', item: 'Hostel fee · Term 1', amount: '₹24,000', channel: 'Net banking', time: 'Today, 09:18', status: 'Unmatched' },
  { id: 'TXN-84274', student: 'Kavin Raj', item: 'Exam fee', amount: '₹3,250', channel: 'Card', time: 'Yesterday, 17:52', status: 'Failed' },
  { id: 'TXN-84263', student: 'Nila George', item: 'Tuition fee · Full', amount: '₹68,000', channel: 'Bank transfer', time: 'Yesterday, 15:06', status: 'Reconciled' },
  { id: 'RFN-00318', student: 'Sara Khan', item: 'Transport cancellation', amount: '₹7,500', channel: 'Refund', time: '12 Aug, 12:30', status: 'Approval' },
];

const SERVICES = [
  { name: 'Hostel', icon: Users, open: 12, sla: '94%', owner: 'Student welfare' },
  { name: 'Transport', icon: Bus, open: 6, sla: '97%', owner: 'Transport office' },
  { name: 'Library', icon: Library, open: 4, sla: '99%', owner: 'Library team' },
  { name: 'Gatepass', icon: ShieldCheck, open: 18, sla: '91%', owner: 'Campus security' },
  { name: 'Documents', icon: FileText, open: 22, sla: '88%', owner: 'Student records' },
  { name: 'Repairs', icon: Wrench, open: 7, sla: '86%', owner: 'Facilities' },
];

const REQUESTS = [
  { id: 'SR-26081', request: 'Bonafide certificate', person: 'Aarav Patel', service: 'Documents', priority: 'Normal', owner: 'Records desk', due: '2h 15m', status: 'In progress' },
  { id: 'SR-26077', request: 'Route change request', person: 'Meera Nair', service: 'Transport', priority: 'High', owner: 'Unassigned', due: '42m', status: 'New' },
  { id: 'SR-26072', request: 'Hostel room maintenance', person: 'Kavin Raj', service: 'Repairs', priority: 'Urgent', owner: 'Facilities', due: 'Overdue', status: 'Escalated' },
  { id: 'SR-26069', request: 'Library fine review', person: 'Nila George', service: 'Library', priority: 'Normal', owner: 'Ms. Kavya', due: '5h 30m', status: 'Waiting' },
];

const REPORTS = [
  { id: 'RPT-01', name: 'Daily admissions funnel', domain: 'Admissions', owner: 'Admissions office', schedule: 'Daily · 08:00', format: 'PDF', updated: '18 min ago' },
  { id: 'RPT-02', name: 'Fee collection and ageing', domain: 'Finance', owner: 'Finance office', schedule: 'Every Monday', format: 'XLSX', updated: '2h ago' },
  { id: 'RPT-03', name: 'Attendance risk register', domain: 'Academics', owner: 'Academic office', schedule: 'Friday · 16:00', format: 'PDF', updated: 'Yesterday' },
  { id: 'RPT-04', name: 'Service SLA performance', domain: 'ERP', owner: 'Operations', schedule: 'Monthly', format: 'CSV', updated: '12 Aug' },
];

const toneClass = (value: string) => {
  const normalized = value.toLowerCase();
  if (/(clear|active|ready|reconciled|on track|resolved)/.test(normalized)) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (/(failed|urgent|overdue|high risk|suspended|escalated)/.test(normalized)) return 'bg-red-50 text-red-700 border-red-200';
  if (/(due|pending|conflict|unmatched|approval|waiting|substitute)/.test(normalized)) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-[var(--crm-panel)] text-[var(--crm-muted)] border-[var(--crm-border)]';
};

function Pill({ children }: { children: React.ReactNode }) {
  return <span className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${toneClass(String(children))}`}>{children}</span>;
}

function MetricStrip({ items }: { items: Metric[] }) {
  return (
    <div className="grid border-y border-[var(--crm-border)] bg-[var(--crm-card)] sm:grid-cols-2 xl:grid-cols-4">
      {items.map(({ label, value, note, icon: Icon, tone }, index) => (
        <div key={label} className={`flex min-h-24 items-center gap-4 px-5 py-4 ${index ? 'border-t border-[var(--crm-border)] sm:border-l sm:border-t-0' : ''}`}>
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-md ${tone === 'bad' ? 'bg-red-50 text-red-600' : tone === 'warn' ? 'bg-amber-50 text-amber-700' : 'bg-[var(--crm-panel)] text-[var(--tenant-primary)]'}`}><Icon size={18} /></span>
          <div className="min-w-0"><p className="text-[11px] text-[var(--crm-muted)]">{label}</p><p className="mt-0.5 text-2xl font-semibold text-[var(--crm-text)]">{value}</p><p className="truncate text-[10px] text-[var(--crm-muted)]">{note}</p></div>
        </div>
      ))}
    </div>
  );
}

function SectionButton({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} title={label} className="grid h-9 w-9 place-items-center rounded-md border border-[var(--crm-border)] bg-[var(--crm-card)] text-[var(--crm-muted)] hover:bg-[var(--crm-panel)] hover:text-[var(--crm-text)]"><Icon size={16} /></button>;
}

export function CampusOperationsWorkspace({ section, users = [], canCreateUsers = false, onAddUser }: WorkspaceProps) {
  const meta = SECTION_META[section];
  const [tab, setTab] = useState(meta.tabs[0]);
  const [query, setQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resolved, setResolved] = useState<string[]>([]);
  const [studentImportOpen, setStudentImportOpen] = useState(false);
  const [studentRefreshVersion, setStudentRefreshVersion] = useState(0);

  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2400);
  };

  const runPrimary = () => {
    if (section === 'users' && onAddUser) return onAddUser();
    notify(`${meta.action} workspace opened`);
  };

  return (
    <section className="relative flex min-h-0 flex-1 flex-col overflow-y-auto bg-[var(--crm-panel)] text-[var(--crm-text)]">
      {section !== 'students' && (
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--crm-border)] bg-[var(--crm-card)] px-6 py-5">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--tenant-primary)]">{meta.eyebrow}</p><h1 className="mt-1 text-2xl font-semibold">{meta.title}</h1><p className="mt-1 text-xs text-[var(--crm-muted)]">{meta.subtitle}</p></div>
          {(section !== 'users' || canCreateUsers) && <button type="button" onClick={runPrimary} className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--crm-text)] px-4 text-xs font-semibold text-[var(--crm-card)] hover:opacity-85"><Plus size={15} />{meta.action}</button>}
        </header>
      )}

      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--crm-border)] bg-[var(--crm-card)] px-6 py-3">
        <label className="flex h-10 min-w-64 flex-1 items-center gap-2 rounded-md border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 text-xs text-[var(--crm-muted)] xl:max-w-md"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${meta.title.toLowerCase()}`} className="min-w-0 flex-1 bg-transparent outline-none" />{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><X size={14} /></button>}</label>
        <div className="flex h-10 items-center rounded-md border border-[var(--crm-border)] bg-[var(--crm-panel)] p-1">
          {meta.tabs.map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={`h-8 rounded px-3 text-[11px] font-medium ${tab === item ? 'bg-[var(--crm-card)] text-[var(--crm-text)] shadow-sm' : 'text-[var(--crm-muted)]'}`}>{item}</button>)}
        </div>
        <div className="relative">
          <button type="button" onClick={() => setFilterOpen((open) => !open)} className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 text-xs"><Filter size={14} />{filter}<ChevronDown size={13} /></button>
          {filterOpen && <div className="absolute right-0 top-11 z-30 w-40 rounded-md border border-[var(--crm-border)] bg-[var(--crm-card)] p-1 shadow-xl">{['All', 'Needs action', 'Today', 'This week'].map((item) => <button key={item} type="button" onClick={() => { setFilter(item); setFilterOpen(false); }} className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-xs hover:bg-[var(--crm-panel)]">{item}{filter === item && <Check size={13} />}</button>)}</div>}
        </div>
        {section === 'students' && <><button type="button" onClick={() => setStudentImportOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--crm-border)] bg-[var(--crm-card)] px-4 text-xs font-semibold hover:bg-[var(--crm-panel)]"><Upload size={15} />Bulk upload</button><button type="button" onClick={runPrimary} className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--crm-text)] px-4 text-xs font-semibold text-[var(--crm-card)] hover:opacity-85"><Plus size={15} />Add student</button></>}
        <SectionButton icon={RefreshCw} label="Refresh" onClick={() => notify('Workspace refreshed')} />
      </div>

      {section === 'students' && <StudentsView query={query} tab={tab} selected={selected} setSelected={setSelected} notify={notify} refreshVersion={studentRefreshVersion} />}
      {section === 'academics' && <AcademicsView tab={tab} query={query} resolved={resolved} setResolved={setResolved} notify={notify} />}
      {section === 'fees' && <FeesView query={query} tab={tab} selected={selected} setSelected={setSelected} resolved={resolved} setResolved={setResolved} notify={notify} />}
      {section === 'erp' && <ErpView query={query} tab={tab} selected={selected} setSelected={setSelected} resolved={resolved} setResolved={setResolved} notify={notify} />}
      {section === 'reports' && <ReportsView query={query} tab={tab} notify={notify} />}
      {section === 'users' && <UsersView users={users} query={query} tab={tab} selected={selected} setSelected={setSelected} notify={notify} />}

      {notice && <div role="status" className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-md bg-black px-4 py-3 text-xs font-medium text-white shadow-2xl"><CheckCircle2 size={15} />{notice}</div>}
      {studentImportOpen && <BulkStudentImportDialog onClose={() => setStudentImportOpen(false)} onImported={(message) => { setStudentRefreshVersion((version) => version + 1); notify(`Student import complete: ${message}`); }} />}
    </section>
  );
}

const NEW_INTAKE_CUTOFF = Date.now() - 30 * 86_400_000;

function studentMasterErrorMessage(error: unknown) {
  if (!(error instanceof ApiRequestError)) return 'Student Master could not be loaded.';
  if (error.status === 401) return 'Your session expired. Sign in again to load Student Master.';
  if (error.status === 403) return 'Your role does not have permission to view Student Master.';
  if (error.status === 408) return 'Student Master took too long to respond. Retry the request.';
  return error.message;
}

function StudentsView({ query, tab, selected, setSelected, notify, refreshVersion }: { query: string; tab: string; selected: string | null; setSelected: (id: string | null) => void; notify: (message: string) => void; refreshVersion: number }) {
  const [students, setStudents] = useState<StudentMasterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryVersion, setRetryVersion] = useState(0);

  useEffect(() => {
    let active = true;
    listStudentMaster()
      .then((response) => { if (active) { setStudents(response.data); setLoadError(null); } })
      .catch((error: unknown) => { if (active) { setStudents([]); setLoadError(studentMasterErrorMessage(error)); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refreshVersion, retryVersion]);

  const rows = useMemo(() => students.filter((student) => {
    const matchesQuery = `${student.name} ${student.rollNo} ${student.department} ${student.mobileNumber} ${student.email}`.toLowerCase().includes(query.toLowerCase());
    if (!matchesQuery) return false;
    if (tab === 'Needs attention') return !student.email || !student.mobileNumber || student.status !== 'active';
    if (tab === 'New intake') return new Date(student.createdAt).getTime() >= NEW_INTAKE_CUTOFF;
    return true;
  }), [students, query, tab]);
  const student = students.find((item) => item.id === selected);
  const departments = new Set(students.map((item) => item.department).filter(Boolean)).size;
  const completeContacts = students.filter((item) => item.email && item.mobileNumber).length;

  return <>
    <MetricStrip items={[{ label: 'Student Master', value: String(students.length), note: 'Tenant student records', icon: Users }, { label: 'Departments', value: String(departments), note: 'Represented in directory', icon: GraduationCap }, { label: 'Contact ready', value: String(completeContacts), note: 'Email and mobile available', icon: UserCheck }, { label: 'Needs attention', value: String(students.length - completeContacts), note: 'Missing contact information', icon: AlertTriangle, tone: students.length === completeContacts ? 'good' : 'warn' }]} />

    {loadError && <div role="alert" className="flex items-center justify-between gap-4 border-b border-red-200 bg-red-50 px-5 py-2 text-[11px] text-red-800"><span>{loadError}</span><button type="button" onClick={() => { setLoading(true); setLoadError(null); setRetryVersion((version) => version + 1); }} className="inline-flex h-8 shrink-0 items-center gap-2 rounded-md border border-red-200 bg-white px-3 font-semibold hover:bg-red-100"><RefreshCw size={13} />Retry</button></div>}
    <div className="min-h-[520px] flex-1 overflow-x-auto bg-[var(--crm-card)]">
      <div className="grid min-w-[900px] grid-cols-[1.2fr_.85fr_1fr_.9fr_1.2fr_.55fr] border-b border-[var(--crm-border)] px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--crm-muted)]">
        <span>Name</span><span>Roll No</span><span>Department</span><span>Mobile number</span><span>Email</span><span>Status</span>
      </div>
      {loading && <div className="px-5 py-12 text-center text-xs text-[var(--crm-muted)]">Loading Student Master...</div>}
      {!loading && rows.length === 0 && <div className="px-5 py-12 text-center text-xs text-[var(--crm-muted)]">No students match this view.</div>}
      {!loading && rows.map((row) => (
        <button type="button" key={row.id} title="Double-click to open student record" onDoubleClick={() => setSelected(row.id)} onKeyDown={(event) => { if (event.key === 'Enter') setSelected(row.id); }} className="grid min-w-[900px] w-full cursor-pointer grid-cols-[1.2fr_.85fr_1fr_.9fr_1.2fr_.55fr] items-center border-b border-[var(--crm-border)] px-5 py-4 text-left text-xs transition-colors hover:bg-[var(--crm-panel)] focus-visible:bg-[var(--crm-panel)] focus-visible:outline-none">
          <span className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-md bg-black text-[11px] font-semibold text-white">{row.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span><strong className="truncate font-medium">{row.name}</strong></span>
          <span className="font-medium">{row.rollNo}</span><span>{row.department}</span><span>{row.mobileNumber}</span><span className="truncate">{row.email}</span><span><Pill>{row.status}</Pill></span>
        </button>
      ))}
    </div>

    {student && <div className="fixed inset-0 z-[320] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]" role="dialog" aria-modal="true" aria-label={`${student.name} student record`} onMouseDown={(event) => { if (event.currentTarget === event.target) setSelected(null); }}>
      <section className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] shadow-2xl">
        <header className="flex items-center justify-between border-b border-[var(--crm-border)] px-5 py-4"><div className="flex min-w-0 items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-black text-xs font-semibold text-white">{student.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span><div className="min-w-0"><h2 className="truncate text-lg font-semibold">{student.name}</h2><p className="text-xs text-[var(--crm-muted)]">{student.rollNo}</p></div></div><button type="button" onClick={() => setSelected(null)} aria-label="Close student record" title="Close" className="grid h-9 w-9 place-items-center rounded-md border border-[var(--crm-border)] text-[var(--crm-muted)] hover:bg-[var(--crm-panel)] hover:text-[var(--crm-text)]"><X size={17} /></button></header>
        <div className="overflow-y-auto px-5 py-5"><StudentRecordSection title="Student details" entries={[["Name", student.name], ["Roll No", student.rollNo], ["Department", student.department], ["Status", student.status]]} /><StudentRecordSection title="Contact details" entries={[["Mobile number", student.mobileNumber], ["Email", student.email]]} className="mt-6" /></div>
        <footer className="flex items-center justify-end gap-2 border-t border-[var(--crm-border)] px-5 py-4"><button type="button" onClick={() => notify(`Message prepared for ${student.name}`)} className="h-9 rounded-md border border-[var(--crm-border)] px-4 text-xs font-medium hover:bg-[var(--crm-panel)]">Message student</button><button type="button" onClick={() => setSelected(null)} className="h-9 rounded-md bg-black px-4 text-xs font-semibold text-white">Close</button></footer>
      </section>
    </div>}
  </>;
}

function StudentRecordSection({ title, entries, className = '' }: { title: string; entries: Array<[string, string]>; className?: string }) {
  return (
    <section className={className}>
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--crm-muted)]">{title}</h3>
      <dl className="mt-2 grid gap-x-8 border-y border-[var(--crm-border)] sm:grid-cols-2">
        {entries.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 border-b border-[var(--crm-border)] py-3 text-xs">
            <dt className="text-[var(--crm-muted)]">{label}</dt>
            <dd className="text-right font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function LegacyStudentsView({ query, tab, selected, setSelected, notify }: { query: string; tab: string; selected: string | null; setSelected: (id: string | null) => void; notify: (message: string) => void }) {
  const rows = useMemo(() => STUDENTS.filter((student) => `${student.name} ${student.id} ${student.programme}`.toLowerCase().includes(query.toLowerCase()) && (tab !== 'Needs attention' || student.risk !== 'On track')), [query, tab]);
  const student = STUDENTS.find((item) => item.id === selected) ?? rows[0];
  return <><MetricStrip items={[{ label: 'Active students', value: '3,842', note: '+126 this intake', icon: Users }, { label: 'Attendance risk', value: '84', note: 'Below institution threshold', icon: AlertTriangle, tone: 'warn' }, { label: 'Fee holds', value: '37', note: '₹8.4L outstanding', icon: CircleDollarSign, tone: 'bad' }, { label: 'App activation', value: '96%', note: '3,688 active accounts', icon: UserCheck }]} />
    <div className="grid min-h-[520px] flex-1 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="overflow-x-auto border-r border-[var(--crm-border)] bg-[var(--crm-card)]"><div className="grid min-w-[820px] grid-cols-[1.25fr_1fr_.7fr_.8fr_.7fr_.8fr] border-b border-[var(--crm-border)] px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--crm-muted)]"><span>Student</span><span>Programme</span><span>Attendance</span><span>Fees</span><span>App</span><span>Risk</span></div>{rows.map((row) => <button type="button" key={row.id} onClick={() => setSelected(row.id)} className={`grid min-w-[820px] w-full grid-cols-[1.25fr_1fr_.7fr_.8fr_.7fr_.8fr] items-center border-b border-[var(--crm-border)] px-5 py-4 text-left text-xs hover:bg-[var(--crm-panel)] ${student?.id === row.id ? 'bg-[var(--crm-panel)]' : ''}`}><span className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-md bg-black text-[11px] font-semibold text-white">{row.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span><span><strong className="block font-medium">{row.name}</strong><small className="text-[10px] text-[var(--crm-muted)]">{row.id}</small></span></span><span>{row.programme}<small className="block text-[10px] text-[var(--crm-muted)]">{row.semester}</small></span><span className={row.attendance < 75 ? 'font-semibold text-red-600' : ''}>{row.attendance}%</span><span><Pill>{row.fees}</Pill></span><span><Pill>{row.app}</Pill></span><span><Pill>{row.risk}</Pill></span></button>)}</div>
      {student && <aside className="bg-[var(--crm-card)] p-5"><div className="flex items-start justify-between"><div><p className="text-[10px] uppercase tracking-wider text-[var(--crm-muted)]">Student profile</p><h2 className="mt-1 text-lg font-semibold">{student.name}</h2><p className="text-xs text-[var(--crm-muted)]">{student.id} · {student.programme}</p></div><SectionButton icon={MoreHorizontal} label="More" onClick={() => notify('Profile actions opened')} /></div><div className="mt-6 space-y-4 text-xs">{[['Attendance', `${student.attendance}%`], ['Fee position', student.fees], ['Mobile access', student.app], ['Guardian', student.guardian]].map(([label, value]) => <div key={label} className="flex justify-between border-b border-[var(--crm-border)] pb-3"><span className="text-[var(--crm-muted)]">{label}</span><strong className="font-medium">{value}</strong></div>)}</div><div className="mt-6 grid gap-2"><button type="button" onClick={() => notify(`${student.name}'s profile opened`)} className="h-10 rounded-md bg-black text-xs font-semibold text-white">Open full profile</button><button type="button" onClick={() => notify(`Guardian message prepared for ${student.name}`)} className="h-10 rounded-md border border-[var(--crm-border)] text-xs">Message guardian</button></div></aside>}
    </div></>;
}

function AcademicsView({ tab, query, resolved, setResolved, notify }: { tab: string; query: string; resolved: string[]; setResolved: (ids: string[]) => void; notify: (message: string) => void }) {
  const classes = CLASSES.filter((item) => `${item.subject} ${item.code} ${item.group} ${item.staff}`.toLowerCase().includes(query.toLowerCase()));
  return <><MetricStrip items={[{ label: 'Classes today', value: '148', note: 'Across 8 departments', icon: CalendarDays }, { label: 'Faculty assigned', value: '96%', note: '7 substitutions pending', icon: GraduationCap }, { label: 'Timetable conflicts', value: '6', note: '2 require action now', icon: AlertTriangle, tone: 'bad' }, { label: 'Attendance posted', value: '82%', note: '121 of 148 classes', icon: CheckCircle2 }]} />
    <div className="grid flex-1 xl:grid-cols-[minmax(0,1fr)_330px]"><div className="border-r border-[var(--crm-border)] bg-[var(--crm-card)] p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-sm font-semibold">{tab === 'Timetable' ? "Today's teaching plan" : tab}</h2><p className="mt-1 text-[11px] text-[var(--crm-muted)]">Monday · 17 August 2026</p></div><div className="flex gap-1">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <button key={day} type="button" onClick={() => notify(`${day} schedule loaded`)} className={`h-8 rounded px-2.5 text-[10px] ${day === 'Mon' ? 'bg-black text-white' : 'bg-[var(--crm-panel)]'}`}>{day}</button>)}</div></div><div className="overflow-x-auto"><div className="flex min-w-max gap-3 pb-3">{classes.map((item) => <button key={item.period} type="button" onClick={() => notify(`${item.subject} opened`)} className="w-52 shrink-0 rounded-md border border-[var(--crm-border)] bg-[var(--crm-card)] p-4 text-left hover:border-black"><div className="flex justify-between"><span className="text-[10px] font-semibold text-[var(--crm-muted)]">{item.period} · {item.time}</span><Pill>{item.state}</Pill></div><h3 className="mt-5 text-sm font-semibold">{item.subject}</h3><p className="mt-1 text-[10px] text-[var(--crm-muted)]">{item.code} · {item.group}</p><div className="mt-5 border-t border-[var(--crm-border)] pt-3 text-[11px]"><p>{item.staff}</p><p className="mt-1 text-[var(--crm-muted)]">{item.room}</p></div></button>)}</div></div><div className="mt-4 grid gap-3 md:grid-cols-3">{[['Programmes', '24'], ['Subjects', '180'], ['Active sections', '42']].map(([label, value]) => <button key={label} type="button" onClick={() => notify(`${label} opened`)} className="flex items-center justify-between rounded-md border border-[var(--crm-border)] px-4 py-3 text-left"><span className="text-xs">{label}</span><strong className="text-lg">{value}</strong></button>)}</div></div>
      <aside className="bg-[var(--crm-card)] p-5"><h2 className="text-sm font-semibold">Conflict queue</h2><p className="mt-1 text-[11px] text-[var(--crm-muted)]">Resolve before timetable publication</p><div className="mt-5 space-y-3">{[{ id: 'faculty', title: 'Faculty double-booked', detail: 'Dr. S. Raman · P5', tone: 'Urgent' }, { id: 'room', title: 'Room capacity exceeded', detail: 'LH-204 · 8 seats short', tone: 'Review' }, { id: 'sub', title: 'Substitute not confirmed', detail: 'CS304 · P5', tone: 'Pending' }].map((issue) => <div key={issue.id} className="rounded-md border border-[var(--crm-border)] p-3"><div className="flex justify-between"><div><p className="text-xs font-medium">{issue.title}</p><p className="mt-1 text-[10px] text-[var(--crm-muted)]">{issue.detail}</p></div><Pill>{resolved.includes(issue.id) ? 'Resolved' : issue.tone}</Pill></div><button type="button" onClick={() => { setResolved([...resolved, issue.id]); notify(`${issue.title} resolved`); }} disabled={resolved.includes(issue.id)} className="mt-3 text-[10px] font-semibold underline disabled:text-[var(--crm-muted)]">{resolved.includes(issue.id) ? 'Resolved' : 'Resolve conflict'}</button></div>)}</div></aside></div></>;
}

function FeesView({ query, tab, selected, setSelected, resolved, setResolved, notify }: { query: string; tab: string; selected: string | null; setSelected: (id: string | null) => void; resolved: string[]; setResolved: (ids: string[]) => void; notify: (message: string) => void }) {
  const rows = PAYMENTS.filter((item) => `${item.student} ${item.id} ${item.item}`.toLowerCase().includes(query.toLowerCase()));
  const payment = PAYMENTS.find((item) => item.id === selected) ?? rows[0];
  return <><MetricStrip items={[{ label: 'Collected this month', value: '₹82.4L', note: '78% of monthly target', icon: TrendingUp }, { label: 'Outstanding', value: '₹14.2L', note: '286 student accounts', icon: WalletCards, tone: 'warn' }, { label: 'Unmatched payments', value: '18', note: '₹3.8L awaiting match', icon: AlertTriangle, tone: 'bad' }, { label: 'Refunds pending', value: '9', note: '₹84,500 in approval', icon: RefreshCw }]} />
    <div className="grid flex-1 xl:grid-cols-[minmax(0,1fr)_330px]"><div className="overflow-x-auto border-r border-[var(--crm-border)] bg-[var(--crm-card)]"><div className="flex items-center justify-between border-b border-[var(--crm-border)] px-5 py-4"><div><h2 className="text-sm font-semibold">{tab}</h2><p className="text-[11px] text-[var(--crm-muted)]">Live payment ledger</p></div><button type="button" onClick={() => notify('Ledger export prepared')} className="inline-flex items-center gap-2 text-xs"><ArrowDownToLine size={14} />Export</button></div><div className="grid min-w-[760px] grid-cols-[.75fr_1fr_1.3fr_.75fr_.8fr_.8fr] border-b border-[var(--crm-border)] px-5 py-3 text-[10px] uppercase tracking-wider text-[var(--crm-muted)]"><span>Reference</span><span>Student</span><span>Fee item</span><span>Amount</span><span>Channel</span><span>Status</span></div>{rows.map((row) => <button key={row.id} type="button" onClick={() => setSelected(row.id)} className={`grid min-w-[760px] w-full grid-cols-[.75fr_1fr_1.3fr_.75fr_.8fr_.8fr] items-center border-b border-[var(--crm-border)] px-5 py-4 text-left text-xs hover:bg-[var(--crm-panel)] ${payment?.id === row.id ? 'bg-[var(--crm-panel)]' : ''}`}><span className="font-mono text-[10px]">{row.id}</span><span>{row.student}<small className="block text-[10px] text-[var(--crm-muted)]">{row.time}</small></span><span>{row.item}</span><strong>{row.amount}</strong><span>{row.channel}</span><span><Pill>{resolved.includes(row.id) ? 'Reconciled' : row.status}</Pill></span></button>)}</div>
      {payment && <aside className="bg-[var(--crm-card)] p-5"><p className="text-[10px] uppercase tracking-wider text-[var(--crm-muted)]">Payment inspection</p><h2 className="mt-1 text-lg font-semibold">{payment.amount}</h2><p className="text-xs text-[var(--crm-muted)]">{payment.id} · {payment.student}</p><div className="mt-6 space-y-3 text-xs">{[['Fee item', payment.item], ['Channel', payment.channel], ['Received', payment.time], ['Current state', resolved.includes(payment.id) ? 'Reconciled' : payment.status]].map(([label, value]) => <div key={label} className="flex justify-between gap-4 border-b border-[var(--crm-border)] pb-3"><span className="text-[var(--crm-muted)]">{label}</span><span className="text-right">{value}</span></div>)}</div><button type="button" onClick={() => { setResolved([...resolved, payment.id]); notify(`${payment.id} reconciled`); }} className="mt-6 h-10 w-full rounded-md bg-black text-xs font-semibold text-white">Reconcile transaction</button><button type="button" onClick={() => notify('Student ledger opened')} className="mt-2 h-10 w-full rounded-md border border-[var(--crm-border)] text-xs">Open student ledger</button></aside>}
    </div></>;
}

function ErpView({ query, tab, selected, setSelected, resolved, setResolved, notify }: { query: string; tab: string; selected: string | null; setSelected: (id: string | null) => void; resolved: string[]; setResolved: (ids: string[]) => void; notify: (message: string) => void }) {
  const rows = REQUESTS.filter((item) => `${item.request} ${item.person} ${item.service}`.toLowerCase().includes(query.toLowerCase()));
  return <><MetricStrip items={[{ label: 'Open requests', value: '78', note: 'Across 9 campus services', icon: FileText }, { label: 'Due today', value: '21', note: '5 high priority', icon: Clock3, tone: 'warn' }, { label: 'SLA at risk', value: '7', note: '3 already escalated', icon: AlertTriangle, tone: 'bad' }, { label: 'Resolved this week', value: '342', note: '92% within SLA', icon: CheckCircle2 }]} />
    <div className="flex-1 bg-[var(--crm-card)] p-5"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">{SERVICES.map(({ name, icon: Icon, open, sla, owner }) => <button key={name} type="button" onClick={() => { setSelected(name); notify(`${name} queue loaded`); }} className={`rounded-md border p-4 text-left hover:border-black ${selected === name ? 'border-black bg-[var(--crm-panel)]' : 'border-[var(--crm-border)]'}`}><div className="flex items-center justify-between"><Icon size={18} /><span className="text-[10px] text-[var(--crm-muted)]">{open} open</span></div><h3 className="mt-5 text-sm font-semibold">{name}</h3><p className="mt-1 truncate text-[10px] text-[var(--crm-muted)]">{owner}</p><p className="mt-4 text-[10px]">SLA <strong>{sla}</strong></p></button>)}</div><div className="mt-5 overflow-x-auto rounded-md border border-[var(--crm-border)]"><div className="flex items-center justify-between border-b border-[var(--crm-border)] px-4 py-3"><div><h2 className="text-sm font-semibold">{tab}</h2><p className="text-[10px] text-[var(--crm-muted)]">{selected ? `${selected} requests` : 'All service requests'}</p></div><SectionButton icon={MoreHorizontal} label="Queue options" onClick={() => notify('Queue options opened')} /></div><div className="grid min-w-[800px] grid-cols-[.7fr_1.3fr_1fr_.7fr_1fr_.65fr_.8fr] border-b border-[var(--crm-border)] px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--crm-muted)]"><span>ID</span><span>Request</span><span>Student</span><span>Priority</span><span>Owner</span><span>SLA</span><span>Status</span></div>{rows.filter((row) => !selected || SERVICES.some((service) => service.name === selected) ? !selected || row.service === selected : true).map((row) => <div key={row.id} className="grid min-w-[800px] grid-cols-[.7fr_1.3fr_1fr_.7fr_1fr_.65fr_.8fr] items-center border-b border-[var(--crm-border)] px-4 py-4 text-xs"><span className="font-mono text-[10px]">{row.id}</span><button type="button" onClick={() => notify(`${row.request} opened`)} className="text-left font-medium underline-offset-2 hover:underline">{row.request}</button><span>{row.person}</span><span><Pill>{row.priority}</Pill></span><span>{row.owner}</span><span className={row.due === 'Overdue' ? 'font-semibold text-red-600' : ''}>{row.due}</span><button type="button" onClick={() => { setResolved([...resolved, row.id]); notify(`${row.id} marked resolved`); }}><Pill>{resolved.includes(row.id) ? 'Resolved' : row.status}</Pill></button></div>)}</div></div></>;
}

function ReportsView({ query, tab, notify }: { query: string; tab: string; notify: (message: string) => void }) {
  const rows = REPORTS.filter((item) => `${item.name} ${item.domain} ${item.owner}`.toLowerCase().includes(query.toLowerCase()));
  const chart = [34, 42, 39, 58, 54, 67, 63, 78, 74, 86, 82, 91];
  return <><MetricStrip items={[{ label: 'Admissions conversion', value: '41.2%', note: '+3.8% this month', icon: TrendingUp }, { label: 'Collection efficiency', value: '82%', note: '₹82.4L collected', icon: CircleDollarSign }, { label: 'Attendance compliance', value: '89.4%', note: '+1.6% vs last month', icon: UserCheck }, { label: 'ERP SLA', value: '92%', note: '342 requests resolved', icon: Clock3 }]} />
    <div className="grid flex-1 xl:grid-cols-[minmax(0,1fr)_360px]"><div className="border-r border-[var(--crm-border)] bg-[var(--crm-card)] p-5"><div className="flex items-start justify-between"><div><h2 className="text-sm font-semibold">Institution performance</h2><p className="mt-1 text-[11px] text-[var(--crm-muted)]">Composite operating index · Last 12 months</p></div><button type="button" onClick={() => notify('Dashboard exported')} className="inline-flex items-center gap-2 text-xs"><ArrowDownToLine size={14} />Export</button></div><div className="mt-6 h-64 border-b border-l border-[var(--crm-border)] p-4"><svg viewBox="0 0 720 210" className="h-full w-full" role="img" aria-label="Institution performance trend"><defs><linearGradient id="reportArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--tenant-primary)" stopOpacity=".18"/><stop offset="1" stopColor="var(--tenant-primary)" stopOpacity="0"/></linearGradient></defs><path d={`M 0 190 ${chart.map((value, index) => `L ${(index / (chart.length - 1)) * 720} ${200 - value * 1.8}`).join(' ')} L 720 210 L 0 210 Z`} fill="url(#reportArea)"/><polyline points={chart.map((value, index) => `${(index / (chart.length - 1)) * 720},${200 - value * 1.8}`).join(' ')} fill="none" stroke="var(--tenant-primary)" strokeWidth="4" strokeLinejoin="round"/>{chart.map((value, index) => <circle key={index} cx={(index / (chart.length - 1)) * 720} cy={200 - value * 1.8} r="4" fill="var(--crm-card)" stroke="var(--tenant-primary)" strokeWidth="3" />)}</svg></div><div className="mt-5 grid gap-3 md:grid-cols-3">{[['Admissions', '68%', '+12%'], ['Finance', '82%', '+8%'], ['Campus services', '92%', '+4%']].map(([label, value, change]) => <button key={label} type="button" onClick={() => notify(`${label} drilldown opened`)} className="rounded-md border border-[var(--crm-border)] p-4 text-left"><p className="text-[10px] text-[var(--crm-muted)]">{label}</p><div className="mt-2 flex items-end justify-between"><strong className="text-2xl">{value}</strong><span className="text-[10px] text-emerald-600">{change}</span></div></button>)}</div></div>
      <aside className="bg-[var(--crm-card)] p-5"><div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold">{tab}</h2><p className="text-[10px] text-[var(--crm-muted)]">Reports ready for delivery</p></div><SectionButton icon={FileBarChart} label="Report catalogue" onClick={() => notify('Report catalogue opened')} /></div><div className="mt-5 space-y-2">{rows.map((report) => <button key={report.id} type="button" onClick={() => notify(`${report.name} opened`)} className="w-full rounded-md border border-[var(--crm-border)] p-3 text-left hover:bg-[var(--crm-panel)]"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium">{report.name}</p><p className="mt-1 text-[10px] text-[var(--crm-muted)]">{report.domain} · {report.owner}</p></div><span className="text-[10px] font-semibold">{report.format}</span></div><div className="mt-3 flex justify-between text-[10px] text-[var(--crm-muted)]"><span>{report.schedule}</span><span>{report.updated}</span></div></button>)}</div></aside></div></>;
}

function UsersView({ users, query, tab, selected, setSelected, notify }: { users: DirectoryUser[]; query: string; tab: string; selected: string | null; setSelected: (id: string | null) => void; notify: (message: string) => void }) {
  const fallback = [{ id: 'admin', name: 'Tenant Administrator', email: 'admin@college.edu', initials: 'TA', role: 'Tenant Admin', team: 'Administration', access: ['All modules'] }];
  const source = users.length ? users : fallback;
  const rows = source.filter((user) => `${user.name} ${user.email} ${user.role} ${user.team}`.toLowerCase().includes(query.toLowerCase()));
  const [expandedRoles, setExpandedRoles] = useState<string[]>([]);
  const configuredRoles = Array.from(new Set(source.map((item) => item.role)));
  const roleGroups = configuredRoles
    .sort((left, right) => left.localeCompare(right))
    .map((role) => ({ role, users: rows.filter((user) => user.role === role) }))
    .filter((group) => group.users.length > 0);
  const toggleRole = (role: string) => {
    setExpandedRoles((current) => current.includes(role) ? current.filter((item) => item !== role) : [...current, role]);
  };

  return <>
    <MetricStrip items={[{ label: 'Active accounts', value: String(source.length), note: 'Across all portal families', icon: Users }, { label: 'Roles configured', value: String(configuredRoles.length), note: 'Tenant-scoped roles', icon: ShieldCheck }, { label: 'Access reviews due', value: '6', note: 'Complete before 31 Aug', icon: AlertTriangle, tone: 'warn' }, { label: 'Healthy sessions', value: '98%', note: 'No critical identity alerts', icon: KeyRound }]} />
    <div className="flex-1 bg-[var(--crm-card)]">
      <div className="flex items-center justify-between border-b border-[var(--crm-border)] px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold">{tab}</h2>
          <p className="text-[10px] text-[var(--crm-muted)]">Users grouped by their assigned tenant role</p>
        </div>
        <button type="button" onClick={() => notify('Access review started')} className="text-xs font-semibold underline">Start access review</button>
      </div>
      <div className="space-y-3 p-5">
        {roleGroups.map((group) => {
          const expanded = expandedRoles.includes(group.role);
          const teams = Array.from(new Set(group.users.map((user) => user.team))).join(', ');
          return <section key={group.role} className="overflow-hidden rounded-md border border-[var(--crm-border)]">
            <button
              type="button"
              onClick={() => toggleRole(group.role)}
              aria-expanded={expanded}
              className="flex min-h-16 w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-[var(--crm-panel)]"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-black text-white"><ShieldCheck size={16} /></span>
                <span className="min-w-0">
                  <strong className="block truncate text-sm font-semibold">{group.role}</strong>
                  <small className="block truncate text-[10px] text-[var(--crm-muted)]">{teams}</small>
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="rounded bg-[var(--crm-panel)] px-2.5 py-1 text-[10px] font-semibold">{group.users.length} {group.users.length === 1 ? 'user' : 'users'}</span>
                <ChevronDown size={16} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </span>
            </button>
            {expanded && <div className="overflow-x-auto border-t border-[var(--crm-border)]">
              <div className="grid min-w-[680px] grid-cols-[1.4fr_1fr_1.5fr_.6fr] bg-[var(--crm-panel)] px-4 py-2.5 text-[10px] uppercase tracking-wider text-[var(--crm-muted)]">
                <span>User</span><span>Team</span><span>Effective access</span><span>Status</span>
              </div>
              {group.users.map((row) => <button key={row.id} type="button" onClick={() => setSelected(row.id)} className={`grid min-w-[680px] w-full grid-cols-[1.4fr_1fr_1.5fr_.6fr] items-center border-t border-[var(--crm-border)] px-4 py-3 text-left text-xs hover:bg-[var(--crm-panel)] ${selected === row.id ? 'bg-[var(--crm-panel)]' : ''}`}>
                <span className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-black text-[10px] font-semibold text-white">{row.initials}</span><span className="min-w-0"><strong className="block truncate font-medium">{row.name}</strong><small className="block truncate text-[10px] text-[var(--crm-muted)]">{row.email}</small></span></span>
                <span className="truncate">{row.team}</span>
                <span className="flex gap-1 overflow-hidden">{row.access.slice(0, 3).map((access) => <span key={access} className="truncate rounded bg-[var(--crm-panel)] px-2 py-1 text-[9px]">{access}</span>)}</span>
                <span><Pill>Active</Pill></span>
              </button>)}
            </div>}
          </section>;
        })}
        {roleGroups.length === 0 && <div className="grid min-h-40 place-items-center border border-dashed border-[var(--crm-border)] text-xs text-[var(--crm-muted)]">No roles or users match this search.</div>}
      </div>
    </div>
  </>;
}
