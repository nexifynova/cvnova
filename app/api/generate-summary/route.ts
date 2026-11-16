import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { jobTitle, experience, education } = await req.json();
    const role = jobTitle || 'Professional';
    const latestExp = experience && experience.length > 0 ? experience[0] : null;
    const latestEdu = education && education.length > 0 ? education[0] : null;

    let skills = [];
    const expDesc = latestExp?.desc?.toLowerCase() || '';
    const expRole = latestExp?.role?.toLowerCase() || '';
    const eduDegree = latestEdu?.degree?.toLowerCase() || '';

    // User ke data se skills nikalna
    if (expDesc.includes('manage') || expRole.includes('manage')) skills.push('Management');
    if (expDesc.includes('account') || expRole.includes('account') || role.toLowerCase().includes('account')) skills.push('Accounting & Finance');
    if (expDesc.includes('market') || expRole.includes('market')) skills.push('Marketing');
    if (expDesc.includes('sale') || expRole.includes('sale')) skills.push('Sales');
    if (expDesc.includes('team') || expRole.includes('team')) skills.push('Team Leadership');
    if (expDesc.includes('data') || expDesc.includes('excel')) skills.push('Data Analysis');
    if (expDesc.includes('customer') || expDesc.includes('client')) skills.push('Customer Service');
    if (expDesc.includes('project')) skills.push('Project Management');
    if (eduDegree.includes('computer') || eduDegree.includes('software')) skills.push('Software Development');

    if (skills.length === 0) {
      skills = ['Communication', 'Problem Solving', 'Time Management', 'Teamwork', 'Adaptability', 'Microsoft Office'];
    }
    skills = [...new Set(skills)].slice(0, 6);

    const expText = latestExp ? `with experience as a ${latestExp.role} at ${latestExp.company}` : 'with a strong professional background';
    const eduText = latestEdu ? `and holds a ${latestEdu.degree} from ${latestEdu.school}` : '';
    const summary = `A highly motivated and detail-oriented ${role} ${expText}. ${eduText ? eduText + '.' : ''} Proven ability to ${skills.slice(0, 3).join(', ').toLowerCase()}. Seeking to leverage these skills to contribute to a dynamic organization.`;

    await new Promise(resolve => setTimeout(resolve, 800));

    return NextResponse.json({ summary, skills });
  } catch (error: any) {
    return NextResponse.json({ error: `System Error: ${error.message}` }, { status: 500 });
  }
}