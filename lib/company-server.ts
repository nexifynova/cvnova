import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createAdminClient, getUserFromRequest, isCompanyUser } from './supabase-admin';
import { canExposeDocument, getConsent, type ProfileLike } from './account-status';

export type CompanyContext =
  | { ok: true; user: User; company: any; admin: SupabaseClient }
  | { ok: false; status: number; error: string };

export async function resolveCompany(req: Request): Promise<CompanyContext> {
  const user = await getUserFromRequest(req);
  if (!user) return { ok: false, status: 401, error: 'unauthorized' };
  if (!isCompanyUser(user)) return { ok: false, status: 403, error: 'company_account_required' };

  const admin = createAdminClient();
  const { data: company } = await admin.from('companies').select('*').eq('id', user.id).maybeSingle();
  if (!company) return { ok: false, status: 404, error: 'company_profile_missing' };
  if (company.is_approved === false) return { ok: false, status: 403, error: 'company_not_approved' };

  return { ok: true, user, company, admin };
}

export async function loadCandidateProfile(
  admin: SupabaseClient,
  doc: { user_id?: string | null; email?: string | null },
): Promise<ProfileLike | null> {
  if (doc.user_id) {
    const { data } = await admin.from('user_profiles').select('*').eq('id', doc.user_id).maybeSingle();
    if (data) return data as ProfileLike;
  }
  const email = String(doc.email || '').trim();
  if (!email || email.toLowerCase() === 'n/a') return null;
  const { data } = await admin.from('user_profiles').select('*').ilike('email', email).maybeSingle();
  return (data as ProfileLike) || null;
}

/**
 * Removes personal contact data from a CV payload unless the candidate has
 * explicitly allowed company contact. This runs on the server, so a crafted
 * request cannot bypass the dashboard toggle.
 */
export function redactCv(
  fullData: Record<string, any> | null | undefined,
  profile: ProfileLike | null,
): { data: Record<string, any>; contact: Record<string, any> | null } {
  const source = { ...(fullData || {}) };
  const consent = getConsent(profile);
  if (consent.allowContact) {
    return {
      data: source,
      contact: {
        email: source.email || (profile as any)?.email || '',
        phone: source.phone || '',
        linkedin: source.linkedin || '',
        instagram: source.instagram || '',
        indeed: source.indeed || '',
      },
    };
  }

  delete source.email;
  delete source.phone;
  delete source.linkedin;
  delete source.instagram;
  delete source.indeed;
  if (Array.isArray(source.references)) {
    source.references = source.references.map((ref: any) => {
      const copy = { ...ref };
      delete copy.contact;
      return copy;
    });
  }
  return { data: source, contact: null };
}

export function assertExposable(
  profile: ProfileLike | null,
  doc: { is_public?: boolean | null; document_type?: string | null },
): boolean {
  return canExposeDocument(profile, doc);
}
