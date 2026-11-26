import { NextResponse } from 'next/server';
import { resolveCompany } from '@/lib/company-server';
import {
  loadCompanyAccess,
  loadCompanyPackages,
  loadCompanySettings,
} from '@/lib/company-access';
import { mapCompanyPayment, PAYMENT_SUBMITTED_MESSAGE } from '@/lib/company-payments';

/**
 * Phase 5 - /company/checkout (slip upload -> admin approval).
 *
 * GET  returns the active paid plans, the company's own payment history, the
 *      current access snapshot and the admin's enabled payment rails.
 * POST stores a `pending` company_payments row. Nothing is activated here: the
 *      plan columns are written only when the admin approves the slip from
 *      /admin/company-payments.
 *
 * Both handlers run with the service role, so `company_payments` can keep RLS
 * closed and no browser can read another company's slips.
 */

/** Only the payment-rail fields may leave the server; never the whole settings row. */
const ACCOUNT_FIELDS = [
  'skrill_enabled',
  'skrill_email',
  'skrill_name',
  'payoneer_enabled',
  'payoneer_email',
  'payoneer_name',
  'easy_paisa_enabled',
  'easy_paisa_number',
  'easy_paisa_name',
  'binance_enabled',
  'binance_id',
  'bank_enabled',
  'bank_name',
  'bank_account_number',
  'bank_account_name',
  'bank_iban',
] as const;

type Accounts = Record<string, string | boolean | null>;

function pickAccounts(settings: any): Accounts {
  const accounts: Accounts = {};
  for (const field of ACCOUNT_FIELDS) {
    const value = settings?.[field];
    accounts[field] = typeof value === 'boolean' ? value : value == null ? null : String(value);
  }
  return accounts;
}

function paymentMethods(accounts: Accounts): { value: string; label: string }[] {
  const methods: { value: string; label: string }[] = [];
  if (accounts.skrill_enabled) methods.push({ value: 'Skrill', label: 'Skrill' });
  if (accounts.payoneer_enabled) methods.push({ value: 'Payoneer', label: 'Payoneer' });
  if (accounts.easy_paisa_enabled) methods.push({ value: 'EasyPaisa', label: 'EasyPaisa' });
  if (accounts.binance_enabled) methods.push({ value: 'Binance', label: 'Binance' });
  if (accounts.bank_enabled) methods.push({ value: 'Bank', label: 'Bank Transfer' });
  return methods;
}

/** Slips are uploaded from the browser into the public `payment-slips` bucket. */
function isSlipUrl(value: string): boolean {
  if (!value || value.length > 2048) return false;
  const base = String(process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
  if (!base) return value.includes('/storage/v1/object/public/payment-slips/');
  return value.startsWith(`${base}/storage/v1/object/public/payment-slips/`);
}

export async function GET(req: Request) {
  const ctx = await resolveCompany(req);
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  try {
    const [settings, packages, access, { data: rows }, { data: appSettings }] = await Promise.all([
      loadCompanySettings(ctx.admin),
      loadCompanyPackages(ctx.admin),
      loadCompanyAccess(ctx.admin, ctx.company),
      ctx.admin
        .from('company_payments')
        .select('*')
        .eq('company_id', ctx.user.id)
        .order('created_at', { ascending: false })
        .limit(25),
      ctx.admin.from('app_settings').select(ACCOUNT_FIELDS.join(', ')).eq('id', 1).maybeSingle(),
    ]);

    const accounts = pickAccounts(appSettings);

    return NextResponse.json({
      company: {
        name: ctx.company.company_name || 'Company',
        email: ctx.company.email || ctx.user.email || '',
      },
      access,
      plans: packages.filter((plan) => plan.isActive),
      payments: (rows || []).map(mapCompanyPayment),
      accounts,
      paymentMethods: paymentMethods(accounts),
      graceHours: settings.graceHours,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'checkout_load_failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const ctx = await resolveCompany(req);
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  try {
    const body = await req.json().catch(() => ({} as any));
    const code = String(body?.code || '').trim();
    const slipUrl = String(body?.slipUrl || '').trim();
    const paymentMethod = String(body?.paymentMethod || '').trim().slice(0, 40) || 'Manual';
    const transactionId = String(body?.transactionId || '').trim().slice(0, 120) || null;

    if (!code) return NextResponse.json({ error: 'plan_code_required' }, { status: 400 });
    if (!isSlipUrl(slipUrl)) {
      return NextResponse.json({ error: 'payment_slip_required' }, { status: 400 });
    }

    const [settings, packages, access] = await Promise.all([
      loadCompanySettings(ctx.admin),
      loadCompanyPackages(ctx.admin),
      loadCompanyAccess(ctx.admin, ctx.company),
    ]);

    const plan = packages.find((item) => item.code === code);
    if (!plan) return NextResponse.json({ error: 'plan_not_found' }, { status: 404 });
    if (!plan.isActive) return NextResponse.json({ error: 'plan_inactive' }, { status: 409 });
    if (plan.priceUsd <= 0) {
      return NextResponse.json(
        {
          error: 'free_plan_no_payment',
          message: 'This plan is free - start it from the billing page, no payment slip is needed.',
        },
        { status: 409 },
      );
    }

    // The free trial is a signup benefit, never a paid checkout.
    if (plan.isTrial && access.status !== 'none') {
      return NextResponse.json(
        {
          error: 'trial_already_used',
          message: 'Your free trial has already been used. Choose a paid plan to continue.',
        },
        { status: 409 },
      );
    }

    // Re-uploading a slip for the same plan while it is still in checking
    // replaces the old file instead of queuing a duplicate approval.
    const { data: existing } = await ctx.admin
      .from('company_payments')
      .select('id')
      .eq('company_id', ctx.user.id)
      .eq('package_code', plan.code)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .maybeSingle();

    const nowIso = new Date().toISOString();
    const row = {
      company_id: ctx.user.id,
      company_name: ctx.company.company_name || 'Company',
      company_email: ctx.company.email || ctx.user.email || '',
      package_code: plan.code,
      package_name: plan.name,
      duration_days: plan.durationDays,
      amount: plan.priceUsd,
      payment_method: paymentMethod,
      transaction_id: transactionId,
      slip_url: slipUrl,
      status: 'pending',
      admin_notes: null,
      approved_at: null,
      applied_expiry: null,
      updated_at: nowIso,
      // Snapshot so a disapproval can restore exactly what was there before.
      previous_package_type: ctx.company.package_type ?? null,
      previous_package_expiry: ctx.company.package_expiry ?? null,
      previous_grace_expiry: ctx.company.grace_expiry ?? null,
    };

    const query = existing?.id
      ? ctx.admin.from('company_payments').update(row).eq('id', existing.id)
      : ctx.admin.from('company_payments').insert({ ...row, created_at: nowIso });

    const { data: saved, error } = await query.select('*').maybeSingle();
    if (error) throw error;

    return NextResponse.json(
      {
        success: true,
        replaced: !!existing?.id,
        payment: mapCompanyPayment(saved),
        message: PAYMENT_SUBMITTED_MESSAGE,
        graceHours: settings.graceHours,
      },
      { status: existing?.id ? 200 : 201 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'payment_submit_failed' }, { status: 500 });
  }
}
