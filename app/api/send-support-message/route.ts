import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    // Aapke Vercel ke mutabiq variable ka naam 'bd' kar diya gaya hai
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_bd!
    );

    // 1. Admin Panel ke liye Database mein save karein
    const { error: dbError } = await supabaseAdmin.from('contact_messages').insert([{
      name, 
      email, 
      message, 
      is_read: false
    }]);

    if (dbError) throw new Error("Database error: " + dbError.message);

    // 2. Support Email par email bhejein (Agar fail ho to error na de, bas log kare)
    try {
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
    } catch (emailError) {
      console.error("Email send failed, but DB saved:", emailError);
      // Email fail hui to hum error throw nahi karenge taake frontend crash na ho
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}