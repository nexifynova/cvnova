import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveCompany } from '@/lib/company-server';
import { loadCompanyAccess } from '@/lib/company-access';
import {
  EMAIL_RE,
  EMPLOYEE_CREATE_LOCKED_MESSAGE,
  employeeFieldCounts,
  mapCompanyEmployee,
} from '@/lib/company-employees';

/**
 * Phase 3 - "Our Employees CVs" (B2B).
 *
 * GET  lists the signed-in company's roster with field counts for the filter.
 * POST registers an employee: it creates a *normal* CVNova account (the
 *      existing handle_new_user() trigger builds the candidate profile, chat ID
 *      and 2-month trial), emails a temporary password plus a verification
 *      link, and stores the company-side row (EMP-0001, joining date, field).
 *
 * Both handlers run with the service role, so RLS on company_employees stays
 * closed: no browser session can read another company's staff list.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cvnova-one.vercel.app';
const MAIL_FROM = 'CVNova <support@nexifynova.co.uk>';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type AdminClient = SupabaseClient;

/** Mixed-case + digit password that satisfies the default Supabase policy. */
function generateTemporaryPassword(length = 10): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  let body = '';
  for (let i = 0; i < length; i += 1) body += alphabet[bytes[i] % alphabet.length];
  // Prefix/suffix guarantee upper, lower and digit even if the random part misses one.
  return `Nv${body}7`;
}

async function findProfileIdByEmail(admin: AdminClient, email: string): Promise<string | null> {
  const { data } = await admin
    .from('user_profiles')
    .select('id, email')
    .ilike('email', email)
    .maybeSingle();
  return (data as { id?: string } | null)?.id ?? null;
}

/** Re-sends the Supabase signup confirmation; never fails the whole request. */
async function sendVerificationEmail(admin: AdminClient, email: string): Promise<string> {
  try {
    const { error } = await admin.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${SITE_URL}/auth/confirm` },
    });
    return error ? `failed: ${error.message}` : 'sent';
  } catch (err: any) {
    return `failed: ${err?.message || 'unknown_error'}`;
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] as string,
  );
}

function buildWelcomeHtml(params: {
  companyName: string;
  empId: string;
  email: string;
  password: string;
  appliedField: string;
  joinedOn: string;
}): string {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111827">
      <h2 style="margin:0 0 8px">Your CVNova employee account is ready</h2>
      <p style="margin:0 0 16px;color:#4b5563">
        ${escapeHtml(params.companyName)} created a CVNova account for you. Use the details below to sign in,
        build your CV and appear in the company talent pool.
      </p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px">
        <tr><td style="padding:10px 14px;color:#6b7280;font-size:12px">Employee ID</td><td style="padding:10px 14px;font-weight:bold">${escapeHtml(params.empId)}</td></tr>
        <tr><td style="padding:10px 14px;color:#6b7280;font-size:12px">Login email</td><td style="padding:10px 14px;font-weight:bold">${escapeHtml(params.email)}</td></tr>
        <tr><td style="padding:10px 14px;color:#6b7280;font-size:12px">Temporary password</td><td style="padding:10px 14px;font-family:monospace;font-weight:bold">${escapeHtml(params.password)}</td></tr>
        <tr><td style="padding:10px 14px;color:#6b7280;font-size:12px">Applied field</td><td style="padding:10px 14px">${escapeHtml(params.appliedField || '-')}</td></tr>
        <tr><td style="padding:10px 14px;color:#6b7280;font-size:12px">Joining date</td><td style="padding:10px 14px">${escapeHtml(params.joinedOn || '-')}</td></tr>
      </table>
      <p style="margin:16px 0 8px;color:#4b5563;font-size:13px">
        Confirm your email address first (a separate verification email is on its way), then sign in and
        change this password from your dashboard.
      </p>
      <a href="${SITE_URL}/login" style="display:inline-block;background:#2563eb;color:#fff;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:bold">
        Sign in to CVNova
      </a>
      <p style="color:#9ca3af;font-size:11px;margin-top:26px">
        You are receiving this because ${escapeHtml(params.companyName)} added you to their CVNova employee list.
      </p>
    </div>
  `;
}

async function sendWelcomeEmail(params: {
  to: string;
  companyName: string;
  empId: string;
  password: string;
  appliedField: string;
  joinedOn: string;
}): Promise<'sent' | 'skipped' | 'failed'> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return 'skipped';
  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: MAIL_FROM,
      to: [params.to],
      replyTo: 'support@nexifynova.co.uk',
      subject: `Your ${params.companyName} employee account on CVNova`,
      html: buildWelcomeHtml({
        companyName: params.companyName,
        empId: params.empId,
        email: params.to,
        password: params.password,
        appliedField: params.appliedField,
        joinedOn: params.joinedOn,
      }),
    });
    return error ? 'failed' : 'sent';
  } catch {
    return 'failed';
  }
}

