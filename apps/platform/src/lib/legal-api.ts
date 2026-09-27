/**
 * Builds the emails the public legal forms hand off to.
 *
 * There is no public backend endpoint for account deletion or support
 * inquiries yet, so these forms do not submit anything themselves. They open
 * a pre-filled email to the team that handles the request; the request is
 * only received once the person sends that email. Never report a request as
 * submitted, queued or deleted from this module.
 */

/** The one monitored SuperCampus mailbox: support, privacy, deletion and grievances. */
export const CONTACT_EMAIL = 'dev@supercampus.ai';
export const PRIVACY_EMAIL = CONTACT_EMAIL;
export const SUPPORT_EMAIL = CONTACT_EMAIL;

export interface DeletionRequestPayload {
  identifier: string; // Registered email or phone
  fullName: string;
  role?: string;
  collegeName?: string;
  reason?: string;
  additionalDetails?: string;
}

export interface ContactMessagePayload {
  name: string;
  email: string;
  category: 'general' | 'privacy' | 'deletion' | 'institutional';
  subject: string;
  message: string;
  college?: string;
}

function mailto(to: string, subject: string, lines: string[]): string {
  const body = lines.join('\r\n');
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function accountDeletionEmail(payload: DeletionRequestPayload): string {
  return mailto(PRIVACY_EMAIL, `Account deletion request: ${payload.fullName}`, [
    'Please delete my SuperCampus account.',
    '',
    `Registered email or phone: ${payload.identifier}`,
    `Full name: ${payload.fullName}`,
    `Role: ${payload.role || 'Not specified'}`,
    `College / institution: ${payload.collegeName || 'Not specified'}`,
    `Reason: ${payload.reason || 'Not specified'}`,
    '',
    payload.additionalDetails ? `Additional comments: ${payload.additionalDetails}` : '',
    '',
    'I understand that some records may be retained where required for legal, security,',
    'financial, or institutional record-keeping purposes.',
  ]);
}

export function contactInquiryEmail(payload: ContactMessagePayload): {
  to: string;
  href: string;
} {
  const to =
    payload.category === 'privacy' || payload.category === 'deletion'
      ? PRIVACY_EMAIL
      : SUPPORT_EMAIL;
  const href = mailto(to, payload.subject, [
    payload.message,
    '',
    '---',
    `Name: ${payload.name}`,
    `Reply to: ${payload.email}`,
    `Topic: ${payload.category}`,
    `College / institution: ${payload.college || 'Not specified'}`,
  ]);
  return { to, href };
}
