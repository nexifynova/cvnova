import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { jobTitle, companyName, fullName } = await req.json();

    const role = jobTitle || 'the position';
    const company = companyName || 'your esteemed organization';
    const name = fullName || 'Your Name';

    const generatedBody = `Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${role} position at ${company}. With a proven track record of delivering high-quality results and a passion for continuous improvement, I am confident in my ability to contribute effectively to your team.\n\nThroughout my career, I have developed strong skills in problem-solving, collaboration, and strategic planning. I am eager to bring my expertise to ${company} and help drive success.\n\nThank you for considering my application. I look forward to the opportunity to discuss how I can contribute to your team.\n\nSincerely,\n${name}`;

    await new Promise(resolve => setTimeout(resolve, 800));

    return NextResponse.json({ body: generatedBody });
  } catch (error: any) {
    return NextResponse.json({ error: `System Error: ${error.message}` }, { status: 500 });
  }
}