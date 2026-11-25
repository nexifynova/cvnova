import { NextResponse } from 'next/server';
import { createAdminClient, isAdminCookie } from '@/lib/supabase-admin';

/**
 * Admin document lookup (service role + admin_session cookie).
 *
 * The admin panel authenticates with a cookie, not a Supabase JWT, so it
 * cannot be authorised by RLS. `generated_documents` is now locked down
 * (supabase/rls_fix.sql); every admin read goes through this route instead
 * of the anon-key table select the panel used before.
 *
 * GET /api/admin/documents                     -> all documents (newest first)
 * GET /api/admin/documents?id=<uuid>           -> one document
 * GET /api/admin/documents?email=<email>       -> documents of one email
 * GET /api/admin/documents?full_name=&share_code=  -> shared documents
 */
export async function GET(req: Request) {
  if (!isAdminCookie(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const id = (url.searchParams.get('id') || '').trim();
    const email = (url.searchParams.get('email') || '').trim();
    const fullName = (url.searchParams.get('full_name') || '').trim();
    const shareCode = (url.searchParams.get('share_code') || '').trim().toUpperCase();

    const admin = createAdminClient();

    if (id) {
      const { data, error } = await admin
        .from('generated_documents')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
      return NextResponse.json({ document: data });
    }

    let query = admin
      .from('generated_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (email) {
      query = query.eq('email', email);
    } else if (fullName && shareCode) {
      query = query.eq('full_name', fullName).eq('share_code', shareCode).eq('is_shareable', true);
    }

    const { data, error } = await query.limit(1000);
    if (error) throw error;

    return NextResponse.json({ documents: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'documents_load_failed' }, { status: 500 });
  }
}
