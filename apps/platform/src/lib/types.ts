export type Persona = 'hosteller' | 'dayscholar';

export type NavId =
  | 'home' | 'attendance' | 'exams' | 'timetable'
  | 'gatepass' | 'qr' | 'fees' | 'hostel' | 'transport'
  | 'library' | 'placement' | 'documents' | 'profile';

export interface Student {
  name: string;
  initials: string;
  roll: string;
  college: string;
  dept: string;
  year: string;
}

export interface FeeComponent {
  key: string;
  name: string;
  amount: number;
  due: string;
  paid: boolean;
}

export interface PaymentRecord {
  id: string;
  date: string;
  desc: string;
  amount: string;
  mode: string;
  status: 'Success' | 'Failed' | 'Pending';
}

export interface GatePassRecord {
  date: string;
  type: string;
  status: string;
  color: string;
  reason?: string;
}

export interface Book {
  title: string;
  author: string;
  due: string;
  days: number;
}

export interface PlacementDrive {
  company: string;
  role: string;
  ctc: string;
  date: string;
  eligible: boolean;
  reason?: string;
}

export interface DocRequest {
  id: string;
  type: string;
  on: string;
  status: string;
}

export interface HostelTicket {
  id: string;
  cat: string;
  text: string;
  status: string;
}

export interface QRScan {
  time: string;
  loc: string;
  purpose: string;
  status: 'Success' | 'Flagged' | 'Denied';
}

export interface SummaryCard {
  label: string;
  big: string;
  sub: string;
  color: string;
  mod: NavId;
}

export interface AppState {
  persona: Persona;
  active: NavId;
  notifOpen: boolean;
  toast: string | null;
  countdown: number;
  // gate pass
  gp: { status: 'none' | 'pending' | 'approved'; type: string | null; early: boolean; step: number };
  // fees
  paid: { tuition: boolean; hostel: boolean; transport: boolean; exam: boolean };
  pay: { comp: string | null; step: number; plan: string | null; mode: string | null };
  refunds: Record<string, string>;
  // attendance
  condonation: 'none' | 'pending' | 'approved';
  // exams
  examReg: number;
  reval: Record<string, string>;
  asg: { a3: string };
  // timetable
  changeNotice: boolean;
  // hostel
  mess: boolean;
  hostelLeave: number;
  hostelTickets: HostelTicket[];
  // transport
  tripStep: number;
  breakdown: boolean;
  // documents
  docReq: DocRequest[];
  // placement
  placeApp: number;
  // feedback
  feedback: number;
}

export type PersistedAppState = Omit<AppState, 'active' | 'notifOpen' | 'toast' | 'countdown'>;
export type BackendStatus = 'connecting' | 'online' | 'offline' | 'saving';

export interface Tenant {
  id: string;
  code: string;
  name: string;
  city: string;
}

export interface TenantBrand {
  logoDataUrl: string | null;
  primary: string;
  secondary: string;
  surface: string;
}

export interface AuthStudent extends Student {
  id: string;
  tenantId: string;
  email: string;
  role: string;
  portalFamilies: Array<'student' | 'parent' | 'staff' | 'admin'>;
  team: string;
  access: string[];
  fullCollege: string;
  tenant: Tenant;
}

export type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';
export interface LoginCredentials { email: string; password: string }

/**
 * The campus entry fence, as the gatepass module enforces it.
 *
 * A circle, because that is the shape the API compares against: one centre and
 * one radius, measured as great-circle distance. `null` means no fence is set,
 * and entry passes activate from anywhere.
 */
export interface CampusGeofence {
  latitude: number;
  longitude: number;
  radiusMetres: number;
}

export interface Campus {
  id: string;
  code: string;
  name: string;
  geofence: CampusGeofence | null;
}
