import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Yeh GET sirf test karne ke liye hai
export async function GET() {
  return NextResponse.json({ message: "API is working perfectly!" });
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email aur password zaroori hain!' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_bd || '';

    if (!supabaseUrl || !supabaseKey) {
       return NextResponse.json({ error: 'Server config error: Missing ENV in Vercel' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, password')
      .eq('email', email)
      // (password is verified below with bcrypt)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: `Database Error: ${error.message}` }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Email ya Password galat hai!' }, { status: 401 });
    }

    // Verify the submitted plain-text password against the stored bcrypt hash.
    const storedPassword = String(data.password || '');
    const isBcryptHash =
      storedPassword.startsWith('$2a$') ||
      storedPassword.startsWith('$2b$') ||
      storedPassword.startsWith('$2y$');
    let passwordMatches = false;

    if (isBcryptHash) {
      passwordMatches = await bcrypt.compare(String(password), storedPassword);
    } else if (storedPassword !== '' && storedPassword === password) {
      // Legacy plain-text row: allow one login, then transparently upgrade it to a hash.
      passwordMatches = true;
      try {
        const upgradedHash = await bcrypt.hash(String(password), 10);
        await supabaseAdmin.from('admin_users').update({ password: upgradedHash }).eq('id', data.id);
      } catch {
        // Upgrade is best-effort; the login itself still succeeds.
      }
    }

    if (!passwordMatches) {
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
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `System Error: ${message}` }, { status: 500 });
  }
}