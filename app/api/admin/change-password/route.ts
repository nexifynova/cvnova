import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { newPassword } = await req.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_bd || '';

    if (!supabaseUrl || !supabaseKey) {
       return NextResponse.json({ error: 'Server config error' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Hash the new password with bcrypt (never store plain text).
    const passwordHash = await bcrypt.hash(String(newPassword), 10);

    // Update the admin password. Assuming there is only one admin master account.
    const { error } = await supabaseAdmin
      .from('admin_users')
      .update({ password: passwordHash })
      .neq('email', ''); // Updates the admin account

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}