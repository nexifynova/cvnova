import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { loadCompanyPackages } from '@/lib/company-access';
import { buildPublicPricing } from '@/lib/public-pricing';

/**
 * Phase 4 - public pricing feed for /pricing.
 *
 * Individual plans come from app_settings (Admin -> Settings) and company plans
 * from company_packages (Admin -> Company Pricing). Both tables are not readable
 * by anonymous visitors, so this route reads them with the service role and
 * returns only the price/plan fields the marketing page needs.
 */
export async function GET() {
  try {
    const admin = createAdminClient();

    const [{ data: settings }, packages] = await Promise.all([
      admin
        .from('app_settings')
        .select(
          'package_3m_price, package_6m_price, package_1y_price, package_5y_price, cvs_3m, cvs_6m, cvs_1y, cvs_5y, trial_months, free_cv_limit, reactivation_price, additional_cv_price, cvs_per_price, skrill_enabled, payoneer_enabled, easy_paisa_enabled, binance_enabled, bank_enabled',
        )
        .eq('id', 1)
        .maybeSingle(),
      loadCompanyPackages(admin),
    ]);

    return NextResponse.json(buildPublicPricing(settings, packages));
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : 'pricing_load_failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
