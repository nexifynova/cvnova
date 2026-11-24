import { NextResponse } from 'next/server';
import { getConsent, type ProfileLike } from '@/lib/account-status';
import { assertExposable, redactCv, resolveCompany } from '@/lib/company-server';
import { getTemplate } from '@/lib/templates';


type Row = { doc: any; profile: ProfileLike };

const findProfile = (rows: ProfileLike[], doc: any): ProfileLike | null => {
  if (doc.user_id) {
    const byId = rows.find((p) => (p as any).id === doc.user_id);
    if (byId) return byId;
  }
  const email = String(doc.email || '').trim().toLowerCase();
  if (!email || email === 'n/a') return null;
  return rows.find((p) => String((p as any).email || '').trim().toLowerCase() === email) || null;
};

export async function GET(req: Request) {
  const ctx = await resolveCompany(req);
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  try {
    const url = new URL(req.url);
    const search = (url.searchParams.get('q') || '').trim().toLowerCase();
    const ats = (url.searchParams.get('ats') || '').trim().toLowerCase();

    const { data: docs, error } = await ctx.admin
      .from('generated_documents')
      .select('id, user_id, document_type, template_name, full_name, email, phone, full_data, created_at, is_public, ats_tier')
      .eq('is_public', true)
      .eq('document_type', 'CV')
      .order('created_at', { ascending: false })
      .limit(300);

    if (error) throw error;
    if (!docs || docs.length === 0) {
      return NextResponse.json({ candidates: [], total: 0, consentPolicyVersion: 'v1' });
    }

    const ids = Array.from(new Set(docs.map((d: any) => d.user_id).filter(Boolean)));
    const emails = Array.from(
      new Set(
        docs
          .map((d: any) => String(d.email || '').trim())
          .filter((e) => e && e.toLowerCase() !== 'n/a'),
      ),
    );

    const [byId, byEmail] = await Promise.all([
      ids.length
        ? ctx.admin.from('user_profiles').select('*').in('id', ids)
        : Promise.resolve({ data: [] as any[] }),
      emails.length
        ? ctx.admin.from('user_profiles').select('*').in('email', emails)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const profiles = [...((byId as any).data || []), ...((byEmail as any).data || [])] as ProfileLike[];

    const rows: Row[] = [];
    const seen = new Set<string>();

    for (const doc of docs) {
      if (seen.has(doc.id)) continue;
      const profile = findProfile(profiles, doc);
      if (!assertExposable(profile, doc)) continue;
      seen.add(doc.id);
      rows.push({ doc, profile: profile as ProfileLike });
    }

    const enriched = rows.map(({ doc, profile }) => {
      const consent = getConsent(profile);
      const meta = getTemplate(doc.template_name);
      const full = doc.full_data || {};
      const redacted = redactCv(full, profile);

      return {
        id: doc.id,
        fullName: full.fullName || doc.full_name || 'Candidate',
        jobTitle: full.jobTitle || '',
        location: full.address || '',
        nationality: full.nationality || '',
        summary: String(full.summary || '').slice(0, 320),
        skills: Array.isArray(full.skills) ? full.skills.filter(Boolean).slice(0, 12) : [],
        experienceYears: Array.isArray(full.experience) ? full.experience.length : 0,
        template: meta.id,
        templateName: meta.name,
        ats: meta.ats,
        updatedAt: doc.created_at,
        cvnovaCode: full.cvnovaCode || '',
        canView: true,
        canContact: consent.allowContact,
        contact: redacted.contact,
        photoUrl: redacted.data.photoUrl || '',
      };
    });

    const filtered = enriched.filter((item) => {
      if (ats && item.ats !== ats) return false;
      if (!search) return true;
      const haystack = [item.fullName, item.jobTitle, item.location, item.summary, ...item.skills].join(' ').toLowerCase();
      return haystack.includes(search);
    });

    return NextResponse.json({
      candidates: filtered,
      total: filtered.length,
      consentPolicyVersion: 'v1',
      notice: 'Only candidates who opted in to CV sharing and marked an individual CV public are listed. Contact details are hidden unless the candidate separately allowed company contact.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'candidate_list_failed' }, { status: 500 });
  }
}
