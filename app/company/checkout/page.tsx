'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock,
  Crown,
  Eye,
  Landmark,
  Loader2,
  LogOut,
  Receipt,
  ShieldCheck,
  Upload,
  Wallet,
  XCircle,
} from 'lucide-react';
import { authedFetch, supabase } from '@/lib/supabase';
import type { CompanyAccess, CompanyPackage } from '@/lib/company-access';
import {
  companyPaymentStatusMeta,
  paymentDateLabel,
  PAYMENT_SUBMITTED_MESSAGE,
  usdAmount,
  type CompanyPayment,
} from '@/lib/company-payments';

/**
 * Phase 5 - /company/checkout?plan=<code>
 *
 * The company pays through one of the admin-enabled rails, uploads the slip and
 * the row waits in `company_payments` as "In Checking". Nothing is activated on
 * this page: the admin approves the slip from /admin/company-payments, and only
 * then are package_type / package_expiry / grace_expiry written.
 */

type CheckoutResponse = {
  company: { name: string; email: string };
  access: CompanyAccess;
  plans: CompanyPackage[];
  payments: CompanyPayment[];
  accounts: Record<string, string | boolean | null>;
  paymentMethods: { value: string; label: string }[];
  graceHours: number;
};

const MAX_SLIP_BYTES = 5 * 1024 * 1024;

function durationLabel(days: number): string {
  if (!days) return '';
  if (days % 365 === 0) {
    const years = days / 365;
    return `${years} year${years === 1 ? '' : 's'}`;
  }
  if (days % 30 === 0) {
    const months = days / 30;
    if (months >= 24 && months % 12 === 0) {
      const years = months / 12;
      return `${years} year${years === 1 ? '' : 's'}`;
    }
    return `${months} month${months === 1 ? '' : 's'}`;
  }
  return `${days} days`;
}

