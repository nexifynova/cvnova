import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const { to, subject, html } = await req.json();
    
    // API key check
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY nahi mili' }, { status: 500 });
    }

    const resend = new Resend(apiKey);

    // Resend ki free testing ke liye 'onboarding@resend.dev' use hota hai
    const data = await resend.emails.send({
      from: 'CVNova <onboarding@resend.dev>', 
      to: [to],
      subject: subject,
      html: html,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}