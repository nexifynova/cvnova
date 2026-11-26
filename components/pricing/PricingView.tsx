'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  Clock3,
  CreditCard,
  Crown,
  Gem,
  Loader2,
  Rocket,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { IndividualPlan, PublicCompanyPlan, PublicPaymentMethods, PublicPricing } from '@/lib/public-pricing';

/**
 * Phase 4 - public pricing page (/pricing).
 *
 * Two tabs: "For Individuals" (CV builder packages from app_settings) and
 * "For Companies / Talent Pool" (recruiter plans from company_packages). Both
 * catalogues come from /api/pricing, so an admin price change shows up here
 * without touching any code.
 */

type Status = 'loading' | 'ready' | 'error';

const compactMoney = (value: number) => {
  const rounded = Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
  return `$${Number.isInteger(rounded) ? rounded : rounded.toFixed(2)}`;
};

const TIER_ICONS: Record<string, LucideIcon> = {
  free_trial: Sparkles,
  '1_month': Zap,
  '3_months': Building2,
  '9_months': Crown,
  '2_years': Gem,
};

const tierIcon = (code: string): LucideIcon => TIER_ICONS[code] || Rocket;

const individualFeatures = (plan: IndividualPlan): string[] => [
  `${plan.cvs} CV / cover letter documents included`,
  'All 25 ATS-scored templates unlocked',
  'AI writing assistant for CV & cover letter',
  `Full ${plan.name.toLowerCase()} access from the day you buy`,
  'Saved documents stay downloadable forever',
];

const paymentChips = (payments: PublicPaymentMethods | undefined): string[] =>
  [
    payments?.skrill && 'Skrill',
    payments?.payoneer && 'Payoneer',
    payments?.binance && 'Binance Pay',
    payments?.easypaisa && 'EasyPaisa',
    payments?.bank && 'Bank transfer',
  ].filter((chip): chip is string => Boolean(chip));

export type PricingTab = 'individuals' | 'companies';

async function fetchPricing(): Promise<PublicPricing> {
  const res = await fetch('/api/pricing', { cache: 'no-store' });
  const payload = (await res.json()) as PublicPricing & { error?: string };
  if (!res.ok) throw new Error(payload?.error || 'Unable to load the price list.');
  return payload;
}

const errorMessage = (err: unknown) =>
  err instanceof Error && err.message ? err.message : 'Unable to load the price list.';

