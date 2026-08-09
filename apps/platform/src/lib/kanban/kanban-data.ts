export type OfferDecision = 'accepted' | 'rejected' | 'on-hold' | 'pending';

export interface MoveLog {
  id: string;
  from: string;
  to: string;
  by: string;
  byName: string;
  timestamp: string;
  note: string;
}

export interface ActivityEntry {
  id: string;
  leadId: string;
  leadName: string;
  type: 'move' | 'call' | 'email' | 'note' | 'document' | 'archive';
  from?: string;
  to?: string;
  by: string;
  byName: string;
  byAvatar?: string;
  timestamp: string;
  note?: string;
}

export interface Communication {
  id: string;
  type: 'call' | 'email' | 'sms' | 'whatsapp' | 'note';
  direction: 'inbound' | 'outbound';
  subject: string;
  summary: string;
  by: string;
  byName: string;
  timestamp: string;
  duration?: string;
}

export interface LeadDocument {
  name: string;
  verified: boolean;
  uploadedAt?: string;
}

export interface Lead {
  id: string;
  name: string;
  initials: string;
  phone: string;
  email: string;
  course: string;
  intake: string;
  source: string;
  city: string;
  assignedTo: { name: string; avatar?: string };
  status: string;
  globalStatus?: string | null;
  globalStatusData?: Record<string, unknown>;
  offerDecision?: OfferDecision;
  documents: { uploaded: number; required: number; items?: LeadDocument[] };
  communicationCount: number;
  nextFollowUp: string | null;
  lastContact: string;
  parent: { name: string; phone: string; relation: string };
  createdAt?: string;
  /** Server revision timestamp used to reject stale realtime replays. */
  updatedAt?: string;
  moveHistory: MoveLog[];
  communications?: Communication[];
  tags?: string[];
  whatsapp?: string;
  /** Programme and intake as stored on the CRM lead, preserved so edits round-trip. */
  interest?: Record<string, unknown>;
  academic?: Record<string, unknown>;
  /** Values for published form fields that have no dedicated lead column. */
  customFields?: Record<string, unknown>;
}

export interface Column {
  id: string;
  title: string;
  accent: string;
}

export interface UserRole {
  id: string;
  name: string;
  label: string;
  permissions: string[];
}

export const COLUMNS: Column[] = [
  { id: 'enquiry', title: 'Enquiry', accent: '#6d5dfc' },
  { id: 'contact-attempted', title: 'Contact Attempted', accent: '#d946ef' },
  { id: 'contacted', title: 'Contacted', accent: '#f59e0b' },
  { id: 'nurture', title: 'Nurture', accent: '#10b981' },
  { id: 'qualified', title: 'Qualified', accent: '#06b6d4' },
  { id: 'application', title: 'Application', accent: '#3b82f6' },
  { id: 'application-status', title: 'Application Status', accent: '#8b5cf6' },
  { id: 'offer-status', title: 'Offer / Status', accent: '#ec4899' },
  { id: 'archived', title: 'Archived', accent: '#64748b' },
];

export const COLUMN_IDS = COLUMNS.map((c) => c.id);

export const ROLES: UserRole[] = [
  {
    id: 'telecaller',
    name: 'Telecaller',
    label: 'Telecaller',
    permissions: ['enquiry', 'contact-attempted'],
  },
  {
    id: 'counselor',
    name: 'Counselor',
    label: 'Counselor',
    permissions: [
      'contact-attempted',
      'contacted',
      'nurture',
      'qualified',
      'application',
    ],
  },
  {
    id: 'senior-counselor',
    name: 'Senior Counselor',
    label: 'Senior Counselor',
    permissions: [
      'enquiry',
      'contact-attempted',
      'contacted',
      'nurture',
      'qualified',
      'application',
      'application-status',
      'offer-status',
      'archived',
    ],
  },
  {
    id: 'document-officer',
    name: 'Document Officer',
    label: 'Document Officer',
    permissions: ['application', 'application-status', 'offer-status'],
  },
  {
    id: 'finance-officer',
    name: 'Finance Officer',
    label: 'Finance Officer',
    permissions: ['offer-status', 'archived'],
  },
  {
    id: 'principal',
    name: 'Principal / Manager',
    label: 'Principal / Manager',
    permissions: COLUMN_IDS,
  },
];

const now = new Date();
const ts = (daysAgo: number, hoursAgo = 0) => {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursAgo);
  return d.toISOString();
};

