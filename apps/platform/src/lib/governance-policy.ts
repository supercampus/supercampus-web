import type { AuthorityRoleKey } from './authority-model';

export type GovernanceCapability =
  | 'fees.approvals.approve'
  | 'fees.refunds.prepare'
  | 'fees.refunds.approve'
  | 'examination.publishing.approve'
  | 'students.status.suspend'
  | 'application-desk.approve'
  | 'academics.assignments.manage';

export interface GovernanceRule {
  capability: GovernanceCapability;
  allowedRoles: readonly AuthorityRoleKey[];
  deniedRoles?: readonly AuthorityRoleKey[];
  note: string;
}

/**
 * Non-configurable separation-of-duty rules. A role still needs the matching
 * permission grant; this policy prevents a sensitive action from being made
 * available to an authority that must never perform it.
 */
export const GOVERNANCE_RULES: readonly GovernanceRule[] = [
  {
    capability: 'fees.approvals.approve',
    allowedRoles: ['principal'],
    note: 'Principal may approve fee decisions other than refunds.',
  },
  {
    capability: 'fees.refunds.prepare',
    allowedRoles: ['accountant', 'management'],
    note: 'Accountant may prepare a refund request for management review.',
  },
  {
    capability: 'fees.refunds.approve',
    allowedRoles: ['management'],
    deniedRoles: ['principal', 'accountant'],
    note: 'Only Management may issue final refund approval.',
  },
  {
    capability: 'examination.publishing.approve',
    allowedRoles: ['principal'],
    note: 'Principal approves publication of institutional results.',
  },
  {
    capability: 'students.status.suspend',
    allowedRoles: ['principal'],
    note: 'Principal may approve a student suspension.',
  },
  {
    capability: 'application-desk.approve',
    allowedRoles: ['admissions_officer', 'management'],
    deniedRoles: ['principal'],
    note: 'Admissions decisions remain outside Principal authority.',
  },
  {
    capability: 'academics.assignments.manage',
    allowedRoles: ['principal', 'academic_administrator'],
    note: 'Principal or Academic Administrator assigns HOD departments and Faculty teaching work.',
  },
] as const;

export const HOD_VISIBILITY_POLICY = {
  baseScope: 'department',
  includeCrossDepartmentTeachingByDepartmentStaff: true,
} as const;

export const ACADEMIC_ASSIGNMENT_POLICY = {
  assigners: ['principal', 'academic_administrator'] as const,
  hodAssignments: ['department'] as const,
  facultyAssignments: ['class', 'subject'] as const,
};

export function governanceRule(capability: GovernanceCapability) {
  return GOVERNANCE_RULES.find((rule) => rule.capability === capability);
}

export function roleMayPerformGovernedAction(
  role: AuthorityRoleKey,
  capability: GovernanceCapability,
) {
  const rule = governanceRule(capability);
  return Boolean(rule?.allowedRoles.includes(role));
}
