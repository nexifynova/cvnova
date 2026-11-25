import { NextResponse } from 'next/server';
import { createAdminClient, getUserFromRequest, isCompanyUser } from '@/lib/supabase-admin';
import { buildTrialWindow, loadCompanySettings } from '@/lib/company-access';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Accepts either an existing job_fields id or a free-text field name (the
// company signup dropdown sends the id). Mirrors save_user_job_field() but
// runs with the service role because companies have no profile row.
async function resolveJobFieldId(admin: ReturnType<typeof createAdminClient>, raw: unknown): Promise<string | null> {
  const value = String(raw || '').trim();
  if (!value) return null;
  if (UUID_RE.test(value)) return value;

  const name = value.slice(0, 80);
  await admin
    .from('job_fields')
    .insert([{ field_name: name }])
    .select('id');

  const { data } = await admin
    .from('job_fields')
    .select('id')
    .ilike('field_name', name)
    .maybeSingle();

  return (data as { id: string } | null)?.id ?? null;
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isCompanyUser(user)) return NextResponse.json({ error: 'company_account_required' }, { status: 403 });

  try {
    const { companyName, contactName, website, industry, country, fieldId, fieldName } = await req.json();
    if (!companyName || String(companyName).trim().length < 2) {
      return NextResponse.json({ error: 'company_name_required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const jobFieldId = await resolveJobFieldId(admin, fieldId || fieldName);

    // Phase 2: a brand-new company starts on the admin-configured free trial.
    // Existing rows are only healed when they carry no expiry at all, so this
    // login-time self-heal call can never overwrite a paid plan.
    const { data: existing } = await admin
      .from('companies')
      .select('id, package_expiry')
      .eq('id', user.id)
      .maybeSingle();

    const patch: Record<string, unknown> = {
      id: user.id,
      company_name: String(companyName).trim(),
      contact_name: String(contactName || '').trim() || null,
      email: user.email,
      website: String(website || '').trim() || null,
      industry: String(industry || '').trim() || null,
      country: String(country || '').trim() || null,
    };
    // Only overwrite the field when the caller actually supplied one, so the
    // login-time self-heal call never wipes an existing selection.
    if (jobFieldId) patch.job_field_id = jobFieldId;

    if (!existing || !existing.package_expiry) {
      const trial = buildTrialWindow(await loadCompanySettings(admin));
      patch.package_type = trial.packageType;
      patch.package_expiry = trial.packageExpiry;
      patch.grace_expiry = trial.graceExpiry;
    }

    const { data, error } = await admin
      .from('companies')
      .upsert(patch)
      .select('*')
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ success: true, company: data });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'company_register_failed' }, { status: 500 });
  }
}