const text = (value: unknown): string => String(value ?? '').trim();

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedPlan = (searchParams.get('plan') || '').trim();

  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');

  const [companyName, setCompanyName] = useState('Company');
  const [access, setAccess] = useState<CompanyAccess | null>(null);
  const [plans, setPlans] = useState<CompanyPackage[]>([]);
  const [payments, setPayments] = useState<CompanyPayment[]>([]);
  const [accounts, setAccounts] = useState<Record<string, string | boolean | null>>({});
  const [methods, setMethods] = useState<{ value: string; label: string }[]>([]);

  const [planCode, setPlanCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Manual');
  const [transactionId, setTransactionId] = useState('');
  const [slipFile, setSlipFile] = useState<File | null>(null);

  const paidPlans = useMemo(
    () => plans.filter((plan) => plan.isActive && plan.priceUsd > 0).sort((a, b) => a.sortOrder - b.sortOrder),
    [plans],
  );

  const selectedPlan = useMemo(
    () => paidPlans.find((plan) => plan.code === planCode) || null,
    [paidPlans, planCode],
  );

  const load = async () => {
    setLoading(true);
    try {
      const res = await authedFetch('/api/company/checkout');
      const data = (await res.json()) as CheckoutResponse & { error?: string; message?: string };
      if (!res.ok) {
        throw new Error(
          data.error === 'company_account_disabled'
            ? 'This company account has been disabled by the CVNova team. Please contact support.'
            : data.error === 'company_not_approved'
              ? 'This company account is not approved yet.'
              : data.message || data.error || 'Could not load company checkout',
        );
      }

      setAccess(data.access || null);
      setPlans(Array.isArray(data.plans) ? data.plans : []);
      setPayments(Array.isArray(data.payments) ? data.payments : []);
      setAccounts(data.accounts || {});
      setMethods(Array.isArray(data.paymentMethods) ? data.paymentMethods : []);
      if (data.company?.name) setCompanyName(data.company.name);
      setPaymentMethod((current) => {
        const available = data.paymentMethods || [];
        if (available.some((method) => method.value === current)) return current;
        return available[0]?.value || 'Manual';
      });
      setError('');
    } catch (err: any) {
      setError(err.message || 'Could not load company checkout');
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
      await load();
    };
    void guard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Keep the selection in sync with ?plan= once the catalogue is known.
  useEffect(() => {
    if (!paidPlans.length) return;
    setPlanCode((current) => {
      if (current && paidPlans.some((plan) => plan.code === current)) return current;
      if (requestedPlan && paidPlans.some((plan) => plan.code === requestedPlan)) return requestedPlan;
      return paidPlans[0].code;
    });
  }, [paidPlans, requestedPlan]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace('/company');
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFlash('');
    setError('');

    if (!selectedPlan) {
      setError('Choose a plan to continue.');
      return;
    }
    if (!slipFile) {
      setError('Upload your payment slip to continue.');
      return;
    }
    if (slipFile.size > MAX_SLIP_BYTES) {
      setError('The slip image must be smaller than 5 MB.');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please sign in again.');

      const extension = (slipFile.name.split('.').pop() || 'png').toLowerCase().slice(0, 5);
      const path = `${user.id}-company-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from('payment-slips')
        .upload(path, slipFile, { upsert: false });
      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage.from('payment-slips').getPublicUrl(path);

      const res = await authedFetch('/api/company/checkout', {
        method: 'POST',
        body: JSON.stringify({
          code: selectedPlan.code,
          paymentMethod,
          transactionId,
          slipUrl: publicUrl.publicUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Could not submit your payment');

      setPayments((current) => [
        data.payment as CompanyPayment,
        ...current.filter((payment) => payment.id !== data.payment?.id),
      ]);
      setFlash(data.message || PAYMENT_SUBMITTED_MESSAGE);
      setSlipFile(null);
      setTransactionId('');
      const input = document.getElementById('company-slip') as HTMLInputElement | null;
      if (input) input.value = '';
    } catch (err: any) {
      setError(err.message || 'Could not submit your payment');
    } finally {
      setSaving(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B1120]">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  const expiryLabel = access?.packageExpiry ? paymentDateLabel(access.packageExpiry) : '-';
  const pendingPayment = payments.find((payment) => payment.status === 'pending') || null;

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
            <Link href="/company/employees" className="hidden text-xs font-bold text-gray-600 hover:text-blue-600 sm:block">
              Our employees
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
            <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Company checkout</h1>
            <p className="mt-1 text-sm text-gray-500">
              Pay for your plan, upload the slip and the CVNova team activates it after verification.
            </p>
          </div>
          <Link href="/company/billing" className="text-xs font-bold text-blue-600 hover:underline">
            Back to plans
          </Link>
        </header>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
              <Wallet size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Current plan</p>
              <p className="text-sm font-extrabold text-gray-900">
                {text(access?.packageType) || 'No plan'}
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-600">
                  {access?.status === 'active'
                    ? 'Active'
                    : access?.status === 'grace'
                      ? 'Grace period'
                      : access?.status === 'expired'
                        ? 'Expired'
                        : 'Not started'}
                </span>
              </p>
            </div>
          </div>
          <p className="text-xs font-semibold text-gray-500">Valid until {expiryLabel}</p>
        </div>

        {flash ? (
          <div className="mb-4 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
            <BadgeCheck size={18} className="mt-0.5 shrink-0 text-emerald-600" />
            <div>
              <p className="text-sm font-bold">{flash}</p>
              <p className="mt-0.5 text-xs">
                Your plan activates automatically the moment the admin approves the slip. You can track the status
                in the list on this page.
              </p>
            </div>
          </div>
        ) : null}

        {pendingPayment ? (
          <div className="mb-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <Clock size={18} className="mt-0.5 shrink-0" />
            <p className="text-xs font-semibold">
              {pendingPayment.packageName} payment of {usdAmount(pendingPayment.amount)} is in checking. Uploading a
              new slip for the same plan replaces this request.
            </p>
          </div>
        ) : null}

        {error ? (
          <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
          <form onSubmit={submit} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <section>
              <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">1</span>
                Choose your plan
              </p>
              {loading && paidPlans.length === 0 ? (
                <div className="mt-3 flex justify-center rounded-xl border border-gray-100 bg-gray-50 p-6">
                  <Loader2 className="animate-spin text-blue-500" size={22} />
                </div>
              ) : paidPlans.length === 0 ? (
                <p className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-600">
                  No paid plans are available right now. Please check back shortly.
                </p>
              ) : (
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {paidPlans.map((plan) => {
                    const active = plan.code === planCode;
                    return (
                      <button
                        type="button"
                        key={plan.code}
                        onClick={() => setPlanCode(plan.code)}
                        aria-pressed={active}
                        className={`flex items-start justify-between gap-2 rounded-xl border-2 p-3 text-left transition ${
                          active
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                            : 'border-gray-200 bg-white hover:border-blue-200'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 truncate text-sm font-extrabold text-gray-900">
                            <Crown size={13} className={active ? 'text-blue-600' : 'text-gray-400'} />
                            {plan.name}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {durationLabel(plan.durationDays)} · {usdAmount(plan.monthlyUsd)}/month
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-base font-extrabold text-gray-900">{usdAmount(plan.priceUsd)}</p>
                          <p className={`text-[10px] font-bold uppercase tracking-wide ${active ? 'text-blue-600' : 'text-gray-400'}`}>
                            {active ? 'Selected' : 'Select'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="mt-5">
              <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">2</span>
                Send the payment
              </p>

              <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-900">
                <p className="flex flex-wrap items-center justify-between gap-2 text-sm font-extrabold">
                  Amount to pay
                  <span className="rounded-lg bg-white px-2 py-1 text-base text-blue-700">
                    {usdAmount(selectedPlan?.priceUsd ?? 0)}
                  </span>
                </p>
                <p className="mt-2 text-[11px] text-blue-800">
                  Transfer the exact USD amount to any of these accounts, then upload the slip below.
                </p>

                <ul className="mt-3 space-y-1.5 text-[11px] text-blue-900">
                  {accounts.skrill_enabled ? (
                    <li className="flex items-start gap-2">
                      <Landmark size={12} className="mt-0.5 shrink-0" />
                      <span>
                        Skrill:{' '}
                        <span className="rounded bg-white px-1.5 py-0.5 font-mono">{text(accounts.skrill_email) || '-'}</span>
                        {text(accounts.skrill_name) ? ` (${text(accounts.skrill_name)})` : ''}
                      </span>
                    </li>
                  ) : null}
                  {accounts.payoneer_enabled ? (
                    <li className="flex items-start gap-2">
                      <Landmark size={12} className="mt-0.5 shrink-0" />
                      <span>
                        Payoneer:{' '}
                        <span className="rounded bg-white px-1.5 py-0.5 font-mono">{text(accounts.payoneer_email) || '-'}</span>
                        {text(accounts.payoneer_name) ? ` (${text(accounts.payoneer_name)})` : ''}
                      </span>
                    </li>
                  ) : null}
                  {accounts.easy_paisa_enabled ? (
                    <li className="flex items-start gap-2">
                      <Landmark size={12} className="mt-0.5 shrink-0" />
                      <span>
                        EasyPaisa:{' '}
                        <span className="rounded bg-white px-1.5 py-0.5 font-mono">{text(accounts.easy_paisa_number) || '-'}</span>
                        {text(accounts.easy_paisa_name) ? ` (${text(accounts.easy_paisa_name)})` : ''}
                      </span>
                    </li>
                  ) : null}
                  {accounts.binance_enabled ? (
                    <li className="flex items-start gap-2">
                      <Landmark size={12} className="mt-0.5 shrink-0" />
                      <span>
                        Binance ID:{' '}
                        <span className="rounded bg-white px-1.5 py-0.5 font-mono">{text(accounts.binance_id) || '-'}</span>
                      </span>
                    </li>
                  ) : null}
                  {accounts.bank_enabled ? (
                    <li className="flex items-start gap-2">
                      <Landmark size={12} className="mt-0.5 shrink-0" />
                      <span>
                        Bank: <span className="rounded bg-white px-1.5 py-0.5 font-mono">{text(accounts.bank_name) || '-'}</span>
                        {' · '}Account{' '}
                        <span className="rounded bg-white px-1.5 py-0.5 font-mono">
                          {text(accounts.bank_account_number) || '-'}
                        </span>
                        {text(accounts.bank_account_name) ? ` (${text(accounts.bank_account_name)})` : ''}
                        {text(accounts.bank_iban) ? ` · IBAN ${text(accounts.bank_iban)}` : ''}
                      </span>
                    </li>
                  ) : null}
                  {!accounts.skrill_enabled &&
                  !accounts.payoneer_enabled &&
                  !accounts.easy_paisa_enabled &&
                  !accounts.binance_enabled &&
                  !accounts.bank_enabled ? (
                    <li className="text-blue-800">
                      No payment accounts are published right now. Contact support and we will send you the current
                      details.
                    </li>
                  ) : null}
                </ul>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                    Which method did you use?
                  </span>
                  <select
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {methods.length === 0 ? <option value="Manual">Manual transfer</option> : null}
                    {methods.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                    Transaction ID / TID (optional)
                  </span>
                  <input
                    value={transactionId}
                    onChange={(event) => setTransactionId(event.target.value)}
                    placeholder="e.g. 123456789"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
              </div>
            </section>

            <section className="mt-5">
              <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">3</span>
                Upload the payment slip
              </p>

              <label className="mt-3 block cursor-pointer rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center transition hover:border-blue-400 hover:bg-blue-50">
                <input
                  id="company-slip"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => setSlipFile(event.target.files?.[0] || null)}
                />
                <Upload className="mx-auto mb-2 text-gray-400" size={26} />
                <p className="text-sm font-bold text-gray-700">
                  {slipFile ? slipFile.name : 'Click to choose a screenshot'}
                </p>
                <p className="mt-1 text-[11px] text-gray-500">PNG, JPG or WEBP · up to 5 MB</p>
              </label>

              <button
                type="submit"
                disabled={saving || loading || !selectedPlan}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                Submit payment for approval
              </button>

              <p className="mt-2 text-center text-[11px] text-gray-500">
                Nothing is charged automatically. Your plan starts only after the admin approves this slip.
              </p>
            </section>
          </form>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-gray-900">How approval works</p>
              <ol className="mt-3 space-y-3 text-xs text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-700">1</span>
                  Pay the exact amount to any account above and keep the screenshot.
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-50 text-[10px] font-bold text-amber-700">2</span>
                  Submit the slip. The payment shows as <strong>In Checking</strong> until it is verified.
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-700">3</span>
                  On approval the plan is written to your company: package, expiry and the{' '}
                  {access?.graceHours ?? 24}h grace window update automatically.
                </li>
              </ol>
              <Link
                href="/company/billing"
                className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
              >
                <span className="flex items-center gap-1.5"><Receipt size={14} /> Compare plans</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-gray-900">Your payment history</p>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  Refresh
                </button>
              </div>

              {payments.length === 0 ? (
                <p className="mt-3 text-xs text-gray-500">No payments submitted yet.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {payments.slice(0, 8).map((payment) => {
                    const meta = companyPaymentStatusMeta(payment.status);
                    const StatusIcon =
                      payment.status === 'approved' ? CheckCircle2 : payment.status === 'rejected' ? XCircle : Clock;
                    return (
                      <li key={payment.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-gray-900">{payment.packageName}</p>
                            <p className="text-[10px] text-gray-500">
                              {paymentDateLabel(payment.createdAt)} · {usdAmount(payment.amount)} ·{' '}
                              {payment.paymentMethod}
                            </p>
                          </div>
                          <span className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.badge}`}>
                            <StatusIcon size={10} /> {meta.label}
                          </span>
                        </div>
                        {payment.slipUrl ? (
                          <a
                            href={payment.slipUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline"
                          >
                            <Eye size={10} /> View slip
                          </a>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}

              <p className="mt-3 text-[10px] leading-relaxed text-gray-400">
                Disapproved payments can be replaced by uploading a new slip for the same plan.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function CompanyCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0B1120]">
          <Loader2 className="animate-spin text-blue-500" size={48} />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
