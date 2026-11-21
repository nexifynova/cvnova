import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { userId, action, value } = await req.json();

    // Admin privileges ke liye Service Key use karni hai
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_bd!
    );

    if (action === 'toggle_deactivate') {
      const { error } = await supabaseAdmin.from('user_profiles').update({ is_deactivated: value }).eq('id', userId);
      if (error) throw error;
    } 
    else if (action === 'extend_expiry') {
      const { error } = await supabaseAdmin.from('user_profiles').update({ subscription_expiry: value }).eq('id', userId);
      if (error) throw error;
    } 
    else if (action === 'update_cv_limit') {
      const { error } = await supabaseAdmin.from('user_profiles').update({ total_allowed_cvs: parseInt(value) }).eq('id', userId);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}