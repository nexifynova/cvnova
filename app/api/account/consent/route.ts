import { NextResponse } from 'next/server';
import { createAdminClient, getUserFromRequest } from '@/lib/supabase-admin';
import { CONSENT_VERSION } from '@/lib/account-status';


const asBool = (value: unknown): boolean | null =>
  typeof value === 'boolean' ? value : value === 'true' ? true : value === 'false' ? false : null;

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('user_profiles')
    .select('consent_share_cv, consent_company_contact, consent_marketing, consent_updated_at, consent_version')
    .eq('id', user.id)
    .maybeSingle();

  return NextResponse.json({ consent: profile || {} });
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const shareCv = asBool(body?.shareCv);
    const allowContact = asBool(body?.allowContact);
    const marketing = asBool(body?.marketing);

    if (shareCv === null && allowContact === null && marketing === null) {
      return NextResponse.json({ error: 'no_consent_fields' }, { status: 400 });
    }

    const admin = createAdminClient();
    const now = new Date().toISOString();

    const patch: Record<string, unknown> = {
      consent_updated_at: now,
      consent_version: String(body?.version || CONSENT_VERSION),
    };
    if (shareCv !== null) patch.consent_share_cv = shareCv;
    if (allowContact !== null) patch.consent_company_contact = allowContact;
    if (marketing !== null) patch.consent_marketing = marketing;
    // Contact consent is meaningless without CV sharing consent.
    if (shareCv === false) patch.consent_company_contact = false;

    const { data, error } = await admin
      .from('user_profiles')
      .update(patch)
      .eq('id', user.id)
      .select('consent_share_cv, consent_company_contact, consent_marketing, consent_updated_at, consent_version')
      .maybeSingle();

    if (error) throw error;

    // Withdrawal takes effect immediately: hide every CV from the company pool
    // at the same moment the flag is turned off (defence in depth â€” the read
    // APIs re-check the flag on every request anyway).
    if (patch.consent_share_cv === false || patch.consent_company_contact === false) {
      await admin
        .from('generated_documents')
        .update({ is_public: false })
        .or(`user_id.eq.${user.id},email.eq.${user.email || ''}`);
    }

    return NextResponse.json({ success: true, consent: data });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'consent_update_failed' }, { status: 500 });
  }
}
