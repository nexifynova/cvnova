import { planTier } from './company-plans';
import type { CompanyPackage } from './company-access';

/**
 * Phase 4 - /pricing (public pricing page).
 *
 * Pure mappers only: /api/pricing reads the two catalogues (app_settings for
 * individual plans, company_packages for company plans) and these helpers turn
 * them into the shapes the page renders. Nothing is hard-coded in the UI, so a
 * price changed from Admin -> Settings or Admin -> Company Pricing shows up on
 * the public page straight away.
 */

export type IndividualPlanKey = '3 Months' | '6 Months' | '1 Year' | '5 Years';

export type IndividualPlan = {
  /** Key understood by /payment?package=... */
  key: IndividualPlanKey;
  name: string;
  months: number;
  priceUsd: number;
  /** Total price divided by the number of 30-day months in the term. */
  perMonthUsd: number;
  cvs: number;
  tagline: string;
  popular: boolean;
};

export type PublicCompanyPlan = {
  code: string;
  name: string;
  tier: string;
  tagline: string;
  highlights: string[];
  popular: boolean;
  priceUsd: number;
  monthlyUsd: number;
  durationDays: number;
  durationLabel: string;
  isTrial: boolean;
};

export type PublicPaymentMethods = {
  skrill: boolean;
  payoneer: boolean;
  easypaisa: boolean;
  binance: boolean;
  bank: boolean;
};

export type PublicPricing = {
  individual: IndividualPlan[];
  company: PublicCompanyPlan[];
  payments: PublicPaymentMethods;
  trialMonths: number;
  freeCvLimit: number;
  reactivationPrice: number;
  additionalCvPrice: number;
  cvsPerPrice: number;
};

const num = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/** 90 -> "3 months", 365 -> "1 year", 45 -> "45 days". */
export function durationLabel(days: number): string {
  const value = Math.max(0, Math.round(num(days, 0)));
  if (!value) return '';
  if (value % 365 === 0) {
    const years = value / 365;
    return `${years} year${years === 1 ? '' : 's'}`;
  }
  if (value % 30 === 0) {
    const months = value / 30;
    if (months >= 24 && months % 12 === 0) {
      const years = months / 12;
      return `${years} year${years === 1 ? '' : 's'}`;
    }
    return `${months} month${months === 1 ? '' : 's'}`;
  }
  return `${value} days`;
}

/**
 * Individual (CV builder) plans. Prices and document allowances live in
 * app_settings (`package_3m_price` / `cvs_3m`, ...) and are editable from the
 * admin settings screen; the fallbacks mirror the homepage section.
 */
const INDIVIDUAL_TERMS: {
  key: IndividualPlanKey;
  months: number;
  priceField: string;
  cvsField: string;
  priceFallback: number;
  cvsFallback: number;
  tagline: string;
  popular: boolean;
}[] = [
  {
    key: '3 Months',
    months: 3,
    priceField: 'package_3m_price',
    cvsField: 'cvs_3m',
    priceFallback: 5,
    cvsFallback: 25,
    tagline: 'Perfect for a quick job search.',
    popular: false,
  },
  {
    key: '6 Months',
    months: 6,
    priceField: 'package_6m_price',
    cvsField: 'cvs_6m',
    priceFallback: 8,
    cvsFallback: 45,
    tagline: 'Best value for serious professionals.',
    popular: true,
  },
  {
    key: '1 Year',
    months: 12,
    priceField: 'package_1y_price',
    cvsField: 'cvs_1y',
    priceFallback: 12,
    cvsFallback: 60,
    tagline: 'Long-term career growth plan.',
    popular: false,
  },
  {
    key: '5 Years',
    months: 60,
    priceField: 'package_5y_price',
    cvsField: 'cvs_5y',
    priceFallback: 40,
    cvsFallback: 250,
    tagline: 'Lifetime access for experts.',
    popular: false,
  },
];

const asSettings = (settings: unknown): Record<string, unknown> =>
  settings && typeof settings === 'object' ? (settings as Record<string, unknown>) : {};

export function individualPlansFromSettings(settings: unknown): IndividualPlan[] {
  const bag = asSettings(settings);
  return INDIVIDUAL_TERMS.map((term) => {
    const priceUsd = Math.max(0, num(bag[term.priceField], term.priceFallback));
    return {
      key: term.key,
      name: term.key,
      months: term.months,
      priceUsd,
      perMonthUsd: Math.round((priceUsd / term.months) * 100) / 100,
      cvs: Math.max(0, Math.round(num(bag[term.cvsField], term.cvsFallback))),
      tagline: term.tagline,
      popular: term.popular,
    };
  });
}

/**
 * Company plans come from the Phase 2 catalogue that /admin/company-pricing
 * edits. Product names (Free, Basic, Silver, Gold, Platinum) and the feature
 * copy are resolved through planTier, so a brand new plan code still renders.
 */
export function companyPlansForPublic(packages: CompanyPackage[]): PublicCompanyPlan[] {
  return (packages || [])
    .filter((plan) => plan && plan.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((plan) => {
      const info = planTier(plan.code, plan.name);
      const highlights = [...info.highlights];
      // Keep the trial length in sync with the catalogue instead of the copy.
      if (plan.isTrial) {
        highlights[0] = `${plan.durationDays}-day free trial`;
      }
      return {
        code: plan.code,
        name: plan.name,
        tier: info.tier,
        tagline: info.tagline,
        highlights,
        popular: info.popular,
        priceUsd: plan.priceUsd,
        monthlyUsd: plan.monthlyUsd,
        durationDays: plan.durationDays,
        durationLabel: durationLabel(plan.durationDays),
        isTrial: plan.isTrial,
      };
    });
}

export function buildPublicPricing(settings: unknown, packages: CompanyPackage[]): PublicPricing {
  const bag = asSettings(settings);
  return {
    individual: individualPlansFromSettings(bag),
    company: companyPlansForPublic(packages),
    payments: {
      skrill: !!bag.skrill_enabled,
      payoneer: !!bag.payoneer_enabled,
      easypaisa: !!bag.easy_paisa_enabled,
      binance: !!bag.binance_enabled,
      bank: !!bag.bank_enabled,
    },
    trialMonths: Math.max(1, Math.round(num(bag.trial_months, 1))),
    freeCvLimit: Math.max(0, Math.round(num(bag.free_cv_limit, 1))),
    reactivationPrice: Math.max(0, num(bag.reactivation_price, 2)),
    additionalCvPrice: Math.max(0, num(bag.additional_cv_price, 2)),
    cvsPerPrice: Math.max(1, Math.round(num(bag.cvs_per_price, 5))),
  };
}
