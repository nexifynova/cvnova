'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BadgeCheck,
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  Mail,
  UserPlus,
  X,
} from 'lucide-react';
import { authedFetch, supabase } from '@/lib/supabase';
import {
  EMPLOYEE_CREATE_LOCKED_MESSAGE,
  formatJoinedOn,
  todayDateOnly,
  type CompanyEmployee,
} from '@/lib/company-employees';

/**
 * Phase 3 - "Create your Employees CVs at Nexify Nova".
 *
 * Creates a normal CVNova candidate account for an employee (temp password +
 * verification email are sent by /api/company/employees) and adds the row to
 * the company roster. Used from the talent-pool box and from /company/employees.
 */

export type EmployeeInviteCredentials = {
  email: string;
  temporaryPassword: string | null;
  linkedExistingAccount: boolean;
  verificationEmail: string;
  welcomeEmail: string;
};

const inputClass =
  'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

export default function EmployeeCreateModal({
  open,
  onClose,
  onCreated,
  locked = false,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (employee: CompanyEmployee) => void;
  /** True when the company package is expired: form is replaced by the lock note. */
  locked?: boolean;
}) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    contact: '',
    appliedField: '',
    joinedOn: '',
  });
  const [fieldOptions, setFieldOptions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ employee: CompanyEmployee; credentials: EmployeeInviteCredentials } | null>(null);
  const [copied, setCopied] = useState('');

  // Default the joining date to today once the modal opens (calling
  // `new Date()` during prerender is blocked by Next 16's Cache Components).
  useEffect(() => {
    if (!open) return;
    setForm((prev) => (prev.joinedOn ? prev : { ...prev, joinedOn: todayDateOnly() }));
  }, [open]);

  // Applied-field suggestions come from the shared job_fields catalogue.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from('job_fields')
        .select('field_name')
        .order('field_name', { ascending: true });
      if (cancelled) return;
      setFieldOptions(
        Array.from(new Set(((data as { field_name?: string }[]) || []).map((row) => String(row.field_name || '').trim()).filter(Boolean))),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  const reset = () => {
    setForm({ fullName: '', email: '', contact: '', appliedField: '', joinedOn: todayDateOnly() });
    setCreated(null);
    setError('');
  };

  const close = () => {
    reset();
    onClose();
  };

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(''), 1600);
    } catch {
      /* clipboard blocked: the value is visible on screen anyway */
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setError('');
    setSaving(true);
    try {
      const res = await authedFetch('/api/company/employees', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'package_expired') throw new Error(data.message || EMPLOYEE_CREATE_LOCKED_MESSAGE);
        if (data.error === 'employee_exists') throw new Error('This employee is already on your list.');
        if (data.error === 'employee_email_invalid') throw new Error('Enter a valid employee email address.');
        if (data.error === 'employee_name_required') throw new Error('Enter the employee full name.');
        if (data.error === 'invalid_joining_date') throw new Error('Enter a valid joining date.');
        throw new Error(data.message || data.error || 'Could not create the employee account');
      }
      setCreated({ employee: data.employee as CompanyEmployee, credentials: data.credentials as EmployeeInviteCredentials });
      onCreated?.(data.employee as CompanyEmployee);
    } catch (err: any) {
      setError(err.message || 'Could not create the employee account');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-purple-600 p-5 text-white">
          <div className="flex items-start gap-3">
            <UserPlus size={22} className="mt-0.5 shrink-0" />
            <div>
              <h2 className="text-lg font-bold">Create your Employees CVs at Nexify Nova</h2>
              <p className="mt-1 text-xs text-blue-50">
                Each employee gets a normal CVNova account, a temporary password and their own dashboard.
              </p>
            </div>
          </div>
          <button type="button" onClick={close} aria-label="Close" className="text-white/80 transition hover:text-white">
            <X size={20} />
          </button>
        </div>

        {locked ? (
          <div className="space-y-4 p-5">
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              {EMPLOYEE_CREATE_LOCKED_MESSAGE}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={close}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-100"
              >
                Close
              </button>
              <Link
                href="/company/billing"
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                View plans
              </Link>
            </div>
          </div>
        ) : created ? (
          <div className="space-y-4 p-5">
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-bold text-emerald-900">{created.employee.fullName} is on your employee list</p>
                <p className="mt-0.5 text-xs text-emerald-800">
                  Employee ID <span className="font-mono font-bold">{created.employee.empId}</span> · joined{' '}
                  {formatJoinedOn(created.employee.joinedOn)}
                </p>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                  <Mail size={14} /> Login email
                </span>
                <button
                  type="button"
                  onClick={() => copy('email', created.credentials.email)}
                  className="flex items-center gap-1 font-mono text-xs font-bold text-gray-900 hover:text-blue-600"
                >
                  {created.credentials.email} <Copy size={12} />
                </button>
              </div>
              {created.credentials.temporaryPassword ? (
                <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-2">
                  <span className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                    <KeyRound size={14} /> Temporary password
                  </span>
                  <button
                    type="button"
                    onClick={() => copy('password', created.credentials.temporaryPassword || '')}
                    className="flex items-center gap-1 font-mono text-xs font-bold text-gray-900 hover:text-blue-600"
                  >
                    {created.credentials.temporaryPassword} <Copy size={12} />
                  </button>
                </div>
              ) : (
                <p className="border-t border-gray-200 pt-2 text-xs text-gray-600">
                  This person already had a CVNova account, so it was linked instead of creating a second one.
                </p>
              )}
              {copied ? <p className="text-[11px] font-semibold text-emerald-600">Copied {copied} to clipboard.</p> : null}
            </div>

            <div className="space-y-1 rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-900">
              <p className="flex items-start gap-2">
                <BadgeCheck size={14} className="mt-0.5 shrink-0" />
                {created.credentials.verificationEmail === 'sent'
                  ? 'A verification email was sent - the employee must confirm it before signing in.'
                  : created.credentials.verificationEmail === 'not_needed'
                    ? 'Existing account linked, so no new verification email was needed.'
                    : `Verification email could not be sent (${created.credentials.verificationEmail.replace('failed: ', '')}). Ask them to use "Resend verification" on the login page.`}
              </p>
              <p className="flex items-start gap-2">
                <Mail size={14} className="mt-0.5 shrink-0" />
                {created.credentials.welcomeEmail === 'sent'
                  ? 'The temporary password was emailed to the employee.'
                  : created.credentials.welcomeEmail === 'not_needed'
                    ? 'No new password to send.'
                    : 'The welcome email was not delivered - share the temporary password above manually.'}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={reset}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
              >
                Create another
              </button>
              <Link
                href="/company/employees"
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                View our employees
              </Link>
              <button
                type="button"
                onClick={close}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-gray-500 transition hover:bg-gray-100"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3 p-5">
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-600">Employee full name</label>
              <input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
                minLength={2}
                placeholder="e.g. Ayesha Khan"
                className={inputClass}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-600">Employee email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="name@company.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-600">Contact number</label>
                <input
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  placeholder="+44 7..."
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-600">Applied field</label>
                <input
                  value={form.appliedField}
                  onChange={(e) => setForm({ ...form, appliedField: e.target.value })}
                  list="employee-field-options"
                  placeholder="e.g. Software Engineering"
                  className={inputClass}
                />
                <datalist id="employee-field-options">
                  {fieldOptions.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-600">Joining date</label>
                <input
                  type="date"
                  value={form.joinedOn}
                  onChange={(e) => setForm({ ...form, joinedOn: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p>
            ) : (
              <p className="text-[11px] leading-relaxed text-gray-500">
                We email a temporary password and a verification link. The employee signs in like any normal CVNova
                user and can build CVs straight away.
              </p>
            )}

            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={close}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                Create employee CV
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
