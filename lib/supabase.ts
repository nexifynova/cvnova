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

export const checkUserLimit = async (userEmail: string) => {
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('email', userEmail)
    .single();

  const { data: settings, error: settingsError } = await supabase
    .from('app_settings')
    .select('free_cv_limit')
    .eq('id', 1)
    .single();

  if (profileError) console.error("Profile Error:", profileError);
  if (settingsError) console.error("Settings Error:", settingsError);

  if (!profile || !settings) {
    return { allowed: true, isLoggedIn: !!profile };
  }

  const limit = settings.free_cv_limit || 6;
  const used = profile.free_cv_count || 0;

  if (used >= limit && profile.subscription_type === 'free') {
    return { allowed: false, isLoggedIn: true };
  }

  return { allowed: true, isLoggedIn: true };
};

export const incrementUserCount = async (userEmail: string) => {
  const { data: profile, error: fetchError } = await supabase
    .from('user_profiles')
    .select('free_cv_count')
    .eq('email', userEmail)
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
      .eq('email', userEmail);
    
    if (error) {
      console.error("Increment Error:", error);
    } else {
      console.log("Count incremented to:", currentCount + 1);
    }
  } else {
    console.error("No profile found for email:", userEmail);
  }
};