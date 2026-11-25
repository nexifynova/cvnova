/**
 * Phase 3 - B2B employee roster.
 *
 * Shared between the company APIs (service role), the "Our Employees CVs" page
 * and the create-employee modal, so all three use the same field names and the
 * same row → view-model mapping. Pure functions only: this file is imported by
 * client components, so never add Node-only dependencies here.
 */

export type CompanyEmployee = {
  id: string;
  empId: string;
  fullName: string;
  email: string;
  contact: string;
  appliedField: string;
  /** YYYY-MM-DD (date column, no timezone shifting). */
  joinedOn: string;
  employeeUserId: string | null;
  inviteSentAt: string | null;
  createdAt: string;
};

export type EmployeeFieldCount = { name: string; count: number };

/** Shown when the company's package has expired (chat/creation are locked). */
export const EMPLOYEE_CREATE_LOCKED_MESSAGE =
  "Please purchase a plan to create your employees' CVs.";

const toText = (value: unknown): string => String(value ?? '').trim();

const toDateOnly = (value: unknown): string => {
  const raw = toText(value);
  if (!raw) return '';
  const match = raw.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : '';
};

export function mapCompanyEmployee(row: any): CompanyEmployee {
  return {
    id: String(row?.id || ''),
    empId: toText(row?.emp_id),
    fullName: toText(row?.full_name) || 'Employee',
    email: toText(row?.email),
    contact: toText(row?.contact),
    appliedField: toText(row?.applied_field),
    joinedOn: toDateOnly(row?.joined_on),
    employeeUserId: row?.employee_user_id ? String(row.employee_user_id) : null,
    inviteSentAt: row?.invite_sent_at ? String(row.invite_sent_at) : null,
    createdAt: row?.created_at ? String(row.created_at) : '',
  };
}

/** Distinct applied fields with counts, for the filter dropdown. */
export function employeeFieldCounts(employees: CompanyEmployee[]): EmployeeFieldCount[] {
  const counts = new Map<string, number>();
  for (const employee of employees) {
    const name = employee.appliedField;
    if (!name) continue;
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** "2026-11-26" -> "26 Nov 2026" (stable, no timezone drift). */
export function formatJoinedOn(value: string): string {
  const date = toDateOnly(value);
  if (!date) return '—';
  const [year, month, day] = date.split('-').map((part) => Number(part));
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = months[(month || 1) - 1] || '';
  if (!year || !day || !monthName) return date;
  return `${String(day).padStart(2, '0')} ${monthName} ${year}`;
}

/** Today as YYYY-MM-DD in the browser's timezone (default for the date input). */
export function todayDateOnly(now: Date = new Date()): string {
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
