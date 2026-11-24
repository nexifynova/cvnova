import { NextResponse } from 'next/server';
import { createAdminClient, getUserFromRequest } from '@/lib/supabase-admin';
import { getAtsQuota, getConsent, getPlanState } from '@/lib/account-status';


export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const admin = createAdminClient();
    const [{ data: profile }, { data: settings }] = await Promise.all([
      admin.from('user_profiles').select('*').eq('id', user.id).maybeSingle(),
      admin.from('app_settings').select('*').eq('id', 1).maybeSingle(),
    ]);

    if (!profile) {
      return NextResponse.json({ error: 'profile_missing' }, { status: 404 });
    }

    // Signup consent lives in auth metadata until a profile row exists (email
    // confirmation can land before the profile trigger runs). Mirror it once so
    // an opt-in chosen on the signup form is never silently lost.
    const meta = (user.user_metadata || {}) as Record<string, any>;
    const metaPatch: Record<string, unknown> = {};
    if (meta.consent_share_cv === true && profile.consent_share_cv !== true) {
      metaPatch.consent_share_cv = true;
      metaPatch.consent_updated_at = new Date().toISOString();
      metaPatch.consent_version = String(meta.consent_version || 'v1');
    }
    if (meta.consent_company_contact === true && profile.consent_company_contact !== true) {
      metaPatch.consent_company_contact = true;
      metaPatch.consent_updated_at = new Date().toISOString();
      metaPatch.consent_version = String(meta.consent_version || 'v1');
    }
    if (meta.consent_marketing === true && profile.consent_marketing !== true) {
      metaPatch.consent_marketing = true;
      metaPatch.consent_updated_at = new Date().toISOString();
      metaPatch.consent_version = String(meta.consent_version || 'v1');
    }
    if (Object.keys(metaPatch).length > 0) {
      const { data: synced } = await admin
        .from('user_profiles')
        .update(metaPatch)
        .eq('id', user.id)
        .select('*')
        .maybeSingle();
      if (synced) Object.assign(profile, synced);
    }

    const trialMonths = Number(settings?.trial_months) || 2;
    const freeBlueAtsLimit = Number(settings?.free_blue_ats_limit) || 3;
    const plan = getPlanState(profile, new Date());
    const consent = getConsent(profile);
    const ats = getAtsQuota(profile, freeBlueAtsLimit);

    return NextResponse.json({
      plan: { ...plan, trialEnd: plan.trialEnd.toISOString() },
      consent,
      ats,
      profile: {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        subscription_type: profile.subscription_type,
        subscription_expiry: profile.subscription_expiry,
        free_cv_count: profile.free_cv_count,
        total_allowed_cvs: profile.total_allowed_cvs,
      },
      limits: {
        trialMonths,
        freeBlueAtsLimit,
        reactivationPrice: Number(settings?.reactivation_price) || 2,
        freeCvLimit: Number(settings?.free_cv_limit) || 1,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'status_failed' }, { status: 500 });
  }
}
