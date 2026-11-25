'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  BadgeDollarSign,
  Building2,
  CalendarClock,
  Check,
  Crown,
  Loader2,
  LogOut,
  Sparkles,
  Users,
} from 'lucide-react';
import { authedFetch, supabase } from '@/lib/supabase';
import type { CompanyAccess, CompanyPackage } from '@/lib/company-access';
import { planTier } from '@/lib/company-plans';

/**
 * Phase 3 - /company/billing
 *
 * Shows the same five plans as the Phase 2 catalogue, under product names
 * (Free, Basic, Silver, Gold, Platinum). "Buy Plan" activates the plan through
 * /api/company/package/purchase; the server validates the code, computes the
 * expiry from the catalogue duration and keeps the grace window in sync.
 */

const usd = (value: number) => `$${(Math.round(Number(value || 0) * 100) / 100).toFixed(2)}`;
const shortUsd = (value: number) => usd(value).replace(/\.00$/, '');

const dateLabel = (iso: string | null): string => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const durationLabel = (days: number): string => {
  if (!days) return '';
  if (days % 365 === 0) {
    const years = days / 365;
    return `${years} year${years === 1 ? '' : 's'}`;
  }
  if (days % 30 === 0) {
    const months = days / 30;
    return `${months} month${months === 1 ? '' : 's'}`;
  }
  return `${days} days`;
};

type Accent = { border: string; badge: string; icon: string; button: string };

const ACCENTS: Record<string, Accent> = {
  free_trial: {
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
    icon: 'bg-emerald-50 text-emerald-600',
    button: 'bg-emerald-600 hover:bg-emerald-700',
  },
  '1_month': {
    border: 'border-sky-200',
    badge: 'bg-sky-100 text-sky-700',
    icon: 'bg-sky-50 text-sky-600',
    button: 'bg-sky-600 hover:bg-sky-700',
  },
  '3_months': {
    border: 'border-indigo-300',
    badge: 'bg-indigo-100 text-indigo-700',
    icon: 'bg-indigo-50 text-indigo-600',
    button: 'bg-indigo-600 hover:bg-indigo-700',
  },
  '9_months': {
    border: 'border-amber-300',
    badge: 'bg-amber-100 text-amber-700',
    icon: 'bg-amber-50 text-amber-600',
    button: 'bg-amber-600 hover:bg-amber-700',
  },
  '2_years': {
    border: 'border-slate-300',
    badge: 'bg-slate-200 text-slate-700',
    icon: 'bg-slate-100 text-slate-700',
    button: 'bg-slate-800 hover:bg-slate-900',
  },
};

const DEFAULT_ACCENT: Accent = {
  border: 'border-blue-200',
  badge: 'bg-blue-100 text-blue-700',
  icon: 'bg-blue-50 text-blue-600',
  button: 'bg-blue-600 hover:bg-blue-700',
};

