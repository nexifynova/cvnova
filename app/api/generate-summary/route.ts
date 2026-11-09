import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { jobTitle, skills } = await req.json();

    // Yahan hum OpenAI/Gemini API call karte hain, 
    // Lekin abhi ke liye hum aik dummy summary bana rahe hain taake structure clear ho.
    // Baad mein aap yahan apni API Key dalenge.
    
    const generatedText = `A highly motivated ${jobTitle} with expertise in ${skills}. Proven ability to deliver high-quality results and collaborate effectively within teams. Seeking to leverage skills to contribute to a dynamic organization.`;

    // Thora delay daal rahe hain taake 'loading' effect nazar aaye
    await new Promise(resolve => setTimeout(resolve, 1500));

    return NextResponse.json({ summary: generatedText });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate' }, { status: 500 });
  }
}