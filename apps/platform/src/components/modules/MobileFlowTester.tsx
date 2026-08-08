'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Banknote,
  Bell,
  BookOpen,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  ClipboardCheck,
  Clock,
  CreditCard,
  FileCheck2,
  FileText,
  Home,
  Layers,
  ListChecks,
  LockKeyhole,
  MapPin,
  MessageCircle,
  PieChart,
  QrCode,
  ReceiptText,
  Search,
  Send,
  ShieldCheck,
  Upload,
  UserRound,
} from 'lucide-react';

type CrudAction = 'create' | 'read' | 'update' | 'delete';
type FlowStep = {
  id: string;
  order: number;
  title: string;
  description: string;
  type: string;
  crud: CrudAction[];
};
type ModuleFlow = {
  id: string;
  moduleKey: string;
  name: string;
  summary: string;
  steps: FlowStep[];
};
type ModuleFlowCatalog = {
  moduleKey: string;
  source: string;
  deliveryTargets: string[];
  overview: string;
  navigation: string[];
  workflows: ModuleFlow[];
};
type AppView = 'home' | 'module' | 'flow';
type Activity = {
  id: string;
  title: string;
  meta: string;
  status: string;
};

const featuredModules = [
  'student-self-service',
  'fees',
  'gatepass',
  'hostel',
  'attendance',
  'documents',
  'examinations',
  'transport',
  'library',
  'placement',
  'counselling-wellness',
  'feedback-grievance',
];

const moduleColors: Record<string, string> = {
  'student-self-service': '#0b3d2e',
  fees: '#de6b21',
  gatepass: '#24328a',
  hostel: '#7747b9',
  attendance: '#137c63',
  documents: '#326b9a',
  examinations: '#9b2441',
  transport: '#23615c',
  library: '#795c2f',
  placement: '#1f5f8b',
  'counselling-wellness': '#287a4f',
  'feedback-grievance': '#82572a',
};

function titleFromKey(value: string) {
  return value.split('-').map((part) => part.slice(0, 1).toUpperCase() + part.slice(1)).join(' ');
}

function primaryFor(moduleKey: string) {
  return moduleColors[moduleKey] ?? '#1f2a74';
}

function preferredFlow(catalog: ModuleFlowCatalog) {
  const names = ['profile', 'online-payment', 'gate-pass-request', 'room-allocation', 'attendance', 'document-repository-upload-and-delete'];
  return names.map((name) => catalog.workflows.find((flow) => flow.id.includes(name))).find(Boolean) ?? catalog.workflows[0];
}

function screenKind(step: FlowStep) {
  const text = `${step.title} ${step.description}`.toLowerCase();
  if (/login|authenticate/.test(text)) return 'login';
  if (/select|choose|pick|view outstanding|available/.test(text)) return 'select';
  if (/upload|document|file|photo|supporting/.test(text)) return 'upload';
  if (/payment|gateway|upi|card|net banking|fee/.test(text)) return 'payment';
  if (/receipt|certificate|id card|qr|barcode|pass/.test(text)) return 'receipt';
  if (/approve|approval|verify|verification|review|eligible|rejected/.test(text)) return 'approval';
  if (/notify|alert|reminder|message|email|sms/.test(text)) return 'notification';
  if (/report|analytics|insight|summary|metrics/.test(text)) return 'report';
  if (/map|route|gps|transport|boarding/.test(text)) return 'route';
  if (/profile|student|parent|medical|contact/.test(text)) return 'profile';
  return 'form';
}

function iconFor(kind: string) {
  if (kind === 'login') return LockKeyhole;
  if (kind === 'select') return ListChecks;
  if (kind === 'upload') return Upload;
  if (kind === 'payment') return CreditCard;
  if (kind === 'receipt') return QrCode;
  if (kind === 'approval') return ShieldCheck;
  if (kind === 'notification') return Bell;
  if (kind === 'report') return PieChart;
  if (kind === 'route') return MapPin;
  if (kind === 'profile') return UserRound;
  return FileText;
}

function StepIcon({ kind, size }: { kind: string; size: number }) {
  if (kind === 'login') return <LockKeyhole size={size} />;
  if (kind === 'select') return <ListChecks size={size} />;
  if (kind === 'upload') return <Upload size={size} />;
  if (kind === 'payment') return <CreditCard size={size} />;
  if (kind === 'receipt') return <QrCode size={size} />;
  if (kind === 'approval') return <ShieldCheck size={size} />;
  if (kind === 'notification') return <Bell size={size} />;
  if (kind === 'report') return <PieChart size={size} />;
  if (kind === 'route') return <MapPin size={size} />;
  if (kind === 'profile') return <UserRound size={size} />;
  return <FileText size={size} />;
}

function MobileFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#ded8d0] px-0 py-0 text-[#111111] sm:px-6 sm:py-8">
      <div className="mx-auto min-h-screen max-w-[430px] overflow-hidden bg-[#f9f6f1] shadow-2xl sm:min-h-[860px] sm:rounded-[34px] sm:border-[8px] sm:border-[#111111]">
        <div className="hidden h-7 items-center justify-center bg-[#111111] sm:flex">
          <div className="h-1.5 w-24 rounded-full bg-white/25" />
        </div>
        {children}
      </div>
    </main>
  );
}

function BottomNav({ active }: { active: string }) {
  const items = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'services', label: 'Services', icon: Layers },
    { id: 'updates', label: 'Updates', icon: Bell },
    { id: 'profile', label: 'Profile', icon: UserRound },
  ];
  return (
    <nav className="sticky bottom-0 grid grid-cols-4 border-t border-[#e0d6ca] bg-white px-2 py-2">
      {items.map((item) => {
        const Icon = item.icon;
        const selected = active === item.id;
        return (
          <button key={item.id} type="button" className={`grid justify-items-center gap-1 rounded-[14px] py-2 text-[11px] ${selected ? 'bg-[#eef7e8] text-[#0b3d2e]' : 'text-[#746a78]'}`}>
            <Icon size={18} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function HomeScreen({
  catalogs,
  query,
  setQuery,
  openModule,
}: {
  catalogs: ModuleFlowCatalog[];
  query: string;
  setQuery: (value: string) => void;
  openModule: (moduleKey: string) => void;
}) {
  const filtered = catalogs.filter((catalog) => `${catalog.moduleKey} ${catalog.navigation.join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <MobileFrame>
      <div className="bg-[#f9f6f1]">
        <header className="px-5 pb-4 pt-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[#796f7c]">SuperCampus</p>
              <h1 className="mt-1 text-[27px] leading-tight font-normal">Student App</h1>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-[16px] bg-[#0b3d2e] text-white">SC</div>
          </div>
          <label className="mt-5 flex h-12 items-center gap-2 rounded-[16px] border border-[#ddd3c8] bg-white px-3 text-sm text-[#746a78]">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search services" className="min-w-0 flex-1 bg-transparent outline-none" />
          </label>
        </header>

        <section className="px-5">
          <div className="rounded-[24px] bg-[#0b3d2e] p-5 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/70">Today</p>
                <h2 className="mt-1 text-[24px] leading-tight font-normal">3 pending actions</h2>
              </div>
              <BadgeCheck size={28} className="text-[#b9f43b]" />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {['Fees', 'Gate Pass', 'Documents'].map((item) => (
                <div key={item} className="rounded-[16px] bg-white/10 p-3">
                  <p className="text-[11px] text-white/60">{item}</p>
                  <p className="mt-1 text-lg">1</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-normal">Services</h2>
            <span className="text-xs text-[#746a78]">{filtered.length} modules</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {filtered.map((catalog) => {
              const Icon = iconFor(screenKind(preferredFlow(catalog)?.steps[0] ?? { title: '', description: '', id: '', order: 0, type: '', crud: [] }));
              return (
                <button key={catalog.moduleKey} type="button" onClick={() => openModule(catalog.moduleKey)} className="min-h-[118px] rounded-[22px] border border-[#e0d6ca] bg-white p-4 text-left shadow-sm">
                  <div className="grid h-10 w-10 place-items-center rounded-[14px] text-white" style={{ background: primaryFor(catalog.moduleKey) }}>
                    <Icon size={19} />
                  </div>
                  <p className="mt-3 text-[15px] leading-tight">{titleFromKey(catalog.moduleKey)}</p>
                  <p className="mt-1 text-xs text-[#746a78]">{catalog.workflows.length} flows</p>
                </button>
              );
            })}
          </div>
        </section>
      </div>
      <BottomNav active="home" />
    </MobileFrame>
  );
}

function ModuleScreen({
  catalog,
  openHome,
  openFlow,
}: {
  catalog: ModuleFlowCatalog;
  openHome: () => void;
  openFlow: (flowId: string) => void;
}) {
  return (
    <MobileFrame>
      <header className="px-5 pb-4 pt-5 text-white" style={{ background: primaryFor(catalog.moduleKey) }}>
        <button type="button" onClick={openHome} className="mb-5 grid h-10 w-10 place-items-center rounded-full bg-white/12">
          <ArrowLeft size={18} />
        </button>
        <p className="text-xs uppercase tracking-[0.16em] text-white/70">Module</p>
        <h1 className="mt-1 text-[28px] leading-tight font-normal">{titleFromKey(catalog.moduleKey)}</h1>
        <p className="mt-2 text-sm leading-6 text-white/74">{catalog.overview || 'Choose a real module journey and run it screen by screen.'}</p>
      </header>
      <section className="px-5 py-5">
        <h2 className="text-lg font-normal">Available flows</h2>
        <div className="mt-3 grid gap-3">
          {catalog.workflows.map((flow) => (
            <button key={flow.id} type="button" onClick={() => openFlow(flow.id)} className="rounded-[20px] border border-[#e0d6ca] bg-white p-4 text-left shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-base leading-tight">{flow.name}</p>
                  <p className="mt-1 text-xs leading-5 text-[#746a78]">{flow.summary}</p>
                </div>
                <ChevronRight size={18} className="text-[#746a78]" />
              </div>
              <div className="mt-3 flex gap-2">
                <span className="rounded-full bg-[#f4eee8] px-3 py-1 text-xs text-[#5f5562]">{flow.steps.length} screens</span>
                <span className="rounded-full bg-[#eef7e8] px-3 py-1 text-xs text-[#0b3d2e]">Mobile</span>
              </div>
            </button>
          ))}
        </div>
      </section>
      <BottomNav active="services" />
    </MobileFrame>
  );
}

function StepVisual({ step, moduleKey, completed }: { step: FlowStep; moduleKey: string; completed: boolean }) {
  const kind = screenKind(step);
  const color = primaryFor(moduleKey);

  if (kind === 'login') {
    return (
      <div className="rounded-[24px] bg-white p-4 shadow-sm">
        <div className="grid h-14 w-14 place-items-center rounded-[18px] text-white" style={{ background: color }}><StepIcon kind={kind} size={24} /></div>
        <h3 className="mt-5 text-xl font-normal">Secure login</h3>
        <div className="mt-4 grid gap-3">
          <div className="rounded-[14px] border border-[#e0d6ca] px-3 py-3 text-sm text-[#746a78]">Student ID / Mobile number</div>
          <div className="rounded-[14px] border border-[#e0d6ca] px-3 py-3 text-sm text-[#746a78]">One time password</div>
          <div className="rounded-[14px] py-3 text-center text-sm text-white" style={{ background: color }}>Continue</div>
        </div>
      </div>
    );
  }

  if (kind === 'select') {
    return (
      <div className="grid gap-3">
        {['Current academic year', 'Active semester', 'My department', 'Assigned category'].map((item, index) => (
          <button key={item} type="button" className={`rounded-[18px] border p-4 text-left ${index === 0 ? 'border-transparent text-white' : 'border-[#e0d6ca] bg-white'}`} style={index === 0 ? { background: color } : undefined}>
            <div className="flex items-center justify-between">
              <span>{item}</span>
              {index === 0 ? <Check size={17} /> : <ChevronRight size={17} />}
            </div>
            <p className={`mt-1 text-xs ${index === 0 ? 'text-white/70' : 'text-[#746a78]'}`}>{index === 0 ? 'Selected' : 'Tap to choose'}</p>
          </button>
        ))}
      </div>
    );
  }

  if (kind === 'upload') {
    return (
      <div className="rounded-[24px] bg-white p-4 shadow-sm">
        <div className="grid min-h-44 place-items-center rounded-[20px] border-2 border-dashed border-[#d8cfc5] bg-[#fbfaf8] p-5 text-center">
          <div>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-[18px] text-white" style={{ background: color }}><Camera size={23} /></div>
            <h3 className="mt-4 text-lg font-normal">Upload supporting file</h3>
            <p className="mt-1 text-xs leading-5 text-[#746a78]">PDF, image, certificate, receipt, or ID proof</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-[14px] bg-[#f4eee8] p-3 text-sm">Camera</div>
          <div className="rounded-[14px] bg-[#f4eee8] p-3 text-sm">Files</div>
        </div>
      </div>
    );
  }

  if (kind === 'payment') {
    return (
      <div className="rounded-[24px] bg-white p-4 shadow-sm">
        <div className="rounded-[20px] p-4 text-white" style={{ background: color }}>
          <p className="text-sm text-white/70">Outstanding</p>
          <p className="mt-1 text-[32px] leading-none">Rs. 24,500</p>
          <p className="mt-2 text-xs text-white/70">Due today / includes hostel and transport if enabled</p>
        </div>
        <div className="mt-4 grid gap-2">
          {['UPI', 'Card', 'Net banking'].map((item) => (
            <div key={item} className="flex items-center justify-between rounded-[16px] border border-[#e0d6ca] p-3">
              <span className="flex items-center gap-2"><Banknote size={17} />{item}</span>
              <ChevronRight size={16} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (kind === 'receipt') {
    return (
      <div className="rounded-[24px] bg-white p-4 text-center shadow-sm">
        <div className="mx-auto grid h-40 w-40 place-items-center rounded-[26px] bg-[#f4eee8]">
          <QrCode size={92} style={{ color }} />
        </div>
        <h3 className="mt-4 text-xl font-normal">Digital proof ready</h3>
        <p className="mt-1 text-sm text-[#746a78]">Receipt / certificate / pass generated for mobile wallet.</p>
        <div className="mt-4 rounded-[16px] bg-[#fbfaf8] p-3 text-left text-sm">
          <div className="flex justify-between"><span>ID</span><span>SC-{step.order}8274</span></div>
          <div className="mt-2 flex justify-between"><span>Status</span><span>Active</span></div>
        </div>
      </div>
    );
  }

  if (kind === 'approval') {
    return (
      <div className="grid gap-3">
        {['Submitted', 'Counselor / Staff review', 'Manager approval', 'Final status'].map((item, index) => (
          <div key={item} className="flex gap-3 rounded-[18px] bg-white p-4 shadow-sm">
            <div className={`grid h-9 w-9 place-items-center rounded-full text-white ${index <= 1 || completed ? '' : 'bg-[#d7cec4]'}`} style={index <= 1 || completed ? { background: color } : undefined}>
              {index <= 1 || completed ? <Check size={16} /> : <Clock size={16} />}
            </div>
            <div>
              <p className="text-sm">{item}</p>
              <p className="mt-1 text-xs text-[#746a78]">{index <= 1 || completed ? 'Completed' : 'Waiting'}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (kind === 'notification') {
    return (
      <div className="grid gap-3">
        {['Mobile push', 'Email', 'Parent alert'].map((item) => (
          <div key={item} className="flex items-center gap-3 rounded-[18px] bg-white p-4 shadow-sm">
            <div className="grid h-11 w-11 place-items-center rounded-[15px] text-white" style={{ background: color }}><Bell size={19} /></div>
            <div>
              <p className="text-sm">{item}</p>
              <p className="mt-1 text-xs text-[#746a78]">Ready to send status update</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (kind === 'report') {
    return (
      <div className="rounded-[24px] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-normal">Live summary</h3>
          <PieChart size={20} style={{ color }} />
        </div>
        <div className="mt-5 flex h-40 items-end gap-3">
          {[58, 82, 45, 72, 64, 91].map((height, index) => (
            <div key={index} className="flex-1 rounded-t-[14px]" style={{ height: `${height}%`, background: index === 3 ? color : '#e8dfd5' }} />
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {['Total', 'Pending', 'Done'].map((item, index) => (
            <div key={item} className="rounded-[14px] bg-[#fbfaf8] p-3">
              <p className="text-lg">{[128, 14, 96][index]}</p>
              <p className="text-[11px] text-[#746a78]">{item}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (kind === 'route') {
    return (
      <div className="rounded-[24px] bg-white p-4 shadow-sm">
        <div className="relative h-52 overflow-hidden rounded-[22px] bg-[#e6f0ed]">
          <div className="absolute left-6 top-8 h-32 w-64 rotate-[-18deg] rounded-full border-[10px] border-[#c7ddd5]" />
          <MapPin className="absolute left-14 top-16" size={28} style={{ color }} />
          <div className="absolute bottom-5 right-5 rounded-full px-4 py-2 text-sm text-white" style={{ background: color }}>Live</div>
        </div>
        <div className="mt-4 grid gap-2">
          <div className="rounded-[14px] bg-[#fbfaf8] p-3 text-sm">Route 4 / Main gate to Hostel</div>
          <div className="rounded-[14px] bg-[#fbfaf8] p-3 text-sm">Next stop: Library block</div>
        </div>
      </div>
    );
  }

  if (kind === 'profile') {
    return (
      <div className="rounded-[24px] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-16 w-16 place-items-center rounded-[22px] text-white" style={{ background: color }}>AM</div>
          <div>
            <h3 className="text-lg font-normal">Arjun Mehta</h3>
            <p className="text-sm text-[#746a78]">B.Tech CSE / 2026</p>
          </div>
        </div>
        <div className="mt-5 grid gap-2">
          {['Student name', 'Email address', 'Emergency contact', 'Department'].map((item, index) => (
            <div key={item} className="rounded-[14px] bg-[#fbfaf8] p-3">
              <p className="text-[11px] text-[#746a78]">{item}</p>
              <p className="mt-1 text-sm">{['Arjun Mehta', 'arjun@supercampus.edu', '+91 98765 43210', 'Computer Science'][index]}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] bg-white p-4 shadow-sm">
      <div className="grid h-14 w-14 place-items-center rounded-[18px] text-white" style={{ background: color }}><StepIcon kind={kind} size={23} /></div>
      <h3 className="mt-4 text-xl font-normal">{step.title}</h3>
      <div className="mt-4 grid gap-3">
        <div className="rounded-[14px] border border-[#e0d6ca] px-3 py-3 text-sm text-[#746a78]">Enter details</div>
        <div className="rounded-[14px] border border-[#e0d6ca] px-3 py-3 text-sm text-[#746a78]">Add remarks</div>
        <div className="rounded-[14px] border border-[#e0d6ca] px-3 py-3 text-sm text-[#746a78]">Attach optional proof</div>
      </div>
    </div>
  );
}

function FlowScreen({
  catalog,
  flow,
  stepIndex,
  completed,
  activities,
  goModule,
  next,
  back,
  completeStep,
}: {
  catalog: ModuleFlowCatalog;
  flow: ModuleFlow;
  stepIndex: number;
  completed: Record<string, boolean>;
  activities: Activity[];
  goModule: () => void;
  next: () => void;
  back: () => void;
  completeStep: () => void;
}) {
  const step = flow.steps[stepIndex];
  const progress = Math.round(((stepIndex + 1) / flow.steps.length) * 100);
  const color = primaryFor(catalog.moduleKey);
  const done = Boolean(completed[`${flow.id}:${step.id}`]);

  return (
    <MobileFrame>
      <div className="min-h-[calc(100vh-57px)] bg-[#f9f6f1]">
        <header className="px-5 pb-5 pt-5 text-white" style={{ background: color }}>
          <div className="flex items-center justify-between">
            <button type="button" onClick={goModule} className="grid h-10 w-10 place-items-center rounded-full bg-white/12"><ArrowLeft size={18} /></button>
            <span className="rounded-full bg-white/12 px-3 py-1 text-xs">Screen {stepIndex + 1}/{flow.steps.length}</span>
          </div>
          <p className="mt-5 text-xs uppercase tracking-[0.16em] text-white/70">{titleFromKey(catalog.moduleKey)}</p>
          <h1 className="mt-1 text-[25px] leading-tight font-normal">{flow.name}</h1>
          <div className="mt-4 h-2 rounded-full bg-white/16">
            <div className="h-2 rounded-full bg-[#b9f43b]" style={{ width: `${progress}%` }} />
          </div>
        </header>

        <section className="px-5 py-5">
          <div className="mb-4 rounded-[20px] border border-[#e0d6ca] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-[#746a78]">{screenKind(step)} screen</p>
                <h2 className="mt-1 text-[22px] leading-tight font-normal">{step.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#746a78]">{step.description}</p>
              </div>
              {done && <BadgeCheck size={24} className="text-[#0b8f62]" />}
            </div>
          </div>

          <StepVisual step={step} moduleKey={catalog.moduleKey} completed={done} />

          <div className="mt-4 grid gap-3">
            <button type="button" onClick={completeStep} className="h-13 rounded-[16px] text-sm text-white" style={{ background: color }}>
              <Check className="mr-2 inline" size={16} />
              Complete this screen
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={back} disabled={stepIndex === 0} className="h-12 rounded-[16px] border border-[#e0d6ca] bg-white text-sm disabled:opacity-40">Back</button>
              <button type="button" onClick={next} disabled={stepIndex === flow.steps.length - 1} className="h-12 rounded-[16px] bg-[#111111] text-sm text-white disabled:opacity-40">Next screen</button>
            </div>
          </div>

          <section className="mt-5">
            <h3 className="text-base font-normal">Journey Activity</h3>
            <div className="mt-3 grid gap-2">
              {activities.length === 0 && <div className="rounded-[18px] bg-white p-4 text-sm text-[#746a78]">Complete screens to see the mobile journey state.</div>}
              {activities.map((activity) => (
                <div key={activity.id} className="rounded-[18px] bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm">{activity.title}</p>
                    <span className="rounded-full bg-[#eef7e8] px-2 py-1 text-[11px] text-[#0b3d2e]">{activity.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#746a78]">{activity.meta}</p>
                </div>
              ))}
            </div>
          </section>
        </section>
      </div>
      <BottomNav active="services" />
    </MobileFrame>
  );
}

export default function MobileFlowTester({ catalogs }: { catalogs: ModuleFlowCatalog[] }) {
  const mobileCatalogs = useMemo(() => {
    const mobile = catalogs.filter((catalog) => catalog.deliveryTargets.some((target) => target.startsWith('flutter-')));
    return [...mobile].sort((a, b) => {
      const aRank = featuredModules.indexOf(a.moduleKey);
      const bRank = featuredModules.indexOf(b.moduleKey);
      if (aRank !== -1 || bRank !== -1) return (aRank === -1 ? 999 : aRank) - (bRank === -1 ? 999 : bRank);
      return titleFromKey(a.moduleKey).localeCompare(titleFromKey(b.moduleKey));
    });
  }, [catalogs]);

  const [view, setView] = useState<AppView>('home');
  const [query, setQuery] = useState('');
  const [moduleKey, setModuleKey] = useState(mobileCatalogs[0]?.moduleKey ?? '');
  const activeCatalog = mobileCatalogs.find((catalog) => catalog.moduleKey === moduleKey) ?? mobileCatalogs[0];
  const [flowId, setFlowId] = useState(preferredFlow(activeCatalog)?.id ?? '');
  const activeFlow = activeCatalog?.workflows.find((flow) => flow.id === flowId) ?? preferredFlow(activeCatalog);
  const [stepIndex, setStepIndex] = useState(0);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [activities, setActivities] = useState<Activity[]>([]);

  function openModule(nextModuleKey: string) {
    const catalog = mobileCatalogs.find((item) => item.moduleKey === nextModuleKey);
    const flow = catalog ? preferredFlow(catalog) : undefined;
    setModuleKey(nextModuleKey);
    setFlowId(flow?.id ?? '');
    setStepIndex(0);
    setView('module');
  }

  function openFlow(nextFlowId: string) {
    setFlowId(nextFlowId);
    setStepIndex(0);
    setActivities([]);
    setView('flow');
  }

  function completeStep() {
    if (!activeCatalog || !activeFlow) return;
    const step = activeFlow.steps[stepIndex];
    const key = `${activeFlow.id}:${step.id}`;
    setCompleted((current) => ({ ...current, [key]: true }));
    setActivities((current) => [
      {
        id: `${Date.now()}`,
        title: step.title,
        meta: `${titleFromKey(activeCatalog.moduleKey)} / ${activeFlow.name}`,
        status: step.crud.join(' + ') || 'done',
      },
      ...current,
    ].slice(0, 6));
  }

  if (!activeCatalog || !activeFlow) {
    return (
      <MobileFrame>
        <div className="grid min-h-screen place-items-center p-8 text-center">
          <div>
            <AlertCircle className="mx-auto text-[#b42318]" size={34} />
            <h1 className="mt-4 text-xl font-normal">No mobile flows found</h1>
          </div>
        </div>
      </MobileFrame>
    );
  }

  if (view === 'module') {
    return <ModuleScreen catalog={activeCatalog} openHome={() => setView('home')} openFlow={openFlow} />;
  }

  if (view === 'flow') {
    return (
      <FlowScreen
        catalog={activeCatalog}
        flow={activeFlow}
        stepIndex={stepIndex}
        completed={completed}
        activities={activities}
        goModule={() => setView('module')}
        next={() => setStepIndex((current) => Math.min(current + 1, activeFlow.steps.length - 1))}
        back={() => setStepIndex((current) => Math.max(current - 1, 0))}
        completeStep={completeStep}
      />
    );
  }

  return <HomeScreen catalogs={mobileCatalogs} query={query} setQuery={setQuery} openModule={openModule} />;
}
