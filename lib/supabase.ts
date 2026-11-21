import { createClient } from '@supabase/supabase-js'

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
}) => {
  try {
    const { error } = await supabase
      .from('generated_documents')
      .insert([
        {
          user_type: 'Guest',
          document_type: data.documentType,
          template_name: data.templateName,
          full_name: data.fullName,
          email: data.email,
          phone: data.phone,
          full_data: data.fullData,
        }
      ]);
    if (error) console.error("Supabase Save Error:", error);
  } catch (err) {
    console.error("Catch Error:", err);
  }
};

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

  const isPro = profile.subscription_type && profile.subscription_type !== 'free';

  if (isPro) {
    if (profile.subscription_expiry) {
      const expiry = new Date(profile.subscription_expiry);
      const now = new Date();
      if (expiry > now) {
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