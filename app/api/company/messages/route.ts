import { NextResponse } from 'next/server';
import { createAdminClient, getUserFromRequest, isCompanyUser } from '@/lib/supabase-admin';
import { getConsent } from '@/lib/account-status';


async function candidateName(admin: any, id: string) {
  const { data } = await admin.from('user_profiles').select('full_name, email').eq('id', id).maybeSingle();
  return data?.full_name || (data?.email ? String(data.email).split('@')[0] : 'Candidate');
}

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const url = new URL(req.url);
  const role = isCompanyUser(user) ? 'company' : 'candidate';
  const candidateFilter = url.searchParams.get('candidateId');
  const companyFilter = url.searchParams.get('companyId');

  if (role === 'company') {
    const { data: company } = await admin.from('companies').select('*').eq('id', user.id).maybeSingle();
    if (!company) return NextResponse.json({ error: 'company_profile_missing' }, { status: 404 });
    if (company.is_approved === false) return NextResponse.json({ error: 'company_not_approved' }, { status: 403 });

    let query = admin
      .from('company_messages')
      .select('*')
      .eq('company_id', user.id)
      .order('created_at', { ascending: true })
      .limit(300);
    if (candidateFilter) query = query.eq('candidate_user_id', candidateFilter);

    const { data: messages, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await admin
      .from('company_messages')
      .update({ is_read: true })
      .eq('company_id', user.id)
      .eq('sender', 'candidate')
      .eq('is_read', false);

    const ids = Array.from(new Set((messages || []).map((m: any) => m.candidate_user_id).filter(Boolean)));
    const names: Record<string, string> = {};
    for (const id of ids) names[id as string] = await candidateName(admin, id as string);

    return NextResponse.json({
      role,
      company: { id: company.id, name: company.company_name },
      messages: (messages || []).map((m: any) => ({ ...m, candidateName: m.candidate_user_id ? names[m.candidate_user_id] : '' })),
    });
  }

  let candidateQuery = admin
    .from('company_messages')
    .select('*')
    .eq('candidate_user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(300);
  if (companyFilter) candidateQuery = candidateQuery.eq('company_id', companyFilter);

  const { data: messages, error } = await candidateQuery;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let markQuery = admin
    .from('company_messages')
    .update({ is_read: true })
    .eq('candidate_user_id', user.id)
    .eq('sender', 'company')
    .eq('is_read', false);
  if (companyFilter) markQuery = markQuery.eq('company_id', companyFilter);
  await markQuery;

  const companyIds = Array.from(new Set((messages || []).map((m: any) => m.company_id).filter(Boolean)));
  const companies: Record<string, string> = {};
  for (const id of companyIds) {
    const { data } = await admin.from('companies').select('company_name').eq('id', id).maybeSingle();
    companies[id as string] = data?.company_name || 'Company';
  }

  return NextResponse.json({
    role,
    messages: (messages || []).map((m: any) => ({ ...m, companyName: m.company_id ? companies[m.company_id] : 'Company' })),
  });
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const { body, documentId, candidateUserId, companyId } = await req.json();
    const text = String(body || '').trim();
    if (!text) return NextResponse.json({ error: 'message_required' }, { status: 400 });

    const admin = createAdminClient();

    if (isCompanyUser(user)) {
      const { data: company } = await admin.from('companies').select('*').eq('id', user.id).maybeSingle();
      if (!company || company.is_approved === false) {
        return NextResponse.json({ error: 'company_not_approved' }, { status: 403 });
      }
      if (!candidateUserId) return NextResponse.json({ error: 'candidate_required' }, { status: 400 });

      const { data: profile } = await admin.from('user_profiles').select('*').eq('id', candidateUserId).maybeSingle();
      if (!profile || profile.is_deactivated) {
        return NextResponse.json({ error: 'candidate_not_found' }, { status: 404 });
      }
      // Consent is the default gate. A candidate who applied to one of this
      // company's jobs has already invited the conversation, so the company can
      // answer inside the same thread even before turning contact consent on.
      const { data: application } = await admin
        .from('job_applications')
        .select('id')
        .eq('company_id', user.id)
        .eq('candidate_user_id', candidateUserId)
        .maybeSingle();
      if (!getConsent(profile).allowContact && !application) {
        return NextResponse.json({ error: 'contact_consent_required' }, { status: 403 });
      }

      const { data, error } = await admin.from('company_messages').insert([{
        company_id: user.id,
        candidate_user_id: candidateUserId,
        document_id: documentId || null,
        sender: 'company',
        body: text,
      }]).select('*').maybeSingle();
      if (error) throw error;
      return NextResponse.json({ success: true, message: data });
    }

    if (!companyId) return NextResponse.json({ error: 'company_required' }, { status: 400 });
    const { data: company } = await admin.from('companies').select('id').eq('id', companyId).maybeSingle();
    if (!company) return NextResponse.json({ error: 'company_not_found' }, { status: 404 });

    const { data, error } = await admin.from('company_messages').insert([{
      company_id: companyId,
      candidate_user_id: user.id,
      document_id: documentId || null,
      sender: 'candidate',
      body: text,
    }]).select('*').maybeSingle();
    if (error) throw error;

    return NextResponse.json({ success: true, message: data });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'message_failed' }, { status: 500 });
  }
}
