'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarClock,
  Check,
  Loader2,
  Pencil,
  RefreshCcw,
  Search,
  ShieldOff,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import type { CompanyPackage } from '@/lib/company-access';
import { paymentDateLabel } from '@/lib/company-payments';

/**
 * Phase 5 - /admin/companies
 *
 * One row per company with its live package state. The Edit plan modal can set
 * the plan, the exact expiry, extend by +N days, toggle approval and disable or
 * re-enable the portal. Delete is separate and explains the cascade: jobs,
 * applications, chats, outreach and roster rows go with the company, while each
 * employee keeps their own CVNova login.
 */

type AdminCompany = {
  id: string;
  name: string;
  contactName: string;
  email: string;
  website: string;
  industry: string;
  country: string;
  createdAt: string;
  isApproved: boolean;
  isDisabled: boolean;
  packageType: string;
  packageExpiry: string | null;
  graceExpiry: string | null;
  status: 'active' | 'grace' | 'expired' | 'none';
  daysLeft: number | null;
  graceHoursLeft: number | null;
  employeeCount: number;
  pendingPayments: number;
};

type ApiResponse = { companies: AdminCompany[]; packages: CompanyPackage[]; error?: string };

type EditForm = {
  packageType: string;
  addDays: string;
  packageExpiry: string;
  graceExpiry: string;
  isApproved: boolean;
  isDisabled: boolean;
};

const STATUS_META: Record<AdminCompany['status'], { label: string; badge: string }> = {
  active: { label: 'Active', badge: 'bg-emerald-100 text-emerald-700' },
  grace: { label: 'Grace period', badge: 'bg-amber-100 text-amber-700' },
  expired: { label: 'Expired', badge: 'bg-red-100 text-red-700' },
  none: { label: 'No plan', badge: 'bg-gray-100 text-gray-600' },
};

const inputClass =
  'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

