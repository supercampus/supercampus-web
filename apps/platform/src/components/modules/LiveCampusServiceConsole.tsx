'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChefHat,
  CircleDollarSign,
  ClipboardCheck,
  DoorOpen,
  LoaderCircle,
  Plus,
  QrCode,
  RefreshCw,
  Send,
  ShieldCheck,
  Store,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { ApiRequestError } from '@/lib/api';
import {
  createAttendanceReport,
  createAttendanceSession,
  createCanteenMenuItem,
  decideGatepass,
  deleteCanteenMenuItem,
  getAttendanceReports,
  getAttendanceRoster,
  getAttendanceSessions,
  getCanteenStore,
  getGatepassOverview,
  publishAttendanceSession,
  saveAttendanceEntries,
  scanCanteenOrder,
  scanGatepass,
  submitAttendanceReport,
  topUpCanteenWallet,
  updateCanteenOrder,
  updateCanteenStaffState,
  type AttendanceReport,
  type AttendanceSession,
  type AttendanceStudent,
  type CanteenStore,
  type GatepassOverview,
} from '@/lib/campus-operations-api';

export type LiveCampusService = 'attendance' | 'canteen' | 'gatepass';

const fieldClass = 'h-9 min-w-0 rounded-md border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 text-xs outline-none focus:border-[var(--crm-text)]';
const iconButtonClass = 'grid h-9 w-9 shrink-0 place-items-center rounded-md border border-[var(--crm-border)] bg-[var(--crm-card)] hover:bg-[var(--crm-panel)] disabled:cursor-not-allowed disabled:opacity-35';

