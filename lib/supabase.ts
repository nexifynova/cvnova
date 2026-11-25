import { createClient } from '@supabase/supabase-js'
import { getPlanState } from './account-status'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON! // Vercel wala naam

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const saveDocumentRecord = async (data: {
  documentType: string;
  templateName: string;
  fullName: string;
  email: string;
  phone: string;
  fullData: any;
  userId?: string | null;
  isPublic?: boolean;
  atsTier?: string;
  templateTier?: string;
}) => {
  try {
    const baseRow = {
      user_type: data.userId ? 'Registered' : 'Guest',
      document_type: data.documentType,
      template_name: data.templateName,
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      full_data: data.fullData,
    };

    const extendedRow = {
      ...baseRow,
      user_id: data.userId || null,
      is_public: data.isPublic === true,
      ats_tier: data.atsTier || null,
      template_tier: data.templateTier || null,
    };

    // Prefer the extended row. If the 2026 migration has not been applied yet,
    // fall back to the legacy columns so saving never breaks.
    let { error } = await supabase.from('generated_documents').insert([extendedRow]);
    if (error) {
      const retry = await supabase.from('generated_documents').insert([baseRow]);
      error = retry.error;
    }
    if (error) console.error('Supabase Save Error:', error);
  } catch (err) {
    console.error('Catch Error:', err);
  }
};

// Ek saved document ko load karta hai (Edit Document flow ke liye).
export const fetchDocumentRecord = async (id: string) => {
  const { data, error } = await supabase
    .from('generated_documents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Supabase Fetch Error:', error);
    return null;
  }
  return data;
};

// Edit permission: sirf document ka owner hi usay edit kar sakta hai.
export const ownsDocument = (doc: any, user: { id?: string; email?: string } | null) => {
  if (!doc || !user) return false;
  if (doc.user_id) return !!user.id && doc.user_id === user.id;
  const docEmail = String(doc.email || '').trim().toLowerCase();
  const userEmail = String(user.email || '').trim().toLowerCase();
  return !!docEmail && docEmail === userEmail;
};

// Existing document ko update karta hai — naya document insert nahi hota,
// is liye CV/document count bhi double nahi hota.
export const updateDocumentRecord = async (
  id: string,
  data: {
    templateName?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    fullData?: any;
    atsTier?: string;
    templateTier?: string;
  }
) => {
  const baseRow: Record<string, any> = {};
  if (data.templateName !== undefined) baseRow.template_name = data.templateName;
  if (data.fullName !== undefined) baseRow.full_name = data.fullName;
  if (data.email !== undefined) baseRow.email = data.email;
  if (data.phone !== undefined) baseRow.phone = data.phone;
  if (data.fullData !== undefined) baseRow.full_data = data.fullData;

  const extendedRow: Record<string, any> = { ...baseRow };
  if (data.atsTier !== undefined) extendedRow.ats_tier = data.atsTier;
  if (data.templateTier !== undefined) extendedRow.template_tier = data.templateTier;

  // Prefer the extended row. If the 2026 migration has not been applied yet,
  // fall back to the legacy columns so updating never breaks.
  let { error } = await supabase.from('generated_documents').update(extendedRow).eq('id', id);
  if (error) {
    const retry = await supabase.from('generated_documents').update(baseRow).eq('id', id);
    error = retry.error;
  }
  if (error) {
    console.error('Supabase Update Error:', error);
    return false;
  }
  return true;
};

// Authenticated fetch for CVNova API routes. Attaches the Supabase access
// token so server-side consent/quota checks can identify the caller securely
// (never trust a user id supplied by the browser).
export async function authedFetch(input: string, init: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = new Headers(init.headers);
  if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return fetch(input, { ...init, headers, cache: 'no-store' });
}

// Check Limit
const PLAN_CV_SETTING_KEY: Record<string, string> = {
  '3 Months': 'cvs_3m',
  '6 Months': 'cvs_6m',
  '1 Year': 'cvs_1y',
  '5 Years': 'cvs_5y',
};

export const checkUserLimit = async (_userEmail?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { allowed: false, reason: 'not_logged_in' as const };

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: settings, error: settingsError } = await supabase
    .from('app_settings')
    .select('free_cv_limit, cvs_3m, cvs_6m, cvs_1y, cvs_5y')
    .eq('id', 1)
    .single();

  if (profileError || settingsError || !profile || !settings) {
    return { allowed: true, reason: 'error_fallback' as const };
  }

  // Trial / reactivation gate. If the 2-month trial is over and the account is
  // neither paid nor reactivated, creation is locked until they choose a plan.
  const plan = getPlanState(profile as any);
  if (plan.isLocked) {
    return { allowed: false, isPro: false, reason: 'trial_expired' as const };
  }

  const isPro = plan.isPaid || plan.isReactivated;

  if (isPro) {
    if (profile.subscription_expiry) {
      const expiry = new Date(profile.subscription_expiry);
      const now = new Date();
      if (expiry > now || plan.isReactivated) {
        // 🚨 Plan ka CV allowance admin settings + purchased total, jo bhi zyada ho.
        const planKey = PLAN_CV_SETTING_KEY[profile.subscription_type];
        const planCVs = planKey ? Number((settings as any)[planKey]) || 0 : 0;
        const allowedCVs = Math.max(Number(profile.total_allowed_cvs) || 0, planCVs);
        const used = profile.free_cv_count || 0;
        if (allowedCVs > 0 && used >= allowedCVs) {
          return { allowed: false, isPro: true, reason: 'pro_limit_reached' as const };
        }
        return { allowed: true, isPro: true, reason: 'pro_active' as const };
      }
      await supabase
        .from('user_profiles')
        .update({ subscription_type: 'free', subscription_expiry: null })
        .eq('id', user.id);

      const limit = settings.free_cv_limit || 1;
      const used = profile.free_cv_count || 0;
      if (used >= limit) {
        return { allowed: false, isPro: false, reason: 'free_limit_reached' as const };
      }
      return { allowed: true, isPro: false, reason: 'free' as const };
    }
    return { allowed: true, isPro: true, reason: 'pro_no_expiry' as const };
  }

  const limit = settings.free_cv_limit || 1;
  const used = profile.free_cv_count || 0;
  if (used >= limit) {
    return { allowed: false, isPro: false, reason: 'free_limit_reached' as const };
  }
  return { allowed: true, isPro: false, reason: 'free' as const };
};

// Increment Count - Fixed Version
export const incrementUserCount = async (_userEmail?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Directly increment using RPC (Better approach if you have a function)
  // For now, let's fetch and update
  const { data: profile, error: fetchError } = await supabase
    .from('user_profiles')
    .select('free_cv_count')
    .eq('id', user.id)
    .single();

  if (fetchError || !profile) {
    console.error("Fetch Profile Error:", fetchError);
    return;
  }

  const currentCount = profile.free_cv_count || 0;
  const { error } = await supabase
    .from('user_profiles')
    .update({ free_cv_count: currentCount + 1 })
    .eq('id', user.id);

  if (error) console.error("Increment Error:", error);
};

// Phase 2 — Job/Fields: CV builder ka "Job Title" job_fields table mein upsert
// karta hai (case-insensitive dedup DB par hota hai) aur current user ki
// profile me job_field_id set karta hai. Error par UI block nahi hona chahiye.
export const saveUserJobField = async (jobTitle: string) => {
  const title = String(jobTitle || '').trim();
  if (!title) return null;

  const { data, error } = await supabase.rpc('save_user_job_field', { p_name: title });
  if (error) {
    console.error('Job field save error:', error);
    return null;
  }
  return (data as string | null) ?? null;
};
