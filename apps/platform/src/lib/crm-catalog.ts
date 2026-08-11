export const LEAD_SOURCES = [
  'Agent / Consultant',
  'Google Search',
  'Other Search / AI',
  'Google Ads',
  'Facebook / Instagram',
  'LinkedIn',
  'YouTube',
  'Quora',
  'College Portals / Aggregators',
  'Institution Website',
  'Google Business Profile',
  'Inbound Call',
  'Inbound WhatsApp',
  'Walk-In',
  'Outbound Calling',
  'WhatsApp Campaign',
  'SMS Campaign',
  'Student Referral',
  'Alumni Referral',
  'Parent Referral',
  'School / Counselor Referral',
  'Education Fair / Seminar',
  'Webinar',
  'Counselling / Admission Event',
  'Radio / Offline Media',
  'Other',
] as const;

export function pipelineValueLabel(value: string) {
  return value.replaceAll('_', ' ').replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const SAME_STAGE_TRANSITIONS: Record<string, Record<string, string[]>> = {
  enquiry: {
    new: ['contact_attempted', 'contacted', 'nurture'],
    contact_attempted: ['contacted', 'nurture'],
    contacted: ['nurture', 'qualified'],
    nurture: ['qualified', 'converted'],
    qualified: ['converted'],
  },
  contact_attempted: {
    contacted: ['nurture', 'qualified', 'converted'],
    nurture: ['qualified', 'converted'],
    qualified: ['converted'],
  },
  contacted: {
    nurture: ['qualified', 'converted'],
    qualified: ['converted'],
  },
  nurture: { qualified: ['converted'] },
  application: {
    to_do: ['application_in_progress', 'documents_required', 'application_fee_pending', 'application_not_open', 'technical_issue'],
    application_in_progress: ['documents_required', 'application_fee_pending', 'application_submitted'],
    documents_required: ['application_submitted'],
    application_fee_pending: ['application_submitted'],
    application_not_open: ['to_do'],
    technical_issue: ['to_do'],
  },
  application_status: {
    awaiting_decision: ['documents_required', 'interview_to_be_scheduled', 'waitlisted', 'unconditional_offer'],
    documents_required: ['awaiting_decision'],
    interview_to_be_scheduled: ['interview_scheduled'],
    interview_scheduled: ['awaiting_decision', 'unconditional_offer'],
    waitlisted: ['unconditional_offer'],
  },
  offer_status: { to_do: ['accepted', 'rejected'] },
};

export function availableCurrentStageSubstates(stage: string, current: string | undefined, catalog: string[]) {
  if (!current) return catalog;
  const stageKey = stage.replaceAll('-', '_');
  const allowed = SAME_STAGE_TRANSITIONS[stageKey]?.[current] ?? [];
  return catalog.filter((substate) => substate === current || allowed.includes(substate));
}
