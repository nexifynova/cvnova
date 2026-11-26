import { NextResponse } from 'next/server';
import { createAdminClient, isAdminCookie } from '@/lib/supabase-admin';
import {
  computeCompanyAccess,
  loadCompanyPackages,
  loadCompanySettings,
  planWindowFrom,
} from '@/lib/company-access';
import { mapCompanyPayment, normalizeCompanyPaymentStatus } from '@/lib/company-payments';

/**
 * Phase 5 - admin approval of company plan payments.
 *
 * GET   lists every company_payments row with the company's current package,
 *       so the admin can see what a slip will change before approving it.
 * PATCH approves / disapproves a slip. Approval is the only place that writes
 *       package_type + package_expiry + grace_expiry for a paid company plan;
 *       disapproving restores the snapshot taken when the slip was uploaded.
 *
 * Auth is the httpOnly `admin_session` cookie, and every query runs with the
 * service role, so `company_payments` can keep RLS closed.
 */

const UUID_RE = /^[0-9a-f]{8}-[a-f0-9]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const COMPANY_FIELDS =
  'id, company_name, email, package_type, package_expiry, grace_expiry, is_approved, is_disabled';

type CompanyRow = {
  id: string;
  company_name?: string | null;
  email?: string | null;
  package_type?: string | null;
  package_expiry?: string | null;
  grace_expiry?: string | null;
  is_approved?: boolean | null;
  is_disabled?: boolean | null;
};

function decoratePayment(payment: any, companies: Map<string, CompanyRow>) {
  const company = companies.get(String(payment.company_id || ''));
  return {
    ...mapCompanyPayment(payment),
    companyApproved: company?.is_approved !== false,
    companyDisabled: company?.is_disabled === true,
    companyPackageType: company?.package_type || null,
    companyPackageExpiry: company?.package_expiry || null,
    companyGraceExpiry: company?.grace_expiry || null,
    adminNotes: String(payment?.admin_notes || ''),
  };
}

