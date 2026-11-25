import { NextResponse } from 'next/server';
import { createAdminClient, getUserFromRequest } from '@/lib/supabase-admin';

// Public job board for signed-in candidates. Rows are served through the
// service role so company contact fields stay under our control.
export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const admin = createAdminClient();

    const { data: settings } = await admin
      .from('app_settings')
      .select('show_jobs_on_dashboard')
      .eq('id', 1)
      .maybeSingle();

    if (settings && settings.show_jobs_on_dashboard === false) {
      return NextResponse.json({ jobs: [], enabled: false });
    }

    const { data: jobs, error } = await admin
      .from('jobs')
      .select('id, company_id, title, description, location, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    if (!jobs || jobs.length === 0) return NextResponse.json({ jobs: [], enabled: true });

    // Which of these jobs has the caller already applied to, and how many times?
    const applied = new Map<string, { documentId: string | null; count: number }>();
    const { data: applications } = await admin
      .from('job_applications')
      .select('job_id, document_id, apply_count')
      .eq('candidate_user_id', user.id)
      .limit(200);
    (applications || []).forEach((row: any) => {
      if (!row.job_id) return;
      applied.set(String(row.job_id), {
        documentId: row.document_id ? String(row.document_id) : null,
        count: Math.max(1, Number(row.apply_count) || 1),
      });
    });

    const companyIds = Array.from(new Set(jobs.map((job: any) => job.company_id).filter(Boolean)));

    const { data: companies } = await admin
      .from('companies')
      .select('id, company_name, industry, country, website, chat_id, is_approved')
      .in('id', companyIds);

    const approved = new Map<string, any>();
    (companies || []).forEach((company: any) => {
      if (company.is_approved !== false) approved.set(company.id, company);
    });

    const list = jobs
      .filter((job: any) => approved.has(job.company_id))
      .map((job: any) => {
        const company = approved.get(job.company_id);
        return {
          id: job.id,
          title: job.title,
          description: job.description || '',
          location: job.location || '',
          createdAt: job.created_at,
          companyId: job.company_id,
          companyName: company.company_name,
          industry: company.industry || '',
          country: company.country || '',
          website: company.website || '',
          companyChatId: company.chat_id || '',
          appliedDocumentId: applied.get(job.id)?.documentId ?? null,
          appliedCount: applied.get(job.id)?.count ?? 0,
        };
      });

    return NextResponse.json({ jobs: list, enabled: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'jobs_load_failed' }, { status: 500 });
  }
}
