import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY! 
    );

    // 1. Delete generated documents
    await supabaseAdmin.from('generated_documents').delete().eq('user_id', userId);
    await supabaseAdmin.from('payments').delete().eq('user_id', userId);
    
    // 2. Delete profile
    await supabaseAdmin.from('user_profiles').delete().eq('id', userId);
    
    // 3. Delete Auth User
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}