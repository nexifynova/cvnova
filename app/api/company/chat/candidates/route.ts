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
};

/**
 * Contactable candidates for the company chat panel.
 *
 * Matching happens in two passes so legacy accounts are not lost:
 *   1. `user_profiles.job_field_id` = the company's recruiting field.
 *   2. CVs whose stored `jobTitle` matches the field name (accounts saved
 *      before job fields existed and therefore have a NULL job_field_id).
 *
 * Only candidates who explicitly allowed company contact are returned.
 */
export async function GET(req: Request) {
  const ctx = await resolveCompany(req);
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  try {
    const url = new URL(req.url);
    const requested = (url.searchParams.get('field') || '').trim();
    const fieldId = UUID_RE.test(requested) ? requested : String(ctx.company.job_field_id || '');

    if (!fieldId) {
      return NextResponse.json({ candidates: [], fieldName: '', fieldId: null });
    }

    const { data: fieldRow, error: fieldError } = await ctx.admin
      .from('job_fields')
      .select('id, field_name')
      .eq('id', fieldId)
      .maybeSingle();

    if (fieldError) throw fieldError;
    if (!fieldRow) return NextResponse.json({ candidates: [], fieldName: '', fieldId: null });

    const fieldName = String(fieldRow.field_name || '').trim();
    const fieldNameLower = fieldName.toLowerCase();

    // Pass 1 — profiles linked to the field.
    const { data: linked, error: linkedError } = await ctx.admin
      .from('user_profiles')
      .select('id, full_name, email, chat_id, job_field_id, is_online, last_seen_at, consent_company_contact, is_deactivated')
      .eq('job_field_id', fieldId)
      .limit(500);

    if (linkedError) throw linkedError;

    const profiles = new Map<string, any>();
    (linked || []).forEach((profile: any) => profiles.set(profile.id, profile));

    // Pass 2 — legacy CVs whose job title matches the field name.
    const { data: docs } = await ctx.admin
      .from('generated_documents')
      .select('user_id, email, full_data')
      .eq('document_type', 'CV')
      .order('created_at', { ascending: false })
      .limit(500);

    const legacyIds: string[] = [];
    const legacyEmails: string[] = [];
    (docs || []).forEach((doc: any) => {
      const title = String((doc.full_data || {}).jobTitle || '').trim().toLowerCase();
      if (title !== fieldNameLower) return;
      if (doc.user_id) legacyIds.push(String(doc.user_id));
      const email = String(doc.email || '').trim();
      if (email && email.toLowerCase() !== 'n/a') legacyEmails.push(email);
    });

    const extraIds = Array.from(new Set(legacyIds)).filter((id) => !profiles.has(id));
    const extraEmails = Array.from(new Set(legacyEmails));

    if (extraIds.length) {
      const { data } = await ctx.admin
        .from('user_profiles')
        .select('id, full_name, email, chat_id, job_field_id, is_online, last_seen_at, consent_company_contact, is_deactivated')
        .in('id', extraIds);
      (data || []).forEach((profile: any) => profiles.set(profile.id, profile));
    }

    if (extraEmails.length) {
      const { data } = await ctx.admin
        .from('user_profiles')
        .select('id, full_name, email, chat_id, job_field_id, is_online, last_seen_at, consent_company_contact, is_deactivated')
        .in('email', extraEmails);
      (data || []).forEach((profile: any) => {
        if (!profiles.has(profile.id)) profiles.set(profile.id, profile);
      });
    }

    const candidates: CandidateRow[] = Array.from(profiles.values())
      .filter((profile: any) => profile.consent_company_contact === true && profile.is_deactivated !== true)
      .map((profile: any) => ({
        id: profile.id,
        fullName: profile.full_name || (profile.email ? String(profile.email).split('@')[0] : 'Candidate'),
        jobTitle: fieldName,
        chatId: profile.chat_id || '',
        isOnline: profile.is_online === true,
        lastSeenAt: profile.last_seen_at || null,
      }))
      .sort((a, b) => {
        if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
        return a.fullName.localeCompare(b.fullName);
      });

    return NextResponse.json({
      candidates,
      fieldId,
      fieldName,
      companyChatId: ctx.company.chat_id || '',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'candidates_load_failed' }, { status: 500 });
  }
}
