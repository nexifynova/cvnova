// Single source of truth for trial / paid / locked account states and for the
// three-tier consent model. Everything here is pure so it can run on the server
// (API guards) and in the browser (badges, banners).

export const DEFAULT_TRIAL_DAYS = 61; // 2 months, expressed in days as a fallback
export const CONSENT_VERSION = 'v1';

export interface ProfileLike {
  created_at?: string | null;
  trial_started_at?: string | null;
  trial_ends_at?: string | null;
  reactivated_until?: string | null;
  subscription_type?: string | null;
  subscription_expiry?: string | null;
  total_allowed_cvs?: number | null;
  free_cv_count?: number | null;
  blue_ats_used?: number | null;
  consent_share_cv?: boolean | null;
  consent_company_contact?: boolean | null;
  consent_marketing?: boolean | null;
  consent_updated_at?: string | null;
  consent_version?: string | null;
  is_deactivated?: boolean | null;
}

const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

export const parseDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function getTrialWindow(profile?: ProfileLike | null, trialMonths = 2) {
  const created = parseDate(profile?.created_at) || new Date();
  const start = parseDate(profile?.trial_started_at) || created;
  const end = parseDate(profile?.trial_ends_at) || addMonths(start, trialMonths);
  return { start, end };
}

export type PlanState = {
  isPaid: boolean;
  isTrial: boolean;
  isReactivated: boolean;
  isLocked: boolean;
  isTrialExpired: boolean;
  trialEnd: Date;
  daysLeft: number;
  label: string;
  planName: string;
  /** Coarse tier used by UI badges: premium (paid/reactivated) vs basic (free/trial). */
  tier: 'premium' | 'basic';
};

export function getPlanState(profile?: ProfileLike | null, now: Date = new Date()): PlanState {
  const { end } = getTrialWindow(profile);
  const type = String(profile?.subscription_type || 'free').toLowerCase();
  const expiry = parseDate(profile?.subscription_expiry);
  const paidType = type !== 'free' && type !== 'trial';
  const isPaid = paidType && (!expiry || expiry > now);
  const paidExpired = paidType && !!expiry && expiry <= now;

  const reactivatedUntil = parseDate(profile?.reactivated_until);
  const isReactivated = !isPaid && !!reactivatedUntil && reactivatedUntil > now;

  const trialExpired = end <= now;
  const isTrial = !isPaid && !isReactivated && !trialExpired;

  const msLeft = Math.max(0, end.getTime() - now.getTime());
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

  const isLocked = !isPaid && !isTrial && !isReactivated;

  let label = 'Free trial';
  if (isPaid) label = 'Premium plan';
  else if (isReactivated) label = 'Reactivated';
  else if (paidExpired) label = 'Plan expired';
  else if (isLocked) label = 'Trial ended';
  else if (daysLeft <= 7) label = `Trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`;

  return {
    isPaid,
    isTrial,
    isReactivated,
    isLocked,
    isTrialExpired: trialExpired,
    trialEnd: end,
    daysLeft,
    label,
    // Public-facing package names: paid/reactivated accounts are "Premium",
    // everything else (free signup + active trial) is "Basic".
    planName: isPaid || isReactivated ? 'Premium' : 'Basic',
    tier: isPaid || isReactivated ? 'premium' : 'basic',
  };
}

export type ConsentState = {
  shareCv: boolean;
  allowContact: boolean;
  marketing: boolean;
  version: string;
  updatedAt: string | null;
  /** Both flags must be on before a CV is surfaced to companies. */
  canBeDiscovered: boolean;
};

export function getConsent(profile?: ProfileLike | null): ConsentState {
  const shareCv = profile?.consent_share_cv === true;
  const allowContact = profile?.consent_company_contact === true;
  return {
    shareCv,
    allowContact,
    marketing: profile?.consent_marketing === true,
    version: profile?.consent_version || CONSENT_VERSION,
    updatedAt: profile?.consent_updated_at || null,
    canBeDiscovered: shareCv,
  };
}

/**
 * A CV is exposed to companies when the candidate turned on
 * "Show my CV to companies". The per-CV `is_public` flag is only a shortcut
 * that the dashboard/apply flow switches on — it must never hide a CV from a
 * candidate who already gave account-level consent, otherwise the talent pool
 * stays empty for every legacy account.
 */
export function canExposeDocument(
  profile: ProfileLike | null | undefined,
  doc: { is_public?: boolean | null; document_type?: string | null },
): boolean {
  if (!profile) return false;
  if (profile.is_deactivated === true) return false;
  if (getConsent(profile).shareCv !== true) return false;
  if ((doc.document_type || 'CV') !== 'CV') return false;
  return true;
}

export function getAtsQuota(profile?: ProfileLike | null, freeLimit = 3) {
  const used = Math.max(0, Number(profile?.blue_ats_used) || 0);
  const limit = Math.max(0, Number(freeLimit) || 3);
  const plan = getPlanState(profile);
  const unlimited = plan.isPaid || plan.isReactivated;
  return {
    used,
    limit,
    remaining: unlimited ? Infinity : Math.max(0, limit - used),
    unlimited,
    exhausted: !unlimited && used >= limit,
  };
}

export type PlanTone = 'basic' | 'premium' | 'reactivated' | 'trial' | 'locked';

/**
 * Turns a profile (+ optional server-computed plan) into ready-to-render badge
 * content. Package names follow the public model: free/trial = "Basic",
 * paid/reactivated = "Premium".
 */
export function getPlanBadgeInfo(
  profile?: ProfileLike | null,
  plan?: Partial<PlanState> | null,
): { name: string; subtitle: string; tone: PlanTone } {
  const rawType = String(profile?.subscription_type || '').trim();
  const lower = rawType.toLowerCase();
  const hasPackage = !!rawType && lower !== 'free' && lower !== 'trial';
  const packageLabel = hasPackage ? rawType : '';

  // The server-computed plan is authoritative. It is produced inside the
  // /api/account/status route handler — never during prerender — so reading
  // `daysLeft` here is safe. We must NOT call getPlanState() (which uses
  // `new Date()`) during render: Next.js 16 rejects that while prerendering.
  if (plan) {
    if (plan.isPaid === true) {
      return {
        name: 'Premium',
        subtitle: packageLabel ? `${packageLabel} package` : 'Premium plan',
        tone: 'premium',
      };
    }

    if (plan.isReactivated === true) {
      return { name: 'Premium', subtitle: 'Reactivated access', tone: 'reactivated' };
    }

    if (plan.isLocked === true) {
      return {
        name: 'Basic',
        subtitle: 'Trial ended — reactivate to keep creating',
        tone: 'locked',
      };
    }

    if (plan.isTrial === true) {
      const daysLeft = Number(plan.daysLeft) || 0;
      return {
        name: 'Basic',
        subtitle: daysLeft > 0 ? `Free trial · ${daysLeft} day${daysLeft === 1 ? '' : 's'} left` : 'Free trial',
        tone: 'trial',
      };
    }

    return { name: 'Basic', subtitle: 'Free plan', tone: 'basic' };
  }

  // Fallback (plan not loaded yet / API unavailable): derive from the static
  // subscription type only — never touch the clock while rendering.
  if (hasPackage) {
    return { name: 'Premium', subtitle: `${packageLabel} package`, tone: 'premium' };
  }
  return { name: 'Basic', subtitle: 'Free plan', tone: 'basic' };
}

