import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient, getUserFromRequest } from '@/lib/supabase-admin';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] as string));

/**
 * Candidate applies to a job with one saved CV.
 *
 * The CV is stamped as shared and the company gets:
 *   - a row in `job_applications` (talent pool + chat list),
 *   - a chat message in `company_messages`,
 *   - an email notification.
 */
export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const jobId = String(body?.jobId || '');
    const documentId = String(body?.documentId || '');
    if (!UUID_RE.test(jobId) || !UUID_RE.test(documentId)) {
      return NextResponse.json({ error: 'job_and_cv_required' }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: job } = await admin
      .from('jobs')
      .select('id, company_id, title')
      .eq('id', jobId)
      .maybeSingle();
    if (!job) return NextResponse.json({ error: 'job_not_found' }, { status: 404 });

    const { data: company } = await admin
      .from('companies')
      .select('id, company_name, email, chat_id, is_approved')
      .eq('id', job.company_id)
      .maybeSingle();
    if (!company) return NextResponse.json({ error: 'company_not_found' }, { status: 404 });
    if (company.is_approved === false) return NextResponse.json({ error: 'company_not_approved' }, { status: 403 });

    const { data: doc } = await admin
      .from('generated_documents')
      .select('id, user_id, email, document_type, full_name, template_name, full_data')
      .eq('id', documentId)
      .maybeSingle();
    if (!doc) return NextResponse.json({ error: 'document_not_found' }, { status: 404 });
    if (doc.document_type && doc.document_type !== 'CV') {
      return NextResponse.json({ error: 'only_cv_documents' }, { status: 400 });
    }

    // Ownership: newer rows carry user_id, legacy rows only an email.
    const ownerEmail = String(doc.email || '').trim().toLowerCase();
    const myEmail = String(user.email || '').trim().toLowerCase();
    const owns = doc.user_id ? doc.user_id === user.id : !!myEmail && ownerEmail === myEmail;
    if (!owns) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const { data: profile } = await admin
      .from('user_profiles')
      .select('id, full_name, email, chat_id, consent_share_cv, is_deactivated')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.is_deactivated === true) {
      return NextResponse.json({ error: 'account_deactivated' }, { status: 403 });
    }
    // Sending a CV to a company requires the account-level sharing consent.
    if (profile?.consent_share_cv !== true) {
      return NextResponse.json({ error: 'consent_required' }, { status: 409 });
    }

    // Applying is an explicit share: stamp the owner and public flag so legacy
    // rows (user_id = null) render in the company talent pool too.
    await admin
      .from('generated_documents')
      .update({ is_public: true, user_id: doc.user_id || user.id })
      .eq('id', doc.id);

    const full = (doc.full_data as any) || {};
    const candidateName =
      String(profile?.full_name || full.fullName || doc.full_name || '').trim() || 'A candidate';
    const candidateChatId = String(profile?.chat_id || '');
    const candidateEmail = String(profile?.email || doc.email || user.email || '').trim();

    const { data: application, error: appError } = await admin
      .from('job_applications')
      .upsert(
        [
          {
            job_id: job.id,
            company_id: company.id,
            candidate_user_id: user.id,
            document_id: doc.id,
            candidate_chat_id: candidateChatId,
            candidate_email: candidateEmail,
            job_title: job.title,
            created_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'job_id,candidate_user_id' },
      )
      .select('*')
      .maybeSingle();

    if (appError) throw appError;

    // The company sees the application in its chat panel immediately.
    await admin.from('company_messages').insert([
      {
        company_id: company.id,
        candidate_user_id: user.id,
        document_id: doc.id,
        sender: 'candidate',
        body: `Applied for "${job.title}" — CV sent${candidateChatId ? ` (${candidateChatId})` : ''}.`,
      },
    ]);

    const cvLabel = String(full.jobTitle || doc.template_name || 'CV').trim();
    const companyEmail = String(company.email || '').trim();
    let emailStatus = 'skipped_no_api_key';
    const apiKey = process.env.RESEND_API_KEY;

    if (apiKey && companyEmail) {
      try {
        const resend = new Resend(apiKey);
        const result = await resend.emails.send({
          from: process.env.RESEND_FROM_TALENT || 'CVNova Talent <talent@nexifynova.co.uk>',
          to: [companyEmail],
          replyTo: candidateEmail || undefined,
          subject: `New application — ${job.title}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
              <h2 style="color:#1d4ed8;margin:0 0 4px">CVNova Talent</h2>
              <p style="color:#6b7280;font-size:12px;margin:0 0 20px">A candidate applied through your job post.</p>
              <p style="color:#374151"><b>${escapeHtml(candidateName)}</b> applied for <b>${escapeHtml(job.title)}</b> with the CV "${escapeHtml(cvLabel)}".</p>
              <div style="background:#f8fafc;border-left:4px solid #2563eb;padding:16px;border-radius:6px;margin:16px 0;color:#111827">
                <p style="margin:0 0 6px"><b>Candidate chat ID:</b> ${escapeHtml(candidateChatId || 'pending')}</p>
                <p style="margin:0"><b>Your company chat ID:</b> ${escapeHtml(company.chat_id || 'pending')}</p>
              </div>
              <p style="color:#374151">The CV is in your talent pool and the application is waiting in your company chat. Reply there to start the conversation.</p>
              <a href="${new URL(req.url).origin}/company/dashboard" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Open company dashboard</a>
              <p style="color:#9ca3af;font-size:11px;margin-top:28px">You are receiving this because this candidate applied to a role you published on CVNova.</p>
            </div>`,
        });
        emailStatus = (result as any)?.error ? 'failed' : 'sent';
      } catch {
        emailStatus = 'failed';
      }
    }

    if (application?.id) {
      await admin.from('job_applications').update({ email_status: emailStatus }).eq('id', application.id);
    }

    return NextResponse.json({
      success: true,
      emailStatus,
      application: application ? { ...application, email_status: emailStatus } : null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'apply_failed' }, { status: 500 });
  }
}
