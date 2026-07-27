import type { AppState } from './types';

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');

export const STUDENT = {
  name: 'Data Unavailable',
  initials: 'DU',
  roll: 'Data Unavailable',
  college: 'Data Unavailable',
  dept: 'Data Unavailable',
  year: 'Data Unavailable',
  fullCollege: 'Data Unavailable',
};

export const ICONS: Record<string, string> = {
  home: 'M3 11.5 12 4l9 7.5M5 10v10h5v-6h4v6h5V10',
  attendance: 'M9 11l3 3 8-8M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  gatepass: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  fees: 'M2 7h20v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM2 11h20',
  exams: 'M9 3h6l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM9 12h6M9 16h4',
  timetable: 'M4 5h16v16H4zM4 9h16M8 3v4M16 3v4',
  hostel: 'M2 7v12M2 13h17a2 2 0 0 1 2 2v4M6 13v-3h6a2 2 0 0 1 2 2v1',
  library: 'M5 4a1 1 0 0 1 1-1h13v17H6a1 1 0 0 0-1 1zM9 3v16',
  transport: 'M4 6h16v9H4zM4 15v3M20 15v3M7 6V4h10v2M6 18h.01M18 18h.01',
  placement: 'M3 8h18v11H3zM8 8V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3M3 13h18',
  documents: 'M3 6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21v-1a6 6 0 0 1 12 0v1',
  qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z',
};

export const TITLES: Record<string, string> = {
  home: 'Dashboard', attendance: 'Attendance', gatepass: 'Gate Pass', fees: 'Fees',
  exams: 'Exams', timetable: 'Timetable', hostel: 'Hostel', library: 'Library',
  transport: 'Transport', placement: 'Placement', documents: 'Documents', profile: 'Profile', qr: 'QR History',
};

export function fmtClock(t: number) {
  const h = String(Math.floor(t / 3600)).padStart(2, '0');
  const m = String(Math.floor((t % 3600) / 60)).padStart(2, '0');
  const s = String(t % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function duesTotal(paid: AppState['paid']) {
  return 0; // Data Unavailable for fees
}

export function fmtDues(paid: AppState['paid']) {
  return fmt(duesTotal(paid));
}

export function attPct() { return 0; }
export function attEligible() { return false; }
export function barColor(p: number) { return p >= 75 ? '#10b981' : p >= 65 ? '#d97706' : '#ef4444'; }

export function stepper(labels: string[], idx: number) {
  return labels.map((l, i) => {
    const done = i < idx, active = i === idx;
    const state: 'done' | 'active' | 'pending' = done ? 'done' : active ? 'active' : 'pending';
    return {
      label: l, done, active,
      num: done ? '✓' : String(i + 1),
      state,
    };
  });
}

export const TIMETABLE_HEAD = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const T = (s: string, lab?: boolean) => ({ s, lab: !!lab });
const B = { s: '—', lab: false };
export const TIMETABLE_GRID = [
  ['Data Unavailable', T('Data Unavailable'), T('Data Unavailable'), T('Data Unavailable'), T('Data Unavailable'), T('Data Unavailable')],
] as const;

export const WEEK_BARS = (() => {
  const raw: [string, number][] = [['Mon', 0], ['Tue', 0], ['Wed', 0], ['Thu', 0], ['Fri', 0], ['Sat', 0]];
  const wkMax = 100;
  const wkPal = ['#c4bcff', '#a89dff', '#8b7cf5', '#776cf5', '#9a7cf0', '#b46cf0'];
  return raw.map(([day, v], i) => ({
    day, label: 'Data Unavailable', h: 0, peak: false, fill: wkPal[i],
  }));
})();

export const THEORY_BARS = [
  { name: 'Data Unavailable', pct: 0 },
].map(b => ({ ...b, color: barColor(b.pct), w: b.pct + '%', label: 'Data Unavailable' }));

export const LAB_BARS = [
  { name: 'Data Unavailable', pct: 0 },
].map(b => ({ ...b, color: barColor(b.pct), w: b.pct + '%', label: 'Data Unavailable' }));

export const CALENDAR_STATE = {
  absent: [],
  od: [],
  off: [],
};

export function buildCalendar() {
  const cal = [];
  for (let d = 1; d <= 31; d++) {
    cal.push({ d, state: 'p' as const });
  }
  return cal;
}

export const GP_HISTORY = [
  { date: 'Data Unavailable', type: 'Data Unavailable', status: 'Data Unavailable', color: '#c3c6d0', reason: 'Data Unavailable' },
];

export const FEE_ITEMS = [
  { key: 'tuition', name: 'Data Unavailable', amount: 0, due: 'Data Unavailable' },
];

export const PAY_HISTORY = [
  { id: 'Data Unavailable', date: 'Data Unavailable', desc: 'Data Unavailable', amount: '0', mode: 'Data Unavailable', status: 'Pending' as 'Success' | 'Failed' | 'Pending' },
];

export const INTERNALS = [
  { subj: 'Data Unavailable', cia1: 0, cia2: 0 },
];

export const RESULTS = [
  { subj: 'Data Unavailable', grade: 'Data Unavailable', gp: 0 },
].map(r => ({ ...r, color: '#c3c6d0' }));

export const ARREARS = [
  { code: 'Data Unavailable', subj: 'Data Unavailable', status: 'Data Unavailable', color: '#c3c6d0' },
];

export const BOOKS = [
  { title: 'Data Unavailable', author: 'Data Unavailable', due: 'Data Unavailable', days: 0 },
];

export const CATALOG = [
  { title: 'Data Unavailable', author: 'Data Unavailable', status: 'Data Unavailable', color: '#c3c6d0' },
];

export const DIGITAL_RESOURCES = ['Data Unavailable'];

export const PLACEMENT_DRIVES = [
  { company: 'Data Unavailable', role: 'Data Unavailable', ctc: 'Data Unavailable', date: 'Data Unavailable', eligible: false, reason: 'Data Unavailable' },
];

export const DOC_TYPES = ['Data Unavailable'];

export const QR_TODAY = [
  { time: 'Data Unavailable', loc: 'Data Unavailable', purpose: 'Data Unavailable', status: 'Flagged' as 'Success' | 'Flagged' | 'Denied' },
];

export const QR_YESTERDAY = [
  { time: 'Data Unavailable', loc: 'Data Unavailable', purpose: 'Data Unavailable', status: 'Flagged' as 'Success' | 'Flagged' | 'Denied' },
];

export const NOTICES = [
  { title: 'Data Unavailable', preview: 'Data Unavailable', date: 'Data Unavailable', dot: '#ccc' },
];

export const MESS_MENU = [
  { m: 'Breakfast', v: 'Data Unavailable' },
  { m: 'Lunch', v: 'Data Unavailable' },
  { m: 'Snacks', v: 'Data Unavailable' },
  { m: 'Dinner', v: 'Data Unavailable' },
];

export const SCHEDULE = [
  { time: 'Data Unavailable', subject: 'Data Unavailable', room: 'Data Unavailable', kind: 'Data Unavailable', state: 'done' },
];

export const NEXT_CLASS = { subject: 'Data Unavailable', time: 'Data Unavailable', room: 'Data Unavailable', kind: 'Data Unavailable' };
export const CGPA = 0;
export const SGPA = '0';
