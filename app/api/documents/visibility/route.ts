import { NextResponse } from 'next/server';
import { createAdminClient, getUserFromRequest } from '@/lib/supabase-admin';


export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const { documentId, isPublic } = await req.json();
    if (!documentId || typeof isPublic !== 'boolean') {
      return NextResponse.json({ error: 'documentId_and_isPublic_required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: doc } = await admin
      .from('generated_documents')
      .select('id, user_id, email, document_type')
      .eq('id', documentId)
      .maybeSingle();

    if (!doc) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const ownerEmail = String(doc.email || '').trim().toLowerCase();
    const myEmail = String(user.email || '').trim().toLowerCase();
    const owns = doc.user_id ? doc.user_id === user.id : !!myEmail && ownerEmail === myEmail;
    if (!owns) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    if (doc.document_type && doc.document_type !== 'CV') {
      return NextResponse.json({ error: 'only_cv_documents_can_be_shared' }, { status: 400 });
    }

    // Turning sharing on also requires the account-level consent flag.
    if (isPublic) {
      const { data: profile } = await admin
        .from('user_profiles')
        .select('consent_share_cv, is_deactivated')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.consent_share_cv || profile?.is_deactivated) {
        return NextResponse.json({ error: 'consent_required' }, { status: 409 });
      }
    }

    const { error } = await admin
      .from('generated_documents')
      .update({ is_public: isPublic, user_id: doc.user_id || user.id })
      .eq('id', documentId);

    if (error) throw error;

    return NextResponse.json({ success: true, isPublic });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'visibility_update_failed' }, { status: 500 });
  }
}
