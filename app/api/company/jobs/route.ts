import { NextResponse } from 'next/server';
import { resolveCompany } from '@/lib/company-server';
import { loadCompanyAccess } from '@/lib/company-access';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Company-side job management. Only the owning company can read or edit rows;
// the service role client is used because RLS also protects the public board.
export async function GET(req: Request) {
  const ctx = await resolveCompany(req);
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  try {
    const { data, error } = await ctx.admin
      .from('jobs')
      .select('id, title, description, location, created_at')
      .eq('company_id', ctx.user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({
      jobs: data || [],
      company: {
        id: ctx.company.id,
        name: ctx.company.company_name,
        chatId: ctx.company.chat_id || '',
        jobFieldId: ctx.company.job_field_id || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'jobs_load_failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const ctx = await resolveCompany(req);
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  try {
    // Phase 2: posting jobs needs a live package (trial or paid). The grace
    // period only keeps chat open, so expired packages are read-only here.
    const access = await loadCompanyAccess(ctx.admin, ctx.company);
    if (!access.canPostJobs) {
      return NextResponse.json(
        { error: 'package_expired', message: access.jobMessage, packageStatus: access.status },
        { status: 402 },
      );
    }

    const body = await req.json();
    const title = String(body?.title || '').trim();
    if (title.length < 2) {
      return NextResponse.json({ error: 'job_title_required' }, { status: 400 });
    }

    const { data, error } = await ctx.admin
      .from('jobs')
      .insert([{
        company_id: ctx.user.id,
        title: title.slice(0, 120),
        description: String(body?.description || '').trim().slice(0, 4000),
        location: String(body?.location || '').trim().slice(0, 160),
      }])
      .select('id, title, description, location, created_at')
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ success: true, job: data });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'job_create_failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const ctx = await resolveCompany(req);
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  try {
    const id = new URL(req.url).searchParams.get('id') || '';
    if (!UUID_RE.test(id)) return NextResponse.json({ error: 'job_id_required' }, { status: 400 });

    const { error } = await ctx.admin
      .from('jobs')
      .delete()
      .eq('id', id)
      .eq('company_id', ctx.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'job_delete_failed' }, { status: 500 });
  }
}
