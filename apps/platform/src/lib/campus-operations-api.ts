import { apiRequest } from './api';

export type CanteenOrder = {
  id: string;
  orderNumber: number;
  customerUserId: string;
  customerName: string;
  lines: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  fulfilmentMode: string;
  status: string;
  tokenNumber: number | null;
  createdAt: string;
};

export type CanteenMenuItem = {
  id: string;
  store: string;
  name: string;
  description: string;
  category: string;
  price: number;
  prepMinutes: number;
  isVegetarian: boolean;
  isPopular: boolean;
  isAvailable: boolean;
  isInstant: boolean;
  imageUrl: string | null;
};

export type CanteenShop = {
  id: string;
  shopKey: string;
  name: string;
  category: string;
  description: string;
  isActive: boolean;
  mealCompliance: boolean;
  qrPayments: boolean;
  operators: CanteenShopOperator[];
  createdAt: string;
  updatedAt: string;
};

/** What `campus_ops.shop_user_assignments` returns: an id and a role, nothing more.
 *  Display names are resolved against the user directory by whoever renders it. */
export type CanteenShopOperator = {
  userId: string;
  assignmentRole: 'owner' | 'captain' | string;
};

export type ShopAssignmentRole = 'owner' | 'captain';

export type CanteenCapabilities = {
  readShops: boolean;
  createShops: boolean;
  updateShops: boolean;
  deleteShops: boolean;
  readMenu: boolean;
  createMenu: boolean;
  updateMenu: boolean;
  deleteMenu: boolean;
  manageOrders: boolean;
  readAnalytics: boolean;
  topUpWallets: boolean;
};

export type CanteenStore = {
  walletBalance: number;
  shops: CanteenShop[];
  assignedShopKeys: string[];
  menu: CanteenMenuItem[];
  orders: CanteenOrder[];
  staffState: { mode: 'eat' | 'work'; shopOpen: boolean | null };
  canManage: boolean;
  analytics: { ordersToday: number; revenueToday: number; pending: number } | null;
  capabilities: CanteenCapabilities;
};

export type WalletTopUpResult = {
  userId: string;
  balance: number;
  transaction: {
    id: string;
    amount: number;
    transactionType: string;
    description: string;
    createdAt: string;
  };
};

export type CanteenShopInput = Pick<CanteenShop, 'shopKey' | 'name' | 'category' | 'description' | 'isActive' | 'mealCompliance' | 'qrPayments'> & {
  /** Omitting this preserves the existing assignments; an empty array clears them.
   *  The field name has to be `assignmentRole` — the API declares the operator
   *  payload with `deny_unknown_fields`, so a stray `role` key fails the whole
   *  request body with a 422 before any handler runs. */
  operators?: Array<{ userId: string; assignmentRole: ShopAssignmentRole }>;
};
export type CanteenMenuItemInput = Omit<CanteenMenuItem, 'id' | 'store' | 'isInstant' | 'imageUrl'>
  & Partial<Pick<CanteenMenuItem, 'store' | 'isInstant' | 'imageUrl'>>;

export type GatepassRequest = {
  id: string;
  requesterUserId: string;
  requesterName: string;
  passType: 'outpass' | 'leave_pass';
  residency: string;
  departureAt: string;
  returnAt: string;
  destination: string;
  reason: string;
  state: string;
};

export type GateMovement = {
  id: string;
  userId: string;
  requestId: string | null;
  direction: 'entry' | 'exit';
  checkpoint: string;
  createdAt: string;
};

export type GatepassOverview = {
  requests: GatepassRequest[];
  movements: GateMovement[];
  canManage: boolean;
};

export type AttendanceStudent = {
  studentUserId: string;
  studentId: string;
  studentNumber: string;
  studentName: string;
  departmentId: string | null;
  sectionId: string | null;
};

export type AttendanceSession = {
  id: string;
  subjectName: string;
  heldOn: string;
  periodLabel: string;
  status: string;
  sectionId: string | null;
};

export type AttendanceReport = {
  id: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  summary: { sessions?: number; entries?: number; present?: number; absent?: number };
};

