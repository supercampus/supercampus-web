import type { Lead, MoveLog, UserRole, ActivityEntry } from './kanban-data';
import { COLUMN_IDS, ROLES } from './kanban-data';

export function canMoveLead(
  roleId: string,
  fromColumn: string,
  toColumn: string
): { allowed: boolean; reason?: string } {
  const role = ROLES.find((r) => r.id === roleId);
  if (!role) return { allowed: false, reason: 'Unknown role' };

  if (role.id === 'principal') return { allowed: true };

  if (toColumn === 'archived') {
    if (role.permissions.includes(fromColumn)) return { allowed: true };
    return { allowed: false, reason: `You don't have permission to archive leads from this column` };
  }

  const fromIndex = COLUMN_IDS.indexOf(fromColumn);
  const toIndex = COLUMN_IDS.indexOf(toColumn);

  if (fromIndex < 0 || toIndex < 0) return { allowed: false, reason: 'Invalid column' };

  const allowedSet = new Set(role.permissions);

  if (!allowedSet.has(fromColumn)) {
    return { allowed: false, reason: `You don't have permission to move leads from "${fromColumn}"` };
  }

  if (!allowedSet.has(toColumn)) {
    return { allowed: false, reason: `You don't have permission to move leads to "${toColumn}"` };
  }

  if (toColumn === 'archived') return { allowed: true };

  if (Math.abs(toIndex - fromIndex) > 3) {
    return { allowed: false, reason: 'Cannot jump too many stages at once' };
  }

  return { allowed: true };
}

export function createMoveLog(
  lead: Lead,
  from: string,
  to: string,
  by: string,
  byName: string,
  note: string
): MoveLog {
  return {
    id: `ml-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    from,
    to,
    by,
    byName,
    timestamp: new Date().toISOString(),
    note,
  };
}

export function createActivityEntry(
  lead: Lead,
  type: ActivityEntry['type'],
  by: string,
  byName: string,
  options?: { from?: string; to?: string; note?: string }
): ActivityEntry {
  return {
    id: `ae-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    leadId: lead.id,
    leadName: lead.name,
    type,
    from: options?.from,
    to: options?.to,
    by,
    byName,
    timestamp: new Date().toISOString(),
    note: options?.note,
  };
}

export function findColumnById(id: string) {
  return COLUMN_IDS.find((c) => c === id) ?? null;
}

export function isKeyStageMove(from: string, to: string): boolean {
  const keyMoves: [string, string][] = [
    ['enquiry', 'contact-attempted'],
    ['qualified', 'application'],
    ['application', 'application-status'],
    ['application-status', 'deposit-payment'],
    ['deposit-payment', 'admitted'],
  ];
  return keyMoves.some(([f, t]) => f === from && t === to);
}

export function getColumnTitle(id: string): string {
  const map: Record<string, string> = {
    enquiry: 'Enquiry',
    'contact-attempted': 'Contact Attempted',
    contacted: 'Contacted',
    nurture: 'Nurture',
    qualified: 'Qualified',
    application: 'Application',
    'application-status': 'Application Status',
    'deposit-payment': 'Deposit Payment',
    admitted: 'Admitted',
    archived: 'Archived',
  };
  return map[id] ?? id;
}
