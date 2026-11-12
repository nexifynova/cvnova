import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { jobTitle, experience, education } = await req.json();

    // Dummy AI logic (Aap yahan OpenAI ya Gemini ka API call laga sakte hain baad mein)
    const expText = experience && experience.length > 0 ? `with experience as ${experience[0].role} at ${experience[0].company}` : '';
    const eduText = education && education.length > 0 ? `holding a degree in ${education[0].degree}` : '';
    
    const generatedSummary = `A highly motivated and detail-oriented ${jobTitle} ${expText} ${eduText}. Proven ability to deliver high-quality results, collaborate effectively within teams, and solve complex problems. Seeking to leverage skills and expertise to contribute to a dynamic organization.`;
    
    // AI se skills bhi generate karwa rahe hain
    const generatedSkills = jobTitle.toLowerCase().includes('account') 
      ? ['Financial Reporting', 'Data Analysis', 'Ms-Office', 'QuickBooks', 'Taxation', 'Communication']
      : ['Project Management', 'Communication', 'Problem Solving', 'Teamwork', 'Leadership'];

    await new Promise(resolve => setTimeout(resolve, 1500));

    return NextResponse.json({ summary: generatedSummary, skills: generatedSkills });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate' }, { status: 500 });
  }
}