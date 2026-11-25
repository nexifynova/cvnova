'use client';

import Link from 'next/link';
import { BadgeDollarSign, CalendarClock, CheckCircle2, Crown, Sparkles, TimerOff, X } from 'lucide-react';
import type { CompanyAccess, CompanyPackage } from '@/lib/company-access';

/**
 * Phase 2 package UI: the dashboard banner, the grace-period popup and the
 * plan list. All three are pure views over `CompanyAccess`, which is computed
 * on the server, so the wording and the gating stay in sync with the APIs.
 */

const usd = (value: number) => `$${(Math.round(Number(value || 0) * 100) / 100).toFixed(2)}`;
const shortUsd = (value: number) => usd(value).replace(/\.00$/, '');

const plansLabel = (access: CompanyAccess) => (access.packageType === 'free_trial' ? 'Free trial' : 'Package');

export function CompanyPackageBanner({
  access,
  onViewPlans,
}: {
  access: CompanyAccess | null;
  onViewPlans: () => void;
}) {
  if (!access) return null;

  const tone =
    access.status === 'active'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
      : access.status === 'grace'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : 'border-red-200 bg-red-50 text-red-900';
  const iconTone =
    access.status === 'active'
      ? 'text-emerald-600'
      : access.status === 'grace'
        ? 'text-amber-600'
        : 'text-red-600';
  const Icon =
    access.status === 'active' ? CheckCircle2 : access.status === 'grace' ? TimerOff : BadgeDollarSign;

  let title = `${plansLabel(access)} active`;
  let detail = `${access.daysLeft ?? 0} day${access.daysLeft === 1 ? '' : 's'} left. Chat and job posting are unlocked.`;

  if (access.status === 'grace') {
    title = 'Grace period active';
    detail = access.graceMessage;
  } else if (access.status === 'expired') {
    title = 'Package expired';
    detail =
      'Read-only access: you can still browse the talent pool and read old chats, but chat and job posting are locked.';
  } else if (access.status === 'none') {
    title = 'No active package';
    detail =
      'Read-only access: browse the talent pool and read old chats. Purchase a plan to unlock chat and job posting.';
  }

  return (
    <div className={`flex flex-col gap-3 rounded-2xl border px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between ${tone}`}>
      <div className="flex items-start gap-3">
        <Icon size={22} className={`mt-0.5 shrink-0 ${iconTone}`} />
        <div>
          <p className="text-sm font-bold">{title}</p>
          <p className="mt-0.5 text-xs leading-relaxed opacity-90">{detail}</p>
        </div>
      </div>
      {access.status !== 'active' ? (
        <button
          type="button"
          onClick={onViewPlans}
          className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          View plans
        </button>
      ) : (
        <span className="shrink-0 rounded-xl bg-white/70 px-3 py-1.5 text-xs font-semibold">
          {access.packageType === 'free_trial' ? 'Trial package' : access.packageType.replace(/_/g, ' ')}
        </span>
      )}
    </div>
  );
}

/**
 * Shown when an expired package still has an open grace window. Chat keeps
 * working until the window closes, so this is an alert rather than a hard
 * block: it only appears while the company is in the grace state and the
 * admin has not switched the feature off.
 */
export function GracePeriodPopup({
  access,
  onClose,
  onViewPlans,
}: {
  access: CompanyAccess;
  onClose: () => void;
  onViewPlans: () => void;
}) {
  const hours = access.graceHoursLeft ?? access.graceHours;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start gap-3 border-b border-amber-100 bg-amber-50 p-5">
          <TimerOff size={22} className="mt-0.5 shrink-0 text-amber-600" />
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900">Grace period active</h2>
            <p className="mt-1 text-sm text-amber-900">{access.graceMessage}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-amber-700 transition hover:text-amber-900"
          >
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            <CalendarClock size={18} className="mt-0.5 shrink-0 text-gray-500" />
            <p>
              {hours} hour{hours === 1 ? '' : 's'} left. Chat stays open until the grace period ends;
              after that the account becomes read-only until a plan is purchased.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-100"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={onViewPlans}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              <Sparkles size={16} /> View plans
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Read-only price list for companies; activation is handled by the CVNova team. */
export function PackagePlansModal({
  access,
  packages,
  onClose,
}: {
  access: CompanyAccess | null;
  packages: CompanyPackage[];
  onClose: () => void;
}) {
  const visible = packages.filter((item) => item.isActive);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-5">
          <div className="flex items-start gap-3">
            <Crown size={22} className="mt-0.5 text-blue-600" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Company plans</h2>
              <p className="mt-1 text-sm text-gray-500">
                Chat, talent-pool contact and job posting are included in every paid plan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 transition hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3 p-5">
          {visible.length === 0 ? (
            <p className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              Plans are being updated. Please try again in a moment.
            </p>
          ) : (
            visible.map((item) => {
              const current = access?.packageType === item.code;
              return (
                <div
                  key={item.code}
                  className={`flex flex-col gap-2 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
                    current ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                      {item.isTrial ? <Sparkles size={18} /> : <Crown size={18} />}
                    </div>
                    <div>
                      <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
                        {item.name}
                        {current ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                            Current
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.durationDays} days access
                        {item.isTrial ? ' · one time' : ` · about ${shortUsd(item.monthlyUsd)} per month`}
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {item.priceUsd > 0 ? shortUsd(item.priceUsd) : 'Free'}
                  </p>
                </div>
              );
            })
          )}

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
            Prices are managed by the CVNova team. Contact us to activate or renew a plan — access is
            restored as soon as the payment is confirmed.
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-gray-100 p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-100"
          >
            Close
          </button>
          <Link
            href="/contact"
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Contact us
          </Link>
        </div>
      </div>
    </div>
  );
}
