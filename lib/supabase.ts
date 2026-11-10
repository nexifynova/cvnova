import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Record save karne ka function
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

// User ka limit check karne ka function
export const checkUserLimit = async (userEmail: string) => {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('email', userEmail)
    .single();

  const { data: settings } = await supabase
    .from('app_settings')
    .select('free_cv_limit')
    .eq('id', 1)
    .single();

  if (!profile || !settings) return { allowed: true, isLoggedIn: false };

  const limit = settings.free_cv_limit || 6;
  const used = profile.free_cv_count || 0;

  if (used >= limit && profile.subscription_type === 'free') {
    return { allowed: false, isLoggedIn: true };
  }

  return { allowed: true, isLoggedIn: true };
};

// User ka count barhane ka function
export const incrementUserCount = async (userEmail: string) => {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('free_cv_count')
    .eq('email', userEmail)
    .single();

  if (profile) {
    await supabase
      .from('user_profiles')
      .update({ free_cv_count: (profile.free_cv_count || 0) + 1 })
      .eq('email', userEmail);
  }
};