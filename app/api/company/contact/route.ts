import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { assertExposable, loadCandidateProfile, resolveCompany } from '@/lib/company-server';
import { getConsent } from '@/lib/account-status';


const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] as string));

export async function POST(req: Request) {
  const ctx = await resolveCompany(req);
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  try {
    const { documentId, subject, message, alsoChat = true } = await req.json();
    if (!documentId || !message) {
      return NextResponse.json({ error: 'documentId_and_message_required' }, { status: 400 });
    }

    const { data: doc } = await ctx.admin.from('generated_documents').select('*').eq('id', documentId).maybeSingle();
    if (!doc) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const profile = await loadCandidateProfile(ctx.admin, doc);
    if (!assertExposable(profile, doc)) {
      return NextResponse.json({ error: 'consent_not_granted' }, { status: 403 });
    }

    const consent = getConsent(profile);
    const candidateEmail = String((doc.full_data as any)?.email || (profile as any)?.email || '').trim();
    const candidateUserId = doc.user_id || (profile as any)?.id || null;

    if (!consent.allowContact || !candidateEmail) {
      return NextResponse.json(
        { error: 'contact_consent_required', message: 'This candidate allowed CV viewing but not company contact.' },
        { status: 403 },
      );
    }

    const safeCompany = escapeHtml(ctx.company.company_name);
    const safeSubject = escapeHtml(subject || `Opportunity at ${ctx.company.company_name}`);
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br/>');
    const viewLink = `${new URL(req.url).origin}/track-document`;

    let emailStatus = 'sent';
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      emailStatus = 'skipped_no_api_key';
    } else {
      try {
        const resend = new Resend(apiKey);
        const result = await resend.emails.send({
          // Official CVNova domain sender (configure SPF + DKIM for nexifynova.co.uk in Resend).
          from: process.env.RESEND_FROM_TALENT || 'CVNova Talent <talent@nexifynova.co.uk>',
          to: [candidateEmail],
          replyTo: ctx.company.email,
          subject: `${safeSubject} â€” via CVNova`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
              <h2 style="color:#1d4ed8;margin:0 0 4px">CVNova Talent</h2>
              <p style="color:#6b7280;font-size:12px;margin:0 0 20px">A message from ${safeCompany} sent through the CVNova company portal.</p>
              <p style="color:#374151"><b>${safeCompany}</b> reviewed the CV you chose to share and sent you a message:</p>
              <div style="background:#f8fafc;border-left:4px solid #2563eb;padding:16px;border-radius:6px;margin:16px 0;color:#111827">${safeMessage}</div>
              <p style="color:#374151">You can reply privately from your CVNova dashboard. Your contact details stay hidden from companies unless you turn on company contact.</p>
              <a href="${viewLink}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Open CVNova</a>
              <p style="color:#9ca3af;font-size:11px;margin-top:28px">You are receiving this because you opted in to company contact in your CVNova privacy settings. You can withdraw consent at any time from your dashboard, which stops all future messages immediately.</p>
            </div>`,
        });
        if ((result as any)?.error) emailStatus = 'failed';
      } catch {
        emailStatus = 'failed';
      }
    }

    await ctx.admin.from('company_outreach').insert([{
      company_id: ctx.company.id,
      candidate_user_id: candidateUserId,
      document_id: doc.id,
      candidate_email: candidateEmail,
      subject: subject || `Opportunity at ${ctx.company.company_name}`,
      message,
      email_status: emailStatus,
    }]);

    if (alsoChat && candidateUserId) {
      await ctx.admin.from('company_messages').insert([{
        company_id: ctx.company.id,
        candidate_user_id: candidateUserId,
        document_id: doc.id,
        sender: 'company',
        body: message,
      }]);
    }

    return NextResponse.json({ success: true, emailStatus, sentTo: candidateEmail.replace(/(.{2}).+(@.*)/, '$1***$2') });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'outreach_failed' }, { status: 500 });
  }
}
