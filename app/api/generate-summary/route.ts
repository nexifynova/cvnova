import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { jobTitle, experience, education } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Vercel mein GEMINI_API_KEY nahi mili!' }, { status: 500 });
    }

    // 1. Available models ki list nikalne ki koshish karein
    let modelToUse = 'gemini-1.5-flash'; // Default fallback

    try {
      const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const listData = await listRes.json();
      
      const validModels = listData.models
        ?.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m: any) => m.name.replace('models/', '')) || [];

      // Agar list mil gayi, toh pehla valid model select karein
      if (validModels.length > 0) {
        modelToUse = validModels[0];
      }
    } catch (e) {
      // Agar list nahi mili, toh default hi use karein
      console.log("Model list nahi mili, default use kar rahe hain");
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
    1. Write a professional summary (max 3 sentences).
    2. Extract a list of 6 relevant skills based on the Experience and Education.
    Return ONLY valid JSON format exactly like this: {"summary": "...", "skills": ["skill1", "skill2"]}`;

    // 2. Jo model mila hai, usko use karein
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: `Model '${modelToUse}' ne error diya: ${data.error?.message || 'Unknown error'}` }, { status: 500 });
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