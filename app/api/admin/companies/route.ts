import { NextResponse } from 'next/server';
import { createAdminClient, isAdminCookie } from '@/lib/supabase-admin';
import {
  computeCompanyAccess,
  loadCompanyPackages,
  loadCompanySettings,
} from '@/lib/company-access';

/**
 * Phase 5 - admin control over company accounts.
 *
 * GET    lists every company with its current package, computed access state,
 *        roster size and open slip count.
 * PATCH  sets the package/expiry by hand (including a +N days extension) and
 *        toggles approval / disable without touching any data.
 * DELETE hard-deletes the company. `companies.id` is referenced with
 *        ON DELETE CASCADE by jobs, job_applications, company_messages,
 *        company_outreach and company_employees, so the response reports how
 *        many rows were removed. Employee CVNova accounts survive (they are
 *        separate auth users, not owned by the company).
 *
 * Auth is the httpOnly `admin_session` cookie; every query uses the service
 * role because the companies table is not client-writable.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

const COMPANY_SELECT =
  'id, company_name, contact_name, email, website, industry, country, created_at, package_type, package_expiry, grace_expiry, is_approved, is_disabled';

/** "2026-12-01" -> end of that UTC day; full ISO strings are kept as-is. */
function parseAdminDate(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const date = new Date(`${raw}T23:59:59.000Z`);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export async function GET(req: Request) {
  if (!isAdminCookie(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const [settings, packages, { data: rows, error }, { data: employees }, { data: openPayments }] =
      await Promise.all([
        loadCompanySettings(admin),
        loadCompanyPackages(admin, { includeInactive: true }),
        admin.from('companies').select(COMPANY_SELECT).order('created_at', { ascending: false }).limit(1000),
        admin.from('company_employees').select('company_id').limit(20000),
        admin.from('company_payments').select('company_id, status').eq('status', 'pending').limit(20000),
      ]);

    if (error) throw error;

    const employeeCounts = new Map<string, number>();
    for (const row of employees || []) {
      const id = String((row as any).company_id || '');
      if (!id) continue;
      employeeCounts.set(id, (employeeCounts.get(id) || 0) + 1);
    }

    const pendingCounts = new Map<string, number>();
    for (const row of openPayments || []) {
      const id = String((row as any).company_id || '');
      if (!id) continue;
      pendingCounts.set(id, (pendingCounts.get(id) || 0) + 1);
    }

    const companies = (rows || []).map((company: any) => {
      const access = computeCompanyAccess(company, settings);
      return {
        id: String(company.id),
        name: String(company.company_name || 'Company'),
        contactName: String(company.contact_name || ''),
        email: String(company.email || ''),
        website: String(company.website || ''),
        industry: String(company.industry || ''),
        country: String(company.country || ''),
        createdAt: company.created_at ? String(company.created_at) : '',
        isApproved: company.is_approved !== false,
        isDisabled: company.is_disabled === true,
        packageType: String(company.package_type || ''),
        packageExpiry: company.package_expiry ? String(company.package_expiry) : null,
        graceExpiry: company.grace_expiry ? String(company.grace_expiry) : null,
        status: access.status,
        daysLeft: access.daysLeft,
        graceHoursLeft: access.graceHoursLeft,
        employeeCount: employeeCounts.get(String(company.id)) || 0,
        pendingPayments: pendingCounts.get(String(company.id)) || 0,
      };
    });

    return NextResponse.json({ companies, packages, settings });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'companies_load_failed' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!isAdminCookie(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({} as any));
    const id = String(body?.id || '').trim();
    if (!UUID_RE.test(id)) return NextResponse.json({ error: 'company_id_required' }, { status: 400 });

    const admin = createAdminClient();
    const { data: company, error: fetchError } = await admin
      .from('companies')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!company) return NextResponse.json({ error: 'company_not_found' }, { status: 404 });

    const settings = await loadCompanySettings(admin);
    const patch: Record<string, unknown> = {};

    if (body?.isApproved !== undefined) patch.is_approved = body.isApproved === true;
    if (body?.isDisabled !== undefined) patch.is_disabled = body.isDisabled === true;

    if (body?.packageType !== undefined) {
      const code = String(body.packageType || '').trim();
      if (code) {
        const packages = await loadCompanyPackages(admin, { includeInactive: true });
        if (!packages.some((plan) => plan.code === code)) {
          return NextResponse.json({ error: 'invalid_package_type' }, { status: 400 });
        }
        patch.package_type = code;
      } else {
        patch.package_type = null;
      }
    }

    // +N days extends from the current expiry when it is still in the future,
    // so an admin can top up a plan without losing paid days.
    if (body?.addDays !== undefined && body?.addDays !== null && body?.addDays !== '') {
      const days = Math.round(Number(body.addDays));
      if (!Number.isFinite(days) || days === 0 || Math.abs(days) > 3650) {
        return NextResponse.json({ error: 'invalid_add_days' }, { status: 400 });
      }
      const currentMs = company.package_expiry ? Date.parse(company.package_expiry) : Number.NaN;
      const baseMs = Number.isFinite(currentMs) && currentMs > Date.now() ? currentMs : Date.now();
      patch.package_expiry = new Date(baseMs + days * DAY_MS).toISOString();
    } else if (body?.packageExpiry !== undefined) {
      const parsed = parseAdminDate(body.packageExpiry);
      if (parsed === undefined) {
        return NextResponse.json({ error: 'invalid_package_expiry' }, { status: 400 });
      }
      patch.package_expiry = parsed;
    }

    if (body?.graceExpiry !== undefined) {
      const parsed = parseAdminDate(body.graceExpiry);
      if (parsed === undefined) {
        return NextResponse.json({ error: 'invalid_grace_expiry' }, { status: 400 });
      }
      patch.grace_expiry = parsed;
    } else if (patch.package_expiry !== undefined) {
      // Keep the grace window aligned unless the admin set it explicitly.
      patch.grace_expiry = patch.package_expiry
        ? new Date(Date.parse(String(patch.package_expiry)) + settings.graceHours * HOUR_MS).toISOString()
        : null;
    }

    if (!Object.keys(patch).length) {
      return NextResponse.json({ error: 'no_changes' }, { status: 400 });
    }

    const { data: updated, error } = await admin
      .from('companies')
      .update(patch)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw error;
    if (!updated) return NextResponse.json({ error: 'company_not_found' }, { status: 404 });

    const access = computeCompanyAccess(updated, settings);
    return NextResponse.json({
      success: true,
      company: {
        id,
        packageType: String(updated.package_type || ''),
        packageExpiry: updated.package_expiry ? String(updated.package_expiry) : null,
        graceExpiry: updated.grace_expiry ? String(updated.grace_expiry) : null,
        isApproved: updated.is_approved !== false,
        isDisabled: updated.is_disabled === true,
        status: access.status,
        daysLeft: access.daysLeft,
        graceHoursLeft: access.graceHoursLeft,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'company_update_failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!isAdminCookie(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({} as any));
    const id = String(url.searchParams.get('id') || body?.id || '').trim();
    if (!UUID_RE.test(id)) return NextResponse.json({ error: 'company_id_required' }, { status: 400 });

    const admin = createAdminClient();
    const { data: company } = await admin
      .from('companies')
      .select('id, company_name, email')
      .eq('id', id)
      .maybeSingle();

    if (!company) return NextResponse.json({ error: 'company_not_found' }, { status: 404 });

    // Report what the cascade removes so the admin sees the impact afterwards.
    const cascaded: Record<string, number> = {};
    for (const table of [
      'jobs',
      'job_applications',
      'company_messages',
      'company_outreach',
      'company_employees',
      'company_payments',
    ]) {
      const { count } = await admin.from(table).select('*', { count: 'exact', head: true }).eq('company_id', id);
      cascaded[table] = count || 0;
    }

    const { error } = await admin.from('companies').delete().eq('id', id);
    if (error) throw error;

    // The login is removed last: companies.id references auth.users, so the row
    // has to go first. A failure here leaves an orphan login, never lost data.
    try {
      await admin.auth.admin.deleteUser(id);
    } catch {
      /* best effort */
    }

    return NextResponse.json({
      success: true,
      deleted: {
        id,
        name: String((company as any).company_name || 'Company'),
        email: String((company as any).email || ''),
      },
      cascaded,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'company_delete_failed' }, { status: 500 });
  }
}

