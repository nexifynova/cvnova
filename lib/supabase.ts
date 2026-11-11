import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON!

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

// Check if user has valid subscription (Pro) or free limit not exceeded
export const checkUserLimit = async (userEmail: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { allowed: false, reason: 'not_logged_in' };

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: settings, error: settingsError } = await supabase
    .from('app_settings')
    .select('free_cv_limit')
    .eq('id', 1)
    .single();

  if (profileError || settingsError || !profile || !settings) {
    return { allowed: true, reason: 'error_fallback' }; // Allow on error to avoid blocking
  }

  // Check Subscription
  const isPro = profile.subscription_type && profile.subscription_type !== 'free';
  
  if (isPro) {
    // Check if subscription is expired
    if (profile.subscription_expiry) {
      const expiry = new Date(profile.subscription_expiry);
      const now = new Date();
      
      if (expiry > now) {
        // Valid subscription - unlimited access
        return { allowed: true, isPro: true, reason: 'pro_active' };
      } else {
        // Subscription expired - downgrade to free
        await supabase.from('user_profiles').update({
          subscription_type: 'free',
          subscription_expiry: null
        }).eq('id', user.id);
        
        // After expiry, check free limit
        const limit = settings.free_cv_limit || 3;
        const used = profile.free_cv_count || 0;
        
        if (used >= limit) {
          return { allowed: false, isPro: false, reason: 'free_limit_reached' };
        }
        return { allowed: true, isPro: false, reason: 'free' };
      }
    }
    return { allowed: true, isPro: true, reason: 'pro_no_expiry' };
  }

  // Free user - check limit
  const limit = settings.free_cv_limit || 3;
  const used = profile.free_cv_count || 0;

  if (used >= limit) {
    return { allowed: false, isPro: false, reason: 'free_limit_reached' };
  }

  return { allowed: true, isPro: false, reason: 'free' };
};

export const incrementUserCount = async (userEmail: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile, error: fetchError } = await supabase
    .from('user_profiles')
    .select('free_cv_count')
    .eq('id', user.id)
    .single();

  if (fetchError) {
    console.error("Fetch Profile Error:", fetchError);
    return;
  }

  if (profile) {
    const currentCount = profile.free_cv_count || 0;
    const { error } = await supabase
      .from('user_profiles')
      .update({ free_cv_count: currentCount + 1 })
      .eq('id', user.id);import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON!

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

// FIXED: Check Limit
export const checkUserLimit = async (userEmail: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { allowed: false, reason: 'not_logged_in' };

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: settings } = await supabase
    .from('app_settings')
    .select('free_cv_limit')
    .eq('id', 1)
    .single();

  if (!profile || !settings) return { allowed: true, reason: 'error_fallback' }; 

  // Pro user check
  const isPro = profile.subscription_type && profile.subscription_type !== 'free';
  if (isPro && profile.subscription_expiry) {
    const expiry = new Date(profile.subscription_expiry);
    if (expiry > new Date()) return { allowed: true, isPro: true };
  }

  // Free user check
  const limit = settings.free_cv_limit || 3;
  const used = profile.free_cv_count || 0;

  if (used >= limit) {
    return { allowed: false, isPro: false, reason: 'free_limit_reached' };
  }

  return { allowed: true, isPro: false, reason: 'free' };
};

// FIXED: Increment Count
export const incrementUserCount = async (userEmail: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('free_cv_count')
    .eq('id', user.id)
    .single();

  if (profile) {
    const currentCount = profile.free_cv_count || 0;
    await supabase
      .from('user_profiles')
      .update({ free_cv_count: currentCount + 1 })
      .eq('id', user.id); // Yahan id use kiya hai
  }
};
    
    if (error) console.error("Increment Error:", error);
  }
};