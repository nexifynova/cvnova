import { NextResponse } from 'next/server';
import { createAdminClient, getUserFromRequest, isCompanyUser } from '@/lib/supabase-admin';


export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isCompanyUser(user)) return NextResponse.json({ error: 'company_account_required' }, { status: 403 });

  try {
    const { companyName, contactName, website, industry, country } = await req.json();
    if (!companyName || String(companyName).trim().length < 2) {
      return NextResponse.json({ error: 'company_name_required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('companies')
      .upsert({
        id: user.id,
        company_name: String(companyName).trim(),
        contact_name: String(contactName || '').trim() || null,
        email: user.email,
        website: String(website || '').trim() || null,
        industry: String(industry || '').trim() || null,
        country: String(country || '').trim() || null,
      })
      .select('*')
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ success: true, company: data });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'company_register_failed' }, { status: 500 });
  }
}
