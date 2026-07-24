import type { AppState } from './types';

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');

export const STUDENT = {
  name: 'Arun Kumar S',
  initials: 'AK',
  roll: '22EC101',
  college: 'SVCE',
  dept: 'Electronics & Communication',
  year: '4th Year',
  fullCollege: 'Sri Venkateswara College of Engineering',
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
  return (paid.hostel ? 0 : 42000) + (paid.exam ? 0 : 1800) + 20;
}

export function fmtDues(paid: AppState['paid']) {
  return fmt(duesTotal(paid));
}

export function attPct() { return 63; }
export function attEligible() { return attPct() >= 75; }
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
  ['08:45', T('DSP'), T('VLSI'), T('DSP'), T('Antennas'), T('DSP')],
  ['09:45', T('VLSI'), T('Microwave'), T('VLSI'), T('DSP'), T('VLSI')],
  ['11:00', T('Microwave Lab', true), T('Antennas'), T('VLSI Lab', true), T('Microwave'), T('Project')],
  ['12:00', T('Microwave Lab', true), T('DSP'), T('VLSI Lab', true), T('Elective'), T('Seminar')],
  ['14:00', T('Antennas'), T('Elective'), T('Microwave'), T('VLSI'), B],
] as const;

export const WEEK_BARS = (() => {
  const raw: [string, number][] = [['Mon', 82], ['Tue', 74], ['Wed', 60], ['Thu', 88], ['Fri', 71], ['Sat', 95]];
  const wkMax = Math.max(...raw.map(x => x[1]));
  const wkPal = ['#c4bcff', '#a89dff', '#8b7cf5', '#776cf5', '#9a7cf0', '#b46cf0'];
  return raw.map(([day, v], i) => ({
    day, label: v + '%', h: Math.round(v * 1.35), peak: v === wkMax,
    fill: v === wkMax ? 'linear-gradient(180deg,#1400ff,#a600ff)' : wkPal[i],
  }));
})();

export const THEORY_BARS = [
  { name: 'Digital Signal Processing', pct: 71 },
  { name: 'VLSI Design', pct: 58 },
  { name: 'Microwave Engineering', pct: 66 },
  { name: 'Antennas & Propagation', pct: 72 },
].map(b => ({ ...b, color: barColor(b.pct), w: b.pct + '%', label: b.pct + '%' }));

export const LAB_BARS = [
  { name: 'VLSI Lab', pct: 55 },
  { name: 'Microwave Lab', pct: 68 },
].map(b => ({ ...b, color: barColor(b.pct), w: b.pct + '%', label: b.pct + '%' }));

export const CALENDAR_STATE = {
  absent: [3, 9, 17, 24],
  od: [12, 19],
  off: [6, 7, 13, 14, 20, 21, 27, 28],
};

export function buildCalendar() {
  const cal = [];
  for (let d = 1; d <= 31; d++) {
    let state: 'p' | 'a' | 'od' | 'off' = 'p';
    if (CALENDAR_STATE.off.includes(d)) state = 'off';
    else if (CALENDAR_STATE.absent.includes(d)) state = 'a';
    else if (CALENDAR_STATE.od.includes(d)) state = 'od';
    cal.push({ d, state });
  }
  return cal;
}

export const GP_HISTORY = [
  { date: '21 Jul', type: 'Day Exit', status: 'Approved', color: '#10b981' },
  { date: '14 Jul', type: 'Weekend Leave', status: 'Approved', color: '#10b981' },
  { date: '02 Jul', type: 'Night Out', status: 'Denied', color: '#ef4444', reason: 'Insufficient notice period' },
];

export const FEE_ITEMS = [
  { key: 'tuition', name: 'Tuition Fee', amount: 0, due: '—' },
  { key: 'hostel', name: 'Hostel Fee', amount: 42000, due: '15 Jul 2026' },
  { key: 'transport', name: 'Transport Fee', amount: 0, due: '—' },
  { key: 'exam', name: 'Exam Fee', amount: 1800, due: '02 Aug 2026' },
];

export const PAY_HISTORY = [
  { id: 'PAY-88213', date: '10 Jun 2026', desc: 'Tuition Fee — Sem VII', amount: '₹92,000', mode: 'UPI', status: 'Success' as const },
  { id: 'PAY-87740', date: '08 Jun 2026', desc: 'Transport Fee — Annual', amount: '₹28,000', mode: 'Net Banking', status: 'Success' as const },
  { id: 'PAY-86119', date: '02 Jun 2026', desc: 'Exam Fee — Arrear', amount: '₹600', mode: 'Card', status: 'Failed' as const },
];

export const INTERNALS = [
  { subj: 'Digital Signal Processing', cia1: 42, cia2: 38 },
  { subj: 'VLSI Design', cia1: 35, cia2: 40 },
  { subj: 'Microwave Engineering', cia1: 44, cia2: 41 },
];

