import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!process.env.SUPABASE_SERVICE_KEY) {
       return NextResponse.json({ error: 'Server config error: SUPABASE_SERVICE_KEY missing' }, { status: 500 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: `Database Error: ${error.message}` }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Email ya Password database mein nahi mila!' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_session', 'true', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24,
      path: '/'
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: `System Error: ${error.message}` }, { status: 500 });
  }
}