function errorText(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 403) return 'This role does not have permission for this operation. Grant the required workflow in Access Control.';
    if (error.status === 401) return 'Your session expired. Sign in again.';
    return error.message;
  }
  return 'The operation could not be completed.';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function StatePill({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex rounded-full border border-[var(--crm-border)] bg-[var(--crm-panel)] px-2 py-1 text-[9px] font-semibold uppercase">{children}</span>;
}

function Status({ loading, error, onRetry }: { loading: boolean; error: string | null; onRetry: () => void }) {
  if (loading) return <div className="flex min-h-64 items-center justify-center gap-2 text-xs text-[var(--crm-muted)]"><LoaderCircle className="animate-spin" size={16} />Loading live operations...</div>;
  if (!error) return null;
  return <div role="alert" className="m-5 flex items-center justify-between gap-4 rounded-md border border-red-200 bg-red-50 p-4 text-xs text-red-800"><span>{error}</span><button type="button" onClick={onRetry} className="inline-flex h-9 items-center gap-2 rounded-md border border-red-200 bg-white px-3 font-semibold"><RefreshCw size={14} />Retry</button></div>;
}

export function LiveCampusServiceConsole({ service, query = '' }: { service: LiveCampusService; query?: string }) {
  if (service === 'canteen') return <CanteenConsole query={query} />;
  if (service === 'gatepass') return <GatepassConsole query={query} />;
  return <AttendanceConsole query={query} />;
}

function CanteenConsole({ query }: { query: string }) {
  const [store, setStore] = useState<CanteenStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<'orders' | 'menu' | 'wallet' | 'scanner'>('orders');
  const [qr, setQr] = useState('');
  const [wallet, setWallet] = useState({ userId: '', amount: '', reference: '' });
  const [menu, setMenu] = useState({ name: '', category: 'meals', price: '', prepMinutes: '10' });

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try { setStore((await getCanteenStore()).data); setError(null); } catch (cause) { setError(errorText(cause)); }
    finally { if (!quiet) setLoading(false); }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(true), 3000);
    return () => window.clearInterval(timer);
  }, [load]);

  const act = async (operation: () => Promise<unknown>) => {
    setBusy(true);
    try { await operation(); await load(true); setError(null); } catch (cause) { setError(errorText(cause)); }
    finally { setBusy(false); }
  };
  const orders = useMemo(() => (store?.orders ?? []).filter((item) => `${item.customerName} ${item.orderNumber} ${item.status}`.toLowerCase().includes(query.toLowerCase())), [store, query]);
  const analytics = store?.analytics;

  return <div className="flex-1 bg-[var(--crm-card)]">
    <Status loading={loading} error={!store ? error : null} onRetry={() => void load()} />
    {store && <>
      {error && <div className="border-b border-red-200 bg-red-50 px-5 py-2 text-[11px] text-red-800">{error}</div>}
      <div className="grid border-b border-[var(--crm-border)] sm:grid-cols-4">
        {[[Store, 'Shop', store.staffState.shopOpen === false ? 'Closed' : 'Open'], [ChefHat, 'Pending orders', String(analytics?.pending ?? orders.filter((order) => !['completed', 'rejected'].includes(order.status)).length)], [CircleDollarSign, 'Revenue today', `${Number(analytics?.revenueToday ?? 0).toFixed(2)} cr`], [ClipboardCheck, 'Orders today', String(analytics?.ordersToday ?? orders.length)]].map(([Icon, label, value]) => <div key={String(label)} className="flex items-center gap-3 border-r border-[var(--crm-border)] px-5 py-4"><span className="grid h-9 w-9 place-items-center rounded-md bg-[var(--crm-panel)]"><Icon size={16} /></span><span><small className="block text-[10px] text-[var(--crm-muted)]">{String(label)}</small><strong className="text-sm">{String(value)}</strong></span></div>)}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--crm-border)] px-5 py-3">
        <div className="flex rounded-md border border-[var(--crm-border)] bg-[var(--crm-panel)] p-1">{(['orders', 'menu', 'wallet', 'scanner'] as const).map((item) => <button key={item} type="button" onClick={() => setView(item)} className={`h-8 rounded px-3 text-[10px] font-semibold capitalize ${view === item ? 'bg-[var(--crm-card)] shadow-sm' : ''}`}>{item}</button>)}</div>
        <div className="flex items-center gap-2"><span className="text-[10px] text-[var(--crm-muted)]">Mode</span>{(['eat', 'work'] as const).map((mode) => <button key={mode} type="button" disabled={busy} onClick={() => void act(() => updateCanteenStaffState(mode))} className={`h-8 rounded-md px-3 text-[10px] font-semibold capitalize ${store.staffState.mode === mode ? 'bg-black text-white' : 'border border-[var(--crm-border)]'}`}>{mode}</button>)}{store.canManage && <button type="button" disabled={busy} onClick={() => void act(() => updateCanteenStaffState(store.staffState.mode, store.staffState.shopOpen === false))} className="h-8 rounded-md border border-[var(--crm-border)] px-3 text-[10px] font-semibold">{store.staffState.shopOpen === false ? 'Open shop' : 'Close shop'}</button>}</div>
      </div>
      {view === 'orders' && <div className="overflow-x-auto"><div className="grid min-w-[850px] grid-cols-[.7fr_1.1fr_1.4fr_.7fr_.8fr_1.1fr] border-b border-[var(--crm-border)] px-5 py-3 text-[10px] uppercase text-[var(--crm-muted)]"><span>Order</span><span>Customer</span><span>Items</span><span>Total</span><span>Status</span><span>Actions</span></div>{orders.map((order) => <div key={order.id} className="grid min-w-[850px] grid-cols-[.7fr_1.1fr_1.4fr_.7fr_.8fr_1.1fr] items-center border-b border-[var(--crm-border)] px-5 py-4 text-xs"><span>#{order.orderNumber}</span><span>{order.customerName}</span><span className="truncate">{order.lines.map((line) => `${line.quantity}x ${line.name}`).join(', ')}</span><strong>{order.total.toFixed(2)}</strong><span><StatePill>{order.status}</StatePill></span><span className="flex gap-1"><button title="Accept order" aria-label="Accept order" disabled={busy || order.status !== 'pending'} onClick={() => void act(() => updateCanteenOrder(order.id, 'accepted'))} className={iconButtonClass}><Check size={15} /></button><button title="Mark ready" aria-label="Mark ready" disabled={busy || !['accepted', 'preparing'].includes(order.status)} onClick={() => void act(() => updateCanteenOrder(order.id, 'ready'))} className={iconButtonClass}><ChefHat size={15} /></button><button title="Complete order" aria-label="Complete order" disabled={busy || order.status !== 'ready'} onClick={() => void act(() => updateCanteenOrder(order.id, 'completed'))} className={iconButtonClass}><ClipboardCheck size={15} /></button><button title="Reject and refund" aria-label="Reject and refund" disabled={busy || ['completed', 'rejected'].includes(order.status)} onClick={() => void act(() => updateCanteenOrder(order.id, 'rejected', 'Rejected by canteen'))} className={`${iconButtonClass} text-red-600`}><X size={15} /></button></span></div>)}</div>}
      {view === 'menu' && <div className="p-5"><form className="grid gap-2 border-b border-[var(--crm-border)] pb-5 md:grid-cols-[1.4fr_1fr_.7fr_.7fr_auto]" onSubmit={(event) => { event.preventDefault(); void act(async () => { await createCanteenMenuItem({ name: menu.name, description: '', category: menu.category, price: Number(menu.price), prepMinutes: Number(menu.prepMinutes), isVegetarian: true, isPopular: false, isAvailable: true }); setMenu({ name: '', category: 'meals', price: '', prepMinutes: '10' }); }); }}><input required className={fieldClass} placeholder="Item name" value={menu.name} onChange={(event) => setMenu({ ...menu, name: event.target.value })}/><select className={fieldClass} value={menu.category} onChange={(event) => setMenu({ ...menu, category: event.target.value })}><option value="meals">Meals</option><option value="snacks">Snacks</option><option value="drinks">Drinks</option></select><input required min="0" step="0.01" type="number" className={fieldClass} placeholder="Price" value={menu.price} onChange={(event) => setMenu({ ...menu, price: event.target.value })}/><input required min="1" type="number" className={fieldClass} title="Preparation minutes" value={menu.prepMinutes} onChange={(event) => setMenu({ ...menu, prepMinutes: event.target.value })}/><button disabled={busy} title="Add menu item" aria-label="Add menu item" className={`${iconButtonClass} bg-black text-white`}><Plus size={16}/></button></form><div className="grid gap-2 pt-4 md:grid-cols-2 xl:grid-cols-3">{store.menu.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 rounded-md border border-[var(--crm-border)] p-3"><span className="min-w-0"><strong className="block truncate text-xs">{item.name}</strong><small className="text-[10px] text-[var(--crm-muted)]">{item.category} · {item.price.toFixed(2)} cr · {item.prepMinutes} min</small></span><button title="Delete menu item" aria-label="Delete menu item" disabled={busy} onClick={() => void act(() => deleteCanteenMenuItem(item.id))} className={`${iconButtonClass} text-red-600`}><Trash2 size={14}/></button></div>)}</div></div>}
      {view === 'wallet' && <form className="mx-auto grid max-w-2xl gap-3 p-6" onSubmit={(event) => { event.preventDefault(); void act(async () => { await topUpCanteenWallet(wallet.userId, Number(wallet.amount), wallet.reference); setWallet({ userId: '', amount: '', reference: '' }); }); }}><h2 className="text-sm font-semibold">Manual wallet credit</h2><p className="text-[11px] text-[var(--crm-muted)]">Credits are committed to the tenant ledger and appear in the user app on its next live sync.</p><input required className={fieldClass} placeholder="User account ID" value={wallet.userId} onChange={(event) => setWallet({ ...wallet, userId: event.target.value })}/><div className="grid gap-3 sm:grid-cols-2"><input required type="number" min="0.01" step="0.01" className={fieldClass} placeholder="Amount" value={wallet.amount} onChange={(event) => setWallet({ ...wallet, amount: event.target.value })}/><input required className={fieldClass} placeholder="Receipt / reference" value={wallet.reference} onChange={(event) => setWallet({ ...wallet, reference: event.target.value })}/></div><button disabled={busy} className="h-10 rounded-md bg-black text-xs font-semibold text-white">Credit wallet</button></form>}
      {view === 'scanner' && <ScannerPanel value={qr} setValue={setQr} busy={busy} actions={[['Accept', () => act(() => scanCanteenOrder(qr, 'accepted'))], ['Reject', () => act(() => scanCanteenOrder(qr, 'rejected'))], ['Complete', () => act(() => scanCanteenOrder(qr, 'completed'))]]} />}
    </>}
  </div>;
}

function ScannerPanel({ value, setValue, busy, actions }: { value: string; setValue: (value: string) => void; busy: boolean; actions: Array<[string, () => void]> }) {
  return <div className="mx-auto grid max-w-2xl gap-3 p-6"><span className="grid h-12 w-12 place-items-center rounded-md bg-black text-white"><QrCode size={22}/></span><h2 className="text-sm font-semibold">QR scanner input</h2><p className="text-[11px] text-[var(--crm-muted)]">Use a connected scanner or paste the decoded QR payload.</p><input className={fieldClass} placeholder="Scan QR" value={value} onChange={(event) => setValue(event.target.value)}/><div className="flex flex-wrap gap-2">{actions.map(([label, action]) => <button key={label} type="button" disabled={busy || !value.trim()} onClick={action} className="h-9 rounded-md bg-black px-4 text-xs font-semibold text-white disabled:opacity-35">{label}</button>)}</div></div>;
}

function GatepassConsole({ query }: { query: string }) {
  const [data, setData] = useState<GatepassOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<'requests' | 'scanner' | 'movements'>('requests');
  const [scan, setScan] = useState({ qr: '', direction: 'exit' as 'entry' | 'exit', checkpoint: 'Main gate' });
  const load = useCallback(async (quiet = false) => { if (!quiet) setLoading(true); try { setData((await getGatepassOverview()).data); setError(null); } catch (cause) { setError(errorText(cause)); } finally { if (!quiet) setLoading(false); } }, []);
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(true), 3000); return () => window.clearInterval(timer); }, [load]);
  const act = async (operation: () => Promise<unknown>) => { setBusy(true); try { await operation(); await load(true); setError(null); } catch (cause) { setError(errorText(cause)); } finally { setBusy(false); } };
  const requests = useMemo(() => (data?.requests ?? []).filter((item) => `${item.requesterName} ${item.passType} ${item.state} ${item.destination}`.toLowerCase().includes(query.toLowerCase())), [data, query]);
  const pending = requests.filter((item) => item.state.startsWith('pending_'));
  const metrics = [
    { icon: DoorOpen, label: 'Awaiting decision', value: pending.length },
    { icon: ShieldCheck, label: 'Approved passes', value: requests.filter((item) => item.state === 'approved').length },
    { icon: QrCode, label: 'Gate movements', value: data?.movements.length ?? 0 },
  ];
  return <div className="flex-1 bg-[var(--crm-card)]"><Status loading={loading} error={!data ? error : null} onRetry={() => void load()} />{data && <>{error && <div className="border-b border-red-200 bg-red-50 px-5 py-2 text-[11px] text-red-800">{error}</div>}<div className="grid border-b border-[var(--crm-border)] sm:grid-cols-3">{metrics.map(({ icon: Icon, label, value }) => <div key={label} className="flex items-center gap-3 border-r border-[var(--crm-border)] px-5 py-4"><Icon size={17}/><span><small className="block text-[10px] text-[var(--crm-muted)]">{label}</small><strong>{value}</strong></span></div>)}</div><div className="flex gap-1 border-b border-[var(--crm-border)] px-5 py-3">{(['requests', 'scanner', 'movements'] as const).map((item) => <button key={item} onClick={() => setView(item)} className={`h-8 rounded-md px-3 text-[10px] font-semibold capitalize ${view === item ? 'bg-black text-white' : 'bg-[var(--crm-panel)]'}`}>{item}</button>)}</div>
    {view === 'requests' && <div className="overflow-x-auto"><div className="grid min-w-[900px] grid-cols-[1fr_.7fr_.8fr_1.1fr_1.1fr_.8fr] border-b border-[var(--crm-border)] px-5 py-3 text-[10px] uppercase text-[var(--crm-muted)]"><span>Requester</span><span>Pass</span><span>Residency</span><span>Travel</span><span>Reason</span><span>Decision</span></div>{requests.map((item) => <div key={item.id} className="grid min-w-[900px] grid-cols-[1fr_.7fr_.8fr_1.1fr_1.1fr_.8fr] items-center border-b border-[var(--crm-border)] px-5 py-4 text-xs"><strong>{item.requesterName}</strong><span>{item.passType.replace('_', ' ')}</span><span>{item.residency}</span><span><small className="block">{item.destination}</small><small className="text-[9px] text-[var(--crm-muted)]">{formatDate(item.departureAt)}</small></span><span className="truncate">{item.reason}</span><span className="flex items-center gap-1">{item.state.startsWith('pending_') && data.canManage ? <><button title="Approve" aria-label="Approve pass" disabled={busy} onClick={() => void act(() => decideGatepass(item.id, 'approved'))} className={iconButtonClass}><Check size={15}/></button><button title="Reject" aria-label="Reject pass" disabled={busy} onClick={() => void act(() => decideGatepass(item.id, 'rejected', 'Rejected by reviewer'))} className={`${iconButtonClass} text-red-600`}><X size={15}/></button></> : <StatePill>{item.state.replaceAll('_', ' ')}</StatePill>}</span></div>)}</div>}
    {view === 'scanner' && <div className="mx-auto grid max-w-2xl gap-3 p-6"><QrCode size={28}/><h2 className="text-sm font-semibold">Gate scanner</h2><input className={fieldClass} placeholder="Scan pass or daily gate-in QR" value={scan.qr} onChange={(event) => setScan({ ...scan, qr: event.target.value })}/><div className="grid gap-3 sm:grid-cols-2"><select className={fieldClass} value={scan.direction} onChange={(event) => setScan({ ...scan, direction: event.target.value as 'entry' | 'exit' })}><option value="entry">Gate in</option><option value="exit">Gate out</option></select><input className={fieldClass} value={scan.checkpoint} onChange={(event) => setScan({ ...scan, checkpoint: event.target.value })}/></div><button disabled={busy || !scan.qr.trim()} onClick={() => void act(() => scanGatepass(scan.qr, scan.direction, scan.checkpoint))} className="h-10 rounded-md bg-black text-xs font-semibold text-white disabled:opacity-35">Record movement</button></div>}
    {view === 'movements' && <div>{data.movements.map((item) => <div key={item.id} className="grid grid-cols-[1fr_.7fr_1fr_1fr] border-b border-[var(--crm-border)] px-5 py-4 text-xs"><span className="font-mono text-[10px]">{item.userId}</span><StatePill>{item.direction}</StatePill><span>{item.checkpoint}</span><span className="text-[var(--crm-muted)]">{formatDate(item.createdAt)}</span></div>)}</div>}</>}</div>;
}