export const RESULTS = [
  { subj: 'Embedded Systems', grade: 'A', gp: 9 },
  { subj: 'Control Systems', grade: 'B+', gp: 8 },
  { subj: 'Communication Networks', grade: 'A+', gp: 10 },
  { subj: 'Signals & Systems', grade: 'B', gp: 7 },
].map(r => ({ ...r, color: r.gp >= 9 ? '#10b981' : r.gp >= 7 ? '#776cf5' : '#d97706' }));

export const ARREARS = [
  { code: 'MA8353', subj: 'Transforms & PDE', status: 'Cleared', color: '#10b981' },
  { code: 'EC8451', subj: 'Electromagnetic Fields', status: 'Pending', color: '#d97706' },
];

export const BOOKS = [
  { title: 'Digital Signal Processing', author: 'Proakis & Manolakis', due: '28 Jul', days: 4 },
  { title: 'CMOS VLSI Design', author: 'Weste & Harris', due: '25 Jul', days: 1 },
  { title: 'Microwave Engineering', author: 'D. M. Pozar', due: '20 Jul', days: -4 },
];

export const CATALOG = [
  { title: 'Antenna Theory', author: 'Balanis', status: 'Available', color: '#10b981' },
  { title: 'Embedded Systems', author: 'Shibu K V', status: 'Reserved', color: '#d97706' },
  { title: 'Control Systems Engg', author: 'Nagrath & Gopal', status: 'Checked-out', color: '#ef4444' },
];

export const DIGITAL_RESOURCES = ['Scopus', 'IEEE Xplore', 'Springer', 'NDLI'];

export const PLACEMENT_DRIVES = [
  { company: 'Zoho', role: 'Member Technical Staff', ctc: '₹9.5 LPA', date: '02 Aug', eligible: true },
  { company: 'TCS Digital', role: 'System Engineer', ctc: '₹7.0 LPA', date: '05 Aug', eligible: true },
  { company: 'Freshworks', role: 'Associate PM', ctc: '₹12 LPA', date: '09 Aug', eligible: false, reason: 'Requires CGPA ≥ 7.5' },
];

export const DOC_TYPES = ['Bonafide Certificate', 'Transfer Certificate', 'Migration Certificate', 'Fee Receipt', 'NOC'];

export const QR_TODAY = [
  { time: '06:52 PM', loc: 'Hostel Block B', purpose: 'Night entry', status: 'Success' as const },
  { time: '04:30 PM', loc: 'Central Library', purpose: 'Book issue — CMOS VLSI Design', status: 'Success' as const },
  { time: '01:12 PM', loc: 'Mess Hall', purpose: 'Lunch — mess scan', status: 'Success' as const },
  { time: '11:02 AM', loc: 'Lab B-4', purpose: 'Microwave Lab — attendance', status: 'Success' as const },
  { time: '09:47 AM', loc: 'LH-302', purpose: 'VLSI Design — attendance', status: 'Success' as const },
  { time: '08:41 AM', loc: 'Main Gate', purpose: 'Campus entry', status: 'Success' as const },
];

export const QR_YESTERDAY = [
  { time: '09:58 PM', loc: 'Hostel Block B', purpose: 'Night entry — 2 min before curfew', status: 'Flagged' as const },
  { time: '07:10 PM', loc: 'Main Gate', purpose: 'Gate pass exit — Weekend Leave', status: 'Success' as const },
  { time: '08:39 AM', loc: 'Main Gate', purpose: 'Campus entry', status: 'Success' as const },
];

export const NOTICES = [
  { title: 'Semester exam timetable released', preview: 'Odd-sem end exams begin 12 Aug. Check Exams module for your schedule.', date: '22 Jul', dot: '#776cf5' },
  { title: 'Library extended hours during exams', preview: 'Central library open till 11 PM from 01–20 Aug.', date: '20 Jul', dot: '#3b82f6' },
  { title: 'Hostel mess menu revised', preview: 'New weekly menu effective this week. Preview under Hostel.', date: '18 Jul', dot: '#10b981' },
];

export const MESS_MENU = [
  { m: 'Breakfast', v: 'Idli, Sambar, Chutney, Coffee' },
  { m: 'Lunch', v: 'Rice, Sambar, Poriyal, Curd, Papad' },
  { m: 'Snacks', v: 'Bajji, Tea' },
  { m: 'Dinner', v: 'Chapati, Kurma, Rice, Rasam' },
];

export const SCHEDULE = [
  { time: '08:45', subject: 'Digital Signal Processing', room: 'LH-302', kind: 'Theory', state: 'done' },
  { time: '09:45', subject: 'VLSI Design', room: 'LH-302', kind: 'Theory', state: 'now' },
  { time: '11:00', subject: 'Microwave Lab', room: 'Lab B-4', kind: 'Lab', state: 'next' },
  { time: '14:00', subject: 'Antennas & Propagation', room: 'LH-305', kind: 'Theory', state: 'next' },
];

export const NEXT_CLASS = { subject: 'Microwave Lab', time: '11:00', room: 'Lab B-4', kind: 'Practical' };
export const CGPA = 7.42;
export const SGPA = '7.8';