const toDateInput = (iso: string | null): string => (iso ? String(iso).slice(0, 10) : '');

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [packages, setPackages] = useState<CompanyPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editing, setEditing] = useState<AdminCompany | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/companies', { cache: 'no-store' });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok) throw new Error(data.error || 'Could not load companies');
      setCompanies(Array.isArray(data.companies) ? data.companies : []);
      setPackages(Array.isArray(data.packages) ? data.packages : []);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Could not load companies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return companies.filter((company) => {
      if (statusFilter === 'disabled' && !company.isDisabled) return false;
      if (statusFilter !== 'all' && statusFilter !== 'disabled' && company.status !== statusFilter) return false;
      if (!search) return true;
      return [company.name, company.email, company.industry, company.country, company.contactName, company.packageType]
        .join(' ')
        .toLowerCase()
        .includes(search);
    });
  }, [companies, query, statusFilter]);

  const patchCompany = async (company: AdminCompany, payload: Record<string, unknown>, message: string) => {
    setBusyId(company.id);
    try {
      const res = await fetch('/api/admin/companies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: company.id, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Could not update the company');
      await load();
      window.alert(message);
      return true;
    } catch (err: any) {
      window.alert('Error: ' + (err.message || 'Could not update the company'));
      return false;
    } finally {
      setBusyId('');
    }
  };

  const openEdit = (company: AdminCompany) => {
    setEditing(company);
    setForm({
      packageType: company.packageType,
      addDays: '',
      packageExpiry: toDateInput(company.packageExpiry),
      graceExpiry: toDateInput(company.graceExpiry),
      isApproved: company.isApproved,
      isDisabled: company.isDisabled,
    });
  };

  const saveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing || !form || saving) return;

    const payload: Record<string, unknown> = {
      isApproved: form.isApproved,
      isDisabled: form.isDisabled,
      packageType: form.packageType,
    };

    if (form.addDays.trim()) {
      payload.addDays = Number(form.addDays);
    } else {
      payload.packageExpiry = form.packageExpiry;
      if (form.graceExpiry !== toDateInput(editing.graceExpiry)) {
        payload.graceExpiry = form.graceExpiry;
      }
    }

    setSaving(true);
    const ok = await patchCompany(editing, payload, `${editing.name} was updated.`);
    setSaving(false);
    if (ok) {
      setEditing(null);
      setForm(null);
    }
  };

  const toggleDisabled = async (company: AdminCompany) => {
    const disabling = !company.isDisabled;
    const question = disabling
      ? `Disable ${company.name}?\n\nTheir portal closes immediately, but every job, chat and roster row is kept. Re-enable any time.`
      : `Re-enable ${company.name}? Their portal access is restored straight away.`;
    if (!window.confirm(question)) return;
    await patchCompany(
      company,
      { isDisabled: disabling },
      disabling ? `${company.name} is now disabled.` : `${company.name} is active again.`,
    );
  };

  const toggleApproved = async (company: AdminCompany) => {
    const approving = !company.isApproved;
    const question = approving
      ? `Approve ${company.name}? Their company portal becomes usable again.`
      : `Mark ${company.name} as not approved? Portal APIs will refuse their requests.`;
    if (!window.confirm(question)) return;
    await patchCompany(
      company,
      { isApproved: approving },
      approving ? `${company.name} is approved.` : `${company.name} is no longer approved.`,
    );
  };

  const removeCompany = async (company: AdminCompany) => {
    const typed = window.prompt(
      `This permanently deletes ${company.name}.\n\n` +
        `Cascade: ${company.employeeCount} employee roster row(s), their jobs, applications, chats and outreach are deleted with it. ` +
        'Employee CVNova logins are kept.\n\nType the company name to confirm:',
      '',
    );
    if (typed === null) return;
    if (typed.trim() !== company.name) {
      window.alert('The name did not match, so nothing was deleted.');
      return;
    }

    setDeletingId(company.id);
    try {
      const res = await fetch(`/api/admin/companies?id=${encodeURIComponent(company.id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Could not delete the company');
      const cascaded = data.cascaded || {};
      window.alert(
        `${company.name} was deleted. Removed with it: ${cascaded.jobs || 0} job(s), ${
          cascaded.job_applications || 0
        } application(s), ${cascaded.company_employees || 0} roster row(s), ${
          cascaded.company_messages || 0
        } chat message(s).`,
      );
      await load();
    } catch (err: any) {
      window.alert('Error: ' + (err.message || 'Could not delete the company'));
    } finally {
      setDeletingId('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Link href="/admin" className="rounded-lg bg-white p-2 shadow-sm transition hover:bg-gray-100">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
            <p className="mt-1 text-sm text-gray-500">
              Approve, disable, extend or delete company accounts. Approving a payment slip is handled in{' '}
              <Link href="/admin/company-payments" className="font-bold text-blue-600 hover:underline">
                Company Payments
              </Link>
              .
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />} Refresh
          </button>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search company, email, industry or country..."
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 font-medium outline-none"
          >
            <option value="all">All companies</option>
            <option value="active">Active plan</option>
            <option value="grace">Grace period</option>
            <option value="expired">Expired</option>
            <option value="none">No plan</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-bold">Company</th>
                  <th className="px-5 py-4 font-bold">Plan</th>
                  <th className="px-5 py-4 font-bold">Access</th>
                  <th className="px-5 py-4 font-bold">Team</th>
                  <th className="px-5 py-4 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && visible.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center">
                      <Loader2 className="mx-auto animate-spin text-blue-600" size={26} />
                    </td>
                  </tr>
                ) : visible.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center">
                      <Building2 className="mx-auto mb-2 text-gray-300" size={30} />
                      <p className="text-sm font-bold text-gray-700">No companies match this view</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {companies.length === 0
                          ? 'No company accounts have registered yet.'
                          : 'Try another filter or clear the search box.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  visible.map((company) => {
                    const status = STATUS_META[company.status] || STATUS_META.none;
                    const busy = busyId === company.id;
                    return (
                      <tr key={company.id} className="align-top transition hover:bg-gray-50">
                        <td className="px-5 py-4">
                          <p className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                            <Building2 size={13} className="text-gray-400" /> {company.name}
                          </p>
                          <p className="mt-0.5 text-[11px] text-gray-500">{company.email || '-'}</p>
                          <p className="mt-0.5 text-[10px] text-gray-400">
                            {[company.industry, company.country].filter(Boolean).join(' · ') || 'No industry set'}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {!company.isApproved ? (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                                Not approved
                              </span>
                            ) : null}
                            {company.isDisabled ? (
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">
                                Disabled
                              </span>
                            ) : null}
                            {company.pendingPayments > 0 ? (
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">
                                {company.pendingPayments} slip{company.pendingPayments === 1 ? '' : 's'} waiting
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-blue-700">{company.packageType || 'No plan'}</p>
                          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-500">
                            <CalendarClock size={11} />
                            {company.packageExpiry ? paymentDateLabel(company.packageExpiry) : 'No expiry set'}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            Grace: {company.graceExpiry ? paymentDateLabel(company.graceExpiry) : '-'}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${status.badge}`}>
                            {status.label}
                          </span>
                          <p className="mt-1 text-[10px] text-gray-500">
                            {company.status === 'active'
                              ? `${company.daysLeft ?? 0} day(s) left`
                              : company.status === 'grace'
                                ? `${company.graceHoursLeft ?? 0}h grace left`
                                : 'Chat and job posting locked'}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                            <Users size={13} className="text-gray-400" /> {company.employeeCount}
                          </p>
                          <p className="text-[10px] text-gray-400">employee CVs</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEdit(company)}
                              className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-[11px] font-bold text-gray-700 transition hover:bg-gray-50"
                            >
                              <Pencil size={12} /> Edit plan
                            </button>
                            <button
                              type="button"
                              onClick={() => void toggleApproved(company)}
                              disabled={busy}
                              className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                            >
                              {busy ? <Loader2 size={12} className="animate-spin" /> : <BadgeCheck size={12} />}
                              {company.isApproved ? 'Unapprove' : 'Approve'}
                            </button>
                            <button
                              type="button"
                              onClick={() => void toggleDisabled(company)}
                              disabled={busy}
                              className={`flex items-center gap-1 rounded-lg border px-2.5 py-2 text-[11px] font-bold transition disabled:opacity-50 ${
                                company.isDisabled
                                  ? 'border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50'
                                  : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                              }`}
                            >
                              {busy ? <Loader2 size={12} className="animate-spin" /> : <ShieldOff size={12} />}
                              {company.isDisabled ? 'Enable' : 'Disable'}
                            </button>
                            <button
                              type="button"
                              onClick={() => void removeCompany(company)}
                              disabled={deletingId === company.id}
                              className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-[11px] font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                            >
                              {deletingId === company.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Trash2 size={12} />
                              )}
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-gray-400">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          Deleting a company cascades to its jobs, applications, chats, outreach and employee roster rows. Employee
          CVNova accounts are separate logins and are kept.
        </p>
      </div>

      {editing && form ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-purple-600 p-5 text-white">
              <div className="flex items-start gap-3">
                <Building2 size={22} className="mt-0.5 shrink-0" />
                <div>
                  <h2 className="text-lg font-bold">{editing.name}</h2>
                  <p className="mt-1 text-xs text-blue-50">
                    {editing.email || 'No email'} · {editing.employeeCount} employee CV(s)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setForm(null);
                }}
                aria-label="Close"
                className="text-white/80 transition hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveEdit} className="space-y-3 p-5">
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-600">Package</label>
                <select
                  value={form.packageType}
                  onChange={(event) => setForm({ ...form, packageType: event.target.value })}
                  className={inputClass}
                >
                  <option value="">No plan</option>
                  {packages.map((plan) => (
                    <option key={plan.code} value={plan.code}>
                      {plan.name} · {plan.durationDays} days{plan.isActive ? '' : ' (inactive)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-gray-600">Extend by days</label>
                  <input
                    type="number"
                    value={form.addDays}
                    onChange={(event) => setForm({ ...form, addDays: event.target.value })}
                    placeholder="e.g. 30"
                    className={inputClass}
                  />
                  <p className="mt-1 text-[10px] text-gray-400">
                    Adds days to the current expiry. Overrides the date field.
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-gray-600">Package expiry</label>
                  <input
                    type="date"
                    value={form.packageExpiry}
                    onChange={(event) => setForm({ ...form, packageExpiry: event.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-gray-600">Grace expiry</label>
                <input
                  type="date"
                  value={form.graceExpiry}
                  onChange={(event) => setForm({ ...form, graceExpiry: event.target.value })}
                  className={inputClass}
                />
                <p className="mt-1 text-[10px] text-gray-400">
                  Left untouched, the grace window follows the package expiry plus the configured hours.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-bold text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.isApproved}
                    onChange={(event) => setForm({ ...form, isApproved: event.target.checked })}
                    className="h-4 w-4"
                  />
                  Approved company
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-bold text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.isDisabled}
                    onChange={(event) => setForm({ ...form, isDisabled: event.target.checked })}
                    className="h-4 w-4"
                  />
                  Disable portal access
                </label>
              </div>

              <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setForm(null);
                  }}
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
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Save company
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}


