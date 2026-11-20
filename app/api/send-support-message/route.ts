import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // 1. Admin Panel ke liye Database mein save karein
    const { error: dbError } = await supabaseAdmin.from('contact_messages').insert([{
      name, 
      email, 
      message, 
      is_read: false
    }]);

    if (dbError) throw new Error("Database error: " + dbError.message);

    // 2. Support Email par email bhejein
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://cvnova-one.vercel.app'}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'support@nexifynova.co.uk',
        subject: `New Support Message from ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #2563eb;">New Support Message</h2>
            <p><b>From:</b> ${name}</p>
            <p><b>Email:</b> <a href="mailto:${email}">${email}</a></p>
            <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #2563eb; margin-top: 15px;">
              <p style="margin: 0;"><b>Message:</b></p>
              <p style="margin-top: 5px;">${message}</p>
            </div>
            <br/>
            <p style="color: #64748b; font-size: 12px;">You can also view and reply to this message directly from your <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://cvnova-one.vercel.app'}/admin/messages">Admin Panel</a>.</p>
          </div>
        `
      })
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}