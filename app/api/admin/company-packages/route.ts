import { NextResponse } from 'next/server';
import { createAdminClient, isAdminCookie } from '@/lib/supabase-admin';
import { loadCompanyPackages, loadCompanySettings } from '@/lib/company-access';

/**
 * Admin pricing & settings for company packages.
 *
 * GET   -> catalogue (incl. inactive plans) + trial/grace settings
 * PATCH -> update plan price/duration/name/visibility and the trial/grace rules
 *
 * Admin panel auth is the httpOnly `admin_session` cookie, so every mutation
 * runs through the service role and never trusts the browser.
 */

const MAX_PRICE_USD = 10000;
const MAX_DURATION_DAYS = 3650;
const MAX_TRIAL_DAYS = 365;
const MAX_GRACE_HOURS = 720;

function clampInt(value: unknown, min: number, max: number): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const rounded = Math.round(parsed);
  if (rounded < min || rounded > max) return null;
  return rounded;
}

async function snapshot(admin: ReturnType<typeof createAdminClient>) {
  const [settings, packages] = await Promise.all([
    loadCompanySettings(admin),
    loadCompanyPackages(admin, { includeInactive: true }),
  ]);
  return { settings, packages };
}

export async function GET(req: Request) {
  if (!isAdminCookie(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    return NextResponse.json(await snapshot(createAdminClient()));
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'packages_load_failed' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!isAdminCookie(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const admin = createAdminClient();

    const settingsPatch: Record<string, unknown> = {};
    const incomingSettings = body?.settings;

    if (incomingSettings && typeof incomingSettings === 'object') {
      if (incomingSettings.trialDays !== undefined) {
        const trialDays = clampInt(incomingSettings.trialDays, 1, MAX_TRIAL_DAYS);
        if (trialDays === null) {
          return NextResponse.json({ error: 'invalid_trial_days' }, { status: 400 });
        }
        settingsPatch.trial_days = trialDays;
      }

      if (incomingSettings.graceHours !== undefined) {
        const graceHours = clampInt(incomingSettings.graceHours, 0, MAX_GRACE_HOURS);
        if (graceHours === null) {
          return NextResponse.json({ error: 'invalid_grace_hours' }, { status: 400 });
        }
        settingsPatch.grace_hours = graceHours;
      }

      if (incomingSettings.graceEnabled !== undefined) {
        settingsPatch.grace_enabled = incomingSettings.graceEnabled === true;
      }
    }

    const packageRows: any[] = Array.isArray(body?.packages) ? body.packages : [];
    const { data: existingRows } = await admin.from('company_packages').select('code');
    const knownCodes = new Set((existingRows || []).map((row: any) => String(row.code)));

    const packagePatches: { code: string; patch: Record<string, unknown> }[] = [];

    for (const row of packageRows) {
      const code = String(row?.code || '').trim();
      if (!code || !knownCodes.has(code)) continue;

      const patch: Record<string, unknown> = {};

      if (row?.name !== undefined) {
        const name = String(row.name || '').trim();
        if (!name) return NextResponse.json({ error: 'invalid_package_name', code }, { status: 400 });
        patch.name = name.slice(0, 60);
      }

      if (row?.priceUsd !== undefined) {
        const price = Number(row.priceUsd);
        if (!Number.isFinite(price) || price < 0 || price > MAX_PRICE_USD) {
          return NextResponse.json({ error: 'invalid_package_price', code }, { status: 400 });
        }
        patch.price_usd = Math.round(price * 100) / 100;
      }

      if (row?.durationDays !== undefined) {
        const durationDays = clampInt(row.durationDays, 1, MAX_DURATION_DAYS);
        if (durationDays === null) {
          return NextResponse.json({ error: 'invalid_package_duration', code }, { status: 400 });
        }
        patch.duration_days = durationDays;
      }

      if (row?.isActive !== undefined) {
        patch.is_active = row.isActive === true;
      }

      if (Object.keys(patch).length) packagePatches.push({ code, patch });
    }

    if (!Object.keys(settingsPatch).length && !packagePatches.length) {
      return NextResponse.json({ error: 'no_changes' }, { status: 400 });
    }

    if (Object.keys(settingsPatch).length) {
      const { error } = await admin.from('company_settings').update(settingsPatch).eq('id', 1);
      if (error) throw error;

      // Grace length changed -> move every company's grace_end so the new rule
      // applies immediately, not only to companies registered from now on.
      if (settingsPatch.grace_hours !== undefined) {
        const { error: syncError } = await admin.rpc('sync_company_grace_expiry');
        if (syncError) throw syncError;
      }
    }

    for (const entry of packagePatches) {
      const { error } = await admin.from('company_packages').update(entry.patch).eq('code', entry.code);
      if (error) throw error;
    }

    return NextResponse.json({ success: true, ...(await snapshot(admin)) });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'packages_save_failed' }, { status: 500 });
  }
}
