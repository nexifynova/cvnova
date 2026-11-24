import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

// Server-only Supabase client (service role). Never import this from a
// component that runs in the browser.
export const serviceKey = (): string =>
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_bd || '';

export const createAdminClient = (): SupabaseClient => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = serviceKey();
  if (!url || !key) {
    throw new Error('Supabase server credentials are missing (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_bd).');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
};

// Resolves the caller from the "Authorization: Bearer <access_token>" header.
// Used so consent/quota enforcement never trusts a client supplied user id.
export async function getUserFromRequest(req: Request): Promise<User | null> {
  const header = req.headers.get('authorization') || '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.getUser(token);
    if (error) return null;
    return data.user ?? null;
  } catch {
    return null;
  }
}

export const isCompanyUser = (user: User | null): boolean =>
  String(user?.user_metadata?.role || '').toLowerCase() === 'company';

export const isAdminCookie = (req: Request): boolean => {
  const cookie = req.headers.get('cookie') || '';
  return /(?:^|;\s*)admin_session=true(?:;|$)/.test(cookie);
};
