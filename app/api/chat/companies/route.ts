import { NextResponse } from 'next/server';
import { createAdminClient, getUserFromRequest, isCompanyUser } from '@/lib/supabase-admin';

/**
 * Companies a candidate can start a conversation with from the chat room.
 * Rows are served through the service role because `companies` only exposes a
 * company's own record to authenticated users.
 */
export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (isCompanyUser(user)) return NextResponse.json({ companies: [] });

  try {
    const admin = createAdminClient();

    const [{ data: settings }, { data: companies, error }] = await Promise.all([
      admin.from('app_settings').select('enable_company_chat').eq('id', 1).maybeSingle(),
      admin
        .from('companies')
        .select('id, company_name, chat_id, industry, country, job_field_id, is_approved')
        .order('company_name', { ascending: true })
        .limit(200),
    ]);

    if (error) throw error;
    if (settings && settings.enable_company_chat === false) {
      return NextResponse.json({ companies: [], enabled: false });
    }

    const list = (companies || [])
      .filter((company: any) => company.is_approved !== false && !!company.chat_id)
      .map((company: any) => ({
        id: company.id,
        companyName: company.company_name || 'Company',
        chatId: company.chat_id || '',
        industry: company.industry || '',
        country: company.country || '',
        jobFieldId: company.job_field_id || null,
      }));

    return NextResponse.json({ companies: list, enabled: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'companies_load_failed' }, { status: 500 });
  }
}
