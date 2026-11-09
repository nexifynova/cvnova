'use client';

import { useState } from 'react';
import { Sparkles, ArrowLeft, Download, Printer, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function Builder() {
  const [formData, setFormData] = useState({
    fullName: 'Muhammad Ali',
    email: 'muhammad.ali@example.com',
    phone: '+92 300 1234567',
    address: 'Karachi, Pakistan',
    jobTitle: 'Software Engineer',
    summary: 'Passionate software engineer with experience in building modern web applications.',
    skills: ['React', 'Next.js', 'JavaScript', 'Tailwind CSS'],
    languages: ['English', 'Urdu'],
    education: [
      { degree: 'BS Computer Science', school: 'University of Karachi', year: '2018 - 2022' }
    ],
    experience: [
      { role: 'Frontend Developer', company: 'Tech Solutions', duration: '2022 - Present', desc: 'Built responsive web apps.' }
    ],
    projects: [
      { title: 'Portfolio Website', desc: 'Built using Next.js and Tailwind CSS.' }
    ]
  });

  const [template, setTemplate] = useState('modern');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSkillChange = (index: number, value: string) => {
    const newSkills = [...formData.skills];
    newSkills[index] = value;
    setFormData({ ...formData, skills: newSkills });
  };

  const addSkill = () => setFormData({ ...formData, skills: [...formData.skills, ''] });
  const removeSkill = (index: number) => setFormData({ ...formData, skills: formData.skills.filter((_, i) => i !== index) });

  const addEdu = () => setFormData({ ...formData, education: [...formData.education, { degree: '', school: '', year: '' }] });
  const removeEdu = (index: number) => setFormData({ ...formData, education: formData.education.filter((_, i) => i !== index) });
  const handleEduChange = (index: number, field: string, value: string) => {
    const newEdu = [...formData.education];
    newEdu[index] = { ...newEdu[index], [field]: value };
    setFormData({ ...formData, education: newEdu });
  };

  const addExp = () => setFormData({ ...formData, experience: [...formData.experience, { role: '', company: '', duration: '', desc: '' }] });
  const removeExp = (index: number) => setFormData({ ...formData, experience: formData.experience.filter((_, i) => i !== index) });
  const handleExpChange = (index: number, field: string, value: string) => {
    const newExp = [...formData.experience];
    newExp[index] = { ...newExp[index], [field]: value };
    setFormData({ ...formData, experience: newExp });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 print:hidden">
        <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium">
          <ArrowLeft size={20} /> Back to Home
        </Link>
        <div className="font-bold text-xl text-blue-600">CVNova Builder</div>
        <div className="w-24"></div>
      </nav>

      <main className="flex-grow max-w-[1500px] mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT SIDE: FORM */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit max-h-[85vh] overflow-y-auto print:hidden">
          
          {/* Template Selector */}
          <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h3 className="text-sm font-bold text-gray-800 mb-2">Choose Template Design:</h3>
            <div className="flex flex-wrap gap-2">
              {['modern', 'classic', 'minimal', 'creative'].map((t) => (
                <button key={t} onClick={() => setTemplate(t)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${template === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Personal Details</h1>
          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label><input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Job Title</label><input type="text" name="jobTitle" value={formData.jobTitle} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label><input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
            </div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Address / City</label><input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Professional Summary</h1>
          <div className="mb-8">
            <textarea name="summary" value={formData.summary} onChange={handleChange} rows={3} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"></textarea>
            <button type="button" className="mt-2 flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-1.5 rounded-full">
              <Sparkles size={14} /> Generate with AI
            </button>
          </div>

          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h1 className="text-xl font-bold text-gray-900">Skills</h1>
            <button onClick={addSkill} className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-1"><Plus size={16} /> Add Skill</button>
          </div>
          <div className="space-y-2 mb-8">
            {formData.skills.map((skill, index) => (
              <div key={index} className="flex gap-2">
                <input type="text" value={skill} onChange={(e) => handleSkillChange(index, e.target.value)} placeholder="e.g. React" className="flex-1 px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                <button onClick={() => removeSkill(index)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={18} /></button>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h1 className="text-xl font-bold text-gray-900">Experience</h1>
            <button onClick={addExp} className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-1"><Plus size={16} /> Add</button>
          </div>
          <div className="space-y-4 mb-8">
            {formData.experience.map((exp, index) => (
              <div key={index} className="p-3 border rounded-lg bg-gray-50 relative">
                <button onClick={() => removeExp(index)} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                <div className="grid grid-cols-2 gap-2 mb-2 pr-6">
                  <input type="text" placeholder="Job Role" value={exp.role} onChange={(e) => handleExpChange(index, 'role', e.target.value)} className="px-2 py-1.5 border rounded text-sm w-full" />
                  <input type="text" placeholder="Company" value={exp.company} onChange={(e) => handleExpChange(index, 'company', e.target.value)} className="px-2 py-1.5 border rounded text-sm w-full" />
                </div>
                <input type="text" placeholder="Duration (e.g. 2022 - Present)" value={exp.duration} onChange={(e) => handleExpChange(index, 'duration', e.target.value)} className="px-2 py-1.5 border rounded text-sm w-full mb-2" />
                <textarea placeholder="Job Description" value={exp.desc} onChange={(e) => handleExpChange(index, 'desc', e.target.value)} rows={2} className="px-2 py-1.5 border rounded text-sm w-full resize-none"></textarea>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h1 className="text-xl font-bold text-gray-900">Education</h1>
            <button onClick={addEdu} className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-1"><Plus size={16} /> Add</button>
          </div>
          <div className="space-y-4 mb-8">
            {formData.education.map((edu, index) => (
              <div key={index} className="p-3 border rounded-lg bg-gray-50 relative">
                <button onClick={() => removeEdu(index)} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                <input type="text" placeholder="Degree (e.g. BS Computer Science)" value={edu.degree} onChange={(e) => handleEduChange(index, 'degree', e.target.value)} className="px-2 py-1.5 border rounded text-sm w-full mb-2 pr-6" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="School/University" value={edu.school} onChange={(e) => handleEduChange(index, 'school', e.target.value)} className="px-2 py-1.5 border rounded text-sm w-full" />
                  <input type="text" placeholder="Year (e.g. 2018-2022)" value={edu.year} onChange={(e) => handleEduChange(index, 'year', e.target.value)} className="px-2 py-1.5 border rounded text-sm w-full" />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button type="button" onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-xl hover:bg-gray-800 font-bold text-sm transition">
              <Printer size={18} /> Print CV
            </button>
            <button type="button" className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 font-bold text-sm transition">
              <Download size={18} /> Download
            </button>
          </div>
        </div>

        {/* RIGHT SIDE: LIVE CV PREVIEW */}
        <div className="bg-white shadow-2xl rounded-xl p-10 border border-gray-200 print:shadow-none print:border-none print:p-0 h-fit min-h-[A4]">
          
          {/* MODERN TEMPLATE */}
          {template === 'modern' && (
            <div>
              <div className="border-b-2 border-blue-600 pb-4 mb-6">
                <h1 className="text-4xl font-extrabold text-gray-900 uppercase">{formData.fullName}</h1>
                <p className="text-xl text-blue-600 font-semibold mt-1">{formData.jobTitle}</p>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-3">
                  <span>{formData.email}</span> <span>•</span> <span>{formData.phone}</span> <span>•</span> <span>{formData.address}</span>
                </div>
              </div>
              <div className="mb-6"><h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1">Summary</h2><p className="text-gray-700 text-sm leading-relaxed">{formData.summary}</p></div>
              
              <div className="mb-6">
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1">Experience</h2>
                {formData.experience.map((exp, i) => (
                  <div key={i} className="mb-4">
                    <div className="flex justify-between items-baseline"><h3 className="font-bold text-gray-900 text-sm">{exp.role}</h3><span className="text-xs text-gray-500 font-medium">{exp.duration}</span></div>
                    <p className="text-xs text-blue-600 font-semibold mb-1">{exp.company}</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{exp.desc}</p>
                  </div>
                ))}
              </div>
              
              <div className="mb-6">
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1">Education</h2>
                {formData.education.map((edu, i) => (
                  <div key={i} className="mb-3">
                    <div className="flex justify-between items-baseline"><h3 className="font-bold text-gray-900 text-sm">{edu.degree}</h3><span className="text-xs text-gray-500">{edu.year}</span></div>
                    <p className="text-xs text-gray-600">{edu.school}</p>
                  </div>
                ))}
              </div>

              <div>
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1">Skills</h2>
                <ul className="grid grid-cols-2 gap-1">
                  {formData.skills.map((skill, i) => skill && (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700"><span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span> {skill}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* CLASSIC TEMPLATE */}
          {template === 'classic' && (
            <div>
              <div className="text-center border-b-2 border-gray-900 pb-4 mb-6">
                <h1 className="text-3xl font-serif font-bold text-gray-900 tracking-wide">{formData.fullName}</h1>
                <p className="text-md text-gray-600 mt-1">{formData.jobTitle}</p>
                <div className="flex justify-center gap-3 text-xs text-gray-500 mt-2"><span>{formData.email}</span> <span>|</span> <span>{formData.phone}</span> <span>|</span> <span>{formData.address}</span></div>
              </div>
              <div className="mb-5"><h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1">Summary</h2><p className="text-gray-700 text-sm leading-relaxed">{formData.summary}</p></div>
              
              <div className="mb-5">
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2">Experience</h2>
                {formData.experience.map((exp, i) => (
                  <div key={i} className="mb-3">
                    <div className="flex justify-between"><h3 className="font-bold text-gray-900 text-sm">{exp.company}</h3><span className="text-xs text-gray-600">{exp.duration}</span></div>
                    <p className="text-xs italic text-gray-700">{exp.role}</p>
                    <p className="text-xs text-gray-600 mt-1">{exp.desc}</p>
                  </div>
                ))}
              </div>
              
              <div className="mb-5">
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2">Education</h2>
                {formData.education.map((edu, i) => (
                  <div key={i} className="flex justify-between mb-2">
                    <div><h3 className="font-bold text-gray-900 text-sm">{edu.degree}</h3><p className="text-xs text-gray-600">{edu.school}</p></div>
                    <span className="text-xs text-gray-600">{edu.year}</span>
                  </div>
                ))}
              </div>
              
              <div>
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1">Skills</h2>
                <ul className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, i) => skill && (
                    <li key={i} className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded">{skill}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* MINIMAL TEMPLATE */}
          {template === 'minimal' && (
            <div className="font-light">
              <div className="mb-8">
                <h1 className="text-4xl text-gray-900 mb-1">{formData.fullName}</h1>
                <p className="text-gray-500 uppercase tracking-widest text-sm">{formData.jobTitle}</p>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-1 text-xs text-gray-500 space-y-3">
                  <div><h3 className="font-bold text-gray-900 uppercase tracking-wider mb-1">Contact</h3><p>{formData.email}</p><p>{formData.phone}</p><p>{formData.address}</p></div>
                  <div><h3 className="font-bold text-gray-900 uppercase tracking-wider mb-1">Skills</h3><ul>{formData.skills.map((s, i) => s && <li key={i}>{s}</li>)}</ul></div>
                  <div><h3 className="font-bold text-gray-900 uppercase tracking-wider mb-1">Education</h3>{formData.education.map((e, i) => <div key={i} className="mb-2"><p className="font-semibold text-gray-800">{e.degree}</p><p>{e.school}</p><p>{e.year}</p></div>)}</div>
                </div>
                <div className="col-span-2 space-y-6">
                  <div><h3 className="font-bold text-gray-900 uppercase tracking-wider text-sm border-b pb-1 mb-2">Profile</h3><p className="text-sm text-gray-700 leading-relaxed">{formData.summary}</p></div>
                  <div><h3 className="font-bold text-gray-900 uppercase tracking-wider text-sm border-b pb-1 mb-2">Experience</h3>{formData.experience.map((e, i) => <div key={i} className="mb-4"><h4 className="font-bold text-gray-800">{e.role}</h4><p className="text-xs text-gray-500 mb-1">{e.company} | {e.duration}</p><p className="text-sm text-gray-700">{e.desc}</p></div>)}</div>
                </div>
              </div>
            </div>
          )}

          {/* CREATIVE TEMPLATE */}
          {template === 'creative' && (
            <div className="flex flex-col h-full">
              <div className="bg-gray-900 text-white p-6 rounded-t-xl mb-6">
                <h1 className="text-4xl font-bold">{formData.fullName}</h1>
                <p className="text-blue-300 font-medium mt-1">{formData.jobTitle}</p>
              </div>
              <div className="flex gap-6 px-2">
                <div className="w-1/3">
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 text-blue-600">Contact</h2>
                  <div className="text-xs text-gray-700 space-y-1 mb-6">
                    <p>{formData.email}</p><p>{formData.phone}</p><p>{formData.address}</p>
                  </div>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 text-blue-600">Skills</h2>
                  <ul className="text-xs text-gray-700 space-y-1 mb-6">{formData.skills.map((s, i) => s && <li key={i}>• {s}</li>)}</ul>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 text-blue-600">Education</h2>
                  {formData.education.map((e, i) => <div key={i} className="mb-3 text-xs"><p className="font-bold text-gray-900">{e.degree}</p><p>{e.school}</p><p className="text-gray-500">{e.year}</p></div>)}
                </div>
                <div className="w-2/3">
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 text-blue-600">Profile</h2>
                  <p className="text-sm text-gray-700 leading-relaxed mb-6">{formData.summary}</p>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 text-blue-600">Experience</h2>
                  {formData.experience.map((e, i) => <div key={i} className="mb-4"><h3 className="font-bold text-gray-900 text-sm">{e.role}</h3><p className="text-xs text-blue-600 font-semibold mb-1">{e.company} | {e.duration}</p><p className="text-xs text-gray-700 leading-relaxed">{e.desc}</p></div>)}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}