export async function GET(req: Request) {
  const ctx = await resolveCompany(req);
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  try {
    const url = new URL(req.url);
    const field = (url.searchParams.get('field') || '').trim();
    const search = (url.searchParams.get('q') || '').trim().toLowerCase();

    const [access, { data, error }] = await Promise.all([
      loadCompanyAccess(ctx.admin, ctx.company),
      ctx.admin
        .from('company_employees')
        .select(
          'id, emp_id, full_name, email, contact, applied_field, job_field_id, joined_on, employee_user_id, invite_sent_at, created_at',
        )
        .eq('company_id', ctx.user.id)
        .order('joined_on', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1000),
    ]);

    if (error) throw error;

    const all = (data || []).map(mapCompanyEmployee);
    const fields = employeeFieldCounts(all);

    const employees = all.filter((employee) => {
      if (field && employee.appliedField !== field) return false;
      if (!search) return true;
      const haystack = [employee.empId, employee.fullName, employee.email, employee.contact, employee.appliedField]
        .join(' ')
        .toLowerCase();
      return haystack.includes(search);
    });

    return NextResponse.json({
      employees,
      fields,
      total: all.length,
      shown: employees.length,
      access,
      company: { name: ctx.company.company_name || 'Company' },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'employee_list_failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const ctx = await resolveCompany(req);
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const admin = ctx.admin;
  let createdUserId: string | null = null;

  try {
    // Expired package (and the closed grace window) = read-only, so new
    // employee CVs can only be created while a plan is live.
    const access = await loadCompanyAccess(admin, ctx.company);
    if (access.readOnly) {
      return NextResponse.json(
        { error: 'package_expired', message: EMPLOYEE_CREATE_LOCKED_MESSAGE },
        { status: 402 },
      );
    }

    const body = await req.json().catch(() => ({} as any));
    const fullName = String(body?.fullName || '').trim().slice(0, 120);
    const email = String(body?.email || '').trim().toLowerCase().slice(0, 160);
    const contact = String(body?.contact || '').trim().slice(0, 60) || null;
    const appliedFieldInput = String(body?.appliedField || '').trim().slice(0, 80);
    const rawFieldId = String(body?.jobFieldId || '').trim();
    const joinedOn = String(body?.joinedOn || '').trim();

    if (fullName.length < 2) {
      return NextResponse.json({ error: 'employee_name_required' }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'employee_email_invalid' }, { status: 400 });
    }
    if (joinedOn && (!DATE_RE.test(joinedOn) || Number.isNaN(Date.parse(joinedOn)))) {
      return NextResponse.json({ error: 'invalid_joining_date' }, { status: 400 });
    }

    // Optional job field id: resolves the display name for the roster filter.
    let jobFieldId: string | null = null;
    let appliedField = appliedFieldInput;
    if (rawFieldId && UUID_RE.test(rawFieldId)) {
      const { data: fieldRow } = await admin
        .from('job_fields')
        .select('id, field_name')
        .eq('id', rawFieldId)
        .maybeSingle();
      if (fieldRow) {
        jobFieldId = String((fieldRow as any).id);
        if (!appliedField) appliedField = String((fieldRow as any).field_name || '').trim();
      }
    }

    const { data: existingRow } = await admin
      .from('company_employees')
      .select('id')
      .eq('company_id', ctx.user.id)
      .ilike('email', email)
      .maybeSingle();
    if (existingRow) {
      return NextResponse.json(
        { error: 'employee_exists', message: 'This employee is already on your list.' },
        { status: 409 },
      );
    }

    // A person who already has a CVNova account keeps it: we only link the
    // roster row, so their CVs, chats and profile stay untouched.
    let employeeUserId = await findProfileIdByEmail(admin, email);
    let temporaryPassword: string | null = null;
    let verificationEmail = 'not_needed';

    if (!employeeUserId) {
      temporaryPassword = generateTemporaryPassword();
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: false,
        user_metadata: {
          full_name: fullName,
          role: 'user',
          company_name: ctx.company.company_name || undefined,
          company_id: ctx.user.id,
          employee_of: ctx.company.company_name || undefined,
        },
      });

      if (createError || !created?.user) {
        const alreadyLinked = await findProfileIdByEmail(admin, email);
        if (!alreadyLinked) {
          return NextResponse.json(
            {
              error: 'employee_account_failed',
              message: createError?.message || 'Could not create the employee account.',
            },
            { status: 502 },
          );
        }
        employeeUserId = alreadyLinked;
        temporaryPassword = null;
      } else {
        createdUserId = created.user.id;
        employeeUserId = created.user.id;
        verificationEmail = await sendVerificationEmail(admin, email);
      }
    }

    // EMP-0001 per company. The unique index is the final guard, so a rare
    // concurrent create simply retries with the next number.
    let inserted: any = null;
    let empId = '';
    let lastError: any = null;
    for (let attempt = 0; attempt < 3 && !inserted; attempt += 1) {
      const { data: nextId } = await admin.rpc('next_company_emp_id', { p_company: ctx.user.id });
      empId = String(nextId || '').trim();
      if (!empId) break;

      const { data: row, error } = await admin
        .from('company_employees')
        .insert({
          company_id: ctx.user.id,
          employee_user_id: employeeUserId,
          emp_id: empId,
          full_name: fullName,
          email,
          contact,
          applied_field: appliedField || null,
          job_field_id: jobFieldId,
          joined_on: joinedOn || new Date().toISOString().slice(0, 10),
        })
        .select('*')
        .maybeSingle();

      if (!error) {
        inserted = row;
        break;
      }

      lastError = error;
      if (
        error.code === '23505' &&
        String(error.message || '').includes('company_employees_company_email_key')
      ) {
        // Lost a race with another create: drop the account we just made.
        if (createdUserId) {
          try {
            await admin.auth.admin.deleteUser(createdUserId);
          } catch {
            /* best effort cleanup */
          }
        }
        return NextResponse.json(
          { error: 'employee_exists', message: 'This employee is already on your list.' },
          { status: 409 },
        );
      }
      if (error.code !== '23505') break;
    }

    if (!inserted) {
      throw lastError || new Error('employee_insert_failed');
    }

    const welcomeEmail = temporaryPassword
      ? await sendWelcomeEmail({
          to: email,
          companyName: ctx.company.company_name || 'Your company',
          empId,
          password: temporaryPassword,
          appliedField,
          joinedOn: joinedOn || String(inserted.joined_on || ''),
        })
      : 'not_needed';

    if (welcomeEmail === 'sent' || verificationEmail === 'sent') {
      const { data: touched } = await admin
        .from('company_employees')
        .update({ invite_sent_at: new Date().toISOString() })
        .eq('id', inserted.id)
        .select('*')
        .maybeSingle();
      if (touched) inserted = touched;
    }

    return NextResponse.json(
      {
        success: true,
        employee: mapCompanyEmployee(inserted),
        credentials: {
          email,
          temporaryPassword,
          linkedExistingAccount: !temporaryPassword,
          verificationEmail,
          welcomeEmail,
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    // Never leave an orphan auth user behind if the roster row failed.
    if (createdUserId) {
      try {
        await admin.auth.admin.deleteUser(createdUserId);
      } catch {
        /* best effort cleanup */
      }
    }
    return NextResponse.json({ error: error?.message || 'employee_create_failed' }, { status: 500 });
  }
}