export default function CompanyBillingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [companyName, setCompanyName] = useState('Company');
  const [access, setAccess] = useState<CompanyAccess | null>(null);
  const [packages, setPackages] = useState<CompanyPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState<CompanyPackage | null>(null);
  const [busyCode, setBusyCode] = useState('');
  const [result, setResult] = useState<{ title: string; detail: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await authedFetch('/api/company/access');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load your plans');
      setAccess((data.access as CompanyAccess) || null);
      setPackages(Array.isArray(data.packages) ? (data.packages as CompanyPackage[]) : []);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Could not load your plans');
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

  const purchase = async (plan: CompanyPackage) => {
    setBusyCode(plan.code);
    setError('');
    try {
      const res = await authedFetch('/api/company/package/purchase', {
        method: 'POST',
        body: JSON.stringify({ code: plan.code }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Could not activate this plan');
      }
      setAccess((data.access as CompanyAccess) || null);
      setConfirming(null);
      setResult({
        title: `${planTier(plan.code, plan.name).tier} plan activated`,
        detail: `Your company has recruiter access until ${dateLabel(data.access?.packageExpiry)}${
          data.renewed ? ' (your remaining days were kept)' : ''
        }. Chat, job posting and employee CVs are unlocked.`,
      });
      await load();
    } catch (err: any) {
      setError(err.message || 'Could not activate this plan');
    } finally {
      setBusyCode('');
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace('/company');
  };

  const visiblePlans = useMemo(
    () => packages.filter((plan) => plan.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    [packages],
  );

  const statusLabel =
    access?.status === 'active'
      ? `${access.daysLeft ?? 0} day${access.daysLeft === 1 ? '' : 's'} left`
      : access?.status === 'grace'
        ? `${access.graceHoursLeft ?? access.graceHours} grace hour${
            (access.graceHoursLeft ?? access.graceHours) === 1 ? '' : 's'
          } left`
        : 'Read-only access';

  const statusTone =
    access?.status === 'active'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
      : access?.status === 'grace'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : 'border-red-200 bg-red-50 text-red-900';

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B1120]">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  const confirmInfo = confirming ? planTier(confirming.code, confirming.name) : null;

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
            <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Company billing &amp; plans</h1>
            <p className="mt-1 text-sm text-gray-500">
              Choose a plan to unlock company chat, job posting and employee CV accounts.
            </p>
          </div>
          <Link href="/company/dashboard" className="text-xs font-bold text-blue-600 hover:underline">
            Back to dashboard
          </Link>
        </header>

        <div className={`mb-5 rounded-2xl border p-5 shadow-sm ${statusTone}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white/70 p-2">
                <BadgeDollarSign size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Current plan</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xl font-extrabold">
                  {planTier(access?.packageType).tier}
                  <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                    {statusLabel}
                  </span>
                </p>
                <p className="mt-1 text-xs opacity-90">
                  Valid until {dateLabel(access?.packageExpiry ?? null)} · grace until{' '}
                  {dateLabel(access?.graceExpiry ?? null)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-xs font-semibold">
              <CalendarClock size={16} /> {access?.graceHours ?? 24}h grace window
            </div>
          </div>
          {access && access.status !== 'active' ? (
            <p className="mt-3 rounded-xl bg-white/70 p-3 text-xs font-semibold">
              {access.status === 'grace' ? access.graceMessage : access.chatMessage}
            </p>
          ) : null}
        </div>

        {result ? (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
            <p className="text-sm font-bold">{result.title}</p>
            <p className="mt-1 text-xs">{result.detail}</p>
          </div>
        ) : null}

        {error && !confirming ? (
          <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}

        {loading && visiblePlans.length === 0 ? (
          <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white p-10">
            <Loader2 className="animate-spin text-blue-500" size={28} />
          </div>
        ) : visiblePlans.length === 0 ? (
          <p className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
            Plans are being updated. Please try again in a moment.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visiblePlans.map((plan) => {
              const info = planTier(plan.code, plan.name);
              const accent = ACCENTS[plan.code] || DEFAULT_ACCENT;
              const current = access?.packageType === plan.code;
              const trialBlocked = plan.isTrial && access?.status !== 'none';
              const busy = busyCode === plan.code;
              const label = trialBlocked
                ? 'Trial already used'
                : current
                  ? 'Renew plan'
                  : plan.isTrial
                    ? 'Start free trial'
                    : 'Buy Plan';

              return (
                <div
                  key={plan.code}
                  className={`relative flex flex-col rounded-2xl border-2 bg-white p-5 shadow-sm ${accent.border} ${
                    info.popular ? 'ring-2 ring-indigo-100' : ''
                  }`}
                >
                  {info.popular ? (
                    <span className="absolute -top-3 left-5 rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      Popular
                    </span>
                  ) : null}

                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`rounded-xl p-2 ${accent.icon}`}>
                        {plan.isTrial ? <Sparkles size={18} /> : <Crown size={18} />}
                      </div>
                      <div>
                        <p className="text-base font-extrabold text-gray-900">{info.tier}</p>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${accent.badge}`}
                        >
                          {durationLabel(plan.durationDays)}
                        </span>
                      </div>
                    </div>
                    {current ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                        Current
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-4 flex items-end gap-1 text-3xl font-extrabold text-gray-900">
                    {plan.priceUsd > 0 ? shortUsd(plan.priceUsd) : 'Free'}
                    <span className="pb-1 text-[11px] font-semibold text-gray-400">
                      / {durationLabel(plan.durationDays)}
                    </span>
                  </p>
                  <p className="text-[11px] font-semibold text-gray-500">
                    {plan.priceUsd > 0
                      ? `${shortUsd(plan.monthlyUsd)} per month · billed for the full term`
                      : 'No payment needed'}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">{info.tagline}</p>

                  <ul className="mt-3 flex-1 space-y-1.5 text-[11px] text-gray-600">
                    {info.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-start gap-1.5">
                        <Check size={12} className="mt-0.5 shrink-0 text-emerald-600" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => {
                      setResult(null);
                      setError('');
                      setConfirming(plan);
                    }}
                    disabled={trialBlocked || busy || loading}
                    className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:bg-gray-300 ${accent.button}`}
                  >
                    {busy ? <Loader2 size={14} className="animate-spin" /> : null}
                    {label}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-white p-2 text-blue-600">
              <Users size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-900">Employee CV accounts are included</p>
              <p className="text-xs text-blue-800">
                Every plan lets you create CVNova accounts for your staff from the talent pool, each with their own
                dashboard.
              </p>
            </div>
          </div>
          <Link
            href="/company/employees"
            className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-center text-xs font-bold text-white transition hover:bg-blue-700"
          >
            Our employees
          </Link>
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-gray-400">
          Prices cover the full term shown on each card. Activating a plan updates your company package immediately;
          renewing the plan you already have adds the new days to your current expiry date.
        </p>
      </div>

      {confirming && confirmInfo ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                <Crown size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Confirm {confirmInfo.tier} plan</h2>
                <p className="mt-1 text-sm text-gray-600">
                  {durationLabel(confirming.durationDays)} of recruiter access for{' '}
                  {confirming.priceUsd > 0 ? usd(confirming.priceUsd) : 'free'}.
                </p>
              </div>
            </div>

            <p className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
              {confirming.isTrial
                ? `The free trial starts a fresh ${confirming.durationDays}-day window from today.`
                : `This ${confirmInfo.tier} plan is added to your account straight away. If you are renewing the same plan, the new days are added after your current expiry.`}
            </p>

            {error ? (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                {error}
              </p>
            ) : null}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setConfirming(null);
                  setError('');
                }}
                disabled={busyCode === confirming.code}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => purchase(confirming)}
                disabled={busyCode === confirming.code}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {busyCode === confirming.code ? <Loader2 size={16} className="animate-spin" /> : null}
                Confirm purchase
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
