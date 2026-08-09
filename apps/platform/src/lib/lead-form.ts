import type { Lead } from '@/lib/kanban/kanban-data';
import type { CrmForm } from '@/lib/crm-api';

/**
 * Renders the lead editor from whatever form the tenant administrator published,
 * instead of a fixed list of inputs compiled into the page.
 *
 * A published field is matched to a structured lead column where its meaning is
 * recognisable (student name, phone, course, and so on). Anything the administrator
 * invented is round-tripped through the lead's custom fields, so a new field on the
 * form immediately becomes an editable, persisted value with no code change.
 */

export interface PublishedFormField {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  width?: string;
  section?: string;
}

interface RawSection {
  section?: string;
  fields?: unknown[];
}

/** Lead properties a published field can be bound to. */
export type CanonicalField =
  | 'name'
  | 'phone'
  | 'email'
  | 'whatsapp'
  | 'course'
  | 'intake'
  | 'city'
  | 'parentName'
  | 'parentPhone'
  | 'parentRelation';

const ALIASES: Record<CanonicalField, string[]> = {
  name: ['studentname', 'name', 'fullname', 'applicantname', 'studentfullname', 'candidatename'],
  phone: ['phone', 'phonenumber', 'mobile', 'mobilenumber', 'mobileno', 'contactnumber', 'contactno'],
  email: ['email', 'emailaddress', 'emailid', 'mailid'],
  whatsapp: ['whatsapp', 'whatsappnumber', 'whatsappno'],
  course: ['course', 'courses', 'program', 'programme', 'programname', 'branch', 'degree', 'stream'],
  intake: ['intake', 'intakeyear', 'batch', 'admissionyear', 'session', 'academicyear'],
  city: ['city', 'town', 'location', 'place', 'district'],
  parentName: ['parentname', 'guardianname', 'fathername', 'mothername', 'parentguardianname'],
  parentPhone: ['parentphone', 'parentmobile', 'guardianphone', 'parentcontact', 'parentnumber'],
  parentRelation: ['relation', 'relationship', 'parentrelation', 'guardianrelation'],
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Resolves a published field onto a lead property, or null when it is bespoke. */
export function canonicalFieldFor(field: PublishedFormField): CanonicalField | null {
  const candidates = [normalize(field.key), normalize(field.label)];
  for (const [canonical, aliases] of Object.entries(ALIASES) as [CanonicalField, string[]][]) {
    if (candidates.some((candidate) => candidate && aliases.includes(candidate))) {
      return canonical;
    }
  }
  return null;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const options = value.filter((entry): entry is string => typeof entry === 'string');
  return options.length ? options : undefined;
}

/** Flattens a published schema into an ordered, renderable field list. */
export function publishedFormFields(form: CrmForm | null | undefined): PublishedFormField[] {
  if (!form) return [];
  const schema = form.schema as { sections?: RawSection[] } | null | undefined;
  const sections = Array.isArray(schema?.sections) ? schema.sections : [];
  const fields: PublishedFormField[] = [];
  for (const section of sections) {
    const sectionFields = Array.isArray(section?.fields) ? section.fields : [];
    for (const raw of sectionFields) {
      if (!raw || typeof raw !== 'object') continue;
      const entry = raw as Record<string, unknown>;
      const key = typeof entry.key === 'string' ? entry.key : '';
      const label = typeof entry.label === 'string' ? entry.label : key;
      if (!key && !label) continue;
      fields.push({
        key: key || normalize(label),
        label: label || key,
        type: typeof entry.type === 'string' ? entry.type : 'Short text',
        required: entry.required === true,
        placeholder: typeof entry.placeholder === 'string' ? entry.placeholder : undefined,
        options: asStringArray(entry.options),
        width: typeof entry.width === 'string' ? entry.width : undefined,
        section: typeof section.section === 'string' ? section.section : undefined,
      });
    }
  }
  return fields;
}

/** Values that read as "no data" in the board projection rather than real content. */
const EMPTY_PLACEHOLDERS = new Set(['not provided', 'unassigned', '']);

function displayable(value: string | null | undefined): string {
  if (!value) return '';
  return EMPTY_PLACEHOLDERS.has(value.trim().toLowerCase()) ? '' : value;
}

/** Current value for a published field, from the structured lead or its custom fields. */
export function valueForField(lead: Lead, field: PublishedFormField): string {
  const canonical = canonicalFieldFor(field);
  switch (canonical) {
    case 'name': return displayable(lead.name);
    case 'phone': return displayable(lead.phone);
    case 'email': return displayable(lead.email);
    case 'whatsapp': return displayable(lead.whatsapp);
    case 'course': return displayable(lead.course);
    case 'intake': return displayable(lead.intake);
    case 'city': return displayable(lead.city);
    case 'parentName': return displayable(lead.parent.name);
    case 'parentPhone': return displayable(lead.parent.phone);
    case 'parentRelation': return displayable(lead.parent.relation);
    default: {
      const stored = lead.customFields?.[field.key];
      return stored === null || stored === undefined ? '' : String(stored);
    }
  }
}

export function initialDraftFor(lead: Lead, fields: PublishedFormField[]): Record<string, string> {
  const draft: Record<string, string> = {};
  for (const field of fields) draft[field.key] = valueForField(lead, field);
  return draft;
}

/**
 * Turns edited values back into a lead patch.
 *
 * Recognised fields update their structured column; everything else is merged into
 * custom fields under the published key, preserving values this form does not show.
 */
export function draftToLeadPatch(
  lead: Lead,
  fields: PublishedFormField[],
  draft: Record<string, string>,
): Partial<Lead> {
  const patch: Partial<Lead> = {};
  const parent = { ...lead.parent };
  const customFields: Record<string, unknown> = { ...(lead.customFields ?? {}) };
  let parentTouched = false;

  for (const field of fields) {
    const raw = draft[field.key];
    if (raw === undefined) continue;
    const value = raw.trim();
    switch (canonicalFieldFor(field)) {
      case 'name':
        if (value) {
          patch.name = value;
          patch.initials = value.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
        }
        break;
      case 'phone': patch.phone = value; break;
      case 'email': patch.email = value; break;
      case 'whatsapp': patch.whatsapp = value; break;
      case 'course': patch.course = value; break;
      case 'intake': patch.intake = value; break;
      case 'city': patch.city = value; break;
      case 'parentName': parent.name = value; parentTouched = true; break;
      case 'parentPhone': parent.phone = value; parentTouched = true; break;
      case 'parentRelation': parent.relation = value || 'Parent'; parentTouched = true; break;
      default:
        customFields[field.key] = value;
        break;
    }
  }

  if (parentTouched) patch.parent = parent;
  patch.customFields = customFields;
  return patch;
}

/** Input control for a published field type. */
export type ControlKind = 'text' | 'textarea' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'checkbox';

export function controlKindFor(field: PublishedFormField): ControlKind {
  if (field.options?.length) return 'select';
  switch (normalize(field.type)) {
    case 'longtext':
    case 'textarea':
    case 'paragraph':
      return 'textarea';
    case 'email': return 'email';
    case 'phone':
    case 'mobile':
    case 'telephone':
      return 'tel';
    case 'number':
    case 'numeric':
      return 'number';
    case 'date':
    case 'datepicker':
      return 'date';
    case 'checkbox':
    case 'boolean':
      return 'checkbox';
    default: return 'text';
  }
}
