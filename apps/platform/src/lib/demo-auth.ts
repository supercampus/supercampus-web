import type { AuthStudent, PersistedAppState, Tenant } from './types';

export const DEMO_TENANT: Tenant = {
  id: 'svce',
  code: 'SVCE',
  name: 'Sri Venkateswara College of Engineering',
  city: 'Chennai',
};

export const DEMO_LOGIN_USERS = [
  { id: 'admin-1', name: 'Arjun Mehta', initials: 'AM', email: 'arjun@supercampus.edu', password: 'Admin@123', role: 'Admin', team: 'Operations', access: ['CRM', 'Fee Management', 'ERP'] },
  { id: 'admission-1', name: 'Priya Sharma', initials: 'PS', email: 'priya@supercampus.edu', password: 'Admission@123', role: 'Admission Counselor', team: 'Admissions', access: ['CRM', 'ERP'] },
  { id: 'counselor-1', name: 'Rahul Verma', initials: 'RV', email: 'rahul@supercampus.edu', password: 'Counselor@123', role: 'Admission Counselor', team: 'Admissions', access: ['CRM'] },
  { id: 'marketing-1', name: 'Divya Krishnan', initials: 'DK', email: 'divya@supercampus.edu', password: 'Marketing@123', role: 'Marketing Executive', team: 'Marketing', access: ['CRM'] },
  { id: 'manager-1', name: 'Karthik Nair', initials: 'KN', email: 'karthik@supercampus.edu', password: 'Manager@123', role: 'Marketing Manager', team: 'Marketing', access: ['CRM', 'ERP'] },
  { id: 'docs-1', name: 'Sneha Reddy', initials: 'SR', email: 'sneha@supercampus.edu', password: 'Docs@123', role: 'Document Officer', team: 'Admissions', access: ['CRM', 'Documents'] },
  { id: 'student-1', name: 'Arun Kumar S', initials: 'AK', email: 'student@supercampus.edu', password: 'Student@123', role: 'Student', team: 'ECE 4th Year', access: ['Student App'] },
] as const;

export type DemoLoginUser = (typeof DEMO_LOGIN_USERS)[number];

export const DEFAULT_DEMO_USER_ID = DEMO_LOGIN_USERS[6].id;
export const DEMO_SESSION_COOKIE = 'sc_demo_session';

export function findDemoUserByCredentials(email: string, password: string) {
  return DEMO_LOGIN_USERS.find((user) => user.email.toLowerCase() === email.trim().toLowerCase() && user.password === password);
}

export function findDemoUserById(id: string | undefined) {
  return DEMO_LOGIN_USERS.find((user) => user.id === id);
}

export function toAuthStudent(user: DemoLoginUser): AuthStudent {
  const isStudent = user.role === 'Student';

  return {
    id: user.id,
    tenantId: DEMO_TENANT.id,
    email: user.email,
    role: user.role,
    team: user.team,
    access: [...user.access],
    name: user.name,
    initials: user.initials,
    roll: isStudent ? '22EC101' : user.id.toUpperCase(),
    college: DEMO_TENANT.code,
    dept: isStudent ? 'Electronics & Communication' : user.team,
    year: isStudent ? '4th Year' : user.role,
    fullCollege: DEMO_TENANT.name,
    tenant: DEMO_TENANT,
  };
}

export const DEFAULT_PERSISTED_STATE: PersistedAppState = {
  persona: 'hosteller',
  gp: { status: 'pending', type: 'Weekend Leave', early: true, step: 2 },
  paid: { tuition: true, hostel: false, transport: true, exam: false },
  pay: { comp: null, step: 0, plan: null, mode: null },
  refunds: {},
  condonation: 'none',
  examReg: 0,
  reval: {},
  asg: { a3: 'none' },
  changeNotice: true,
  mess: true,
  hostelLeave: 0,
  hostelTickets: [{ id: 'HST-2291', cat: 'Electrical', text: 'Tube light not working in Room B-214', status: 'In Progress' }],
  tripStep: 1,
  breakdown: true,
  docReq: [{ id: 'DOC-4410', type: 'Bonafide Certificate', on: '18 Jul', status: 'Ready' }],
  placeApp: 0,
  feedback: 0,
};
