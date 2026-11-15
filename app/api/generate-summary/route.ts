import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { jobTitle, experience, education } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Vercel mein GEMINI_API_KEY nahi mili!' }, { status: 500 });
    }

    const expText = experience && experience.length > 0 
      ? `Experience: ${experience.map((e: any) => `${e.role} at ${e.company} (${e.desc})`).join(', ')}.` 
      : 'No experience provided.';
      
    const eduText = education && education.length > 0 
      ? `Education: ${education.map((e: any) => `${e.degree} from ${e.school}`).join(', ')}.` 
      : 'No education provided.';

    const prompt = `You are an expert resume writer. Based on these details:
    Job Title: ${jobTitle}
    ${expText}
    ${eduText}
    
    Task:
    1. Write a professional and compelling summary (max 3 sentences).
    2. Extract and generate a list of 6-8 relevant skills specifically based on the provided Experience and Education.

    You MUST return the response in strict JSON format exactly like this:
    {
      "summary": "A highly motivated...",
      "skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5", "Skill 6"]
    }`;

    // Yeh raha woh model jo Google ne error mein bataya hai
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || "Gemini API se error aya" }, { status: 500 });
    }

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      return NextResponse.json({ error: "AI ne khaali jawab diya." }, { status: 500 });
    }

    let cleanText = generatedText.trim();
    if (cleanText.startsWith('```json')) cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsedData = JSON.parse(cleanText);

    return NextResponse.json({ summary: parsedData.summary, skills: parsedData.skills });
  } catch (error: any) {
    return NextResponse.json({ error: `System Error: ${error.message}` }, { status: 500 });
  }
}