function AttendanceConsole({ query }: { query: string }) {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [students, setStudents] = useState<AttendanceStudent[]>([]);
  const [reports, setReports] = useState<AttendanceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<'sessions' | 'reports'>('sessions');
  const [selected, setSelected] = useState<string>('');
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [sessionForm, setSessionForm] = useState({ subject: '', period: '', date: new Date().toISOString().slice(0, 10) });
  const [reportForm, setReportForm] = useState({ title: '', start: new Date().toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) });
  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const [sessionResult, rosterResult, reportResult] = await Promise.allSettled([getAttendanceSessions(), getAttendanceRoster(), getAttendanceReports()]);
      if (sessionResult.status === 'fulfilled') setSessions(sessionResult.value.data.sessions);
      if (rosterResult.status === 'fulfilled') setStudents(rosterResult.value.data.students);
      if (reportResult.status === 'fulfilled') setReports(reportResult.value.data.reports);
      const rejected = [sessionResult, rosterResult, reportResult].find((result) => result.status === 'rejected');
      setError(rejected?.status === 'rejected' ? errorText(rejected.reason) : null);
    } finally { if (!quiet) setLoading(false); }
  }, []);
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(true), 3000); return () => window.clearInterval(timer); }, [load]);
  useEffect(() => { setMarks(Object.fromEntries(students.map((student) => [student.studentUserId, 'present']))); }, [students]);
  const act = async (operation: () => Promise<unknown>) => { setBusy(true); try { await operation(); await load(true); setError(null); } catch (cause) { setError(errorText(cause)); } finally { setBusy(false); } };
  const filtered = sessions.filter((item) => `${item.subjectName} ${item.periodLabel} ${item.status}`.toLowerCase().includes(query.toLowerCase()));
  const active = sessions.find((item) => item.id === selected);
  const metrics = [
    { icon: ClipboardCheck, label: 'Sessions', value: sessions.length },
    { icon: Users, label: 'Roster', value: students.length },
    { icon: UserCheck, label: 'Published', value: sessions.filter((item) => item.status !== 'draft').length },
    { icon: Send, label: 'Reports', value: reports.length },
  ];
  return <div className="flex-1 bg-[var(--crm-card)]"><Status loading={loading} error={!sessions.length && !!error ? error : null} onRetry={() => void load()} />{!loading && <>{error && <div className="border-b border-amber-200 bg-amber-50 px-5 py-2 text-[11px] text-amber-800">{error}</div>}<div className="grid border-b border-[var(--crm-border)] sm:grid-cols-4">{metrics.map(({ icon: Icon, label, value }) => <div key={label} className="flex items-center gap-3 border-r border-[var(--crm-border)] px-5 py-4"><Icon size={17}/><span><small className="block text-[10px] text-[var(--crm-muted)]">{label}</small><strong>{value}</strong></span></div>)}</div><div className="flex gap-1 border-b border-[var(--crm-border)] px-5 py-3">{(['sessions', 'reports'] as const).map((item) => <button key={item} onClick={() => setView(item)} className={`h-8 rounded-md px-3 text-[10px] font-semibold capitalize ${view === item ? 'bg-black text-white' : 'bg-[var(--crm-panel)]'}`}>{item}</button>)}</div>
    {view === 'sessions' && <div className="grid min-h-[520px] xl:grid-cols-[340px_minmax(0,1fr)]"><aside className="border-r border-[var(--crm-border)] p-4"><form className="grid gap-2 border-b border-[var(--crm-border)] pb-4" onSubmit={(event) => { event.preventDefault(); void act(async () => { await createAttendanceSession(sessionForm.subject, sessionForm.date, sessionForm.period); setSessionForm({ ...sessionForm, subject: '', period: '' }); }); }}><input required className={fieldClass} placeholder="Subject" value={sessionForm.subject} onChange={(event) => setSessionForm({ ...sessionForm, subject: event.target.value })}/><div className="grid grid-cols-2 gap-2"><input required className={fieldClass} placeholder="Period" value={sessionForm.period} onChange={(event) => setSessionForm({ ...sessionForm, period: event.target.value })}/><input required type="date" className={fieldClass} value={sessionForm.date} onChange={(event) => setSessionForm({ ...sessionForm, date: event.target.value })}/></div><button disabled={busy} className="h-9 rounded-md bg-black text-xs font-semibold text-white">Create class</button></form><div className="mt-3 space-y-2">{filtered.map((item) => <button key={item.id} onClick={() => setSelected(item.id)} className={`w-full rounded-md border p-3 text-left ${selected === item.id ? 'border-black bg-[var(--crm-panel)]' : 'border-[var(--crm-border)]'}`}><div className="flex justify-between gap-3"><strong className="truncate text-xs">{item.subjectName}</strong><StatePill>{item.status}</StatePill></div><small className="mt-1 block text-[10px] text-[var(--crm-muted)]">{item.heldOn} · {item.periodLabel}</small></button>)}</div></aside><main className="min-w-0 p-5">{active ? <><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-semibold">{active.subjectName}</h2><p className="text-[10px] text-[var(--crm-muted)]">Mark attendance, save the roster, then publish it to the HOD.</p></div><div className="flex gap-2"><button disabled={busy || active.status !== 'draft'} onClick={() => void act(() => saveAttendanceEntries(active.id, students.map((student) => ({ studentUserId: student.studentUserId, studentName: student.studentName, status: marks[student.studentUserId] ?? 'present' }))))} className="h-9 rounded-md border border-[var(--crm-border)] px-4 text-xs font-semibold disabled:opacity-35">Save roster</button><button disabled={busy || active.status !== 'draft'} onClick={() => void act(() => publishAttendanceSession(active.id))} className="h-9 rounded-md bg-black px-4 text-xs font-semibold text-white disabled:opacity-35">Publish to HOD</button></div></div><div className="overflow-x-auto rounded-md border border-[var(--crm-border)]"><div className="grid min-w-[620px] grid-cols-[.8fr_1.4fr_1fr] bg-[var(--crm-panel)] px-4 py-3 text-[10px] uppercase text-[var(--crm-muted)]"><span>Roll no</span><span>Student</span><span>Status</span></div>{students.map((student) => <div key={student.studentUserId} className="grid min-w-[620px] grid-cols-[.8fr_1.4fr_1fr] items-center border-t border-[var(--crm-border)] px-4 py-3 text-xs"><span>{student.studentNumber}</span><strong>{student.studentName}</strong><span className="flex gap-1">{['present', 'absent', 'od', 'leave'].map((status) => <button key={status} disabled={active.status !== 'draft'} onClick={() => setMarks({ ...marks, [student.studentUserId]: status })} className={`h-7 rounded px-2 text-[9px] font-semibold uppercase ${marks[student.studentUserId] === status ? 'bg-black text-white' : 'bg-[var(--crm-panel)]'}`}>{status === 'present' ? 'P' : status === 'absent' ? 'A' : status.toUpperCase()}</button>)}</span></div>)}</div></> : <div className="grid min-h-80 place-items-center text-xs text-[var(--crm-muted)]">Select or create a class session.</div>}</main></div>}
    {view === 'reports' && <div className="grid gap-5 p-5 xl:grid-cols-[360px_minmax(0,1fr)]"><form className="grid content-start gap-2 rounded-md border border-[var(--crm-border)] p-4" onSubmit={(event) => { event.preventDefault(); void act(async () => { await createAttendanceReport(reportForm.title, reportForm.start, reportForm.end); setReportForm({ ...reportForm, title: '' }); }); }}><h2 className="text-sm font-semibold">HOD report</h2><input required className={fieldClass} placeholder="Report title" value={reportForm.title} onChange={(event) => setReportForm({ ...reportForm, title: event.target.value })}/><div className="grid grid-cols-2 gap-2"><input type="date" className={fieldClass} value={reportForm.start} onChange={(event) => setReportForm({ ...reportForm, start: event.target.value })}/><input type="date" className={fieldClass} value={reportForm.end} onChange={(event) => setReportForm({ ...reportForm, end: event.target.value })}/></div><button disabled={busy} className="h-9 rounded-md bg-black text-xs font-semibold text-white">Generate report</button></form><div className="space-y-2">{reports.map((report) => <div key={report.id} className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-[var(--crm-border)] p-4"><span><strong className="block text-xs">{report.title}</strong><small className="text-[10px] text-[var(--crm-muted)]">{report.periodStart} to {report.periodEnd} · {report.summary.present ?? 0} present · {report.summary.absent ?? 0} absent</small></span><span className="flex items-center gap-2"><StatePill>{report.status}</StatePill>{report.status !== 'submitted_to_principal' && <button title="Submit to principal" aria-label="Submit report to principal" disabled={busy} onClick={() => void act(() => submitAttendanceReport(report.id))} className={iconButtonClass}><Send size={14}/></button>}</span></div>)}</div></div>}</>}</div>;
}
