import { NextResponse } from 'next/server';
import { resolveCompany } from '@/lib/company-server';

/**
 * Applications received by the signed-in company. Each row carries the CV the
 * candidate sent plus their chat ID so the company can open a thread.
 */
export async function GET(req: Request) {
  const ctx = await resolveCompany(req);
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  try {
    const { data: rows, error } = await ctx.admin
      .from('job_applications')
      .select('id, job_id, job_title, candidate_user_id, candidate_chat_id, candidate_email, document_id, email_status, created_at')
      .eq('company_id', ctx.user.id)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;
    if (!rows || rows.length === 0) return NextResponse.json({ applications: [] });

    const profileIds = Array.from(new Set(rows.map((row: any) => row.candidate_user_id).filter(Boolean)));
    const documentIds = Array.from(new Set(rows.map((row: any) => row.document_id).filter(Boolean)));

    const [profilesResult, docsResult] = await Promise.all([
      profileIds.length
        ? ctx.admin.from('user_profiles').select('id, full_name, email, chat_id').in('id', profileIds)
        : Promise.resolve({ data: [] as any[] }),
      documentIds.length
        ? ctx.admin.from('generated_documents').select('id, full_name, template_name, full_data').in('id', documentIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const profiles = new Map<string, any>();
    ((profilesResult as any).data || []).forEach((profile: any) => profiles.set(profile.id, profile));

    const docs = new Map<string, any>();
    ((docsResult as any).data || []).forEach((doc: any) => docs.set(doc.id, doc));

    const applications = rows.map((row: any) => {
      const profile = profiles.get(row.candidate_user_id) || null;
      const doc = docs.get(row.document_id) || null;
      const full = (doc?.full_data as any) || {};
      return {
        id: row.id,
        jobId: row.job_id,
        jobTitle: row.job_title || 'Role',
        candidateUserId: row.candidate_user_id,
        candidateName:
          profile?.full_name || full.fullName || doc?.full_name || 'Candidate',
        chatId: profile?.chat_id || row.candidate_chat_id || '',
        documentId: row.document_id,
        cvLabel: String(full.jobTitle || doc?.template_name || 'CV'),
        emailStatus: row.email_status || '',
        createdAt: row.created_at,
      };
    });

    return NextResponse.json({ applications });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'applications_load_failed' }, { status: 500 });
  }
}
