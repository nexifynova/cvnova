'use client';

import { useState } from 'react';
import { Sparkles, ArrowLeft, Download, Printer, Plus, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function Builder() {
  const [formData, setFormData] = useState({
    fullName: 'Faisal Ilyas',
    email: 'faisal@nexifynova.co.uk',
    phone: '+92 3122777836',
    address: 'Karachi, Pakistan',
    jobTitle: 'Assistant Accounts',
    summary: 'Passionate software engineer with experience in building modern web applications.',
    skills: ['Ms-Office', 'English Language', 'JavaScript', 'Tailwind CSS'],
    education: [
      { degree: 'BS Computer Science', school: 'University of Karachi', year: '2018 - 2022' }
    ],
    experience: [
      { role: 'Accountant', company: 'Zaman Trading', duration: '2022 - Present', desc: 'Built responsive web apps.' }
    ],
  });

  const [template, setTemplate] = useState('modern');
  const [isGenerating, setIsGenerating] = useState(false);

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

  const handleGenerateAI = async () => {
    if (!formData.jobTitle) {
      alert("Pehle Job Title likhein taake AI summary bana sake.");
      return;
    }
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle: formData.jobTitle, skills: formData.skills.join(', ') }),
      });
      const data = await response.json();
      if (data.summary) {
        setFormData({ ...formData, summary: data.summary });
      }
    } catch (error) {
      alert("AI summary generate nahi ho saki. Dobara koshish karein.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
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
            <h3 className="text-sm font-bold text-gray-800 mb-2">Choose Template Design (16 Options):</h3>
            <div className="flex flex-wrap gap-2">
              {['modern', 'classic', 'minimal', 'creative', 'executive', 'elegant', 'tech', 'corporate', 'simple', 'bold', 'timeline', 'compact', 'bluecorporate', 'redexecutive', 'greenprofessional', 'darkmode'].map((t) => (
                <button key={t} onClick={() => setTemplate(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${template === t ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}>
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
            <button type="button" onClick={handleGenerateAI} disabled={isGenerating} className="mt-2 flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-1.5 rounded-full disabled:opacity-50">
              {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {isGenerating ? 'Generating...' : 'Generate with AI'}
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

          {/* EXECUTIVE TEMPLATE */}
          {template === 'executive' && (
            <div className="border-t-[10px] border-gray-900 pt-6">
              <div className="flex justify-between items-end border-b-2 border-gray-300 pb-4 mb-6">
                <div><h1 className="text-4xl font-black text-gray-900">{formData.fullName}</h1><p className="text-lg text-gray-600 mt-1">{formData.jobTitle}</p></div>
                <div className="text-right text-xs text-gray-500 space-y-1"><p>{formData.email}</p><p>{formData.phone}</p><p>{formData.address}</p></div>
              </div>
              <div className="mb-5"><h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1 border-b-2 border-gray-900 inline-block pb-1">Profile</h2><p className="text-gray-700 text-sm leading-relaxed mt-2">{formData.summary}</p></div>
              <div className="mb-5"><h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2 border-b-2 border-gray-900 inline-block pb-1">Experience</h2>{formData.experience.map((e, i) => <div key={i} className="mb-3"><div className="flex justify-between"><h3 className="font-bold text-gray-900 text-sm">{e.role}</h3><span className="text-xs text-gray-600">{e.duration}</span></div><p className="text-xs font-semibold text-gray-700">{e.company}</p><p className="text-xs text-gray-600 mt-1">{e.desc}</p></div>)}</div>
              <div className="mb-5"><h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2 border-b-2 border-gray-900 inline-block pb-1">Education</h2>{formData.education.map((e, i) => <div key={i} className="flex justify-between mb-2"><div><h3 className="font-bold text-gray-900 text-sm">{e.degree}</h3><p className="text-xs text-gray-600">{e.school}</p></div><span className="text-xs text-gray-600">{e.year}</span></div>)}</div>
              <div><h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1 border-b-2 border-gray-900 inline-block pb-1">Skills</h2><ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2">{formData.skills.map((s, i) => s && <li key={i} className="text-sm text-gray-700">• {s}</li>)}</ul></div>
            </div>
          )}

          {/* ELEGANT TEMPLATE */}
          {template === 'elegant' && (
            <div className="font-serif">
              <div className="text-center mb-8 border-b border-gray-300 pb-6">
                <h1 className="text-4xl font-normal text-gray-800 tracking-wider mb-2">{formData.fullName}</h1>
                <p className="text-sm text-gray-500 uppercase tracking-[0.3em]">{formData.jobTitle}</p>
                <div className="flex justify-center gap-4 text-xs text-gray-500 mt-4"><span>{formData.email}</span> <span>•</span> <span>{formData.phone}</span> <span>•</span> <span>{formData.address}</span></div>
              </div>
              <div className="grid grid-cols-12 gap-8">
                <div className="col-span-8 space-y-6">
                  <div><h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3 pb-1 border-b border-gray-200">Experience</h2>{formData.experience.map((e, i) => <div key={i} className="mb-4"><h3 className="font-bold text-gray-900 text-sm">{e.role}</h3><p className="text-xs italic text-gray-600 mb-1">{e.company} | {e.duration}</p><p className="text-xs text-gray-700 leading-relaxed">{e.desc}</p></div>)}</div>
                  <div><h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3 pb-1 border-b border-gray-200">Education</h2>{formData.education.map((e, i) => <div key={i} className="mb-3"><h3 className="font-bold text-gray-900 text-sm">{e.degree}</h3><p className="text-xs text-gray-600">{e.school} | {e.year}</p></div>)}</div>
                </div>
                <div className="col-span-4 space-y-6">
                  <div><h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3 pb-1 border-b border-gray-200">Profile</h2><p className="text-xs text-gray-700 leading-relaxed">{formData.summary}</p></div>
                  <div><h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3 pb-1 border-b border-gray-200">Skills</h2><ul className="text-xs text-gray-700 space-y-1">{formData.skills.map((s, i) => s && <li key={i}>{s}</li>)}</ul></div>
                </div>
              </div>
            </div>
          )}

          {/* TECH TEMPLATE */}
          {template === 'tech' && (
            <div className="font-mono text-sm">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">{formData.fullName}</h1>
                <p className="text-blue-600">{formData.jobTitle}</p>
                <div className="text-xs text-gray-500 mt-2">[{formData.email}] [{formData.phone}] [{formData.address}]</div>
              </div>
              <div className="mb-4"><span className="text-blue-600 font-bold">## Summary</span><p className="text-gray-700 mt-1">{formData.summary}</p></div>
              <div className="mb-4"><span className="text-blue-600 font-bold">## Experience</span>{formData.experience.map((e, i) => <div key={i} className="mt-2"><p className="font-bold text-gray-900">{e.role} @ {e.company} ({e.duration})</p><p className="text-gray-600">{e.desc}</p></div>)}</div>
              <div className="mb-4"><span className="text-blue-600 font-bold">## Education</span>{formData.education.map((e, i) => <div key={i} className="mt-2"><p className="font-bold text-gray-900">{e.degree}</p><p className="text-gray-600">{e.school} ({e.year})</p></div>)}</div>
              <div><span className="text-blue-600 font-bold">## Skills</span><p className="text-gray-700 mt-1">{formData.skills.join(', ')}</p></div>
            </div>
          )}

          {/* CORPORATE TEMPLATE */}
          {template === 'corporate' && (
            <div>
              <div className="bg-blue-900 text-white p-6 mb-6">
                <h1 className="text-3xl font-bold uppercase tracking-wider">{formData.fullName}</h1>
                <p className="text-blue-200 mt-1">{formData.jobTitle}</p>
                <div className="flex gap-4 text-xs text-blue-200 mt-3"><span>{formData.email}</span> <span>|</span> <span>{formData.phone}</span> <span>|</span> <span>{formData.address}</span></div>
              </div>
              <div className="px-4">
                <div className="mb-6"><h2 className="text-sm font-bold text-blue-900 uppercase border-b border-blue-900 pb-1 mb-2">Profile</h2><p className="text-gray-700 text-sm">{formData.summary}</p></div>
                <div className="mb-6"><h2 className="text-sm font-bold text-blue-900 uppercase border-b border-blue-900 pb-1 mb-2">Experience</h2>{formData.experience.map((e, i) => <div key={i} className="mb-3"><div className="flex justify-between"><h3 className="font-bold text-gray-900">{e.role}</h3><span className="text-xs text-gray-500">{e.duration}</span></div><p className="text-xs text-blue-700 font-medium">{e.company}</p><p className="text-xs text-gray-600">{e.desc}</p></div>)}</div>
                <div className="mb-6"><h2 className="text-sm font-bold text-blue-900 uppercase border-b border-blue-900 pb-1 mb-2">Education</h2>{formData.education.map((e, i) => <div key={i} className="mb-2"><div className="flex justify-between"><h3 className="font-bold text-gray-900 text-sm">{e.degree}</h3><span className="text-xs text-gray-500">{e.year}</span></div><p className="text-xs text-gray-600">{e.school}</p></div>)}</div>
                <div><h2 className="text-sm font-bold text-blue-900 uppercase border-b border-blue-900 pb-1 mb-2">Skills</h2><div className="flex flex-wrap gap-2">{formData.skills.map((s, i) => s && <span key={i} className="bg-blue-50 text-blue-800 text-xs px-2 py-1 rounded border border-blue-200">{s}</span>)}</div></div>
              </div>
            </div>
          )}

          {/* SIMPLE TEMPLATE */}
          {template === 'simple' && (
            <div className="text-gray-800">
              <div className="mb-6">
                <h1 className="text-3xl font-bold">{formData.fullName}</h1>
                <p className="text-gray-600">{formData.jobTitle}</p>
                <p className="text-xs text-gray-500 mt-1">{formData.email} | {formData.phone} | {formData.address}</p>
              </div>
              <hr className="mb-4 border-gray-300" />
              <div className="mb-4"><h2 className="font-bold text-gray-900 mb-1">Summary</h2><p className="text-sm text-gray-700">{formData.summary}</p></div>
              <hr className="mb-4 border-gray-300" />
              <div className="mb-4"><h2 className="font-bold text-gray-900 mb-2">Experience</h2>{formData.experience.map((e, i) => <div key={i} className="mb-3"><div className="flex justify-between"><h3 className="font-semibold text-sm">{e.role}</h3><span className="text-xs text-gray-500">{e.duration}</span></div><p className="text-xs text-gray-600 italic">{e.company}</p><p className="text-sm text-gray-700 mt-1">{e.desc}</p></div>)}</div>
              <hr className="mb-4 border-gray-300" />
              <div className="mb-4"><h2 className="font-bold text-gray-900 mb-2">Education</h2>{formData.education.map((e, i) => <div key={i} className="mb-2"><div className="flex justify-between"><h3 className="font-semibold text-sm">{e.degree}</h3><span className="text-xs text-gray-500">{e.year}</span></div><p className="text-sm text-gray-600">{e.school}</p></div>)}</div>
              <hr className="mb-4 border-gray-300" />
              <div><h2 className="font-bold text-gray-900 mb-1">Skills</h2><p className="text-sm text-gray-700">{formData.skills.join(' • ')}</p></div>
            </div>
          )}

          {/* BOLD TEMPLATE */}
          {template === 'bold' && (
            <div>
              <div className="mb-6">
                <h1 className="text-5xl font-black text-gray-900 uppercase leading-none">{formData.fullName}</h1>
                <p className="text-xl font-bold text-gray-500 mt-1">{formData.jobTitle}</p>
              </div>
              <div className="bg-gray-100 p-4 mb-6 flex gap-4 text-xs font-semibold text-gray-600">{formData.email} <span>/</span> {formData.phone} <span>/</span> {formData.address}</div>
              <div className="mb-6"><h2 className="text-xl font-black text-gray-900 uppercase mb-2">Profile</h2><p className="text-sm text-gray-700">{formData.summary}</p></div>
              <div className="mb-6"><h2 className="text-xl font-black text-gray-900 uppercase mb-3">Experience</h2>{formData.experience.map((e, i) => <div key={i} className="mb-4"><h3 className="font-bold text-lg text-gray-900">{e.role}</h3><p className="text-xs font-bold text-gray-500 uppercase">{e.company} / {e.duration}</p><p className="text-sm text-gray-700 mt-1">{e.desc}</p></div>)}</div>
              <div className="mb-6"><h2 className="text-xl font-black text-gray-900 uppercase mb-3">Education</h2>{formData.education.map((e, i) => <div key={i} className="mb-3"><h3 className="font-bold text-lg text-gray-900">{e.degree}</h3><p className="text-sm text-gray-600">{e.school} / {e.year}</p></div>)}</div>
              <div><h2 className="text-xl font-black text-gray-900 uppercase mb-2">Skills</h2><ul className="grid grid-cols-2 gap-2">{formData.skills.map((s, i) => s && <li key={i} className="font-bold text-gray-800 text-sm border-l-4 border-gray-900 pl-2">{s}</li>)}</ul></div>
            </div>
          )}

          {/* TIMELINE TEMPLATE */}
          {template === 'timeline' && (
            <div>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">{formData.fullName}</h1>
                <p className="text-gray-500">{formData.jobTitle}</p>
                <div className="text-xs text-gray-400 mt-2">{formData.email} • {formData.phone} • {formData.address}</div>
              </div>
              <div className="relative border-l-2 border-blue-200 ml-3 pl-6 mb-8">
                <div className="absolute w-4 h-4 bg-blue-600 rounded-full -left-[9px] top-1"></div>
                <h2 className="text-sm font-bold text-blue-600 uppercase mb-2">Summary</h2>
                <p className="text-sm text-gray-700">{formData.summary}</p>
              </div>
              <div className="relative border-l-2 border-blue-200 ml-3 pl-6 mb-8">
                <div className="absolute w-4 h-4 bg-blue-600 rounded-full -left-[9px] top-1"></div>
                <h2 className="text-sm font-bold text-blue-600 uppercase mb-3">Experience</h2>
                {formData.experience.map((e, i) => <div key={i} className="mb-4"><h3 className="font-bold text-gray-900">{e.role}</h3><p className="text-xs text-gray-500 mb-1">{e.company} | {e.duration}</p><p className="text-sm text-gray-700">{e.desc}</p></div>)}
              </div>
              <div className="relative border-l-2 border-blue-200 ml-3 pl-6 mb-8">
                <div className="absolute w-4 h-4 bg-blue-600 rounded-full -left-[9px] top-1"></div>
                <h2 className="text-sm font-bold text-blue-600 uppercase mb-3">Education</h2>
                {formData.education.map((e, i) => <div key={i} className="mb-3"><h3 className="font-bold text-gray-900">{e.degree}</h3><p className="text-sm text-gray-600">{e.school} | {e.year}</p></div>)}
              </div>
              <div className="relative border-l-2 border-blue-200 ml-3 pl-6">
                <div className="absolute w-4 h-4 bg-blue-600 rounded-full -left-[9px] top-1"></div>
                <h2 className="text-sm font-bold text-blue-600 uppercase mb-2">Skills</h2>
                <div className="flex flex-wrap gap-2">{formData.skills.map((s, i) => s && <span key={i} className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">{s}</span>)}</div>
              </div>
            </div>
          )}

          {/* COMPACT TEMPLATE */}
          {template === 'compact' && (
            <div className="text-sm">
              <div className="mb-4 border-b pb-2"><h1 className="text-2xl font-bold text-gray-900">{formData.fullName}</h1><p className="text-gray-600">{formData.jobTitle} | {formData.email} | {formData.phone} | {formData.address}</p></div>
              <div className="mb-3"><p className="text-gray-700">{formData.summary}</p></div>
              <div className="mb-3"><h2 className="font-bold text-gray-900 uppercase text-xs mb-1">Experience</h2>{formData.experience.map((e, i) => <div key={i} className="mb-2"><span className="font-bold text-gray-800">{e.role}</span>, {e.company} <span className="text-gray-500">({e.duration})</span><p className="text-gray-600">{e.desc}</p></div>)}</div>
              <div className="mb-3"><h2 className="font-bold text-gray-900 uppercase text-xs mb-1">Education</h2>{formData.education.map((e, i) => <div key={i} className="mb-1"><span className="font-bold text-gray-800">{e.degree}</span>, {e.school} <span className="text-gray-500">({e.year})</span></div>)}</div>
              <div><h2 className="font-bold text-gray-900 uppercase text-xs mb-1">Skills</h2><p className="text-gray-700">{formData.skills.join(', ')}</p></div>
            </div>
          )}

          {/* BLUE CORPORATE TEMPLATE */}
          {template === 'bluecorporate' && (
            <div>
              <div className="bg-blue-700 text-white p-6 rounded-t-xl mb-6">
                <h1 className="text-4xl font-bold">{formData.fullName}</h1>
                <p className="text-blue-200 font-medium mt-1">{formData.jobTitle}</p>
                <div className="flex gap-4 text-xs text-blue-200 mt-3">
                  <span>{formData.email}</span> <span>•</span> <span>{formData.phone}</span> <span>•</span> <span>{formData.address}</span>
                </div>
              </div>
              <div className="px-4">
                <div className="mb-5"><h2 className="text-sm font-bold text-blue-700 uppercase border-b-2 border-blue-700 pb-1 mb-2">Profile</h2><p className="text-gray-700 text-sm">{formData.summary}</p></div>
                <div className="mb-5"><h2 className="text-sm font-bold text-blue-700 uppercase border-b-2 border-blue-700 pb-1 mb-2">Experience</h2>{formData.experience.map((e, i) => <div key={i} className="mb-3"><div className="flex justify-between"><h3 className="font-bold text-gray-900">{e.role}</h3><span className="text-xs text-gray-500">{e.duration}</span></div><p className="text-xs text-blue-600 font-medium">{e.company}</p><p className="text-xs text-gray-600">{e.desc}</p></div>)}</div>
                <div className="mb-5"><h2 className="text-sm font-bold text-blue-700 uppercase border-b-2 border-blue-700 pb-1 mb-2">Education</h2>{formData.education.map((e, i) => <div key={i} className="mb-2"><div className="flex justify-between"><h3 className="font-bold text-gray-900 text-sm">{e.degree}</h3><span className="text-xs text-gray-500">{e.year}</span></div><p className="text-xs text-gray-600">{e.school}</p></div>)}</div>
                <div><h2 className="text-sm font-bold text-blue-700 uppercase border-b-2 border-blue-700 pb-1 mb-2">Skills</h2><div className="flex flex-wrap gap-2">{formData.skills.map((s, i) => s && <span key={i} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{s}</span>)}</div></div>
              </div>
            </div>
          )}

          {/* RED EXECUTIVE TEMPLATE */}
          {template === 'redexecutive' && (
            <div className="border-t-[10px] border-red-700 pt-6">
              <div className="flex justify-between items-end border-b-2 border-red-700 pb-4 mb-6">
                <div><h1 className="text-4xl font-black text-gray-900">{formData.fullName}</h1><p className="text-lg text-red-700 font-semibold mt-1">{formData.jobTitle}</p></div>
                <div className="text-right text-xs text-gray-500 space-y-1"><p>{formData.email}</p><p>{formData.phone}</p><p>{formData.address}</p></div>
              </div>
              <div className="mb-5"><h2 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-1 border-b-2 border-red-700 inline-block pb-1">Profile</h2><p className="text-gray-700 text-sm leading-relaxed mt-2">{formData.summary}</p></div>
              <div className="mb-5"><h2 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-2 border-b-2 border-red-700 inline-block pb-1">Experience</h2>{formData.experience.map((e, i) => <div key={i} className="mb-3"><div className="flex justify-between"><h3 className="font-bold text-gray-900 text-sm">{e.role}</h3><span className="text-xs text-gray-600">{e.duration}</span></div><p className="text-xs font-semibold text-red-700">{e.company}</p><p className="text-xs text-gray-600 mt-1">{e.desc}</p></div>)}</div>
              <div className="mb-5"><h2 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-2 border-b-2 border-red-700 inline-block pb-1">Education</h2>{formData.education.map((e, i) => <div key={i} className="flex justify-between mb-2"><div><h3 className="font-bold text-gray-900 text-sm">{e.degree}</h3><p className="text-xs text-gray-600">{e.school}</p></div><span className="text-xs text-gray-600">{e.year}</span></div>)}</div>
              <div><h2 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-1 border-b-2 border-red-700 inline-block pb-1">Skills</h2><ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2">{formData.skills.map((s, i) => s && <li key={i} className="text-sm text-gray-700">• {s}</li>)}</ul></div>
            </div>
          )}

          {/* GREEN PROFESSIONAL TEMPLATE */}
          {template === 'greenprofessional' && (
            <div>
              <div className="text-center mb-6 bg-green-50 p-6 rounded-xl border border-green-200">
                <h1 className="text-4xl font-bold text-green-900">{formData.fullName}</h1>
                <p className="text-md text-green-700 font-semibold mt-1">{formData.jobTitle}</p>
                <div className="flex justify-center gap-3 text-xs text-gray-600 mt-3"><span>{formData.email}</span> <span>|</span> <span>{formData.phone}</span> <span>|</span> <span>{formData.address}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h2 className="text-sm font-bold text-green-800 uppercase border-b border-green-300 pb-1 mb-2">Experience</h2>
                  {formData.experience.map((e, i) => <div key={i} className="mb-3"><h3 className="font-bold text-gray-900 text-sm">{e.role}</h3><p className="text-xs text-green-700 font-semibold">{e.company} | {e.duration}</p><p className="text-xs text-gray-600 mt-1">{e.desc}</p></div>)}
                  <h2 className="text-sm font-bold text-green-800 uppercase border-b border-green-300 pb-1 mb-2 mt-4">Education</h2>
                  {formData.education.map((e, i) => <div key={i} className="mb-2"><h3 className="font-bold text-gray-900 text-sm">{e.degree}</h3><p className="text-xs text-gray-600">{e.school} | {e.year}</p></div>)}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-green-800 uppercase border-b border-green-300 pb-1 mb-2">Summary</h2>
                  <p className="text-xs text-gray-700 leading-relaxed mb-4">{formData.summary}</p>
                  <h2 className="text-sm font-bold text-green-800 uppercase border-b border-green-300 pb-1 mb-2">Skills</h2>
                  <ul className="text-xs text-gray-700 space-y-1">{formData.skills.map((s, i) => s && <li key={i} className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>{s}</li>)}</ul>
                </div>
              </div>
            </div>
          )}

          {/* DARK MODE TEMPLATE */}
          {template === 'darkmode' && (
            <div className="bg-gray-900 text-white p-8 rounded-xl h-full">
              <div className="border-b border-gray-700 pb-4 mb-6">
                <h1 className="text-4xl font-bold">{formData.fullName}</h1>
                <p className="text-blue-400 font-medium mt-1">{formData.jobTitle}</p>
                <div className="flex gap-4 text-xs text-gray-400 mt-3"><span>{formData.email}</span> <span>•</span> <span>{formData.phone}</span> <span>•</span> <span>{formData.address}</span></div>
              </div>
              <div className="mb-6"><h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2">Summary</h2><p className="text-gray-300 text-sm">{formData.summary}</p></div>
              <div className="mb-6"><h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2">Experience</h2>{formData.experience.map((e, i) => <div key={i} className="mb-3"><div className="flex justify-between"><h3 className="font-bold text-white text-sm">{e.role}</h3><span className="text-xs text-gray-400">{e.duration}</span></div><p className="text-xs text-blue-300 font-medium">{e.company}</p><p className="text-xs text-gray-400">{e.desc}</p></div>)}</div>
              <div className="mb-6"><h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2">Education</h2>{formData.education.map((e, i) => <div key={i} className="mb-2"><div className="flex justify-between"><h3 className="font-bold text-white text-sm">{e.degree}</h3><span className="text-xs text-gray-400">{e.year}</span></div><p className="text-xs text-gray-400">{e.school}</p></div>)}</div>
              <div><h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2">Skills</h2><div className="flex flex-wrap gap-2">{formData.skills.map((s, i) => s && <span key={i} className="bg-gray-800 text-blue-300 text-xs px-2 py-1 rounded border border-gray-700">{s}</span>)}</div></div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}