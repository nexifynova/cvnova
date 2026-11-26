import { NextResponse } from 'next/server';
import { resolveCompany } from '@/lib/company-server';
import {
  computeCompanyAccess,
  loadCompanyPackages,
  loadCompanySettings,
  planWindowFrom,
} from '@/lib/company-access';

/**
 * Phase 3 - instant plan activation from /company/billing.
 *
 * The catalogue (price, duration, active flag) is read with the service role,
 * so the browser can only send a plan *code*: it can never invent a duration,
 * a price or an expiry. Renewing the plan the company is already on extends the
 * current expiry; buying a different plan (or any plan after expiry) starts
 * today. The package columns stay writable by the service role only, which is
 * what the Phase 2 guard trigger enforces.
 *
 * Phase 5 - paid plans now go through /company/checkout + admin approval; this
 * route stays as the instant path for the free trial only.
 */

export async function POST(req: Request) {
  const ctx = await resolveCompany(req);
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  try {
    const body = await req.json().catch(() => ({} as any));
    const code = String(body?.code || '').trim();
    if (!code) return NextResponse.json({ error: 'plan_code_required' }, { status: 400 });

    const [settings, packages] = await Promise.all([
      loadCompanySettings(ctx.admin),
      loadCompanyPackages(ctx.admin),
    ]);

    const plan = packages.find((item) => item.code === code);
    if (!plan) return NextResponse.json({ error: 'plan_not_found' }, { status: 404 });
    if (!plan.isActive) {
      return NextResponse.json({ error: 'plan_inactive' }, { status: 409 });
    }

    const access = computeCompanyAccess(ctx.company, settings);

    // The free plan is the signup trial: it cannot be "re-bought" forever.
    if (plan.isTrial && access.status !== 'none') {
      return NextResponse.json(
        {
          error: 'trial_already_used',
          message: 'Your free trial has already been used. Choose a paid plan to continue.',
        },
        { status: 409 },
      );
    }

    const now = new Date();
    const window = planWindowFrom(access, plan, settings.graceHours, now);

    const { data: updated, error } = await ctx.admin
      .from('companies')
      .update({
        package_type: plan.code,
        package_expiry: window.packageExpiry,
        grace_expiry: window.graceExpiry,
      })
      .eq('id', ctx.user.id)
      .select('*')
      .maybeSingle();

    if (error) throw error;
    if (!updated) return NextResponse.json({ error: 'company_profile_missing' }, { status: 404 });

    return NextResponse.json({
      success: true,
      package: plan,
      renewed: window.renewed,
      access: computeCompanyAccess(updated, settings),
      activatedAt: now.toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'package_purchase_failed' }, { status: 500 });
  }
}
