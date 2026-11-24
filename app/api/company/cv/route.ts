import { NextResponse } from 'next/server';
import { assertExposable, loadCandidateProfile, redactCv, resolveCompany } from '@/lib/company-server';
import { canExposeDocument, getConsent } from '@/lib/account-status';
import { getTemplate } from '@/lib/templates';


export async function GET(req: Request) {
  const ctx = await resolveCompany(req);
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'document_id_required' }, { status: 400 });

    const { data: doc } = await ctx.admin
      .from('generated_documents')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!doc) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const profile = await loadCandidateProfile(ctx.admin, doc);
    // Re-checked on every request: consent withdrawal applies instantly.
    if (!canExposeDocument(profile, doc)) {
      return NextResponse.json({ error: 'consent_not_granted' }, { status: 403 });
    }

    const consent = getConsent(profile);
    const redacted = redactCv(doc.full_data, profile);

    return NextResponse.json({
      document: {
        id: doc.id,
        template: doc.template_name || 'classicgray',
        templateName: getTemplate(doc.template_name).name,
        ats: getTemplate(doc.template_name).ats,
        createdAt: doc.created_at,
        canContact: consent.allowContact,
        contact: redacted.contact,
        fullData: redacted.data,
      },
      // Needed by the company dashboard to open a chat thread. The id is only
      // returned while the candidate's sharing consent is still active.
      candidate: {
        id: (profile as any)?.id || doc.user_id || null,
        name: redacted.data.fullName || doc.full_name || 'Candidate',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'candidate_load_failed' }, { status: 500 });
  }
}
