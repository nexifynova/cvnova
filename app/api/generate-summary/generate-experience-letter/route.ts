import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { employeeName, employeeDesignation, companyName, joiningDate, leavingDate } = await req.json();

    await new Promise(resolve => setTimeout(resolve, 1500));

    const generatedBody = `This is to certify that Mr./Ms. ${employeeName || 'Employee Name'} was employed with ${companyName || 'Our Company'} as a ${employeeDesignation || 'Professional'} from ${joiningDate || 'Start Date'} to ${leavingDate || 'End Date'}.\n\nDuring their tenure, they were responsible for key operational tasks and consistently demonstrated exceptional skills, dedication, and a strong work ethic. They were a valuable asset to our organization, known for their problem-solving abilities and collaborative spirit.\n\nWe wish them great success in all future endeavors.`;

    return NextResponse.json({ body: generatedBody });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate' }, { status: 500 });
  }
}