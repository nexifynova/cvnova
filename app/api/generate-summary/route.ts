import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { jobTitle, experience, education } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Vercel mein GEMINI_API_KEY nahi mili!' }, { status: 500 });
    }

    const expText = experience && experience.length > 0 
      ? `Experience: ${experience.map((e: any) => `${e.role} at ${e.company}`).join(', ')}.` 
      : '';
      
    const eduText = education && education.length > 0 
      ? `Education: ${education.map((e: any) => `${e.degree} from ${e.school}`).join(', ')}.` 
      : '';

    const prompt = `You are an expert resume writer. Write a professional summary and 6 skills for a ${jobTitle}. ${expText} ${eduText}. Return ONLY valid JSON: {"summary": "...", "skills": ["skill1", "skill2"]}`;

    // Google ka standard URL aur Model
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: `Google Error: ${data.error?.message || 'Unknown'}` }, { status: 500 });
    }

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      return NextResponse.json({ error: "AI ne khaali jawab diya." }, { status: 500 });
    }

    let cleanText = generatedText.trim();
    cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsedData = JSON.parse(cleanText);

    return NextResponse.json({ summary: parsedData.summary, skills: parsedData.skills });
  } catch (error: any) {
    return NextResponse.json({ error: `System Error: ${error.message}` }, { status: 500 });
  }
}