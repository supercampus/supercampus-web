'use client';

import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, Bell, Building2, CircleDollarSign, Database, FileClock,
  Headphones, LayoutDashboard, LogOut, Menu, Plus, RefreshCw, Search, Server,
  Settings, ShieldCheck, Users, X,
} from 'lucide-react';
import { useApp } from '@/lib/context';
import {
  AuditEvent, PlatformOverview, PlatformPayment, PlatformTenant, PlatformUser, SupportTicket,
  createPlatformTeamMember, createPlatformTenant, getAuditEvents, getPlatformOverview,
  getPlatformPayments, getPlatformTenants, getPlatformUsers, getSupportTickets,
  updatePlatformTenant, updatePlatformUser, updateSupportTicket,
} from '@/lib/platform-admin-api';
import styles from './SuperAdminPortal.module.css';

type Section = 'overview' | 'tenants' | 'users' | 'support' | 'payments' | 'audit' | 'infrastructure' | 'settings';
type Modal = 'tenant' | 'team' | null;

const navigation: Array<{ id: Section; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'tenants', label: 'Tenants', icon: Building2 },
  { id: 'users', label: 'Users & team', icon: Users },
  { id: 'support', label: 'Support inbox', icon: Headphones },
  { id: 'payments', label: 'Payments', icon: CircleDollarSign },
  { id: 'audit', label: 'Audit activity', icon: FileClock },
  { id: 'infrastructure', label: 'Infrastructure', icon: Server },
  { id: 'settings', label: 'Platform settings', icon: Settings },
];

