import { NextResponse } from 'next/server';
import { createAdminClient, getUserFromRequest, isAdminCookie } from '@/lib/supabase-admin';

/**
 * Shared document viewer endpoint used by /view/[id].
 *
 * `generated_documents` no longer allows anonymous table reads (see
 * supabase/rls_fix.sql), but the viewer must keep working for:
 *   - the owner (dashboard / builder),
 *   - recipients of a chat message that references the document,
 *   - anonymous recipients of an emailed /view/<uuid> link.
 * The UUID itself is the share token here, exactly like before, but a
 * listing of the whole table is no longer possible with the anon key.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type DocRow = { id: string; user_id: string | null; email: string | null; [key: string]: unknown };

const ownsDocument = (doc: DocRow | null, user: { id: string; email?: string | null } | null): boolean => {
  if (!doc || !user) return false;
  if (doc.user_id) return doc.user_id === user.id;
  const ownerEmail = String(doc.email || '').trim().toLowerCase();
  const myEmail = String(user.email || '').trim().toLowerCase();
  return !!myEmail && ownerEmail === myEmail;
};

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID_RE.test(String(id || ''))) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('generated_documents')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const user = await getUserFromRequest(req);
    const isOwner = isAdminCookie(req) || ownsDocument(data as DocRow, user);

    return NextResponse.json({ document: data, isOwner });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'document_load_failed' }, { status: 500 });
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID_RE.test(String(id || ''))) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const templateName = typeof body?.templateName === 'string' ? body.templateName.trim() : '';
    if (!templateName || templateName.length > 64) {
      return NextResponse.json({ error: 'template_required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: doc, error: readError } = await admin
      .from('generated_documents')
      .select('id, user_id, email')
      .eq('id', id)
      .maybeSingle();

    if (readError) throw readError;
    if (!doc) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const user = await getUserFromRequest(req);
    if (!isAdminCookie(req) && !ownsDocument(doc as DocRow, user)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { error } = await admin
      .from('generated_documents')
      .update({ template_name: templateName })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, templateName });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'document_update_failed' }, { status: 500 });
  }
}