export async function GET(req: Request) {
  if (!isAdminCookie(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const [settings, packages, { data: rows, error }] = await Promise.all([
      loadCompanySettings(admin),
      loadCompanyPackages(admin, { includeInactive: true }),
      admin.from('company_payments').select('*').order('created_at', { ascending: false }).limit(500),
    ]);

    if (error) throw error;

    const ids = Array.from(new Set((rows || []).map((row: any) => String(row.company_id || '')))).filter(
      (id) => UUID_RE.test(id),
    );

    let companies: CompanyRow[] = [];
    if (ids.length) {
      const { data } = await admin.from('companies').select(COMPANY_FIELDS).in('id', ids);
      companies = (data as CompanyRow[]) || [];
    }

    const companyMap = new Map(companies.map((company) => [String(company.id), company]));
    const payments = (rows || []).map((row: any) => decoratePayment(row, companyMap));

    return NextResponse.json({
      payments,
      companies,
      packages,
      settings,
      counts: {
        pending: payments.filter((payment) => payment.status === 'pending').length,
        approved: payments.filter((payment) => payment.status === 'approved').length,
        rejected: payments.filter((payment) => payment.status === 'rejected').length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'company_payments_load_failed' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!isAdminCookie(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({} as any));
    const id = String(body?.id || '').trim();
    const status = normalizeCompanyPaymentStatus(body?.status);
    const notes =
      body?.adminNotes === undefined ? null : String(body.adminNotes || '').trim().slice(0, 500) || null;

    if (!UUID_RE.test(id)) return NextResponse.json({ error: 'payment_id_required' }, { status: 400 });
    if (!['pending', 'approved', 'rejected'].includes(String(body?.status || ''))) {
      return NextResponse.json({ error: 'invalid_status' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: payment, error: fetchError } = await admin
      .from('company_payments')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!payment) return NextResponse.json({ error: 'payment_not_found' }, { status: 404 });

    const { data: company } = await admin
      .from('companies')
      .select('*')
      .eq('id', payment.company_id)
      .maybeSingle();

    if (!company) return NextResponse.json({ error: 'company_not_found' }, { status: 404 });

    const nowIso = new Date().toISOString();
    // `applied_expiry` is written explicitly in each branch below: the granted
    // expiry on approval, null whenever a slip goes back to pending/rejected.
    const paymentPatch: Record<string, unknown> = {
      status,
      updated_at: nowIso,
      approved_at: status === 'approved' ? nowIso : null,
    };
    if (notes !== null) paymentPatch.admin_notes = notes;

    if (status === 'approved') {
      // Already approved: keep the dates that were granted, never extend twice.
      if (normalizeCompanyPaymentStatus(payment.status) === 'approved') {
        return NextResponse.json({
          success: true,
          unchanged: true,
          payment: mapCompanyPayment(payment),
        });
      }

      const [settings, packages] = await Promise.all([
        loadCompanySettings(admin),
        loadCompanyPackages(admin, { includeInactive: true }),
      ]);

      const plan = packages.find((item) => item.code === payment.package_code);
      if (!plan) {
        return NextResponse.json(
          { error: 'plan_not_found', message: `Plan "${payment.package_code}" no longer exists.` },
          { status: 404 },
        );
      }

      const access = computeCompanyAccess(company, settings);
      const window = planWindowFrom(access, plan, settings.graceHours);

      // Snapshot before overwriting, so a later disapproval restores the plan
      // that was live when the slip arrived.
      const previous = {
        previous_package_type: payment.previous_package_type ?? company.package_type ?? null,
        previous_package_expiry: payment.previous_package_expiry ?? company.package_expiry ?? null,
        previous_grace_expiry: payment.previous_grace_expiry ?? company.grace_expiry ?? null,
      };

      const { error: companyError } = await admin
        .from('companies')
        .update({
          package_type: plan.code,
          package_expiry: window.packageExpiry,
          grace_expiry: window.graceExpiry,
        })
        .eq('id', company.id);

      if (companyError) throw companyError;

      const { data: saved, error: saveError } = await admin
        .from('company_payments')
        .update({
          ...paymentPatch,
          ...previous,
          applied_expiry: window.packageExpiry,
        })
        .eq('id', id)
        .select('*')
        .maybeSingle();

      if (saveError) throw saveError;

      return NextResponse.json({
        success: true,
        payment: mapCompanyPayment(saved),
        company: {
          id: String(company.id),
          packageType: plan.code,
          packageExpiry: window.packageExpiry,
          graceExpiry: window.graceExpiry,
          renewed: window.renewed,
        },
      });
    }

    // Moving an approved slip back to In Checking / Disapproved reverts the plan.
    if (normalizeCompanyPaymentStatus(payment.status) === 'approved') {
      const { data: newer } = await admin
        .from('company_payments')
        .select('id')
        .eq('company_id', payment.company_id)
        .eq('status', 'approved')
        .neq('id', id)
        .gt('approved_at', payment.approved_at || '1970-01-01T00:00:00.000Z')
        .maybeSingle();

      if (newer) {
        return NextResponse.json(
          {
            error: 'newer_payment_approved',
            message:
              'A newer payment was approved after this one. Adjust that payment first, then come back to this slip.',
          },
          { status: 409 },
        );
      }

      const { error: revertError } = await admin
        .from('companies')
        .update({
          package_type: payment.previous_package_type ?? null,
          package_expiry: payment.previous_package_expiry ?? null,
          grace_expiry: payment.previous_grace_expiry ?? null,
        })
        .eq('id', company.id);

      if (revertError) throw revertError;
    }

    const { data: saved, error: saveError } = await admin
      .from('company_payments')
      .update({ ...paymentPatch, applied_expiry: null })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (saveError) throw saveError;

    return NextResponse.json({ success: true, payment: mapCompanyPayment(saved) });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'company_payment_update_failed' }, { status: 500 });
  }
}