export const getCanteenStore = () => apiRequest<{ data: CanteenStore }>('/v1/operations/canteen/store');
export const getCanteenShops = () => apiRequest<{ data: { shops: CanteenShop[] } }>('/v1/operations/canteen/shops');
export const createCanteenShop = (value: CanteenShopInput) => apiRequest('/v1/operations/canteen/shops', { method: 'POST', body: JSON.stringify(value) });
export const updateCanteenShop = (id: string, value: CanteenShopInput) => apiRequest(`/v1/operations/canteen/shops/${id}`, { method: 'PUT', body: JSON.stringify(value) });
export const deleteCanteenShop = (id: string) => apiRequest(`/v1/operations/canteen/shops/${id}`, { method: 'DELETE' });
export const updateCanteenOrder = (id: string, status: string, reason?: string) => apiRequest(`/v1/operations/canteen/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, reason }) });
export const scanCanteenOrder = (qrPayload: string, action: string) => apiRequest('/v1/operations/canteen/orders/scan', { method: 'POST', body: JSON.stringify({ qrPayload, action }) });
export const updateCanteenStaffState = (mode: 'eat' | 'work', shopOpen?: boolean) => apiRequest('/v1/operations/canteen/staff-state', { method: 'PUT', body: JSON.stringify({ mode, shopOpen }) });
export const topUpCanteenWallet = (userId: string, amount: number, reference: string) => apiRequest<{ data: WalletTopUpResult }>(`/v1/operations/canteen/wallets/${encodeURIComponent(userId)}/top-ups`, { method: 'POST', body: JSON.stringify({ amount, source: 'manual', reference, idempotencyKey: crypto.randomUUID() }) });
export const createCanteenMenuItem = (value: CanteenMenuItemInput) => apiRequest('/v1/operations/canteen/menu', { method: 'POST', body: JSON.stringify(value) });
export const updateCanteenMenuItem = (id: string, value: CanteenMenuItemInput) => apiRequest(`/v1/operations/canteen/menu/${id}`, { method: 'PUT', body: JSON.stringify(value) });
export const deleteCanteenMenuItem = (id: string) => apiRequest(`/v1/operations/canteen/menu/${id}`, { method: 'DELETE' });

export const getGatepassOverview = () => apiRequest<{ data: GatepassOverview }>('/v1/operations/gatepass/overview');
export const decideGatepass = (id: string, decision: 'approved' | 'rejected', note?: string) => apiRequest(`/v1/operations/gatepass/requests/${id}/decision`, { method: 'POST', body: JSON.stringify({ decision, note }) });
export const scanGatepass = (qrPayload: string, direction: 'entry' | 'exit', checkpoint: string) => apiRequest('/v1/operations/gatepass/scan', { method: 'POST', body: JSON.stringify({ qrPayload, direction, checkpoint }) });

export const getAttendanceRoster = () => apiRequest<{ data: { students: AttendanceStudent[] } }>('/v1/operations/attendance/roster');
export const getAttendanceSessions = () => apiRequest<{ data: { sessions: AttendanceSession[] } }>('/v1/operations/attendance/sessions');
export const createAttendanceSession = (subjectName: string, heldOn: string, periodLabel: string) => apiRequest('/v1/operations/attendance/sessions', { method: 'POST', body: JSON.stringify({ subjectOfferingId: null, sectionId: null, subjectName, heldOn, periodLabel }) });
export const saveAttendanceEntries = (sessionId: string, entries: Array<{ studentUserId: string; studentName: string; status: string }>) => apiRequest(`/v1/operations/attendance/sessions/${sessionId}/entries`, { method: 'PUT', body: JSON.stringify({ entries }) });
export const publishAttendanceSession = (sessionId: string) => apiRequest(`/v1/operations/attendance/sessions/${sessionId}/publish`, { method: 'POST' });
export const getAttendanceReports = () => apiRequest<{ data: { reports: AttendanceReport[] } }>('/v1/operations/attendance/reports');
export const createAttendanceReport = (title: string, periodStart: string, periodEnd: string) => apiRequest('/v1/operations/attendance/reports', { method: 'POST', body: JSON.stringify({ title, periodStart, periodEnd, departmentId: null }) });
export const submitAttendanceReport = (id: string) => apiRequest(`/v1/operations/attendance/reports/${id}/submit`, { method: 'POST' });
