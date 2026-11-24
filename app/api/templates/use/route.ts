import { NextResponse } from 'next/server';
import { createAdminClient, getUserFromRequest } from '@/lib/supabase-admin';
import { getAtsQuota, getPlanState } from '@/lib/account-status';
import { getTemplate, isBlueAtsTemplate, isPremiumTemplate } from '@/lib/templates';


/**
 * Single gate for everything that costs money or is limited:
 *  - premium template access
 *  - 3 free Blue ATS uses
 *  - trial expiry
 * Called by the builder before saving/printing a document.
 */
export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ allowed: false, reason: 'not_logged_in' }, { status: 401 });

  try {
    const { templateId, consume } = await req.json();
    const meta = getTemplate(templateId);
    const admin = createAdminClient();

    const [{ data: profile }, { data: settings }] = await Promise.all([
      admin.from('user_profiles').select('*').eq('id', user.id).maybeSingle(),
      admin.from('app_settings').select('free_blue_ats_limit, reactivation_price').eq('id', 1).maybeSingle(),
    ]);

    if (!profile) {
      return NextResponse.json({ allowed: false, reason: 'profile_missing' }, { status: 404 });
    }

    const limit = Number(settings?.free_blue_ats_limit) || 3;
    const plan = getPlanState(profile, new Date());
    const quota = getAtsQuota(profile, limit);

    if (plan.isLocked) {
      return NextResponse.json(
        { allowed: false, reason: 'trial_expired', reactivationPrice: Number(settings?.reactivation_price) || 2 },
        { status: 402 },
      );
    }

    if (isPremiumTemplate(meta.id) && !plan.isPaid) {
      return NextResponse.json(
        { allowed: false, reason: 'template_locked', template: meta.id, tier: meta.tier, ats: meta.ats },
        { status: 402 },
      );
    }

    const usesBlueAts = isBlueAtsTemplate(meta.id);
    if (usesBlueAts && quota.exhausted) {
      return NextResponse.json(
        { allowed: false, reason: 'ats_limit', used: quota.used, limit: quota.limit, ats: meta.ats },
        { status: 402 },
      );
    }

    let used = quota.used;
    if (consume !== false && usesBlueAts && !quota.unlimited) {
      used = quota.used + 1;
      const { error } = await admin.from('user_profiles').update({ blue_ats_used: used }).eq('id', user.id);
      if (error) throw error;
    }

    return NextResponse.json({
      allowed: true,
      template: meta.id,
      tier: meta.tier,
      ats: meta.ats,
      atsUsed: used,
      atsLimit: quota.limit,
      unlimited: quota.unlimited,
    });
  } catch (error: any) {
    return NextResponse.json({ allowed: false, reason: 'gate_failed', error: error?.message }, { status: 500 });
  }
}