export const LEADS: Lead[] = [
  {
    id: 'L-1001',
    name: 'Rahul Kumar',
    initials: 'RK',
    phone: '+91-98765 43210',
    email: 'rahul.k@gmail.com',
    course: 'B.Tech CSE',
    intake: '2026',
    source: 'Facebook Ad',
    city: 'Chennai',
    assignedTo: { name: 'Priya' },
    status: 'enquiry',
    documents: { uploaded: 3, required: 5 },
    communicationCount: 5,
    nextFollowUp: '2026-07-30T10:00:00Z',
    lastContact: '2h ago',
    parent: { name: 'Suresh Kumar', phone: '+91-98765 43211', relation: 'Father' },
    moveHistory: [
      { id: 'm1', from: '', to: 'enquiry', by: 'system', byName: 'Lead Form', timestamp: ts(3), note: 'Lead created via Facebook Ad' },
    ],
    tags: ['Scholarship Opt'],
  },
  {
    id: 'L-1002',
    name: 'Priya Sharma',
    initials: 'PS',
    phone: '+91-98765 43212',
    email: 'priya.sharma@email.com',
    course: 'MBA Marketing',
    intake: '2024',
    source: 'Walk-in',
    city: 'Chennai',
    assignedTo: { name: 'Priya' },
    status: 'enquiry',
    documents: { uploaded: 1, required: 4 },
    communicationCount: 3,
    nextFollowUp: null,
    lastContact: '5h ago',
    parent: { name: 'Rajesh Sharma', phone: '+91-98765 43213', relation: 'Father' },
    moveHistory: [
      { id: 'm2', from: '', to: 'enquiry', by: 'system', byName: 'Walk-in Form', timestamp: ts(5), note: 'Walk-in at reception' },
    ],
  },
  {
    id: 'L-1003',
    name: 'Arjun Menon',
    initials: 'AM',
    phone: '+91-98765 43214',
    email: 'arjun.m@email.com',
    course: 'B.Tech ECE',
    intake: '2026',
    source: 'Google Ads',
    city: 'Bangalore',
    assignedTo: { name: 'Arun' },
    status: 'contact-attempted',
    documents: { uploaded: 0, required: 5 },
    communicationCount: 2,
    nextFollowUp: '2026-07-29T15:00:00Z',
    lastContact: '1d ago',
    parent: { name: 'Sreedhar Menon', phone: '+91-98765 43215', relation: 'Father' },
    moveHistory: [
      { id: 'm3', from: '', to: 'enquiry', by: 'system', byName: 'Google Ads', timestamp: ts(4), note: 'Lead from Google campaign' },
      { id: 'm4', from: 'enquiry', to: 'contact-attempted', by: 'user1', byName: 'Arun', timestamp: ts(2), note: 'Attempted call, no response' },
    ],
  },
  {
    id: 'L-1004',
    name: 'Sneha Reddy',
    initials: 'SR',
    phone: '+91-98765 43216',
    email: 'sneha.r@email.com',
    course: 'B.Sc Physics',
    intake: '2025',
    source: 'Referral',
    city: 'Hyderabad',
    assignedTo: { name: 'Divya' },
    status: 'contact-attempted',
    documents: { uploaded: 2, required: 4 },
    communicationCount: 4,
    nextFollowUp: '2026-07-30T11:00:00Z',
    lastContact: '12h ago',
    parent: { name: 'Venkat Reddy', phone: '+91-98765 43217', relation: 'Father' },
    moveHistory: [
      { id: 'm5', from: '', to: 'enquiry', by: 'system', byName: 'Referral', timestamp: ts(6), note: 'Referred by alumni' },
      { id: 'm6', from: 'enquiry', to: 'contact-attempted', by: 'user2', byName: 'Divya', timestamp: ts(1), note: 'Left voicemail' },
    ],
  },
  {
    id: 'L-1005',
    name: 'Vikram Iyer',
    initials: 'VI',
    phone: '+91-98765 43218',
    email: 'vikram.iyer@email.com',
    course: 'BCA',
    intake: '2025',
    source: 'Education Fair',
    city: 'Coimbatore',
    assignedTo: { name: 'Karthik' },
    status: 'contacted',
    documents: { uploaded: 0, required: 4 },
    communicationCount: 1,
    nextFollowUp: null,
    lastContact: '3d ago',
    parent: { name: 'Narayanan Iyer', phone: '+91-98765 43219', relation: 'Father' },
    moveHistory: [
      { id: 'm7', from: '', to: 'enquiry', by: 'system', byName: 'Education Fair', timestamp: ts(10), note: 'Met at Coimbatore fair' },
      { id: 'm8', from: 'enquiry', to: 'contact-attempted', by: 'user3', byName: 'Karthik', timestamp: ts(7), note: 'Called, no answer' },
      { id: 'm9', from: 'contact-attempted', to: 'contacted', by: 'user3', byName: 'Karthik', timestamp: ts(3), note: 'Discussed courses briefly' },
    ],
  },
  {
    id: 'L-1006',
    name: 'Ananya Gupta',
    initials: 'AG',
    phone: '+91-98765 43220',
    email: 'ananya.g@email.com',
    course: 'BBA',
    intake: '2025',
    source: 'Facebook Ad',
    city: 'Madurai',
    assignedTo: { name: 'Priya' },
    status: 'contacted',
    documents: { uploaded: 1, required: 4 },
    communicationCount: 3,
    nextFollowUp: '2026-08-01T09:00:00Z',
    lastContact: '1d ago',
    parent: { name: 'Amit Gupta', phone: '+91-98765 43221', relation: 'Father' },
    moveHistory: [
      { id: 'm10', from: '', to: 'enquiry', by: 'system', byName: 'Facebook Ad', timestamp: ts(8), note: 'Facebook lead gen' },
      { id: 'm11', from: 'enquiry', to: 'contact-attempted', by: 'user1', byName: 'Priya', timestamp: ts(5), note: 'Sent WhatsApp message' },
      { id: 'm12', from: 'contact-attempted', to: 'contacted', by: 'user1', byName: 'Priya', timestamp: ts(1), note: 'Interested in campus tour' },
    ],
  },
  {
    id: 'L-1007',
    name: 'Karthik Nair',
    initials: 'KN',
    phone: '+91-98765 43222',
    email: 'karthik.nair@email.com',
    course: 'B.Tech CSE',
    intake: '2026',
    source: 'Referral',
    city: 'Chennai',
    assignedTo: { name: 'Arun' },
    status: 'nurture',
    documents: { uploaded: 2, required: 5 },
    communicationCount: 6,
    nextFollowUp: '2026-07-31T14:00:00Z',
    lastContact: '4h ago',
    parent: { name: 'Mohan Nair', phone: '+91-98765 43223', relation: 'Father' },
    moveHistory: [
      { id: 'm13', from: '', to: 'enquiry', by: 'system', byName: 'Referral', timestamp: ts(14), note: 'Referred by alumni' },
      { id: 'm14', from: 'enquiry', to: 'contact-attempted', by: 'user1', byName: 'Arun', timestamp: ts(11), note: 'Called and left message' },
      { id: 'm15', from: 'contact-attempted', to: 'contacted', by: 'user1', byName: 'Arun', timestamp: ts(9), note: 'Very interested in CSE program' },
      { id: 'm16', from: 'contacted', to: 'nurture', by: 'user1', byName: 'Arun', timestamp: ts(5), note: 'Shared brochure, asked about scholarships' },
    ],
    tags: ['Scholarship Opt', 'Coding Club'],
  },
  {
    id: 'L-1008',
    name: 'Divya Krishnan',
    initials: 'DK',
    phone: '+91-98765 43224',
    email: 'divya.k@email.com',
    course: 'B.Tech CSE',
    intake: '2026',
    source: 'Google Ads',
    city: 'Bangalore',
    assignedTo: { name: 'Divya' },
    status: 'nurture',
    documents: { uploaded: 3, required: 5 },
    communicationCount: 4,
    nextFollowUp: '2026-07-30T16:00:00Z',
    lastContact: '1d ago',
    parent: { name: 'Krishnan', phone: '+91-98765 43225', relation: 'Father' },
    moveHistory: [
      { id: 'm17', from: '', to: 'enquiry', by: 'system', byName: 'Google Ads', timestamp: ts(12), note: 'Google campaign lead' },
      { id: 'm18', from: 'enquiry', to: 'contact-attempted', by: 'user2', byName: 'Divya', timestamp: ts(9), note: 'Sent email with info' },
      { id: 'm19', from: 'contact-attempted', to: 'contacted', by: 'user2', byName: 'Divya', timestamp: ts(6), note: 'Positive conversation, wants to visit campus' },
      { id: 'm20', from: 'contacted', to: 'nurture', by: 'user2', byName: 'Divya', timestamp: ts(2), note: 'Scheduled campus visit for next week' },
    ],
  },
  {
    id: 'L-1009',
    name: 'Rohit Sharma',
    initials: 'RS',
    phone: '+91-98765 43226',
    email: 'rohit.s@email.com',
    course: 'BBA',
    intake: '2025',
    source: 'Walk-in',
    city: 'Chennai',
    assignedTo: { name: 'Karthik' },
    status: 'qualified',
    documents: { uploaded: 4, required: 4 },
    communicationCount: 7,
    nextFollowUp: null,
    lastContact: '2d ago',
    parent: { name: 'Ramesh Sharma', phone: '+91-98765 43227', relation: 'Father' },
    moveHistory: [
      { id: 'm21', from: '', to: 'enquiry', by: 'system', byName: 'Walk-in', timestamp: ts(20), note: 'Walk-in at campus' },
      { id: 'm22', from: 'enquiry', to: 'contact-attempted', by: 'user3', byName: 'Karthik', timestamp: ts(17), note: 'Initial contact made' },
      { id: 'm23', from: 'contact-attempted', to: 'contacted', by: 'user3', byName: 'Karthik', timestamp: ts(14), note: 'Had detailed discussion' },
      { id: 'm24', from: 'contacted', to: 'nurture', by: 'user3', byName: 'Karthik', timestamp: ts(10), note: 'Shared fee structure' },
      { id: 'm25', from: 'nurture', to: 'qualified', by: 'user3', byName: 'Karthik', timestamp: ts(4), note: 'Confirmed interest, shortlisted college' },
    ],
  },
  {
    id: 'L-1010',
    name: 'Meera Patel',
    initials: 'MP',
    phone: '+91-98765 43228',
    email: 'meera.p@email.com',
    course: 'B.Tech ECE',
    intake: '2026',
    source: 'School Visit',
    city: 'Hyderabad',
    assignedTo: { name: 'Priya' },
    status: 'qualified',
    documents: { uploaded: 3, required: 5 },
    communicationCount: 6,
    nextFollowUp: '2026-08-02T10:00:00Z',
    lastContact: '6h ago',
    parent: { name: 'Sunil Patel', phone: '+91-98765 43229', relation: 'Father' },
    moveHistory: [
      { id: 'm26', from: '', to: 'enquiry', by: 'system', byName: 'School Visit', timestamp: ts(15), note: 'School outreach program' },
      { id: 'm27', from: 'enquiry', to: 'contact-attempted', by: 'user1', byName: 'Priya', timestamp: ts(12), note: 'Called parents' },
      { id: 'm28', from: 'contact-attempted', to: 'contacted', by: 'user1', byName: 'Priya', timestamp: ts(10), note: 'Both parents and student interested' },
      { id: 'm29', from: 'contacted', to: 'nurture', by: 'user1', byName: 'Priya', timestamp: ts(7), note: 'Sent detailed ECE brochure' },
      { id: 'm30', from: 'nurture', to: 'qualified', by: 'user1', byName: 'Priya', timestamp: ts(1), note: 'Selected as top choice, ready to apply' },
    ],
    tags: ['Top Choice'],
  },
  {
    id: 'L-1011',
    name: 'Aditya Singh',
    initials: 'AS',
    phone: '+91-98765 43230',
    email: 'aditya.s@email.com',
    course: 'B.Tech CSE',
    intake: '2026',
    source: 'Facebook Ad',
    city: 'Lucknow',
    assignedTo: { name: 'Arun' },
    status: 'application',
    documents: { uploaded: 5, required: 5 },
    communicationCount: 8,
    nextFollowUp: '2026-07-30T09:00:00Z',
    lastContact: '1d ago',
    parent: { name: 'Raj Singh', phone: '+91-98765 43231', relation: 'Father' },
    moveHistory: [
      { id: 'm31', from: '', to: 'enquiry', by: 'system', byName: 'Facebook Ad', timestamp: ts(25), note: 'Facebook campaign' },
      { id: 'm32', from: 'enquiry', to: 'contact-attempted', by: 'user1', byName: 'Arun', timestamp: ts(22), note: 'Initial call' },
      { id: 'm33', from: 'contact-attempted', to: 'contacted', by: 'user1', byName: 'Arun', timestamp: ts(19), note: 'Interested in hostel facilities' },
      { id: 'm34', from: 'contacted', to: 'nurture', by: 'user1', byName: 'Arun', timestamp: ts(15), note: 'Shared hostel details' },
      { id: 'm35', from: 'nurture', to: 'qualified', by: 'user1', byName: 'Arun', timestamp: ts(10), note: 'Confirmed application intent' },
      { id: 'm36', from: 'qualified', to: 'application', by: 'user1', byName: 'Arun', timestamp: ts(3), note: 'Application submitted online' },
    ],
  },
  {
    id: 'L-1012',
    name: 'Neha Joshi',
    initials: 'NJ',
    phone: '+91-98765 43232',
    email: 'neha.j@email.com',
    course: 'MBA Finance',
    intake: '2024',
    source: 'Referral',
    city: 'Pune',
    assignedTo: { name: 'Divya' },
    status: 'application',
    documents: { uploaded: 4, required: 4 },
    communicationCount: 9,
    nextFollowUp: null,
    lastContact: '3d ago',
    parent: { name: 'Anil Joshi', phone: '+91-98765 43233', relation: 'Father' },
    moveHistory: [
      { id: 'm37', from: '', to: 'enquiry', by: 'system', byName: 'Referral', timestamp: ts(30), note: 'Alumni referral' },
      { id: 'm38', from: 'enquiry', to: 'contact-attempted', by: 'user2', byName: 'Divya', timestamp: ts(27), note: 'Called' },
      { id: 'm39', from: 'contact-attempted', to: 'contacted', by: 'user2', byName: 'Divya', timestamp: ts(24), note: 'Interested in MBA Finance' },
      { id: 'm40', from: 'contacted', to: 'nurture', by: 'user2', byName: 'Divya', timestamp: ts(20), note: 'Sent MBA brochure' },
      { id: 'm41', from: 'nurture', to: 'qualified', by: 'user2', byName: 'Divya', timestamp: ts(14), note: 'Shortlisted' },
      { id: 'm42', from: 'qualified', to: 'application', by: 'user2', byName: 'Divya', timestamp: ts(5), note: 'Application in review' },
    ],
  },
  {
    id: 'L-1013',
    name: 'Amit Verma',
    initials: 'AV',
    phone: '+91-98765 43234',
    email: 'amit.v@email.com',
    course: 'B.Tech CSE',
    intake: '2026',
    source: 'Facebook Ad',
    city: 'Delhi',
    assignedTo: { name: 'Karthik' },
    status: 'application-status',
    documents: { uploaded: 3, required: 5 },
    communicationCount: 5,
    nextFollowUp: '2026-08-03T11:00:00Z',
    lastContact: '2d ago',
    parent: { name: 'Pradeep Verma', phone: '+91-98765 43235', relation: 'Father' },
    moveHistory: [
      { id: 'm43', from: '', to: 'enquiry', by: 'system', byName: 'Facebook Ad', timestamp: ts(18), note: 'FB lead' },
      { id: 'm44', from: 'enquiry', to: 'contact-attempted', by: 'user3', byName: 'Karthik', timestamp: ts(15), note: 'Attempted contact' },
      { id: 'm45', from: 'contact-attempted', to: 'contacted', by: 'user3', byName: 'Karthik', timestamp: ts(12), note: 'Connected' },
      { id: 'm46', from: 'contacted', to: 'nurture', by: 'user3', byName: 'Karthik', timestamp: ts(8), note: 'Nurturing' },
      { id: 'm47', from: 'nurture', to: 'qualified', by: 'user3', byName: 'Karthik', timestamp: ts(4), note: 'Qualified' },
      { id: 'm48', from: 'qualified', to: 'application', by: 'user3', byName: 'Karthik', timestamp: ts(2), note: 'Applied' },
      { id: 'm49', from: 'application', to: 'application-status', by: 'doc-officer', byName: 'Document Officer', timestamp: ts(0, 6), note: 'Documents under verification — 2 missing' },
    ],
  },
  {
    id: 'L-1014',
    name: 'Pooja Desai',
    initials: 'PD',
    phone: '+91-98765 43236',
    email: 'pooja.d@email.com',
    course: 'B.Sc Physics',
    intake: '2025',
    source: 'Education Fair',
    city: 'Surat',
    assignedTo: { name: 'Priya' },
    status: 'offer-status',
    offerDecision: 'accepted',
    documents: { uploaded: 4, required: 4 },
    communicationCount: 10,
    nextFollowUp: '2026-07-29T14:00:00Z',
    lastContact: '5h ago',
    parent: { name: 'Kiran Desai', phone: '+91-98765 43237', relation: 'Mother' },
    moveHistory: [
      { id: 'm50', from: '', to: 'enquiry', by: 'system', byName: 'Education Fair', timestamp: ts(35), note: 'Education fair lead' },
      { id: 'm51', from: 'enquiry', to: 'contact-attempted', by: 'user1', byName: 'Priya', timestamp: ts(32), note: 'Called' },
      { id: 'm52', from: 'contact-attempted', to: 'contacted', by: 'user1', byName: 'Priya', timestamp: ts(29), note: 'Interested' },
      { id: 'm53', from: 'contacted', to: 'nurture', by: 'user1', byName: 'Priya', timestamp: ts(25), note: 'Nurtured' },
      { id: 'm54', from: 'nurture', to: 'qualified', by: 'user1', byName: 'Priya', timestamp: ts(18), note: 'Qualified' },
      { id: 'm55', from: 'qualified', to: 'application', by: 'user1', byName: 'Priya', timestamp: ts(10), note: 'Applied' },
      { id: 'm56', from: 'application', to: 'application-status', by: 'doc-officer', byName: 'Document Officer', timestamp: ts(5), note: 'All docs verified' },
      { id: 'm57', from: 'application-status', to: 'offer-status', by: 'user4', byName: 'Finance Officer', timestamp: ts(1), note: 'Offer acceptance pending — follow up for payment' },
    ],
  },
  {
    id: 'L-1015',
    name: 'Varun Chakraborty',
    initials: 'VC',
    phone: '+91-98765 43238',
    email: 'varun.c@email.com',
    course: 'B.Tech CSE',
    intake: '2026',
    source: 'Google Ads',
    city: 'Kolkata',
    assignedTo: { name: 'Divya' },
    status: 'offer-status',
    offerDecision: 'on-hold',
    documents: { uploaded: 5, required: 5 },
    communicationCount: 11,
    nextFollowUp: '2026-07-30T10:30:00Z',
    lastContact: '3h ago',
    parent: { name: 'Sajal Chakraborty', phone: '+91-98765 43239', relation: 'Father' },
    moveHistory: [
      { id: 'm58', from: '', to: 'enquiry', by: 'system', byName: 'Google Ads', timestamp: ts(40), note: 'Google campaign' },
      { id: 'm59', from: 'enquiry', to: 'contact-attempted', by: 'user2', byName: 'Divya', timestamp: ts(37), note: 'Called' },
      { id: 'm60', from: 'contact-attempted', to: 'contacted', by: 'user2', byName: 'Divya', timestamp: ts(34), note: 'Interested in CSE with AI specialization' },
      { id: 'm61', from: 'contacted', to: 'nurture', by: 'user2', byName: 'Divya', timestamp: ts(30), note: 'Shared AI brochure' },
      { id: 'm62', from: 'nurture', to: 'qualified', by: 'user2', byName: 'Divya', timestamp: ts(22), note: 'Top choice' },
      { id: 'm63', from: 'qualified', to: 'application', by: 'user2', byName: 'Divya', timestamp: ts(12), note: 'Applied' },
      { id: 'm64', from: 'application', to: 'application-status', by: 'doc-officer', byName: 'Document Officer', timestamp: ts(6), note: 'All docs verified' },
      { id: 'm65', from: 'application-status', to: 'offer-status', by: 'user4', byName: 'Finance Officer', timestamp: ts(1, 6), note: 'Offer on hold — parent wants to discuss payment plan' },
    ],
    tags: ['AI Specialization', 'Urgent Follow-up'],
  },
  {
    id: 'L-1016',
    name: 'Isha Agarwal',
    initials: 'IA',
    phone: '+91-98765 43240',
    email: 'isha.a@email.com',
    course: 'B.Com Hons',
    intake: '2025',
    source: 'Walk-in',
    city: 'Jaipur',
    assignedTo: { name: 'Arun' },
    status: 'offer-status',
    offerDecision: 'pending',
    documents: { uploaded: 4, required: 4 },
    communicationCount: 9,
    nextFollowUp: '2026-07-31T15:00:00Z',
    lastContact: '1d ago',
    parent: { name: 'Ravi Agarwal', phone: '+91-98765 43241', relation: 'Father' },
    moveHistory: [
      { id: 'm66', from: '', to: 'enquiry', by: 'system', byName: 'Walk-in', timestamp: ts(28), note: 'Walk-in' },
      { id: 'm67', from: 'enquiry', to: 'contact-attempted', by: 'user1', byName: 'Arun', timestamp: ts(25), note: 'Contacted' },
      { id: 'm68', from: 'contact-attempted', to: 'contacted', by: 'user1', byName: 'Arun', timestamp: ts(22), note: 'Spoke with parents' },
      { id: 'm69', from: 'contacted', to: 'nurture', by: 'user1', byName: 'Arun', timestamp: ts(18), note: 'Nurtured' },
      { id: 'm70', from: 'nurture', to: 'qualified', by: 'user1', byName: 'Arun', timestamp: ts(12), note: 'Qualified' },
      { id: 'm71', from: 'qualified', to: 'application', by: 'user1', byName: 'Arun', timestamp: ts(7), note: 'Applied' },
      { id: 'm72', from: 'application', to: 'application-status', by: 'doc-officer', byName: 'Document Officer', timestamp: ts(3), note: 'Docs verified' },
      { id: 'm73', from: 'application-status', to: 'offer-status', by: 'user4', byName: 'Finance Officer', timestamp: ts(0, 12), note: 'Awaiting offer decision' },
    ],
  },
  {
    id: 'L-1017',
    name: 'Kavya Nambiar',
    initials: 'KN',
    phone: '+91-98765 43242',
    email: 'kavya.n@email.com',
    course: 'B.Tech CSE',
    intake: '2026',
    source: 'Referral',
    city: 'Kochi',
    assignedTo: { name: 'Divya' },
    status: 'offer-status',
    offerDecision: 'accepted',
    documents: { uploaded: 5, required: 5 },
    communicationCount: 14,
    nextFollowUp: null,
    lastContact: '2d ago',
    parent: { name: 'Nambiar', phone: '+91-98765 43243', relation: 'Father' },
    moveHistory: [
      { id: 'm74', from: '', to: 'enquiry', by: 'system', byName: 'Referral', timestamp: ts(50), note: 'Referred' },
      { id: 'm75', from: 'enquiry', to: 'contact-attempted', by: 'user2', byName: 'Divya', timestamp: ts(47), note: 'Contacted' },
      { id: 'm76', from: 'contact-attempted', to: 'contacted', by: 'user2', byName: 'Divya', timestamp: ts(44), note: 'Discussed' },
      { id: 'm77', from: 'contacted', to: 'nurture', by: 'user2', byName: 'Divya', timestamp: ts(40), note: 'Nurtured' },
      { id: 'm78', from: 'nurture', to: 'qualified', by: 'user2', byName: 'Divya', timestamp: ts(32), note: 'Qualified' },
      { id: 'm79', from: 'qualified', to: 'application', by: 'user2', byName: 'Divya', timestamp: ts(22), note: 'Application submitted' },
      { id: 'm80', from: 'application', to: 'application-status', by: 'doc-officer', byName: 'Document Officer', timestamp: ts(14), note: 'All docs cleared' },
      { id: 'm81', from: 'application-status', to: 'offer-status', by: 'user4', byName: 'Finance Officer', timestamp: ts(8), note: 'Offer accepted' },
      { id: 'm82', from: 'application-status', to: 'offer-status', by: 'principal', byName: 'Principal', timestamp: ts(2), note: 'Welcome to SuperCampus! Enrollment details shared.' },
    ],
  },
  {
    id: 'L-1018',
    name: 'Siddharth Gupta',
    initials: 'SG',
    phone: '+91-98765 43244',
    email: 'siddharth.g@email.com',
    course: 'MBA',
    intake: '2024',
    source: 'Google Ads',
    city: 'Mumbai',
    assignedTo: { name: 'Karthik' },
    status: 'offer-status',
    offerDecision: 'rejected',
    documents: { uploaded: 0, required: 4 },
    communicationCount: 2,
    nextFollowUp: null,
    lastContact: '15d ago',
    parent: { name: 'Manoj Gupta', phone: '+91-98765 43245', relation: 'Father' },
    moveHistory: [
      { id: 'm83', from: '', to: 'enquiry', by: 'system', byName: 'Google Ads', timestamp: ts(30), note: 'Google lead' },
      { id: 'm84', from: 'enquiry', to: 'contact-attempted', by: 'user3', byName: 'Karthik', timestamp: ts(27), note: 'Attempted' },
      { id: 'm85', from: 'contact-attempted', to: 'offer-status', by: 'user3', byName: 'Karthik', timestamp: ts(15), note: 'Not interested — joined competitor institution' },
    ],
  },
  {
    id: 'L-1019',
    name: 'Lakshmi Narayanan',
    initials: 'LN',
    phone: '+91-98765 43246',
    email: 'lakshmi.n@email.com',
    course: 'B.Tech CSE',
    intake: '2026',
    source: 'Education Fair',
    city: 'Trichy',
    assignedTo: { name: 'Priya' },
    status: 'offer-status',
    offerDecision: 'rejected',
    documents: { uploaded: 1, required: 5 },
    communicationCount: 3,
    nextFollowUp: null,
    lastContact: '20d ago',
    parent: { name: 'Narayanan', phone: '+91-98765 43247', relation: 'Father' },
    moveHistory: [
      { id: 'm86', from: '', to: 'enquiry', by: 'system', byName: 'Education Fair', timestamp: ts(45), note: 'Fair lead' },
      { id: 'm87', from: 'enquiry', to: 'contact-attempted', by: 'user1', byName: 'Priya', timestamp: ts(42), note: 'Called' },
      { id: 'm88', from: 'contact-attempted', to: 'offer-status', by: 'user1', byName: 'Priya', timestamp: ts(20), note: 'No response after multiple attempts — spam' },
    ],
  },
  {
    id: 'L-1020',
    name: 'Akash Verma',
    initials: 'AV',
    phone: '+91-98765 43248',
    email: 'akash.v@email.com',
    course: 'BCA',
    intake: '2025',
    source: 'Facebook Ad',
    city: 'Chennai',
    assignedTo: { name: 'Arun' },
    status: 'enquiry',
    documents: { uploaded: 0, required: 4 },
    communicationCount: 1,
    nextFollowUp: null,
    lastContact: '8h ago',
    parent: { name: 'Rakesh Verma', phone: '+91-98765 43249', relation: 'Father' },
    moveHistory: [
      { id: 'm89', from: '', to: 'enquiry', by: 'system', byName: 'Facebook Ad', timestamp: ts(1), note: 'New Facebook lead' },
    ],
  },
  {
    id: 'L-1021',
    name: 'Sara Khan',
    initials: 'SK',
    phone: '+91-98765 43250',
    email: 'sara.k@email.com',
    course: 'BBA',
    intake: '2025',
    source: 'Referral',
    city: 'Bangalore',
    assignedTo: { name: 'Divya' },
    status: 'contacted',
    documents: { uploaded: 2, required: 4 },
    communicationCount: 4,
    nextFollowUp: '2026-08-05T10:00:00Z',
    lastContact: '1d ago',
    parent: { name: 'Imran Khan', phone: '+91-98765 43251', relation: 'Father' },
    moveHistory: [
      { id: 'm90', from: '', to: 'enquiry', by: 'system', byName: 'Referral', timestamp: ts(7), note: 'Referred' },
      { id: 'm91', from: 'enquiry', to: 'contact-attempted', by: 'user2', byName: 'Divya', timestamp: ts(5), note: 'Called' },
      { id: 'm92', from: 'contact-attempted', to: 'contacted', by: 'user2', byName: 'Divya', timestamp: ts(1), note: 'Interested in BBA with Marketing' },
    ],
  },
  {
    id: 'L-1022',
    name: 'Deepak Raja',
    initials: 'DR',
    phone: '+91-98765 43252',
    email: 'deepak.r@email.com',
    course: 'B.Tech ECE',
    intake: '2026',
    source: 'Google Ads',
    city: 'Madurai',
    assignedTo: { name: 'Karthik' },
    status: 'nurture',
    documents: { uploaded: 1, required: 5 },
    communicationCount: 3,
    nextFollowUp: '2026-08-06T14:00:00Z',
    lastContact: '4d ago',
    parent: { name: 'Raja', phone: '+91-98765 43253', relation: 'Father' },
    moveHistory: [
      { id: 'm93', from: '', to: 'enquiry', by: 'system', byName: 'Google Ads', timestamp: ts(14), note: 'Google lead' },
      { id: 'm94', from: 'enquiry', to: 'contact-attempted', by: 'user3', byName: 'Karthik', timestamp: ts(11), note: 'Called' },
      { id: 'm95', from: 'contact-attempted', to: 'contacted', by: 'user3', byName: 'Karthik', timestamp: ts(8), note: 'Brief conversation' },
      { id: 'm96', from: 'contacted', to: 'nurture', by: 'user3', byName: 'Karthik', timestamp: ts(4), note: 'Showed interest in ECE lab facilities' },
    ],
  },
  {
    id: 'L-1023',
    name: 'Shreya Mishra',
    initials: 'SM',
    phone: '+91-98765 43254',
    email: 'shreya.m@email.com',
    course: 'B.Tech CSE',
    intake: '2026',
    source: 'School Visit',
    city: 'Chennai',
    assignedTo: { name: 'Priya' },
    status: 'qualified',
    documents: { uploaded: 4, required: 5 },
    communicationCount: 7,
    nextFollowUp: '2026-07-30T08:00:00Z',
    lastContact: '12h ago',
    parent: { name: 'Mohan Mishra', phone: '+91-98765 43255', relation: 'Father' },
    moveHistory: [
      { id: 'm97', from: '', to: 'enquiry', by: 'system', byName: 'School Visit', timestamp: ts(16), note: 'School program lead' },
      { id: 'm98', from: 'enquiry', to: 'contact-attempted', by: 'user1', byName: 'Priya', timestamp: ts(13), note: 'Called' },
      { id: 'm99', from: 'contact-attempted', to: 'contacted', by: 'user1', byName: 'Priya', timestamp: ts(11), note: 'Very interested' },
      { id: 'm100', from: 'contacted', to: 'nurture', by: 'user1', byName: 'Priya', timestamp: ts(8), note: 'Shared success stories' },
      { id: 'm101', from: 'nurture', to: 'qualified', by: 'user1', byName: 'Priya', timestamp: ts(2), note: 'Ready to apply, needs guidance on entrance exam' },
    ],
    tags: ['Entrance Guidance'],
  },
  {
    id: 'L-1024',
    name: 'Naveen Kumar',
    initials: 'NK',
    phone: '+91-98765 43256',
    email: 'naveen.k@email.com',
    course: 'B.Tech CSE',
    intake: '2026',
    source: 'Facebook Ad',
    city: 'Hyderabad',
    assignedTo: { name: 'Arun' },
    status: 'application',
    documents: { uploaded: 4, required: 5 },
    communicationCount: 6,
    nextFollowUp: '2026-08-01T16:00:00Z',
    lastContact: '2d ago',
    parent: { name: 'Srinivas Kumar', phone: '+91-98765 43257', relation: 'Father' },
    moveHistory: [
      { id: 'm102', from: '', to: 'enquiry', by: 'system', byName: 'Facebook Ad', timestamp: ts(20), note: 'FB lead' },
      { id: 'm103', from: 'enquiry', to: 'contact-attempted', by: 'user1', byName: 'Arun', timestamp: ts(17), note: 'Called' },
      { id: 'm104', from: 'contact-attempted', to: 'contacted', by: 'user1', byName: 'Arun', timestamp: ts(14), note: 'Interested' },
      { id: 'm105', from: 'contacted', to: 'nurture', by: 'user1', byName: 'Arun', timestamp: ts(10), note: 'Shared fee details' },
      { id: 'm106', from: 'nurture', to: 'qualified', by: 'user1', byName: 'Arun', timestamp: ts(5), note: 'Qualified' },
      { id: 'm107', from: 'qualified', to: 'application', by: 'user1', byName: 'Arun', timestamp: ts(1), note: 'Submitted application' },
    ],
  },
  {
    id: 'L-1025',
    name: 'Swathi Pillai',
    initials: 'SP',
    phone: '+91-98765 43258',
    email: 'swathi.p@email.com',
    course: 'MBA HR',
    intake: '2024',
    source: 'Referral',
    city: 'Thiruvananthapuram',
    assignedTo: { name: 'Divya' },
    status: 'offer-status',
    offerDecision: 'rejected',
    documents: { uploaded: 4, required: 4 },
    communicationCount: 12,
    nextFollowUp: null,
    lastContact: '5d ago',
    parent: { name: 'Pillai', phone: '+91-98765 43259', relation: 'Father' },
    moveHistory: [
      { id: 'm108', from: '', to: 'enquiry', by: 'system', byName: 'Referral', timestamp: ts(55), note: 'Referred' },
      { id: 'm109', from: 'enquiry', to: 'contact-attempted', by: 'user2', byName: 'Divya', timestamp: ts(52), note: 'Contacted' },
      { id: 'm110', from: 'contact-attempted', to: 'contacted', by: 'user2', byName: 'Divya', timestamp: ts(49), note: 'Discussed' },
      { id: 'm111', from: 'contacted', to: 'nurture', by: 'user2', byName: 'Divya', timestamp: ts(44), note: 'Nurtured' },
      { id: 'm112', from: 'nurture', to: 'qualified', by: 'user2', byName: 'Divya', timestamp: ts(35), note: 'Qualified' },
      { id: 'm113', from: 'qualified', to: 'application', by: 'user2', byName: 'Divya', timestamp: ts(25), note: 'Applied' },
      { id: 'm114', from: 'application', to: 'application-status', by: 'doc-officer', byName: 'Document Officer', timestamp: ts(16), note: 'Cleared documents' },
      { id: 'm115', from: 'application-status', to: 'offer-status', by: 'user4', byName: 'Finance Officer', timestamp: ts(10), note: 'Offer accepted' },
      { id: 'm116', from: 'application-status', to: 'offer-status', by: 'principal', byName: 'Principal', timestamp: ts(5), note: 'Offer accepted — orientation scheduled' },
    ],
  },
];


