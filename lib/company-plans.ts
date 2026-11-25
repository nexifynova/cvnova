/**
 * Phase 3 - display tiers for the company pricing catalogue.
 *
 * The Phase 2 catalogue is keyed by term (`1_month`, `3_months`, ...) because
 * the price is stored as the total for that term. /company/billing shows the
 * same five plans under product names (Free, Basic, Silver, Gold, Platinum),
 * so the tier names live here instead of being duplicated in the page.
 */

export type PlanTierInfo = {
  tier: string;
  tagline: string;
  highlights: string[];
  /** Highlighted as the recommended card on the billing page. */
  popular: boolean;
};

const TIERS: Record<string, PlanTierInfo> = {
  free_trial: {
    tier: 'Free',
    tagline: 'Try every recruiter feature for 45 days',
    highlights: ['45-day free trial', 'Company chat unlocked', 'Job posting unlocked', 'Employee CV accounts'],
    popular: false,
  },
  '1_month': {
    tier: 'Basic',
    tagline: 'Month-by-month hiring',
    highlights: ['30 days of access', 'Company chat unlocked', 'Job posting unlocked', 'Employee CV accounts'],
    popular: false,
  },
  '3_months': {
    tier: 'Silver',
    tagline: 'Best for one hiring quarter',
    highlights: ['90 days of access', 'Company chat unlocked', 'Job posting unlocked', 'Employee CV accounts'],
    popular: true,
  },
  '9_months': {
    tier: 'Gold',
    tagline: 'Nine months of steady hiring',
    highlights: ['270 days of access', 'Company chat unlocked', 'Job posting unlocked', 'Employee CV accounts'],
    popular: false,
  },
  '2_years': {
    tier: 'Platinum',
    tagline: 'Lowest cost per month',
    highlights: ['720 days of access', 'Company chat unlocked', 'Job posting unlocked', 'Employee CV accounts'],
    popular: false,
  },
};

const GENERIC: PlanTierInfo = {
  tier: 'Plan',
  tagline: 'Recruiter access',
  highlights: ['Company chat unlocked', 'Job posting unlocked', 'Employee CV accounts'],
  popular: false,
};

/**
 * Resolves a catalogue code (or a free-text name for admin-created plans) to
 * its card copy. Unknown codes fall back to the row name / a generic card, so
 * a new plan added from /admin/company-pricing never breaks the page.
 */
export function planTier(code: string | null | undefined, name?: string | null): PlanTierInfo {
  const key = String(code || '').trim();
  const known = TIERS[key];
  if (known) return known;

  const fallbackName = String(name || '').trim();
  if (fallbackName) {
    return { ...GENERIC, tier: fallbackName };
  }
  return GENERIC;
}

/** Plans that grant a fresh trial window when "purchased". */
export const isTrialCode = (code: string | null | undefined): boolean =>
  String(code || '').trim() === 'free_trial';
