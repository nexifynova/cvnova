import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { jobTitle, experience, education } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is missing' }, { status: 500 });
    }

    const expText = experience && experience.length > 0 ? `Experience: ${experience[0].role} at ${experience[0].company}.` : '';
    const eduText = education && education.length > 0 ? `Education: ${education[0].degree} from ${education[0].school}.` : '';

    const prompt = `You are an expert resume writer. Write a professional summary and a comma-separated list of skills for a ${jobTitle}. ${expText} ${eduText}
    
    You MUST return the response in strict JSON format exactly like this:
    {
      "summary": "A highly motivated...",
      "skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"]
    }`;

    // Google Gemini API Call
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" } // Force JSON response
      })
    });

    const data = await response.json();
    
    // AI ka text nikalna
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error("AI ne koi jawab nahi diya.");
    }

    const parsedData = JSON.parse(generatedText);

    return NextResponse.json({ summary: parsedData.summary, skills: parsedData.skills });
  } catch (error: any) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: 'Failed to generate AI summary' }, { status: 500 });
  }
}