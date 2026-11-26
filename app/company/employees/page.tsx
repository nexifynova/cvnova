'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarDays,
  FileText,
  Loader2,
  LogOut,
  Mail,
  Pencil,
  Phone,
  Plus,
  Receipt,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { authedFetch, supabase } from '@/lib/supabase';
import type { CompanyAccess } from '@/lib/company-access';
import EmployeeCreateModal from '@/components/company/EmployeeCreateModal';
import EmployeeEditModal from '@/components/company/EmployeeEditModal';
import {
  EMPLOYEE_CREATE_LOCKED_MESSAGE,
  employeeFieldCounts,
  formatJoinedOn,
  type CompanyEmployee,
  type EmployeeFieldCount,
} from '@/lib/company-employees';

/**
 * Phase 3 - /company/employees ("Our Employees CVs")
 *
 * The company's own staff list: Emp ID, joining date, name, contact and the
 * applied field, with a field filter. Rows are written by
 * /api/company/employees, which also creates the employee's normal CVNova
 * account and emails the temporary password.
 */

type EmployeesResponse = {
  employees: CompanyEmployee[];
  fields: EmployeeFieldCount[];
  total: number;
  shown: number;
  access: CompanyAccess;
  company?: { name?: string };
};

export default function CompanyEmployeesPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [companyName, setCompanyName] = useState('Company');
  const [employees, setEmployees] = useState<CompanyEmployee[]>([]);
  const [fields, setFields] = useState<EmployeeFieldCount[]>([]);
  const [access, setAccess] = useState<CompanyAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [fieldFilter, setFieldFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [flash, setFlash] = useState('');
  const [editing, setEditing] = useState<CompanyEmployee | null>(null);
  const [deletingId, setDeletingId] = useState('');

  const load = async (field = fieldFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (field) params.set('field', field);
      const qs = params.toString();
      const res = await authedFetch(`/api/company/employees${qs ? `?${qs}` : ''}`);
      const data = (await res.json()) as EmployeesResponse & { error?: string };
      if (!res.ok) throw new Error(data.error || 'Could not load your employees');
      setEmployees(Array.isArray(data.employees) ? data.employees : []);
      setFields(Array.isArray(data.fields) ? data.fields : []);
      setAccess(data.access || null);
      if (data.company?.name) setCompanyName(data.company.name);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Could not load your employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const guard = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const role = String(user?.user_metadata?.role || '').toLowerCase();
      if (!user || role !== 'company') {
        router.replace('/company');
        return;
      }
      setCompanyName(String(user.user_metadata?.company_name || 'Company'));
      setChecking(false);
      await load('');
    };
    void guard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace('/company');
  };

  const changeField = async (next: string) => {
    setFieldFilter(next);
    await load(next);
  };

  /**
   * Phase 5 - remove a roster row. The confirm text makes it explicit that the
   * employee's own CVNova account survives, because the CVs belong to them.
   */
  const removeEmployee = async (employee: CompanyEmployee) => {
    const confirmed = window.confirm(
      `Remove ${employee.fullName} (${employee.empId || 'no Emp ID'}) from your roster?\n\n` +
        'Their CVNova account and CVs stay active - only this company roster row is deleted.',
    );
    if (!confirmed) return;

    setDeletingId(employee.id);
    setError('');
    setFlash('');
    try {
      const res = await authedFetch(`/api/company/employees?id=${encodeURIComponent(employee.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'employee_not_found') throw new Error('This employee is no longer on your roster.');
        if (data.error === 'company_account_disabled') {
          throw new Error('This company account has been disabled by the CVNova team.');
        }
        throw new Error(data.error || 'Could not remove the employee');
      }
      setEmployees((current) => current.filter((item) => item.id !== employee.id));
      setFlash(data.message || `${employee.fullName} was removed from your roster.`);
      await load();
    } catch (err: any) {
      setError(err.message || 'Could not remove the employee');
    } finally {
      setDeletingId('');
    }
  };

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return employees;
    return employees.filter((employee) =>
      [employee.empId, employee.fullName, employee.email, employee.contact, employee.appliedField]
        .join(' ')
        .toLowerCase()
        .includes(search),
    );
  }, [employees, query]);

  const fieldCount = useMemo(() => employeeFieldCounts(employees).length || fields.length, [employees, fields.length]);

  // Current month is resolved after mount: Next 16 blocks `new Date()` while
  // prerendering a client component.
  const [currentMonth, setCurrentMonth] = useState('');
  useEffect(() => {
    setCurrentMonth(new Date().toISOString().slice(0, 7));
  }, []);

  const joinedThisMonth = useMemo(() => {
    if (!currentMonth) return 0;
    return employees.filter((employee) => employee.joinedOn.startsWith(currentMonth)).length;
  }, [employees, currentMonth]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B1120]">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 p-2">
              <Building2 className="text-white" size={18} />
            </div>
            <div>
              <p className="truncate text-sm font-extrabold text-gray-900">{companyName}</p>
              <p className="text-[11px] text-gray-500">Company portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/company/dashboard" className="hidden text-xs font-bold text-gray-600 hover:text-blue-600 sm:block">
              Dashboard
            </Link>
            <Link href="/company/billing" className="hidden text-xs font-bold text-gray-600 hover:text-blue-600 sm:block">
              Billing
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Our Employees CVs</h1>
            <p className="mt-1 text-sm text-gray-500">
              Every employee gets a normal CVNova account and their own dashboard, created by your company.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/company/billing"
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
            >
              <Receipt size={14} /> Billing
            </Link>
            <button
              type="button"
              onClick={() => {
                setFlash('');
                setModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
            >
              <Plus size={14} /> Create employee CV
            </button>
          </div>
        </header>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
              <Users size={13} /> Employees
            </p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">
              {loading && employees.length === 0 ? '—' : employees.length}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
              <Briefcase size={13} /> Applied fields
            </p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">{fieldCount}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
              <CalendarDays size={13} /> Joined this month
            </p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">{joinedThisMonth}</p>
          </div>
        </div>

        {access?.readOnly ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p className="text-xs font-semibold">
                {EMPLOYEE_CREATE_LOCKED_MESSAGE} Your existing employee CVs stay readable.
              </p>
            </div>
            <Link
              href="/company/billing"
              className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-amber-700"
            >
              View plans
            </Link>
          </div>
        ) : null}

        {flash ? (
          <div className="mb-4 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
            <BadgeCheck size={18} className="mt-0.5 shrink-0 text-emerald-600" />
            <p className="text-xs font-semibold">{flash}</p>
          </div>
        ) : null}

        {error ? (
          <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, Emp ID, email, contact..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={fieldFilter}
            onChange={(e) => void changeField(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All fields</option>
            {fields.map((field) => (
              <option key={field.name} value={field.name}>
                {field.name} ({field.count})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-50"
          >
            Refresh
          </button>
          <span className="ml-auto text-[11px] font-semibold text-gray-500">
            {visible.length} of {employees.length} shown
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-bold">Emp ID</th>
                  <th className="px-4 py-3 font-bold">Joining date</th>
                  <th className="px-4 py-3 font-bold">Name</th>
                  <th className="px-4 py-3 font-bold">Contact</th>
                  <th className="px-4 py-3 font-bold">Applied field</th>
                  <th className="px-4 py-3 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && visible.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center">
                      <Loader2 className="mx-auto animate-spin text-blue-500" size={24} />
                    </td>
                  </tr>
                ) : visible.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center">
                      <FileText className="mx-auto mb-2 text-gray-300" size={26} />
                      <p className="text-sm font-bold text-gray-700">
                        {employees.length === 0 ? 'No employees yet' : 'No employees match this filter'}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {employees.length === 0
                          ? 'Create your first employee CV and it will appear here with an Employee ID.'
                          : 'Try another field or clear the search box.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  visible.map((employee) => (
                    <tr key={employee.id} className="transition hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-bold text-gray-900">
                        {employee.empId}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600">
                        {formatJoinedOn(employee.joinedOn)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-900">{employee.fullName}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-500">
                          <Mail size={10} /> {employee.email}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600">
                        {employee.contact ? (
                          <span className="flex items-center gap-1">
                            <Phone size={11} /> {employee.contact}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 font-bold text-blue-700">
                          {employee.appliedField || 'Not set'}
                        </span>
                        {employee.inviteSentAt ? (
                          <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                            <BadgeCheck size={10} /> Invite sent
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setFlash('');
                              setError('');
                              setEditing(employee);
                            }}
                            title={`Edit ${employee.fullName}`}
                            className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void removeEmployee(employee)}
                            disabled={deletingId === employee.id}
                            title={`Remove ${employee.fullName} from the roster`}
                            className="rounded-lg border border-red-100 bg-red-50 p-1.5 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                          >
                            {deletingId === employee.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-gray-400">
          Employees sign in at /login with the email and temporary password your company sent them. Their CVs, chats and
          subscriptions are theirs alone; the company only keeps this roster record.
        </p>
      </div>

      <EmployeeCreateModal
        open={modalOpen}
        locked={!!access?.readOnly}
        onClose={() => setModalOpen(false)}
        onCreated={(employee) => {
          setFlash(`${employee.fullName} (${employee.empId}) was added to your employees.`);
          void load();
        }}
      />

      <EmployeeEditModal
        employee={editing}
        onClose={() => setEditing(null)}
        onSaved={(employee) => {
          setEditing(null);
          setEmployees((current) => current.map((item) => (item.id === employee.id ? employee : item)));
          setFlash(`${employee.fullName} (${employee.empId}) was updated.`);
          void load();
        }}
      />
    </div>
  );
}
