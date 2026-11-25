import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Phase 2 - company package / trial / grace-period rules.
 *
 * Everything the company dashboard shows about its plan is derived here, and
 * the API routes use the very same helpers, so the UI can never claim access
 * the server would refuse (or the other way round).
 */

export const DEFAULT_TRIAL_DAYS = 45;
export const DEFAULT_GRACE_HOURS = 24;

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

/** Wording requested by the product owner. Do not translate on the server. */
export const CHAT_LOCKED_MESSAGE = 'Please purchase a plan to start chatting.';
export const JOB_POST_LOCKED_MESSAGE =
  'Your package has expired. Please purchase a plan to post new jobs.';
export const gracePeriodMessage = (hours: number) =>
  `You have ${hours} hours of grace period from the company to use chat. Please purchase a plan to continue.`;

export type CompanyPackage = {
  id: string;
  code: string;
  name: string;
  priceUsd: number;
  durationDays: number;
  /** Total price divided by the number of 30-day months in the term. */
  monthlyUsd: number;
  isTrial: boolean;
  isActive: boolean;
  sortOrder: number;
};

export type CompanyAccessSettings = {
  trialDays: number;
  graceHours: number;
  graceEnabled: boolean;
};

/**
 * active  -> plan/trial running, chat + job posting unlocked
 * grace   -> plan expired but the grace window is open, chat only
 * expired -> plan + grace over, read-only (talent pool / history)
 * none    -> no plan on record, read-only
 */
export type CompanyPlanStatus = 'active' | 'grace' | 'expired' | 'none';

export type CompanyAccess = {
  status: CompanyPlanStatus;
  packageType: string;
  packageExpiry: string | null;
  graceExpiry: string | null;
  graceEnabled: boolean;
  graceHours: number;
  trialDays: number;
  daysLeft: number | null;
  graceHoursLeft: number | null;
  canChat: boolean;
  canPostJobs: boolean;
  readOnly: boolean;
  chatMessage: string;
  jobMessage: string;
  graceMessage: string;
};

export const DEFAULT_ACCESS_SETTINGS: CompanyAccessSettings = {
  trialDays: DEFAULT_TRIAL_DAYS,
  graceHours: DEFAULT_GRACE_HOURS,
  graceEnabled: true,
};

function toNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toIso(value: unknown): string | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function mapCompanyPackage(row: any): CompanyPackage {
  const priceUsd = Math.max(0, toNumber(row?.price_usd, 0));
  const durationDays = Math.max(1, Math.round(toNumber(row?.duration_days, 30)));
  return {
    id: String(row?.id || row?.code || ''),
    code: String(row?.code || ''),
    name: String(row?.name || row?.code || ''),
    priceUsd,
    durationDays,
    monthlyUsd: Math.round((priceUsd / (durationDays / 30)) * 100) / 100,
    isTrial: row?.is_trial === true,
    isActive: row?.is_active !== false,
    sortOrder: Math.round(toNumber(row?.sort_order, 0)),
  };
}

export function computeCompanyAccess(
  company: any,
  settings: CompanyAccessSettings,
  now: Date = new Date(),
): CompanyAccess {
  const trialDays = Math.max(1, Math.round(toNumber(settings?.trialDays, DEFAULT_TRIAL_DAYS)));
  const graceHours = Math.max(0, Math.round(toNumber(settings?.graceHours, DEFAULT_GRACE_HOURS)));
  const graceEnabled = settings?.graceEnabled !== false;

  const packageExpiry = toIso(company?.package_expiry);
  const graceExpiry = toIso(company?.grace_expiry);
  const packageType = String(company?.package_type || '').trim() || 'free_trial';

  const base = {
    packageType,
    packageExpiry,
    graceExpiry,
    graceEnabled,
    graceHours,
    trialDays,
    chatMessage: CHAT_LOCKED_MESSAGE,
    jobMessage: JOB_POST_LOCKED_MESSAGE,
    graceMessage: gracePeriodMessage(graceHours),
  };

  const nowMs = now.getTime();

  if (!packageExpiry) {
    return {
      ...base,
      status: 'none',
      daysLeft: null,
      graceHoursLeft: null,
      canChat: false,
      canPostJobs: false,
      readOnly: true,
    };
  }

  const expiryMs = Date.parse(packageExpiry);
  if (expiryMs > nowMs) {
    return {
      ...base,
      status: 'active',
      daysLeft: Math.max(1, Math.ceil((expiryMs - nowMs) / DAY_MS)),
      graceHoursLeft: null,
      canChat: true,
      canPostJobs: true,
      readOnly: false,
    };
  }

  const graceMs = graceExpiry ? Date.parse(graceExpiry) : Number.NaN;
  const graceActive = graceEnabled && Number.isFinite(graceMs) && graceMs > nowMs;

  return {
    ...base,
    status: graceActive ? 'grace' : 'expired',
    daysLeft: 0,
    graceHoursLeft: graceActive ? Math.max(1, Math.ceil((graceMs - nowMs) / HOUR_MS)) : null,
    canChat: graceActive,
    canPostJobs: false,
    readOnly: true,
  };
}

/** Reads the single `company_settings` row, falling back to 45 days / 24 h. */
export async function loadCompanySettings(admin: SupabaseClient): Promise<CompanyAccessSettings> {
  try {
    const { data } = await admin
      .from('company_settings')
      .select('trial_days, grace_hours, grace_enabled')
      .eq('id', 1)
      .maybeSingle();

    return {
      trialDays: Math.max(1, Math.round(toNumber(data?.trial_days, DEFAULT_TRIAL_DAYS))),
      graceHours: Math.max(0, Math.round(toNumber(data?.grace_hours, DEFAULT_GRACE_HOURS))),
      graceEnabled: data?.grace_enabled !== false,
    };
  } catch {
    return { ...DEFAULT_ACCESS_SETTINGS };
  }
}

export async function loadCompanyPackages(
  admin: SupabaseClient,
  options: { includeInactive?: boolean } = {},
): Promise<CompanyPackage[]> {
  try {
    let query = admin
      .from('company_packages')
      .select('id, code, name, price_usd, duration_days, is_trial, is_active, sort_order')
      .order('sort_order', { ascending: true });

    if (!options.includeInactive) query = query.eq('is_active', true);

    const { data } = await query;
    return (data || []).map(mapCompanyPackage);
  } catch {
    return [];
  }
}

export async function loadCompanyAccess(
  admin: SupabaseClient,
  company: any,
  settings?: CompanyAccessSettings,
): Promise<CompanyAccess> {
  const resolved = settings ?? (await loadCompanySettings(admin));
  return computeCompanyAccess(company, resolved);
}

/** Trial window applied when a company row is created. */
export function buildTrialWindow(settings: CompanyAccessSettings, from: Date = new Date()) {
  const expiry = new Date(from.getTime() + settings.trialDays * DAY_MS);
  const grace = new Date(expiry.getTime() + settings.graceHours * HOUR_MS);
  return {
    packageType: 'free_trial',
    packageExpiry: expiry.toISOString(),
    graceExpiry: grace.toISOString(),
  };
}