export default function PricingView({ initialTab = 'individuals' }: { initialTab?: PricingTab }) {
  const [tab, setTab] = useState<PricingTab>(initialTab);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState('');
  const [data, setData] = useState<PublicPricing | null>(null);

  useEffect(() => {
    let active = true;
    fetchPricing()
      .then((payload) => {
        if (!active) return;
        setData(payload);
        setStatus('ready');
        setError('');
      })
      .catch((err) => {
        if (!active) return;
        setError(errorMessage(err));
        setStatus('error');
      });
    return () => {
      active = false;
    };
  }, []);

  const retry = async () => {
    setStatus('loading');
    try {
      const payload = await fetchPricing();
      setData(payload);
      setStatus('ready');
      setError('');
    } catch (err) {
      setError(errorMessage(err));
      setStatus('error');
    }
  };

  const chips = paymentChips(data?.payments);

  return (
    <div className="min-h-screen bg-[#0B1120] font-sans text-white">
      <Navbar />

      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-32 -top-40 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="pointer-events-none absolute right-0 top-48 h-96 w-96 rounded-full bg-purple-600/20 blur-[120px]" />

        <section className="relative mx-auto max-w-6xl px-5 pb-20 pt-14 sm:px-6">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
              <CreditCard size={14} /> Pricing
            </span>
            <h1 className="mx-auto mt-5 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl">
              One price list for candidates{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                and hiring teams
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-gray-400 sm:text-base">
              Build ATS-ready CVs as an individual, or unlock the recruiter workspace with job posting, company chat
              and employee CV accounts. Every price below is the live price set by our team — what you see is what you
              pay.
            </p>
          </div>

          {/* Audience tabs */}
          <div
            role="tablist"
            aria-label="Pricing audience"
            className="mx-auto mt-9 flex w-full max-w-xl gap-1 rounded-2xl border border-white/10 bg-white/5 p-1.5 backdrop-blur"
          >
            <button
              type="button"
              role="tab"
              id="pricing-tab-individuals"
              aria-selected={tab === 'individuals'}
              aria-controls="pricing-panel-individuals"
              onClick={() => setTab('individuals')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition sm:text-sm ${
                tab === 'individuals'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-900/40'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <UserRound size={16} /> For Individuals
            </button>
            <button
              type="button"
              role="tab"
              id="pricing-tab-companies"
              aria-selected={tab === 'companies'}
              aria-controls="pricing-panel-companies"
              onClick={() => setTab('companies')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-center text-xs font-bold leading-tight transition sm:text-sm ${
                tab === 'companies'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-900/40'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Users size={16} className="shrink-0" /> For Companies / Talent Pool
            </button>
          </div>

          {status === 'loading' && <PricingSkeleton />}

          {status === 'error' && (
            <div className="mx-auto mt-12 max-w-lg rounded-2xl border border-red-400/30 bg-red-500/10 p-6 text-center">
              <p className="text-sm font-semibold text-red-200">{error}</p>
              <button
                type="button"
                onClick={retry}
                className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20"
              >
                Try again
              </button>
            </div>
          )}

          {status === 'ready' && data && tab === 'individuals' && (
            <IndividualPanel data={data} />
          )}

          {status === 'ready' && data && tab === 'companies' && (
            <CompanyPanel plans={data.company} />
          )}

          {status === 'ready' && (
            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              <TrustCard icon={ShieldCheck} title="Secure checkout" body="Manual verification on every payment, no card details stored." />
              <TrustCard icon={Clock3} title="Instant activation" body="Documents unlock the moment your payment is approved." />
              <TrustCard icon={BadgeCheck} title="Real people on support" body="WhatsApp and email support for billing and account questions." />
            </div>
          )}

          {status === 'ready' && chips.length > 0 && (
            <p className="mt-8 text-center text-xs text-gray-500">
              We accept {chips.join(' · ')}. Prices are in USD.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

function IndividualPanel({ data }: { data: PublicPricing }) {
  return (
    <div
      role="tabpanel"
      id="pricing-panel-individuals"
      aria-labelledby="pricing-tab-individuals"
      className="mt-10"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {data.individual.map((plan) => (
          <article
            key={plan.key}
            className={`relative flex flex-col rounded-3xl border p-6 transition ${
              plan.popular
                ? 'border-blue-400/60 bg-gradient-to-b from-blue-500/15 to-white/[0.04] shadow-[0_0_40px_rgba(59,130,246,0.18)]'
                : 'border-white/10 bg-white/[0.04] hover:border-white/20'
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                Most popular
              </span>
            )}
            <p className="text-sm font-bold text-blue-200">{plan.name}</p>
            <p className="mt-1 text-xs text-gray-400">{plan.tagline}</p>

            <div className="mt-4 flex items-end gap-1.5">
              <span className="text-3xl font-extrabold tracking-tight">{compactMoney(plan.priceUsd)}</span>
              <span className="pb-1 text-[11px] text-gray-400">one-time</span>
            </div>
            <p className="mt-1 text-[11px] text-gray-400">
              {compactMoney(plan.perMonthUsd)} / month · {plan.cvs} documents
            </p>

            <ul className="mt-5 flex-1 space-y-2 text-xs text-gray-300">
              {individualFeatures(plan).map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href={`/payment?package=${encodeURIComponent(plan.key)}`}
              className={`mt-6 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
                plan.popular
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-400 hover:to-purple-500'
                  : 'border border-white/15 bg-white/5 text-white hover:bg-white/10'
              }`}
            >
              Buy Now <ArrowRight size={15} />
            </Link>
          </article>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Need more documents? Add{' '}
          <strong className="text-white">
            {data.cvsPerPrice} extra CVs for {compactMoney(data.additionalCvPrice)}
          </strong>{' '}
          any time from your dashboard.
        </p>
        <p>
          {data.freeCvLimit > 0
            ? `You can also build up to ${data.freeCvLimit} documents on a free account before upgrading.`
            : 'Create a free account and upgrade whenever you are ready.'}
        </p>
      </div>
    </div>
  );
}

function CompanyPanel({ plans }: { plans: PublicCompanyPlan[] }) {
  return (
    <div
      role="tabpanel"
      id="pricing-panel-companies"
      aria-labelledby="pricing-tab-companies"
      className="mt-10"
    >
      {plans.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-gray-400">
          Recruiter plans are being updated. Please contact us for the current company pricing.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const Icon = tierIcon(plan.code);
            const isFree = plan.priceUsd <= 0;
            return (
              <article
                key={plan.code}
                className={`relative flex flex-col rounded-3xl border p-6 transition ${
                  plan.popular
                    ? 'border-purple-400/60 bg-gradient-to-b from-purple-500/15 to-white/[0.04] shadow-[0_0_40px_rgba(147,51,234,0.18)]'
                    : 'border-white/10 bg-white/[0.04] hover:border-white/20'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                    Best value
                  </span>
                )}

                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
                      plan.popular ? 'bg-purple-500/20 text-purple-200' : 'bg-white/10 text-gray-200'
                    }`}
                  >
                    <Icon size={18} />
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-gray-300">
                    {plan.durationLabel || plan.name}
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-extrabold">{plan.isTrial ? plan.name : plan.tier}</h3>
                <p className="mt-1 text-xs text-gray-400">{plan.tagline}</p>

                <div className="mt-4 flex items-end gap-1.5">
                  <span className="text-3xl font-extrabold tracking-tight">
                    {isFree ? 'Free' : compactMoney(plan.priceUsd)}
                  </span>
                  <span className="pb-1 text-[11px] text-gray-400">
                    / {plan.durationLabel || plan.name}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-gray-400">
                  {isFree ? 'No card required to start' : `${compactMoney(plan.monthlyUsd)} per month`}
                </p>

                <ul className="mt-5 flex-1 space-y-2 text-xs text-gray-300">
                  {plan.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-2">
                      <Check size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/company"
                  className={`mt-6 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-400 hover:to-blue-400'
                      : 'border border-white/15 bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  Get Started <ArrowRight size={15} />
                </Link>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-xs leading-relaxed text-gray-400">
        <p>
          <strong className="text-white">How company plans work:</strong> every recruiter plan unlocks job posting,
          company chat and employee CV accounts for your whole team — prices above cover the full term, there are no
          per-seat charges. Need an invoice or a custom term?{' '}
          <Link href="/contact" className="font-semibold text-blue-300 underline">
            Talk to us
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function PricingSkeleton() {
  return (
    <div className="mt-10" aria-busy="true" aria-live="polite">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="h-80 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]" />
        ))}
      </div>
      <p className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
        <Loader2 size={14} className="animate-spin" /> Loading the latest prices…
      </p>
    </div>
  );
}

function TrustCard({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-200">
        <Icon size={17} />
      </span>
      <p className="mt-3 text-sm font-bold text-white">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-gray-400">{body}</p>
    </div>
  );
}

