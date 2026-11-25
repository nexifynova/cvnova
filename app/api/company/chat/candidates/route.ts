import { NextResponse } from 'next/server';
import { resolveCompany } from '@/lib/company-server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type CandidateRow = {
  id: string;
  fullName: string;
  jobTitle: string;
  chatId: string;
  isOnline: boolean;
  lastSeenAt: string | null;
  /** True when the company may message this candidate (consent or an application). */
  canChat: boolean;
  /** Job title of the application, when the candidate applied to this company. */
  appliedFor: string | null;
  documentId: string | null;
};

const PROFILE_COLUMNS =
  'id, full_name, email, chat_id, job_field_id, is_online, last_seen_at, consent_company_contact, is_deactivated';

/**
 * Candidates for the company chat panel.
 *
 * The list merges two sources so it is never empty:
 *   1. Applications the company received (each row keeps the sent CV).
 *   2. Field matches - `user_profiles.job_field_id` plus legacy CVs whose
 *      stored `jobTitle` equals the field name.
 *
 * When the company has no recruiting field the panel falls back to every
 * candidate who allowed company contact.
 */
export async function GET(req: Request) {
  const ctx = await resolveCompany(req);
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  try {
    const url = new URL(req.url);
    const requested = (url.searchParams.get('field') || '').trim();
    const fieldId = UUID_RE.test(requested) ? requested : String(ctx.company.job_field_id || '');

    let fieldIdOut: string | null = fieldId || null;
    let fieldName = '';
    if (fieldId) {
      const { data: fieldRow, error: fieldError } = await ctx.admin
        .from('job_fields')
        .select('id, field_name')
        .eq('id', fieldId)
        .maybeSingle();

      if (fieldError) throw fieldError;
      if (fieldRow) fieldName = String(fieldRow.field_name || '').trim();
      else fieldIdOut = null;
    }

    // Applications first - the company clearly wants to talk to these people.
    const { data: applications } = await ctx.admin
      .from('job_applications')
      .select('candidate_user_id, document_id, job_title, created_at')
      .eq('company_id', ctx.user.id)
      .order('created_at', { ascending: false })
      .limit(200);

    const appliedFor = new Map<string, { jobTitle: string; documentId: string | null }>();
    (applications || []).forEach((row: any) => {
      const id = String(row.candidate_user_id || '');
      if (!id || appliedFor.has(id)) return;
      appliedFor.set(id, {
        jobTitle: String(row.job_title || ''),
        documentId: row.document_id ? String(row.document_id) : null,
      });
    });

    const profiles = new Map<string, any>();
    const matchedIds = new Set<string>();
    const addProfiles = (rows: any[] | null | undefined, markMatched: boolean) => {
      (rows || []).forEach((profile: any) => {
        if (!profile?.id) return;
        if (!profiles.has(profile.id)) profiles.set(profile.id, profile);
        if (markMatched) matchedIds.add(String(profile.id));
      });
    };

    if (fieldId) {
      // Pass 1 - profiles linked to the field.
      const { data: linked, error: linkedError } = await ctx.admin
        .from('user_profiles')
        .select(PROFILE_COLUMNS)
        .eq('job_field_id', fieldId)
        .limit(500);

      if (linkedError) throw linkedError;
      addProfiles(linked, true);

      // Pass 2 - legacy CVs whose job title matches the field name.
      if (fieldName) {
        const wanted = fieldName.toLowerCase();
        const { data: docs } = await ctx.admin
          .from('generated_documents')
          .select('user_id, email, full_data')
          .eq('document_type', 'CV')
          .order('created_at', { ascending: false })
          .limit(500);

        const legacyIds = new Set<string>();
        const legacyEmails = new Set<string>();

        (docs || []).forEach((doc: any) => {
          const title = String((doc.full_data || {}).jobTitle || '').trim().toLowerCase();
          if (!title || title !== wanted) return;
          if (doc.user_id) legacyIds.add(String(doc.user_id));
          const email = String(doc.email || '').trim();
          if (email && email.toLowerCase() !== 'n/a') legacyEmails.add(email);
        });

        const missingIds = Array.from(legacyIds).filter((id) => !profiles.has(id));
        if (missingIds.length) {
          const { data } = await ctx.admin.from('user_profiles').select(PROFILE_COLUMNS).in('id', missingIds);
          addProfiles(data, true);
        }

        if (legacyEmails.size) {
          const known = new Set(
            Array.from(profiles.values()).map((profile: any) => String(profile.email || '').toLowerCase()),
          );
          const missingEmails = Array.from(legacyEmails).filter((email) => !known.has(email.toLowerCase()));
          if (missingEmails.length) {
            const { data } = await ctx.admin.from('user_profiles').select(PROFILE_COLUMNS).in('email', missingEmails);
            addProfiles(data, true);
          }
        }
      }
    } else {
      // No recruiting field yet: show every contactable candidate.
      const { data: contactable } = await ctx.admin
        .from('user_profiles')
        .select(PROFILE_COLUMNS)
        .eq('consent_company_contact', true)
        .limit(300);
      addProfiles(contactable, true);
    }

    // Applicants are always included, even outside the recruiting field.
    const applicantIds = Array.from(appliedFor.keys()).filter((id) => !profiles.has(id));
    if (applicantIds.length) {
      const { data } = await ctx.admin.from('user_profiles').select(PROFILE_COLUMNS).in('id', applicantIds);
      addProfiles(data, false);
    }

    const candidates: CandidateRow[] = Array.from(profiles.values())
      .filter((profile: any) => profile.is_deactivated !== true)
      .filter((profile: any) => {
        const hasApplication = appliedFor.has(profile.id);
        const contactable = profile.consent_company_contact === true;
        return hasApplication || contactable || matchedIds.has(String(profile.id));
      })
      .map((profile: any) => {
        const application = appliedFor.get(profile.id);
        return {
          id: profile.id,
          fullName: profile.full_name || (profile.email ? String(profile.email).split('@')[0] : 'Candidate'),
          jobTitle: application?.jobTitle || fieldName,
          chatId: profile.chat_id || '',
          isOnline: profile.is_online === true,
          lastSeenAt: profile.last_seen_at || null,
          canChat: profile.consent_company_contact === true || !!application,
          appliedFor: application?.jobTitle || null,
          documentId: application?.documentId || null,
        };
      })
      .sort((a, b) => {
        if (!!a.appliedFor !== !!b.appliedFor) return a.appliedFor ? -1 : 1;
        if (a.canChat !== b.canChat) return a.canChat ? -1 : 1;
        if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
        return a.fullName.localeCompare(b.fullName);
      });

    return NextResponse.json({
      candidates,
      fieldId: fieldIdOut,
      fieldName,
      companyChatId: ctx.company.chat_id || '',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'candidates_load_failed' }, { status: 500 });
  }
}
