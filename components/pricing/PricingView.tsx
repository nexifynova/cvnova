'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Clock3,
  CreditCard,
  Loader2,
  ShieldCheck,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { IndividualPlan, PublicCompanyPlan, PublicPaymentMethods, PublicPricing } from '@/lib/public-pricing';

/**
 * Phase 5 - public pricing page (/pricing).
 *
 * Both audiences are shown on one page, one under the other, instead of behind
 * tabs: "For CV Maker Users" (individual plans from app_settings) followed by
 * "For Company Prices" (recruiter plans from company_packages). Company cards
 * use exactly the same card layout as the individual ones, so the two halves of
 * the page look like one product. Every price still comes from /api/pricing.
 */

type Status = 'loading' | 'ready' | 'error';

const compactMoney = (value: number) => {
  const rounded = Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
  return `$${Number.isInteger(rounded) ? rounded : rounded.toFixed(2)}`;
};

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

async function fetchPricing(): Promise<PublicPricing> {
  const res = await fetch('/api/pricing', { cache: 'no-store' });
  const payload = (await res.json()) as PublicPricing & { error?: string };
  if (!res.ok) throw new Error(payload?.error || 'Unable to load the price list.');
  return payload;
}

const errorMessage = (err: unknown) =>
  err instanceof Error && err.message ? err.message : 'Unable to load the price list.';

export default function PricingView() {
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

          {status === 'ready' && data && (
            <>
              <IndividualSection data={data} />
              <CompanySection plans={data.company} />

              <div className="mt-14 grid gap-4 sm:grid-cols-3">
                <TrustCard
                  icon={ShieldCheck}
                  title="Secure checkout"
                  body="Manual verification on every payment, no card details stored."
                />
                <TrustCard
                  icon={Clock3}
                  title="Fast activation"
                  body="Individual plans unlock on approval; company plans activate the moment the slip is verified."
                />
                <TrustCard
                  icon={BadgeCheck}
                  title="Real people on support"
                  body="WhatsApp and email support for billing and account questions."
                />
              </div>

              {chips.length > 0 && (
                <p className="mt-8 text-center text-xs text-gray-500">
                  We accept {chips.join(' · ')}. Prices are in USD.
                </p>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}


function SectionHeading({
  id,
  icon: Icon,
  badge,
  title,
  subtitle,
}: {
  id: string;
  icon: LucideIcon;
  badge: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div id={id} className="mt-14 scroll-mt-24 text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-200">
        <Icon size={13} /> {badge}
      </span>
      <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-400">{subtitle}</p>
    </div>
  );
}

function IndividualSection({ data }: { data: PublicPricing }) {
  return (
    <section aria-labelledby="pricing-for-cv-makers">
      <SectionHeading
        id="pricing-for-cv-makers"
        icon={UserRound}
        badge="For CV Maker Users"
        title="CV builder plans for individuals"
        subtitle="Create ATS-ready CVs and cover letters, unlock every template and keep every document you build."
      />

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
    </section>
  );
}

function CompanySection({ plans }: { plans: PublicCompanyPlan[] }) {
  return (
    <section aria-labelledby="pricing-for-companies">
      <SectionHeading
        id="pricing-for-companies"
        icon={Users}
        badge="For Company Prices"
        title="Recruiter plans for hiring teams"
        subtitle="Job posting, company chat and employee CV accounts for your whole team — no per-seat charges."
      />

      {plans.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-gray-400">
          Recruiter plans are being updated. Please contact us for the current company pricing.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isFree = plan.priceUsd <= 0;
            return (
              <article
                key={plan.code}
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
                  <span className="text-3xl font-extrabold tracking-tight">
                    {isFree ? 'Free' : compactMoney(plan.priceUsd)}
                  </span>
                  <span className="pb-1 text-[11px] text-gray-400">{plan.durationLabel || plan.name}</span>
                </div>
                <p className="mt-1 text-[11px] text-gray-400">
                  {isFree
                    ? 'No payment needed to start'
                    : `${compactMoney(plan.monthlyUsd)} / month · ${plan.durationDays} days`}
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
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-400 hover:to-purple-500'
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
          per-seat charges. Pick a plan in the company portal, pay through one of the published accounts and upload
          your slip; the plan activates as soon as our team verifies the payment. Need an invoice or a custom term?{' '}
          <Link href="/contact" className="font-semibold text-blue-300 underline">
            Talk to us
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

function PricingSkeleton() {
  return (
    <div className="mt-14" aria-busy="true" aria-live="polite">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="h-80 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]" />
        ))}
      </div>
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-64 animate-pulse rounded-3xl border border-white/10 bg-white/[0.03]" />
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

