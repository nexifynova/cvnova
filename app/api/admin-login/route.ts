import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Yeh GET sirf test karne ke liye hai
export async function GET() {
  return NextResponse.json({ message: "API is working perfectly!" });
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
       return NextResponse.json({ error: 'Server config error: Missing ENV in Vercel' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

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
      return NextResponse.json({ error: 'Email ya Password galat hai!' }, { status: 401 });
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