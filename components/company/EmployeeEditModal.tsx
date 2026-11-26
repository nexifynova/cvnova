'use client';

import { useEffect, useState } from 'react';
import { Loader2, Mail, PencilLine, ShieldCheck, X } from 'lucide-react';
import { authedFetch, supabase } from '@/lib/supabase';
import { todayDateOnly, type CompanyEmployee } from '@/lib/company-employees';

/**
 * Phase 5 - edit a roster row from /company/employees.
 *
 * Only the company-owned fields are editable (name, contact, applied field and
 * joining date). The login email belongs to the employee's own CVNova account,
 * so it is shown read-only: /api/company/employees PATCH refuses to change it.
 */

const inputClass =
  'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

export default function EmployeeEditModal({
  employee,
  onClose,
  onSaved,
}: {
  employee: CompanyEmployee | null;
  onClose: () => void;
  onSaved?: (employee: CompanyEmployee) => void;
}) {
  const [form, setForm] = useState({
    fullName: '',
    contact: '',
    appliedField: '',
    joinedOn: '',
  });
  const [fieldOptions, setFieldOptions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load the selected row into the form every time the modal opens.
  useEffect(() => {
    if (!employee) return;
    setForm({
      fullName: employee.fullName,
      contact: employee.contact,
      appliedField: employee.appliedField,
      joinedOn: employee.joinedOn || todayDateOnly(),
    });
    setError('');
  }, [employee]);

  useEffect(() => {
    if (!employee) return;
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from('job_fields')
        .select('field_name')
        .order('field_name', { ascending: true });
      if (cancelled) return;
      setFieldOptions(
        Array.from(
          new Set(
            ((data as { field_name?: string }[]) || [])
              .map((row) => String(row.field_name || '').trim())
              .filter(Boolean),
          ),
        ),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [employee]);

  if (!employee) return null;

  const close = () => {
    if (saving) return;
    setError('');
    onClose();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setError('');
    setSaving(true);
    try {
      const res = await authedFetch('/api/company/employees', {
        method: 'PATCH',
        body: JSON.stringify({
          id: employee.id,
          fullName: form.fullName,
          contact: form.contact,
          appliedField: form.appliedField,
          joinedOn: form.joinedOn,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'employee_name_required') throw new Error('Enter the employee full name.');
        if (data.error === 'invalid_joining_date') throw new Error('Enter a valid joining date.');
        if (data.error === 'employee_not_found') throw new Error('This employee is no longer on your roster.');
        if (data.error === 'company_account_disabled') {
          throw new Error('This company account has been disabled by the CVNova team.');
        }
        throw new Error(data.error || 'Could not save the employee');
      }
      onSaved?.(data.employee as CompanyEmployee);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not save the employee');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-purple-600 p-5 text-white">
          <div className="flex items-start gap-3">
            <PencilLine size={22} className="mt-0.5 shrink-0" />
            <div>
              <h2 className="text-lg font-bold">Edit employee</h2>
              <p className="mt-1 text-xs text-blue-50">
                Employee ID <span className="font-mono font-bold">{employee.empId || '-'}</span> · the CVNova account
                and its CVs stay untouched.
              </p>
            </div>
          </div>
          <button type="button" onClick={close} aria-label="Close" className="text-white/80 transition hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3 p-5">
          <div>
            <label className="mb-1 block text-xs font-bold text-gray-600">Employee full name</label>
            <input
              value={form.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
              required
              minLength={2}
              placeholder="e.g. Ayesha Khan"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-gray-600">Login email</label>
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500">
              <Mail size={14} className="shrink-0" />
              <span className="truncate font-mono text-xs">{employee.email || '-'}</span>
            </div>
            <p className="mt-1 text-[11px] text-gray-400">
              The employee owns this login. Create a new employee entry if the email must change.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-600">Contact number</label>
              <input
                value={form.contact}
                onChange={(event) => setForm({ ...form, contact: event.target.value })}
                placeholder="+44 7..."
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-600">Joining date</label>
              <input
                type="date"
                value={form.joinedOn}
                onChange={(event) => setForm({ ...form, joinedOn: event.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-gray-600">Applied field</label>
            <input
              value={form.appliedField}
              onChange={(event) => setForm({ ...form, appliedField: event.target.value })}
              list="employee-edit-field-options"
              placeholder="e.g. Software Engineering"
              className={inputClass}
            />
            <datalist id="employee-edit-field-options">
              {fieldOptions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p>
          ) : (
            <p className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-[11px] text-blue-900">
              <ShieldCheck size={14} className="mt-0.5 shrink-0" />
              Saving updates only your company roster. The employee signs in with the same credentials as before.
            </p>
          )}

          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={close}
              disabled={saving}
              className="rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <PencilLine size={16} />}
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
