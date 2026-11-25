import { NextResponse } from 'next/server';
import { createAdminClient, getUserFromRequest } from '@/lib/supabase-admin';

/**
 * Legacy "job field" matching for the chat room.
 *
 * The chat page used to download up to 500 CVs with the anon key to map a
 * job field to the candidates whose latest CV title matches it. That is no
 * longer possible (and was a data leak anyway), so the matching happens
 * server-side and only the resulting ids / emails are returned.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const fieldId = (new URL(req.url).searchParams.get('field') || '').trim();
  if (!UUID_RE.test(fieldId)) {
    return NextResponse.json({ userIds: [], emails: [] });
  }

  try {
    const admin = createAdminClient();

    const { data: field, error: fieldError } = await admin
      .from('job_fields')
      .select('id, field_name')
      .eq('id', fieldId)
      .maybeSingle();

    if (fieldError) throw fieldError;

    const wantedTitle = String((field as { field_name?: string } | null)?.field_name || '').trim().toLowerCase();
    if (!wantedTitle) return NextResponse.json({ userIds: [], emails: [] });

    const { data: docs, error } = await admin
      .from('generated_documents')
      .select('user_id, email, full_data')
      .eq('document_type', 'CV')
      .limit(500);

    if (error) throw error;

    const userIds = new Set<string>();
    const emails = new Set<string>();

    (docs as { user_id?: string | null; email?: string | null; full_data?: any }[] | null ?? []).forEach((doc) => {
      const title = String((doc.full_data || {}).jobTitle || '').trim().toLowerCase();
      if (!title || title !== wantedTitle) return;
      if (doc.user_id) userIds.add(doc.user_id);
      const email = String(doc.email || '').trim().toLowerCase();
      if (email && email !== 'n/a') emails.add(email);
    });

    return NextResponse.json({ userIds: Array.from(userIds), emails: Array.from(emails) });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'job_field_match_failed' }, { status: 500 });
  }
}
