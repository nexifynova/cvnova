'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  BadgeDollarSign,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  RefreshCcw,
  Search,
  X,
  XCircle,
} from 'lucide-react';
import {
  companyPaymentStatusMeta,
  paymentDateLabel,
  usdAmount,
  type CompanyPayment,
} from '@/lib/company-payments';

/**
 * Phase 5 - /admin/company-payments
 *
 * Every company slip appears here as "In Checking". Approving writes the plan
 * (package, expiry and grace window) to the company row; disapproving restores
 * whatever plan was live when the slip was uploaded. The API does the writes
 * with the service role, so nothing is trusted from this page.
 */

type AdminPayment = CompanyPayment & {
  companyApproved: boolean;
  companyDisabled: boolean;
  companyPackageType: string | null;
  companyPackageExpiry: string | null;
  companyGraceExpiry: string | null;
};

type ApiResponse = {
  payments: AdminPayment[];
  counts?: { pending: number; approved: number; rejected: number };
  error?: string;
};

const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'In Checking' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Disapproved' },
];

export default function AdminCompanyPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/company-payments', { cache: 'no-store' });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok) throw new Error(data.error || 'Could not load company payments');
      setPayments(Array.isArray(data.payments) ? data.payments : []);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Could not load company payments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(
    () => ({
      pending: payments.filter((payment) => payment.status === 'pending').length,
      approved: payments.filter((payment) => payment.status === 'approved').length,
      rejected: payments.filter((payment) => payment.status === 'rejected').length,
    }),
    [payments],
  );

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return payments.filter((payment) => {
      if (statusFilter !== 'all' && payment.status !== statusFilter) return false;
      if (!search) return true;
      return [payment.companyName, payment.companyEmail, payment.packageName, payment.transactionId, payment.paymentMethod]
        .join(' ')
        .toLowerCase()
        .includes(search);
    });
  }, [payments, query, statusFilter]);

  const setStatus = async (payment: AdminPayment, status: 'pending' | 'approved' | 'rejected') => {
    const label = companyPaymentStatusMeta(status).label;
    const question =
      status === 'approved'
        ? `Approve ${payment.companyName}'s ${payment.packageName} payment of ${usdAmount(payment.amount)}?\n\nThe plan and its expiry are written to the company immediately.`
        : status === 'rejected'
          ? `Disapprove ${payment.companyName}'s ${payment.packageName} payment?\n\nIf it was approved before, the previous plan is restored.`
          : `Move ${payment.companyName}'s payment back to In Checking?\n\nIf it was approved before, the previous plan is restored.`;
    if (!window.confirm(question)) return;

    setBusyId(payment.id);
    try {
      const res = await fetch('/api/admin/company-payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: payment.id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Could not update this payment');
      await load();
      if (data.unchanged) {
        window.alert('This payment is already approved - nothing changed.');
      } else {
        window.alert(`Payment marked as ${label}.`);
      }
    } catch (err: any) {
      window.alert('Error: ' + (err.message || 'Could not update this payment'));
    } finally {
      setBusyId('');
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
            <h1 className="text-3xl font-bold text-gray-900">Company Payments</h1>
            <p className="mt-1 text-sm text-gray-500">
              Verify company slips. Approving writes the plan and expiry to the company; disapproving restores the
              previous plan.
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

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-amber-700">
              <Clock size={13} /> In checking
            </p>
            <p className="mt-1 text-2xl font-extrabold text-amber-900">{counts.pending}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
              <CheckCircle2 size={13} /> Approved
            </p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-900">{counts.approved}</p>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-red-700">
              <XCircle size={13} /> Disapproved
            </p>
            <p className="mt-1 text-2xl font-extrabold text-red-900">{counts.rejected}</p>
          </div>
        </div>

        <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 sm:text-sm">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p>
            <strong>Approval writes the plan straight away:</strong> package, package expiry and the grace window all
            move to the approved dates. Renewing the same plan extends the current expiry instead of restarting it.
            Slips stay <em>In Checking</em> until you decide.
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search company, email, plan or transaction ID..."
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 font-medium outline-none"
          >
            {STATUS_FILTERS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-bold">Date</th>
                  <th className="px-5 py-4 font-bold">Company</th>
                  <th className="px-5 py-4 font-bold">Plan</th>
                  <th className="px-5 py-4 font-bold">Amount</th>
                  <th className="px-5 py-4 font-bold">Slip</th>
                  <th className="px-5 py-4 font-bold">Status</th>
                  <th className="px-5 py-4 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && visible.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center">
                      <Loader2 className="mx-auto animate-spin text-blue-600" size={26} />
                    </td>
                  </tr>
                ) : visible.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center">
                      <BadgeDollarSign className="mx-auto mb-2 text-gray-300" size={30} />
                      <p className="text-sm font-bold text-gray-700">No company payments here</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {payments.length === 0
                          ? 'Companies have not uploaded any slips yet.'
                          : 'Try another status filter or clear the search box.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  visible.map((payment) => {
                    const meta = companyPaymentStatusMeta(payment.status);
                    const busy = busyId === payment.id;
                    return (
                      <tr key={payment.id} className="align-top transition hover:bg-gray-50">
                        <td className="whitespace-nowrap px-5 py-4 text-xs text-gray-500">
                          {paymentDateLabel(payment.createdAt)}
                        </td>
                        <td className="px-5 py-4">
                          <p className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                            <Building2 size={13} className="text-gray-400" /> {payment.companyName}
                          </p>
                          <p className="mt-0.5 text-[11px] text-gray-500">{payment.companyEmail || '-'}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {!payment.companyApproved ? (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                                Not approved
                              </span>
                            ) : null}
                            {payment.companyDisabled ? (
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">
                                Disabled
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-blue-700">{payment.packageName}</p>
                          <p className="text-[11px] text-gray-500">
                            {payment.durationDays} days · {payment.paymentMethod}
                            {payment.transactionId ? ` · TID ${payment.transactionId}` : ''}
                          </p>
                          <p className="mt-1 text-[10px] text-gray-400">
                            Current: {payment.companyPackageType || 'no plan'} ·{' '}
                            {payment.companyPackageExpiry ? paymentDateLabel(payment.companyPackageExpiry) : '-'}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm font-extrabold text-gray-900">
                          {usdAmount(payment.amount)}
                        </td>
                        <td className="px-5 py-4">
                          {payment.slipUrl ? (
                            <a
                              href={payment.slipUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] font-bold text-blue-700 transition hover:bg-blue-100"
                            >
                              <Eye size={13} /> View slip
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">No file</span>
                          )}
                          {payment.appliedExpiry ? (
                            <p className="mt-1 text-[10px] text-gray-400">
                              Applied until {paymentDateLabel(payment.appliedExpiry)}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${meta.badge}`}>
                            {payment.status === 'approved' ? (
                              <CheckCircle2 size={11} />
                            ) : payment.status === 'rejected' ? (
                              <XCircle size={11} />
                            ) : (
                              <Clock size={11} />
                            )}
                            {meta.label}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            {payment.status !== 'approved' ? (
                              <button
                                type="button"
                                onClick={() => void setStatus(payment, 'approved')}
                                disabled={busy}
                                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                              >
                                {busy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Approve
                              </button>
                            ) : null}
                            {payment.status !== 'pending' ? (
                              <button
                                type="button"
                                onClick={() => void setStatus(payment, 'pending')}
                                disabled={busy}
                                className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-amber-600 disabled:opacity-50"
                              >
                                {busy ? <Loader2 size={12} className="animate-spin" /> : <Clock size={12} />} In Checking
                              </button>
                            ) : null}
                            {payment.status !== 'rejected' ? (
                              <button
                                type="button"
                                onClick={() => void setStatus(payment, 'rejected')}
                                disabled={busy}
                                className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                              >
                                {busy ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}{' '}
                                {payment.status === 'approved' ? 'Disapprove' : 'Reject'}
                              </button>
                            ) : null}
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

        <p className="mt-3 text-[11px] leading-relaxed text-gray-400">
          {visible.length} of {payments.length} slips shown. Company accounts and package expiry can also be edited by
          hand from{' '}
          <Link href="/admin/companies" className="font-bold text-blue-600 hover:underline">
            Companies
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
