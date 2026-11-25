import { NextResponse } from 'next/server';
import { resolveCompany } from '@/lib/company-server';
import { computeCompanyAccess, loadCompanyPackages, loadCompanySettings } from '@/lib/company-access';

/**
 * Plan snapshot for the signed-in company: status (active / grace / expired),
 * remaining days or grace hours, the pricing catalogue and the configured
 * trial/grace rules. The dashboard banner, grace popup and plans modal all read
 * from this single endpoint.
 */
export async function GET(req: Request) {
  const ctx = await resolveCompany(req);
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  try {
    const [settings, packages] = await Promise.all([
      loadCompanySettings(ctx.admin),
      loadCompanyPackages(ctx.admin),
    ]);
    const access = computeCompanyAccess(ctx.company, settings);

    return NextResponse.json({
      access,
      packages,
      settings,
      company: {
        id: ctx.company.id,
        name: ctx.company.company_name,
        packageType: access.packageType,
        packageExpiry: access.packageExpiry,
        graceExpiry: access.graceExpiry,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'company_access_failed' }, { status: 500 });
  }
}