const money = (paise: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100);
const compactBytes = (bytes = 0) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index > 1 ? 1 : 0)} ${units[index]}`;
};
const relativeDate = (value: string | null) => value ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Never';

export default function SuperAdminPortal() {
  const { student, logout } = useApp();
  const [section, setSection] = useState<Section>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [payments, setPayments] = useState<PlatformPayment[]>([]);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const common = getPlatformOverview();
      if (section === 'overview' || section === 'infrastructure') setOverview(await common);
      else if (section === 'tenants') setTenants((await getPlatformTenants()).tenants);
      else if (section === 'users') setUsers((await getPlatformUsers()).users);
      else if (section === 'support') setTickets((await getSupportTickets()).tickets);
      else if (section === 'payments') setPayments((await getPlatformPayments()).payments);
      else if (section === 'audit') setEvents((await getAuditEvents()).events);
      else await common.then(setOverview);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to load platform data'); }
    finally { setLoading(false); }
  }, [section]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const title = navigation.find((item) => item.id === section)?.label ?? 'Overview';
  const normalizedQuery = query.trim().toLowerCase();
  const shownTenants = useMemo(() => tenants.filter((tenant) => !normalizedQuery || `${tenant.name} ${tenant.slug} ${tenant.code}`.toLowerCase().includes(normalizedQuery)), [tenants, normalizedQuery]);
  const shownUsers = useMemo(() => users.filter((user) => !normalizedQuery || `${user.name} ${user.email}`.toLowerCase().includes(normalizedQuery)), [users, normalizedQuery]);

  return (
    <div className={styles.shell}>
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.brand}><span className={styles.brandMark}>S</span><div><strong>SuperCampus</strong><small>Control center</small></div><button className={styles.mobileClose} onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X size={19}/></button></div>
        <div className={styles.environment}><span/><div><strong>Production</strong><small>All systems monitored</small></div></div>
        <nav className={styles.nav}>
          {navigation.map((item) => <button key={item.id} className={section === item.id ? styles.activeNav : ''} onClick={() => { setSection(item.id); setSidebarOpen(false); setQuery(''); }}><item.icon size={18}/><span>{item.label}</span>{item.id === 'support' && overview?.support.open ? <b>{overview.support.open}</b> : null}</button>)}
        </nav>
        <div className={styles.profile}><span>{student?.initials || 'SC'}</span><div><strong>{student?.name}</strong><small>Platform Super Admin</small></div><button onClick={() => void logout()} aria-label="Sign out"><LogOut size={17}/></button></div>
      </aside>
      {sidebarOpen && <button className={styles.backdrop} onClick={() => setSidebarOpen(false)} aria-label="Close navigation"/>}

      <main className={styles.main}>
        <header className={styles.topbar}>
          <button className={styles.menuButton} onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu size={20}/></button>
          <div><p>SuperCampus operations</p><h1>{title}</h1></div>
          <div className={styles.topActions}><div className={styles.live}><span/>Live</div><button aria-label="Notifications"><Bell size={19}/><i/></button><button onClick={() => void refresh()} aria-label="Refresh"><RefreshCw size={18} className={loading ? styles.spin : ''}/></button></div>
        </header>

        <div className={styles.content}>
          {error && <div className={styles.error}><span>{error}</span><button onClick={() => void refresh()}>Retry</button></div>}
          {section === 'overview' && <Overview overview={overview} loading={loading} onNavigate={setSection}/>} 
          {section === 'tenants' && <Tenants tenants={shownTenants} query={query} setQuery={setQuery} loading={loading} onCreate={() => setModal('tenant')} onToggle={async (tenant) => { await updatePlatformTenant(tenant.id, tenant.status === 'active' ? 'suspended' : 'active'); await refresh(); }}/>} 
          {section === 'users' && <UsersView users={shownUsers} query={query} setQuery={setQuery} loading={loading} onCreate={() => setModal('team')} onToggle={async (user) => { await updatePlatformUser(user.id, !user.active); await refresh(); }}/>} 
          {section === 'support' && <Support tickets={tickets} loading={loading} onUpdate={async (ticket, status) => { await updateSupportTicket(ticket.id, status, ticket.priority); await refresh(); }}/>} 
          {section === 'payments' && <Payments payments={payments} loading={loading}/>} 
          {section === 'audit' && <Audit events={events} loading={loading}/>} 
          {section === 'infrastructure' && <Infrastructure overview={overview} loading={loading}/>} 
          {section === 'settings' && <SettingsView/>}
        </div>
      </main>
      {modal === 'tenant' && <TenantModal onClose={() => setModal(null)} onSaved={async () => { setModal(null); await refresh(); }}/>} 
      {modal === 'team' && <TeamModal onClose={() => setModal(null)} onSaved={async () => { setModal(null); await refresh(); }}/>} 
    </div>
  );
}

function Overview({ overview, loading, onNavigate }: { overview: PlatformOverview | null; loading: boolean; onNavigate: (value: Section) => void }) {
  if (loading && !overview) return <Loading/>;
  const cards = [
    { label: 'Active tenants', value: overview?.tenants.active ?? 0, sub: `${overview?.tenants.total ?? 0} total`, icon: Building2, tone: 'blue' },
    { label: 'Active users', value: overview?.users.active ?? 0, sub: `${overview?.users.total ?? 0} accounts`, icon: Users, tone: 'purple' },
    { label: 'Open support', value: overview?.support.open ?? 0, sub: `${overview?.support.urgent ?? 0} urgent`, icon: Headphones, tone: 'amber' },
    { label: 'Payments captured', value: money(overview?.payments.capturedPaise ?? 0), sub: `${overview?.payments.paid ?? 0} successful`, icon: CircleDollarSign, tone: 'green' },
  ];
  return <>
    <section className={styles.hero}><div><span className={styles.kicker}><ShieldCheck size={15}/> Platform overview</span><h2>Everything across SuperCampus, in one secure workspace.</h2><p>Monitor institutions, identity, infrastructure, support and collections without entering a tenant workspace.</p></div><button onClick={() => onNavigate('tenants')}><Plus size={17}/> Create tenant</button></section>
    <section className={styles.metrics}>{cards.map((card) => <article key={card.label}><div className={`${styles.metricIcon} ${styles[card.tone]}`}><card.icon size={20}/></div><p>{card.label}</p><strong>{card.value}</strong><small>{card.sub}</small></article>)}</section>
    <section className={styles.gridTwo}>
      <article className={styles.panel}><PanelTitle title="Platform health" subtitle="Live application and storage signals"/><div className={styles.healthRows}><HealthRow label="Platform API" value="Operational"/><HealthRow label="PostgreSQL" value={overview?.database.status ?? 'Checking'}/><HealthRow label="Host runtime" value={overview?.server.status ?? 'Checking'}/><HealthRow label="Database connections" value={`${overview?.database.connections ?? 0} open`}/></div><button className={styles.linkButton} onClick={() => onNavigate('infrastructure')}>Open infrastructure <span>→</span></button></article>
      <article className={styles.panel}><PanelTitle title="Operations pulse" subtitle="Items that need team attention"/><div className={styles.pulse}><div><b className={styles.urgent}>{overview?.support.urgent ?? 0}</b><span>Urgent tickets</span></div><div><b>{(overview?.tenants.total ?? 0) - (overview?.tenants.active ?? 0)}</b><span>Suspended tenants</span></div><div><b>{(overview?.users.total ?? 0) - (overview?.users.active ?? 0)}</b><span>Inactive users</span></div></div><button className={styles.linkButton} onClick={() => onNavigate('support')}>Review support inbox <span>→</span></button></article>
    </section>
  </>;
}

function Tenants({ tenants, query, setQuery, loading, onCreate, onToggle }: { tenants: PlatformTenant[]; query: string; setQuery: (v: string) => void; loading: boolean; onCreate: () => void; onToggle: (t: PlatformTenant) => Promise<void> }) {
  return <section className={styles.panel}><ListHeader title="Tenant directory" subtitle="Create, monitor and control every institution" query={query} setQuery={setQuery} action="New tenant" onAction={onCreate}/>{loading ? <Loading/> : <div className={styles.table}><div className={styles.tableHead}><span>Institution</span><span>Users</span><span>Support</span><span>Status</span><span>Action</span></div>{tenants.map((tenant) => <div className={styles.tableRow} key={tenant.id}><span className={styles.primaryCell}><i>{tenant.code.slice(0,2)}</i><span><strong>{tenant.name}</strong><small>/{tenant.slug} · {tenant.city || 'No city'}</small></span></span><span>{tenant.users}</span><span>{tenant.openSupport}</span><span><Status value={tenant.status}/></span><span><button className={styles.rowAction} onClick={() => void onToggle(tenant)}>{tenant.status === 'active' ? 'Suspend' : 'Activate'}</button></span></div>)}</div>}</section>;
}

function UsersView({ users, query, setQuery, loading, onCreate, onToggle }: { users: PlatformUser[]; query: string; setQuery:(v:string)=>void; loading:boolean; onCreate:()=>void; onToggle:(u:PlatformUser)=>Promise<void> }) {
  return <section className={styles.panel}><ListHeader title="User management" subtitle="Accounts and memberships across every tenant" query={query} setQuery={setQuery} action="Add team member" onAction={onCreate}/>{loading ? <Loading/> : <div className={styles.table}><div className={styles.tableHead}><span>User</span><span>Tenant</span><span>Role</span><span>Last login</span><span>Action</span></div>{users.map((user)=><div className={styles.tableRow} key={user.id}><span className={styles.primaryCell}><i>{user.name.split(' ').map(v=>v[0]).join('').slice(0,2)}</i><span><strong>{user.name}</strong><small>{user.email}</small></span></span><span>{user.memberships[0]?.name ?? '—'}</span><span>{user.memberships[0]?.roles?.[0]?.replaceAll('_',' ') ?? user.accountType}</span><span>{relativeDate(user.lastLoginAt)}</span><span><button className={styles.rowAction} onClick={()=>void onToggle(user)}>{user.active?'Deactivate':'Activate'}</button></span></div>)}</div>}</section>;
}

function Support({ tickets, loading, onUpdate }: { tickets: SupportTicket[]; loading:boolean; onUpdate:(t:SupportTicket,status:string)=>Promise<void> }) {
  return <section className={styles.panel}><PanelTitle title="Support inbox" subtitle="Prioritized issues from every campus"/>{loading?<Loading/>:<div className={styles.ticketGrid}>{tickets.length?tickets.map(ticket=><article className={styles.ticket} key={ticket.id}><div><Status value={ticket.priority}/><small>{relativeDate(ticket.createdAt)}</small></div><h3>{ticket.subject}</h3><p>{ticket.description||'No description was provided.'}</p><footer><span>{ticket.tenantName||'Platform'} · {ticket.requesterName||ticket.requesterEmail||'Unknown requester'}</span><select value={ticket.status} onChange={(e)=>void onUpdate(ticket,e.target.value)}><option value="open">Open</option><option value="in_progress">In progress</option><option value="waiting">Waiting</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></footer></article>):<Empty text="No support tickets yet."/>}</div>}</section>;
}

function Payments({ payments, loading }: { payments: PlatformPayment[]; loading:boolean }) { return <section className={styles.panel}><PanelTitle title="Payment ledger" subtitle="Guardian fee-payment links and settlement state"/>{loading?<Loading/>:<div className={styles.table}><div className={styles.tableHead}><span>Transaction</span><span>Tenant</span><span>Student</span><span>Amount</span><span>Status</span></div>{payments.map(payment=><div className={styles.tableRow} key={payment.id}><span className={styles.primaryCell}><i>₹</i><span><strong>{payment.providerReference}</strong><small>{relativeDate(payment.createdAt)}</small></span></span><span>{payment.tenantName}</span><span>{payment.studentNumber}</span><span>{money(payment.amountPaise)}</span><span><Status value={payment.status}/></span></div>)}</div>}</section>; }
function Audit({ events, loading }: { events: AuditEvent[]; loading:boolean }) { return <section className={styles.panel}><PanelTitle title="Audit activity" subtitle="Immutable history of what changed, who changed it, and where"/>{loading?<Loading/>:<div className={styles.timeline}>{events.map(event=><div key={event.id}><span><FileClock size={16}/></span><section><strong>{event.action.replaceAll('.',' · ')}</strong><p>{event.actorName||'System'} in {event.tenantName}</p></section><time>{relativeDate(event.occurredAt)}</time></div>)}</div>}</section>; }

function Infrastructure({ overview, loading }: { overview:PlatformOverview|null; loading:boolean }) {
  if(loading&&!overview)return <Loading/>;
  const memoryPercent=overview?.server.memory?.totalBytes?Math.round((overview.server.memory.usedBytes/overview.server.memory.totalBytes)*100):0;
  return <><section className={styles.metrics}><article><div className={`${styles.metricIcon} ${styles.green}`}><Activity size={20}/></div><p>API status</p><strong>{overview?.server.status??'Unknown'}</strong><small>Observed {relativeDate(overview?.server.observedAt??null)}</small></article><article><div className={`${styles.metricIcon} ${styles.blue}`}><Server size={20}/></div><p>1-minute load</p><strong>{overview?.server.loadAverage1m?.toFixed(2)??'N/A'}</strong><small>Linux host average</small></article><article><div className={`${styles.metricIcon} ${styles.purple}`}><Database size={20}/></div><p>Database size</p><strong>{compactBytes(overview?.database.sizeBytes)}</strong><small>{overview?.database.connections??0} connections</small></article><article><div className={`${styles.metricIcon} ${styles.amber}`}><Activity size={20}/></div><p>Memory used</p><strong>{memoryPercent?`${memoryPercent}%`:'N/A'}</strong><small>{compactBytes(overview?.server.memory?.usedBytes)} of {compactBytes(overview?.server.memory?.totalBytes)}</small></article></section><section className={styles.gridTwo}><article className={styles.panel}><PanelTitle title="Database pool" subtitle="Current application connection pool"/><div className={styles.gauge}><span style={{width:`${Math.min(100,((overview?.database.poolSize??0)/10)*100)}%`}}/></div><div className={styles.gaugeLegend}><span>{overview?.database.poolSize??0} allocated</span><span>{overview?.database.poolIdle??0} idle</span></div></article><article className={styles.panel}><PanelTitle title="Security boundary" subtitle="Cross-tenant access controls"/><div className={styles.securityNote}><ShieldCheck size={26}/><div><strong>Platform role enforced by API</strong><p>Every control-plane request requires both the protected role and the platform-control portal family.</p></div></div></article></section></>;
}
function SettingsView(){return <section className={styles.gridTwo}><article className={styles.panel}><PanelTitle title="Control-plane settings" subtitle="Production safeguards"/><div className={styles.settingsRows}><label><span><strong>Cross-tenant audit</strong><small>Record privileged operational changes</small></span><input type="checkbox" checked readOnly/></label><label><span><strong>Database-backed identity</strong><small>No local or demo superadmin login</small></span><input type="checkbox" checked readOnly/></label><label><span><strong>Protected platform role</strong><small>Tenant admins cannot assign it</small></span><input type="checkbox" checked readOnly/></label></div></article><article className={styles.panel}><PanelTitle title="Deployment" subtitle="Runtime configuration"/><div className={styles.deployInfo}><code>NEXT_PUBLIC_API_URL</code><span>Platform API endpoint</span><code>PLATFORM_ADMIN_EMAIL</code><span>Initial operator email</span><code>PLATFORM_ADMIN_PASSWORD</code><span>Stored only as a deployment secret</span></div></article></section>}

function TenantModal({onClose,onSaved}:{onClose:()=>void;onSaved:()=>Promise<void>}){const [saving,setSaving]=useState(false);const [error,setError]=useState('');async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setSaving(true);setError('');const form=new FormData(event.currentTarget);try{await createPlatformTenant(Object.fromEntries(form.entries()) as Record<string,string>);await onSaved();}catch(e){setError(e instanceof Error?e.message:'Unable to create tenant');setSaving(false);}}return <ModalShell title="Create a tenant" subtitle="Provision the institution and its first tenant administrator." onClose={onClose}><form className={styles.form} onSubmit={submit}><label>Institution name<input name="name" required placeholder="Madras Engineering College"/></label><div><label>Tenant slug<input name="slug" required pattern="[a-z0-9-]+" placeholder="mec"/></label><label>Code<input name="code" required placeholder="MEC"/></label></div><label>City<input name="city" placeholder="Chennai"/></label><hr/><label>Administrator name<input name="adminName" required/></label><label>Administrator email<input name="adminEmail" type="email" required/></label><label>Temporary password<input name="adminPassword" type="password" minLength={8} required/></label>{error&&<p className={styles.formError}>{error}</p>}<footer><button type="button" onClick={onClose}>Cancel</button><button type="submit" disabled={saving}>{saving?'Creating...':'Create tenant'}</button></footer></form></ModalShell>}
function TeamModal({onClose,onSaved}:{onClose:()=>void;onSaved:()=>Promise<void>}){const [saving,setSaving]=useState(false);const [error,setError]=useState('');async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setSaving(true);setError('');const form=new FormData(event.currentTarget);try{await createPlatformTeamMember(Object.fromEntries(form.entries()) as Record<string,string>);await onSaved();}catch(e){setError(e instanceof Error?e.message:'Unable to add team member');setSaving(false);}}return <ModalShell title="Add operations team member" subtitle="This creates another platform-wide superadmin account." onClose={onClose}><form className={styles.form} onSubmit={submit}><label>Full name<input name="name" required/></label><label>Work email<input name="email" type="email" required/></label><label>Temporary password<input name="password" type="password" minLength={8} required/></label>{error&&<p className={styles.formError}>{error}</p>}<footer><button type="button" onClick={onClose}>Cancel</button><button type="submit" disabled={saving}>{saving?'Adding...':'Add team member'}</button></footer></form></ModalShell>}
function ModalShell({title,subtitle,onClose,children}:{title:string;subtitle:string;onClose:()=>void;children:ReactNode}){return <div className={styles.modalBackdrop}><section className={styles.modal} role="dialog" aria-modal="true"><header><div><h2>{title}</h2><p>{subtitle}</p></div><button onClick={onClose}><X size={20}/></button></header>{children}</section></div>}
function ListHeader({title,subtitle,query,setQuery,action,onAction}:{title:string;subtitle:string;query:string;setQuery:(v:string)=>void;action:string;onAction:()=>void}){return <div className={styles.listHeader}><PanelTitle title={title} subtitle={subtitle}/><div><label className={styles.search}><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search"/></label><button className={styles.primaryButton} onClick={onAction}><Plus size={17}/>{action}</button></div></div>}
function PanelTitle({title,subtitle}:{title:string;subtitle:string}){return <header className={styles.panelTitle}><div><h2>{title}</h2><p>{subtitle}</p></div></header>}
function Status({value}:{value:string}){return <span className={`${styles.status} ${styles[`status_${value}`]??''}`}>{value.replaceAll('_',' ')}</span>}
function HealthRow({label,value}:{label:string;value:string}){return <div><span><i/>{label}</span><strong>{value}</strong></div>}
function Loading(){return <div className={styles.loading}><RefreshCw size={20}/><span>Loading live data...</span></div>}
function Empty({text}:{text:string}){return <div className={styles.empty}>{text}</div>}
