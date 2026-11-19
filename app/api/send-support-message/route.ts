import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // 1. Save to Database (for Admin Panel)
    const { error: dbError } = await supabaseAdmin.from('contact_messages').insert([{
      name, email, message, is_read: false
    }]);

    if (dbError) throw new Error("Database error: " + dbError.message);

    // 2. Send Email to Support
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://cvnova-one.vercel.app'}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'support@nexifynova.co.uk',
        subject: `New Support Message from ${name}`,
        html: `<h3>New Message</h3><p><b>From:</b> ${name} (${email})</p><p><b>Message:</b> ${message}</p>`
      })
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}