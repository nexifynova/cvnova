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
      .select('id, job_id, job_title, candidate_user_id, candidate_chat_id, candidate_email, document_id, email_status, received_at, apply_count, created_at')
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
        applyCount: Number(row.apply_count) || 1,
        receivedAt: row.received_at || null,
        createdAt: row.created_at,
      };
    });

    return NextResponse.json({ applications });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'applications_load_failed' }, { status: 500 });
  }
}

/**
 * Company confirms an application was received. The candidate is told inside
 * their company chat thread (which also surfaces on their dashboard inbox).
 */
export async function POST(req: Request) {
  const ctx = await resolveCompany(req);
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'application_required' }, { status: 400 });

    const { data: application, error } = await ctx.admin
      .from('job_applications')
      .select('id, job_title, candidate_user_id, document_id, received_at')
      .eq('id', id)
      .eq('company_id', ctx.user.id)
      .maybeSingle();

    if (error) throw error;
    if (!application) return NextResponse.json({ error: 'application_not_found' }, { status: 404 });

    // Idempotent: a second click never spams the candidate with a duplicate.
    if (application.received_at) {
      return NextResponse.json({ success: true, alreadyReceived: true, receivedAt: application.received_at });
    }

    const receivedAt = new Date().toISOString();
    const { error: updateError } = await ctx.admin
      .from('job_applications')
      .update({ received_at: receivedAt })
      .eq('id', application.id)
      .eq('company_id', ctx.user.id);
    if (updateError) throw updateError;

    if (application.candidate_user_id) {
      await ctx.admin.from('company_messages').insert([
        {
          company_id: ctx.user.id,
          candidate_user_id: application.candidate_user_id,
          document_id: application.document_id || null,
          sender: 'company',
          body: 'Your document has been received by the company.',
        },
      ]);
    }

    return NextResponse.json({ success: true, receivedAt });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'application_update_failed' }, { status: 500 });
  }
}
