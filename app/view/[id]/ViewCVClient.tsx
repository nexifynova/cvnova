'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowLeft, Printer, Save, LayoutTemplate } from 'lucide-react';
import Link from 'next/link';

export function ViewCVClient({ id }: { id: string }) {
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState('classicgray');

  const templatesList = ['classicgray', 'modern', 'classic', 'minimal', 'creative', 'executive', 'elegant', 'tech', 'corporate', 'simple', 'bold', 'timeline', 'compact', 'bluecorporate', 'redexecutive', 'greenprofessional', 'darkmode', 'blueheader', 'professional'];

  useEffect(() => {
    if (id) fetchDocument(id);
  }, [id]);

  const fetchDocument = async (docId: string) => {
    const { data, error } = await supabase.from('generated_documents').select('*').eq('id', docId).single();
    if (data) {
      setDoc(data);
      setCurrentTemplate(data.template_name || 'classicgray');
    }
    setLoading(false);
  };

  const handleSaveTemplate = async () => {
    setSaving(true);
    const { error } = await supabase.from('generated_documents').update({ template_name: currentTemplate }).eq('id', id);
    if (error) alert("Error saving template: " + error.message);
    else alert("Template updated successfully!");
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;
  if (!doc) return <div className="text-center py-20 font-bold">Document Not Found</div>;

  const formData = doc.full_data;

  return (
    <div className="min-h-screen bg-gray-200 font-sans">
      {/* Top Navigation Bar */}
      <div className="bg-white shadow-sm py-4 px-6 sticky top-0 z-50 print:hidden">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium">
            <ArrowLeft size={18} /> Back to Dashboard
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border">
              <LayoutTemplate size={18} className="text-gray-500 ml-2" />
              <select value={currentTemplate} onChange={(e) => setCurrentTemplate(e.target.value)} className="bg-transparent outline-none text-sm font-semibold capitalize cursor-pointer py-1 pr-4">
                {templatesList.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            
            <button onClick={handleSaveTemplate} disabled={saving} className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-100 transition">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Design
            </button>

            <button onClick={() => window.print()} className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-800 transition">
              <Printer size={16} /> Print / PDF
            </button>
          </div>
        </div>
      </div>

      {/* Actual CV Preview Area */}
      <div className="py-10 px-4 overflow-x-auto">
        <div id="cv-preview" className="print-area max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-2xl">
          
          {/* TEMPLATE 1: CLASSIC GRAY */}
          {currentTemplate === 'classicgray' && (
            <div className="bg-white h-full text-gray-800">
              <div className="flex h-full">
                <div className="w-[35%] bg-[#E5E7EB] p-6 flex flex-col avoid-break">
                  {formData.photoUrl ? <img src={formData.photoUrl} alt="Profile" className="w-32 h-32 object-cover rounded-full mx-auto mb-6 border-4 border-white shadow-sm" /> : <div className="w-32 h-32 rounded-full bg-gray-300 mx-auto mb-6 border-4 border-white"></div>}
                  <div className="w-full mb-6">
                    <h3 className="font-bold text-gray-900 border-b border-gray-400 pb-1 mb-3 uppercase text-sm">Contact</h3>
                    <div className="text-[11px] space-y-1">
                      <p><strong>Address:</strong><br/>{formData.address}</p>
                      <p className="mt-2"><strong>Phone:</strong><br/>{formData.phone}</p>
                      <p className="mt-2"><strong>Email:</strong><br/>{formData.email}</p>
                    </div>
                  </div>
                  {formData.skills?.some((s: any) => s) && (
                  <div className="w-full mb-6">
                    <h3 className="font-bold text-gray-900 border-b border-gray-400 pb-1 mb-3 uppercase text-sm">Skill Highlights</h3>
                    <ul className="text-[11px] list-disc pl-4 space-y-1">{formData.skills.map((s: any, i: number) => s && <li key={i}>{s}</li>)}</ul>
                  </div>
                  )}
                  {formData.languages?.some((l: any) => l.language) && (
                  <div className="w-full mb-6">
                    <h3 className="font-bold text-gray-900 border-b border-gray-400 pb-1 mb-3 uppercase text-sm">Languages</h3>
                    <ul className="text-[11px] list-disc pl-4 space-y-1">{formData.languages.map((l: any, i: number) => l.language && <li key={i}>{l.language} – {l.proficiency}</li>)}</ul>
                  </div>
                  )}
                  {formData.hobbies?.some((h: any) => h) && (
                  <div className="w-full mb-6">
                    <h3 className="font-bold text-gray-900 border-b border-gray-400 pb-1 mb-3 uppercase text-sm">Hobbies</h3>
                    <ul className="text-[11px] list-disc pl-4 space-y-1">{formData.hobbies.map((h: any, i: number) => h && <li key={i}>{h}</li>)}</ul>
                  </div>
                  )}
                </div>
                <div className="w-[65%] p-8 bg-white">
                  <div className="mb-6 border-b-2 border-gray-200 pb-4 avoid-break">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-wide uppercase">{formData.fullName}</h1>
                    <h2 className="text-lg text-[#D97706] font-semibold mt-1">{formData.jobTitle}</h2>
                  </div>
                  {formData.summary && (
                  <div className="mb-6 avoid-break">
                    <h3 className="font-bold text-gray-800 text-sm mb-2 uppercase tracking-wider border-b border-gray-200 pb-1">Professional Summary</h3>
                    <p className="text-[11px] text-gray-700 leading-relaxed text-justify">{formData.summary}</p>
                  </div>
                  )}
                  {formData.experience?.some((e: any) => e.role) && (
                  <div className="mb-6">
                    <h3 className="font-bold text-gray-800 text-sm mb-3 uppercase tracking-wider border-b border-gray-200 pb-1">Experience</h3>
                    {formData.experience.map((e: any, i: number) => e.role && (
                      <div key={i} className="mb-4 avoid-break">
                        <div className="flex justify-between items-baseline mb-1"><h4 className="font-bold text-xs text-gray-900">{e.role}</h4><span className="text-[10px] text-gray-500">{e.duration}</span></div>
                        <p className="text-[11px] text-gray-800 italic mb-1">{e.company}</p>
                        <ul className="text-[10px] text-gray-600 list-disc pl-4 space-y-1 leading-relaxed">{e.desc.split('\n').map((line: string, idx: number) => line && <li key={idx}>{line}</li>)}</ul>
                      </div>
                    ))}
                  </div>
                  )}
                  {formData.education?.some((e: any) => e.degree) && (
                  <div className="mb-6">
                    <h3 className="font-bold text-gray-800 text-sm mb-3 uppercase tracking-wider border-b border-gray-200 pb-1">Education</h3>
                    {formData.education.map((e: any, i: number) => e.degree && (
                      <div key={i} className="mb-2 avoid-break">
                        <div className="flex justify-between items-baseline"><h4 className="font-bold text-xs text-gray-900">{e.degree}</h4><span className="text-[10px] text-gray-500">{e.year}</span></div>
                        <p className="text-[10px] text-gray-600">{e.school}</p>
                      </div>
                    ))}
                  </div>
                  )}
                  {formData.certifications?.some((c: any) => c.name) && (
                  <div className="mb-6">
                    <h3 className="font-bold text-gray-800 text-sm mb-3 uppercase tracking-wider border-b border-gray-200 pb-1">Certifications</h3>
                    {formData.certifications.map((c: any, i: number) => c.name && (
                      <div key={i} className="mb-2 text-[11px] flex justify-between items-center avoid-break">
                        <div><span className="font-bold text-gray-900">{c.name}</span> {c.year && `(${c.year})`}</div>
                        {c.fileUrl && <a href={c.fileUrl} target="_blank" className="text-blue-500 text-[10px] underline print:hidden">View Cert</a>}
                      </div>
                    ))}
                  </div>
                  )}
                  {formData.references?.some((r: any) => r.name) && (
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm mb-3 uppercase tracking-wider border-b border-gray-200 pb-1">References</h3>
                    <div className="text-[11px]">
                      <p className="italic text-gray-600">References available on request</p>
                      {formData.references.map((r: any, i: number) => r.name && (
                        <div key={i} className="mt-2 avoid-break">
                          <p className="font-bold text-gray-900">{r.name}</p>
                          <p className="text-gray-600">{r.role} | {r.contact}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 2: MODERN */}
          {currentTemplate === 'modern' && (
            <div className="bg-white h-full text-gray-800 p-8">
              <div className="flex gap-6 mb-6 avoid-break">
                {formData.photoUrl && <img src={formData.photoUrl} alt="Profile" className="w-32 h-32 object-cover" />}
                <div className="flex-1 bg-gray-100 p-4"><p className="text-xs text-gray-700 leading-relaxed text-justify">{formData.summary}</p></div>
              </div>
              <div className="bg-gray-600 text-white p-3 mb-6 avoid-break"><h1 className="text-3xl font-bold uppercase tracking-wide">{formData.fullName}</h1></div>
              <div className="flex gap-6">
                <div className="w-1/3">
                  <div className="mb-4 text-xs avoid-break"><p><strong>Phone:</strong><br/>{formData.phone}</p><p className="mt-2"><strong>E-Mail:</strong><br/>{formData.email}</p></div>
                  {formData.skills?.some((s: any) => s) && (<div className="mb-4 avoid-break"><h3 className="font-bold text-sm mb-2 border-b pb-1 uppercase">Skills</h3><ul className="text-[10px] list-disc pl-4">{formData.skills.map((s: any, i: number) => s && <li key={i}>{s}</li>)}</ul></div>)}
                  {formData.languages?.some((l: any) => l.language) && (<div className="mb-4 avoid-break"><h3 className="font-bold text-sm mb-2 border-b pb-1 uppercase">Languages</h3><ul className="text-[10px] list-disc pl-4">{formData.languages.map((l: any, i: number) => l.language && <li key={i}>{l.language} - {l.proficiency}</li>)}</ul></div>)}
                </div>
                <div className="w-2/3">
                  {formData.experience?.some((e: any) => e.role) && (
                  <div className="mb-5">
                    <h3 className="font-bold text-sm mb-3 border-b pb-1 uppercase">Experience</h3>
                    {formData.experience.map((e: any, i: number) => e.role && (<div key={i} className="mb-4 avoid-break"><div className="flex justify-between items-baseline mb-1"><h4 className="font-bold text-xs text-gray-900">{e.role} {e.company && `- ${e.company}`}</h4><span className="text-[10px]">{e.duration}</span></div><ul className="text-[10px] text-gray-600 list-disc pl-4">{e.desc.split('\n').map((line: string, idx: number) => line && <li key={idx}>{line}</li>)}</ul></div>))}
                  </div>
                  )}
                  {formData.education?.some((e: any) => e.degree) && (
                  <div className="mb-5">
                    <h3 className="font-bold text-sm mb-3 border-b pb-1 uppercase">Education</h3>
                    {formData.education.map((e: any, i: number) => e.degree && (<div key={i} className="mb-2 avoid-break"><div className="flex justify-between items-baseline"><h4 className="font-bold text-xs text-gray-900">{e.degree}</h4><span className="text-[10px]">{e.year}</span></div><p className="text-[10px] text-gray-600">{e.school}</p></div>))}
                  </div>
                  )}
                  {formData.certifications?.some((c: any) => c.name) && (<div className="mb-5"><h3 className="font-bold text-sm mb-3 border-b pb-1 uppercase">Certifications</h3><ul className="text-[10px] text-gray-600 space-y-1">{formData.certifications.map((c: any, i: number) => c.name && (<li key={i} className="avoid-break"><span className="font-bold text-gray-900">{c.name}</span> {c.year && `(${c.year})`}{c.fileUrl && <a href={c.fileUrl} target="_blank" className="text-blue-500 ml-2 underline print:hidden">View</a>}</li>))}</ul></div>)}
                  {formData.references?.some((r: any) => r.name) && (<div><h3 className="font-bold text-sm mb-3 border-b pb-1 uppercase">References</h3><p className="text-[10px] italic text-gray-600 mb-2">References available on request</p>{formData.references.map((r: any, i: number) => r.name && (<div key={i} className="mb-2 text-[10px] avoid-break"><p className="font-bold text-gray-900">{r.name}</p><p className="text-gray-600">{r.role} | {r.contact}</p></div>))}</div>)}
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 3: CLASSIC */}
          {currentTemplate === 'classic' && (
            <div className="p-10">
              <div className="text-center border-b-2 border-gray-900 pb-4 mb-6 avoid-break">
                <h1 className="text-3xl font-serif font-bold text-gray-900 tracking-wide">{formData.fullName}</h1>
                <p className="text-md text-gray-600 mt-1">{formData.jobTitle}</p>
                <div className="flex justify-center gap-3 text-xs text-gray-500 mt-2"><span>{formData.email}</span> <span>|</span> <span>{formData.phone}</span> <span>|</span> <span>{formData.address}</span></div>
              </div>
              <div className="mb-5 avoid-break"><h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1">Professional Summary</h2><p className="text-gray-700 text-sm leading-relaxed">{formData.summary}</p></div>
              <div className="mb-5">
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2">Experience</h2>
                {formData.experience?.map((exp: any, i: number) => (
                  <div key={i} className="mb-3 avoid-break">
                    <div className="flex justify-between"><h3 className="font-bold text-gray-900 text-sm">{exp.company}</h3><span className="text-xs text-gray-600">{exp.duration}</span></div>
                    <p className="text-xs italic text-gray-700">{exp.role}</p>
                    <p className="text-xs text-gray-600 mt-1">{exp.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mb-5">
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2">Education</h2>
                {formData.education?.map((edu: any, i: number) => (
                  <div key={i} className="flex justify-between mb-2 avoid-break">
                    <div><h3 className="font-bold text-gray-900 text-sm">{edu.degree}</h3><p className="text-xs text-gray-600">{edu.school}</p></div>
                    <span className="text-xs text-gray-600">{edu.year}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4 avoid-break">
                <div><h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1">Skills</h2><ul className="flex flex-wrap gap-2">{formData.skills?.map((skill: string, i: number) => skill && (<li key={i} className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded">{skill}</li>))}</ul></div>
                <div><h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1">Languages</h2><ul className="text-sm text-gray-700 list-disc pl-4">{formData.languages?.map((l: any, i: number) => l.language && <li key={i}>{l.language} - {l.proficiency}</li>)}</ul></div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4 avoid-break">
                {formData.certifications?.some((c: any) => c.name) && (<div><h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1">Certifications</h2><ul className="text-sm text-gray-700 flex flex-col gap-1">{formData.certifications.map((c: any, i: number) => c.name && <li key={i}>{c.name} {c.year && `(${c.year})`}</li>)}</ul></div>)}
                {formData.references?.some((r: any) => r.name) && (<div><h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1">References</h2><ul className="text-sm text-gray-700">{formData.references.map((r: any, i: number) => r.name && <li key={i}>{r.name} - {r.contact}</li>)}</ul></div>)}
              </div>
            </div>
          )}

          {/* TEMPLATE 4: MINIMAL */}
          {currentTemplate === 'minimal' && (
            <div className="font-light p-10">
              <div className="mb-8 avoid-break"><h1 className="text-4xl text-gray-900 mb-1">{formData.fullName}</h1><p className="text-gray-500 uppercase tracking-widest text-sm">{formData.jobTitle}</p></div>
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-1 text-xs text-gray-500 space-y-4">
                  <div><h3 className="font-bold text-gray-900 uppercase tracking-wider mb-1">Contact</h3><p>{formData.email}</p><p>{formData.phone}</p><p>{formData.address}</p></div>
                  <div><h3 className="font-bold text-gray-900 uppercase tracking-wider mb-1">Skills</h3><ul className="list-disc pl-4">{formData.skills?.map((s: any, i: number) => s && <li key={i}>{s}</li>)}</ul></div>
                  <div><h3 className="font-bold text-gray-900 uppercase tracking-wider mb-1">Languages</h3><ul className="list-disc pl-4">{formData.languages?.map((l: any, i: number) => l.language && <li key={i}>{l.language} ({l.proficiency})</li>)}</ul></div>
                  <div><h3 className="font-bold text-gray-900 uppercase tracking-wider mb-1">Certifications</h3><ul className="list-disc pl-4">{formData.certifications?.map((c: any, i: number) => c.name && <li key={i}>{c.name} ({c.year})</li>)}</ul></div>
                  <div><h3 className="font-bold text-gray-900 uppercase tracking-wider mb-1">Hobbies</h3><ul className="list-disc pl-4">{formData.hobbies?.map((h: any, i: number) => h && <li key={i}>{h}</li>)}</ul></div>
                  <div><h3 className="font-bold text-gray-900 uppercase tracking-wider mb-1">References</h3><ul className="list-disc pl-4">{formData.references?.map((r: any, i: number) => r.name && <li key={i}>{r.name}</li>)}</ul></div>
                </div>
                <div className="col-span-2 space-y-6">
                  <div className="avoid-break"><h3 className="font-bold text-gray-900 uppercase tracking-wider text-sm border-b pb-1 mb-2">Profile</h3><p className="text-sm text-gray-700 leading-relaxed">{formData.summary}</p></div>
                  <div><h3 className="font-bold text-gray-900 uppercase tracking-wider text-sm border-b pb-1 mb-2">Experience</h3>{formData.experience?.map((e: any, i: number) => <div key={i} className="mb-4 avoid-break"><h4 className="font-bold text-gray-800">{e.role}</h4><p className="text-xs text-gray-500 mb-1">{e.company} | {e.duration}</p><p className="text-sm text-gray-700">{e.desc}</p></div>)}</div>
                  <div><h3 className="font-bold text-gray-900 uppercase tracking-wider text-sm border-b pb-1 mb-2">Education</h3>{formData.education?.map((e: any, i: number) => <div key={i} className="mb-4 avoid-break"><h4 className="font-bold text-gray-800">{e.degree}</h4><p className="text-xs text-gray-500 mb-1">{e.school} | {e.year}</p></div>)}</div>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 5: CREATIVE */}
          {currentTemplate === 'creative' && (
            <div className="flex flex-col h-full p-10">
              <div className="bg-gray-900 text-white p-6 rounded-t-xl mb-6 avoid-break"><h1 className="text-4xl font-bold">{formData.fullName}</h1><p className="text-blue-300 font-medium mt-1">{formData.jobTitle}</p></div>
              <div className="flex gap-6 px-2">
                <div className="w-1/3">
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 text-blue-600">Contact</h2>
                  <div className="text-xs text-gray-700 space-y-1 mb-6"><p>{formData.email}</p><p>{formData.phone}</p><p>{formData.address}</p></div>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 text-blue-600">Skills</h2><ul className="text-xs text-gray-700 space-y-1 mb-6">{formData.skills?.map((s: any, i: number) => s && <li key={i}>• {s}</li>)}</ul>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 text-blue-600">Languages</h2><ul className="text-xs text-gray-700 space-y-1 mb-6">{formData.languages?.map((l: any, i: number) => l.language && <li key={i}>• {l.language}</li>)}</ul>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 text-blue-600">Education</h2>{formData.education?.map((e: any, i: number) => <div key={i} className="mb-3 text-xs avoid-break"><p className="font-bold text-gray-900">{e.degree}</p><p>{e.school}</p><p className="text-gray-500">{e.year}</p></div>)}
                </div>
                <div className="w-2/3">
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 text-blue-600">Profile</h2><p className="text-sm text-gray-700 leading-relaxed mb-6 avoid-break">{formData.summary}</p>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 text-blue-600">Experience</h2>{formData.experience?.map((e: any, i: number) => <div key={i} className="mb-4 avoid-break"><h3 className="font-bold text-gray-900 text-sm">{e.role}</h3><p className="text-xs text-blue-600 font-semibold mb-1">{e.company} | {e.duration}</p><p className="text-xs text-gray-700 leading-relaxed">{e.desc}</p></div>)}
                  {formData.certifications?.some((c: any) => c.name) && (<div className="mt-6 avoid-break"><h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 text-blue-600">Certifications</h2><ul className="text-xs text-gray-700 space-y-1">{formData.certifications.map((c: any, i: number) => c.name && <li key={i}>• {c.name} {c.year && `(${c.year})`}</li>)}</ul></div>)}
                  {formData.references?.some((r: any) => r.name) && (<div className="mt-6 avoid-break"><h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 text-blue-600">References</h2><ul className="text-xs text-gray-700 space-y-1">{formData.references.map((r: any, i: number) => r.name && <li key={i}>• {r.name} | {r.contact}</li>)}</ul></div>)}
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 6: EXECUTIVE */}
          {currentTemplate === 'executive' && (
            <div className="border-t-[10px] border-gray-900 pt-6 p-10">
              <div className="flex justify-between items-end border-b-2 border-gray-300 pb-4 mb-6 avoid-break"><div><h1 className="text-4xl font-black text-gray-900">{formData.fullName}</h1><p className="text-lg text-gray-600 mt-1">{formData.jobTitle}</p></div><div className="text-right text-xs text-gray-500 space-y-1"><p>{formData.email}</p><p>{formData.phone}</p><p>{formData.address}</p></div></div>
              <div className="mb-5 avoid-break"><h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1 border-b-2 border-gray-900 inline-block pb-1">Profile</h2><p className="text-gray-700 text-sm leading-relaxed mt-2">{formData.summary}</p></div>
              <div className="mb-5"><h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2 border-b-2 border-gray-900 inline-block pb-1">Experience</h2>{formData.experience?.map((e: any, i: number) => <div key={i} className="mb-3 avoid-break"><div className="flex justify-between"><h3 className="font-bold text-gray-900 text-sm">{e.role}</h3><span className="text-xs text-gray-600">{e.duration}</span></div><p className="text-xs font-semibold text-gray-700">{e.company}</p><p className="text-xs text-gray-600 mt-1">{e.desc}</p></div>)}</div>
              <div className="mb-5"><h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2 border-b-2 border-gray-900 inline-block pb-1">Education</h2>{formData.education?.map((e: any, i: number) => <div key={i} className="flex justify-between mb-2 avoid-break"><div><h3 className="font-bold text-gray-900 text-sm">{e.degree}</h3><p className="text-xs text-gray-600">{e.school}</p></div><span className="text-xs text-gray-600">{e.year}</span></div>)}</div>
              <div className="grid grid-cols-2 gap-4 mb-4 avoid-break"><div><h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1 border-b-2 border-gray-900 inline-block pb-1">Skills</h2><ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2">{formData.skills?.map((s: any, i: number) => s && <li key={i} className="text-sm text-gray-700">• {s}</li>)}</ul></div><div><h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1 border-b-2 border-gray-900 inline-block pb-1">Languages</h2><ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2">{formData.languages?.map((l: any, i: number) => l.language && <li key={i} className="text-sm text-gray-700">• {l.language}</li>)}</ul></div></div>
              <div className="grid grid-cols-2 gap-4 avoid-break">{formData.certifications?.some((c: any) => c.name) && (<div><h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1 border-b-2 border-gray-900 inline-block pb-1">Certifications</h2><ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2">{formData.certifications.map((c: any, i: number) => c.name && <li key={i} className="text-sm text-gray-700">• {c.name}</li>)}</ul></div>)}{formData.references?.some((r: any) => r.name) && (<div><h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1 border-b-2 border-gray-900 inline-block pb-1">References</h2><ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2">{formData.references.map((r: any, i: number) => r.name && <li key={i} className="text-sm text-gray-700">• {r.name}</li>)}</ul></div>)}</div>
            </div>
          )}

          {/* TEMPLATE 7: ELEGANT */}
          {currentTemplate === 'elegant' && (
            <div className="font-serif p-10">
              <div className="text-center mb-8 border-b border-gray-300 pb-6 avoid-break"><h1 className="text-4xl font-normal text-gray-800 tracking-wider mb-2">{formData.fullName}</h1><p className="text-sm text-gray-500 uppercase tracking-[0.3em]">{formData.jobTitle}</p><div className="flex justify-center gap-4 text-xs text-gray-500 mt-4"><span>{formData.email}</span> <span>•</span> <span>{formData.phone}</span> <span>•</span> <span>{formData.address}</span></div></div>
              <div className="grid grid-cols-12 gap-8">
                <div className="col-span-8 space-y-6">
                  <div><h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3 pb-1 border-b border-gray-200">Experience</h2>{formData.experience?.map((e: any, i: number) => <div key={i} className="mb-4 avoid-break"><h3 className="font-bold text-gray-900 text-sm">{e.role}</h3><p className="text-xs italic text-gray-600 mb-1">{e.company} | {e.duration}</p><p className="text-xs text-gray-700 leading-relaxed">{e.desc}</p></div>)}</div>
                  <div><h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3 pb-1 border-b border-gray-200">Education</h2>{formData.education?.map((e: any, i: number) => <div key={i} className="mb-3 avoid-break"><h3 className="font-bold text-gray-900 text-sm">{e.degree}</h3><p className="text-xs text-gray-600">{e.school} | {e.year}</p></div>)}</div>
                </div>
                <div className="col-span-4 space-y-6">
                  <div className="avoid-break"><h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3 pb-1 border-b border-gray-200">Profile</h2><p className="text-xs text-gray-700 leading-relaxed">{formData.summary}</p></div>
                  <div><h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3 pb-1 border-b border-gray-200">Skills</h2><ul className="text-xs text-gray-700 space-y-1">{formData.skills?.map((s: any, i: number) => s && <li key={i}>{s}</li>)}</ul></div>
                  <div><h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3 pb-1 border-b border-gray-200">Languages</h2><ul className="text-xs text-gray-700 space-y-1">{formData.languages?.map((l: any, i: number) => l.language && <li key={i}>{l.language}</li>)}</ul></div>
                  <div><h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3 pb-1 border-b border-gray-200">Certifications</h2><ul className="text-xs text-gray-700 space-y-1">{formData.certifications?.map((c: any, i: number) => c.name && <li key={i}>{c.name}</li>)}</ul></div>
                  <div><h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3 pb-1 border-b border-gray-200">References</h2><ul className="text-xs text-gray-700 space-y-1">{formData.references?.map((r: any, i: number) => r.name && <li key={i}>{r.name}</li>)}</ul></div>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 8: TECH */}
          {currentTemplate === 'tech' && (
            <div className="font-mono text-sm p-10">
              <div className="mb-6 avoid-break"><h1 className="text-3xl font-bold text-gray-900">{formData.fullName}</h1><p className="text-blue-600">{formData.jobTitle}</p><div className="text-xs text-gray-500 mt-2">[{formData.email}] [{formData.phone}] [{formData.address}]</div></div>
              <div className="mb-4 avoid-break"><span className="text-blue-600 font-bold">## Summary</span><p className="text-gray-700 mt-1">{formData.summary}</p></div>
              <div className="mb-4"><span className="text-blue-600 font-bold">## Experience</span>{formData.experience?.map((e: any, i: number) => <div key={i} className="mt-2 avoid-break"><p className="font-bold text-gray-900">{e.role} @ {e.company} ({e.duration})</p><p className="text-gray-600">{e.desc}</p></div>)}</div>
              <div className="mb-4"><span className="text-blue-600 font-bold">## Education</span>{formData.education?.map((e: any, i: number) => <div key={i} className="mt-2 avoid-break"><p className="font-bold text-gray-900">{e.degree}</p><p className="text-gray-600">{e.school} ({e.year})</p></div>)}</div>
              <div className="mb-4 avoid-break"><span className="text-blue-600 font-bold">## Skills</span><p className="text-gray-700 mt-1">{formData.skills?.join(', ')}</p></div>
              <div className="mb-4 avoid-break"><span className="text-blue-600 font-bold">## Languages</span><p className="text-gray-700 mt-1">{formData.languages?.map((l: any) => l.language).join(', ')}</p></div>
              <div className="mb-4"><span className="text-blue-600 font-bold">## Certifications</span><ul className="text-gray-700 mt-1 list-disc pl-4">{formData.certifications?.map((c: any, i: number) => c.name && <li key={i} className="avoid-break">{c.name} ({c.year})</li>)}</ul></div>
              <div><span className="text-blue-600 font-bold">## References</span><ul className="text-gray-700 mt-1 list-disc pl-4">{formData.references?.map((r: any, i: number) => r.name && <li key={i} className="avoid-break">{r.name} - {r.contact}</li>)}</ul></div>
            </div>
          )}

          {/* TEMPLATE 9: CORPORATE */}
          {currentTemplate === 'corporate' && (
            <div className="p-10">
              <div className="bg-blue-900 text-white p-6 mb-6 avoid-break"><h1 className="text-3xl font-bold uppercase tracking-wider">{formData.fullName}</h1><p className="text-blue-200 mt-1">{formData.jobTitle}</p><div className="flex gap-4 text-xs text-blue-200 mt-3"><span>{formData.email}</span> <span>|</span> <span>{formData.phone}</span> <span>|</span> <span>{formData.address}</span></div></div>
              <div className="px-4">
                <div className="mb-6 avoid-break"><h2 className="text-sm font-bold text-blue-900 uppercase border-b border-blue-900 pb-1 mb-2">Profile</h2><p className="text-gray-700 text-sm">{formData.summary}</p></div>
                <div className="mb-6"><h2 className="text-sm font-bold text-blue-900 uppercase border-b border-blue-900 pb-1 mb-2">Experience</h2>{formData.experience?.map((e: any, i: number) => <div key={i} className="mb-3 avoid-break"><div className="flex justify-between"><h3 className="font-bold text-gray-900">{e.role}</h3><span className="text-xs text-gray-500">{e.duration}</span></div><p className="text-xs text-blue-700 font-medium">{e.company}</p><p className="text-xs text-gray-600">{e.desc}</p></div>)}</div>
                <div className="mb-6"><h2 className="text-sm font-bold text-blue-900 uppercase border-b border-blue-900 pb-1 mb-2">Education</h2>{formData.education?.map((e: any, i: number) => <div key={i} className="mb-2 avoid-break"><div className="flex justify-between"><h3 className="font-bold text-gray-900 text-sm">{e.degree}</h3><span className="text-xs text-gray-500">{e.year}</span></div><p className="text-xs text-gray-600">{e.school}</p></div>)}</div>
                <div className="grid grid-cols-2 gap-4 mb-4 avoid-break"><div><h2 className="text-sm font-bold text-blue-900 uppercase border-b border-blue-900 pb-1 mb-2">Skills</h2><div className="flex flex-wrap gap-2">{formData.skills?.map((s: any, i: number) => s && <span key={i} className="bg-blue-50 text-blue-800 text-xs px-2 py-1 rounded border border-blue-200">{s}</span>)}</div></div><div><h2 className="text-sm font-bold text-blue-900 uppercase border-b border-blue-900 pb-1 mb-2">Languages</h2><ul className="text-xs text-gray-700 list-disc pl-4">{formData.languages?.map((l: any, i: number) => l.language && <li key={i}>{l.language}</li>)}</ul></div></div>
                <div className="grid grid-cols-2 gap-4 avoid-break">{formData.certifications?.some((c: any) => c.name) && (<div><h2 className="text-sm font-bold text-blue-900 uppercase border-b border-blue-900 pb-1 mb-2">Certifications</h2><ul className="text-xs text-gray-700 list-disc pl-4">{formData.certifications.map((c: any, i: number) => c.name && <li key={i}>{c.name}</li>)}</ul></div>)}{formData.references?.some((r: any) => r.name) && (<div><h2 className="text-sm font-bold text-blue-900 uppercase border-b border-blue-900 pb-1 mb-2">References</h2><ul className="text-xs text-gray-700 list-disc pl-4">{formData.references.map((r: any, i: number) => r.name && <li key={i}>{r.name}</li>)}</ul></div>)}</div>
              </div>
            </div>
          )}

          {/* TEMPLATE 10: SIMPLE */}
          {currentTemplate === 'simple' && (
            <div className="text-gray-800 p-10">
              <div className="mb-6 avoid-break"><h1 className="text-3xl font-bold">{formData.fullName}</h1><p className="text-gray-600">{formData.jobTitle}</p><p className="text-xs text-gray-500 mt-1">{formData.email} | {formData.phone} | {formData.address}</p></div>
              <hr className="mb-4 border-gray-300" />
              <div className="mb-4 avoid-break"><h2 className="font-bold text-gray-900 mb-1">Summary</h2><p className="text-sm text-gray-700">{formData.summary}</p></div>
              <hr className="mb-4 border-gray-300" />
              <div className="mb-4"><h2 className="font-bold text-gray-900 mb-2">Experience</h2>{formData.experience?.map((e: any, i: number) => <div key={i} className="mb-3 avoid-break"><div className="flex justify-between"><h3 className="font-semibold text-sm">{e.role}</h3><span className="text-xs text-gray-500">{e.duration}</span></div><p className="text-xs text-gray-600 italic">{e.company}</p><p className="text-sm text-gray-700 mt-1">{e.desc}</p></div>)}</div>
              <hr className="mb-4 border-gray-300" />
              <div className="mb-4"><h2 className="font-bold text-gray-900 mb-2">Education</h2>{formData.education?.map((e: any, i: number) => <div key={i} className="mb-2 avoid-break"><div className="flex justify-between"><h3 className="font-semibold text-sm">{e.degree}</h3><span className="text-xs text-gray-500">{e.year}</span></div><p className="text-sm text-gray-600">{e.school}</p></div>)}</div>
              <hr className="mb-4 border-gray-300" />
              <div className="grid grid-cols-2 gap-4 mb-4 avoid-break"><div><h2 className="font-bold text-gray-900 mb-1">Skills</h2><p className="text-sm text-gray-700">{formData.skills?.join(' • ')}</p></div><div><h2 className="font-bold text-gray-900 mb-1">Languages</h2><p className="text-sm text-gray-700">{formData.languages?.map((l: any) => l.language).join(' • ')}</p></div></div>
              <hr className="mb-4 border-gray-300" />
              <div className="grid grid-cols-2 gap-4 avoid-break"><div><h2 className="font-bold text-gray-900 mb-1">Certifications</h2><p className="text-sm text-gray-700">{formData.certifications?.map((c: any) => c.name).join(' • ')}</p></div><div><h2 className="font-bold text-gray-900 mb-1">References</h2><p className="text-sm text-gray-700">{formData.references?.map((r: any) => r.name).join(' • ')}</p></div></div>
            </div>
          )}

          {/* TEMPLATE 11: BOLD */}
          {currentTemplate === 'bold' && (
            <div className="p-10">
              <div className="mb-6 avoid-break"><h1 className="text-5xl font-black text-gray-900 uppercase leading-none">{formData.fullName}</h1><p className="text-xl font-bold text-gray-500 mt-1">{formData.jobTitle}</p></div>
              <div className="bg-gray-100 p-4 mb-6 flex gap-4 text-xs font-semibold text-gray-600 avoid-break">{formData.email} <span>/</span> {formData.phone} <span>/</span> {formData.address}</div>
              <div className="mb-6 avoid-break"><h2 className="text-xl font-black text-gray-900 uppercase mb-2">Profile</h2><p className="text-sm text-gray-700">{formData.summary}</p></div>
              <div className="mb-6"><h2 className="text-xl font-black text-gray-900 uppercase mb-3">Experience</h2>{formData.experience?.map((e: any, i: number) => <div key={i} className="mb-4 avoid-break"><h3 className="font-bold text-lg text-gray-900">{e.role}</h3><p className="text-xs font-bold text-gray-500 uppercase">{e.company} / {e.duration}</p><p className="text-sm text-gray-700 mt-1">{e.desc}</p></div>)}</div>
              <div className="mb-6"><h2 className="text-xl font-black text-gray-900 uppercase mb-3">Education</h2>{formData.education?.map((e: any, i: number) => <div key={i} className="mb-3 avoid-break"><h3 className="font-bold text-lg text-gray-900">{e.degree}</h3><p className="text-sm text-gray-600">{e.school} / {e.year}</p></div>)}</div>
              <div className="grid grid-cols-2 gap-4 mb-4 avoid-break"><div><h2 className="text-xl font-black text-gray-900 uppercase mb-2">Skills</h2><ul className="grid grid-cols-1 gap-2">{formData.skills?.map((s: any, i: number) => s && <li key={i} className="font-bold text-gray-800 text-sm border-l-4 border-gray-900 pl-2">{s}</li>)}</ul></div><div><h2 className="text-xl font-black text-gray-900 uppercase mb-2">Languages</h2><ul className="grid grid-cols-1 gap-2">{formData.languages?.map((l: any, i: number) => l.language && <li key={i} className="font-bold text-gray-800 text-sm border-l-4 border-gray-500 pl-2">{l.language}</li>)}</ul></div></div>
              <div className="grid grid-cols-2 gap-4 avoid-break"><div><h2 className="text-xl font-black text-gray-900 uppercase mb-2">Certifications</h2><ul className="grid grid-cols-1 gap-2">{formData.certifications?.map((c: any, i: number) => c.name && <li key={i} className="font-bold text-gray-800 text-sm border-l-4 border-gray-900 pl-2">{c.name}</li>)}</ul></div><div><h2 className="text-xl font-black text-gray-900 uppercase mb-2">References</h2><ul className="grid grid-cols-1 gap-2">{formData.references?.map((r: any, i: number) => r.name && <li key={i} className="font-bold text-gray-800 text-sm border-l-4 border-gray-500 pl-2">{r.name}</li>)}</ul></div></div>
            </div>
          )}

          {/* TEMPLATE 12: TIMELINE */}
          {currentTemplate === 'timeline' && (
            <div className="p-10">
              <div className="text-center mb-8 avoid-break"><h1 className="text-3xl font-bold text-gray-900">{formData.fullName}</h1><p className="text-gray-500">{formData.jobTitle}</p><div className="text-xs text-gray-400 mt-2">{formData.email} • {formData.phone} • {formData.address}</div></div>
              <div className="relative border-l-2 border-blue-200 ml-3 pl-6 mb-8 avoid-break"><div className="absolute w-4 h-4 bg-blue-600 rounded-full -left-[9px] top-1"></div><h2 className="text-sm font-bold text-blue-600 uppercase mb-2">Summary</h2><p className="text-sm text-gray-700">{formData.summary}</p></div>
              <div className="relative border-l-2 border-blue-200 ml-3 pl-6 mb-8"><div className="absolute w-4 h-4 bg-blue-600 rounded-full -left-[9px] top-1"></div><h2 className="text-sm font-bold text-blue-600 uppercase mb-3">Experience</h2>{formData.experience?.map((e: any, i: number) => <div key={i} className="mb-4 avoid-break"><h3 className="font-bold text-gray-900">{e.role}</h3><p className="text-xs text-gray-500 mb-1">{e.company} | {e.duration}</p><p className="text-sm text-gray-700">{e.desc}</p></div>)}</div>
              <div className="relative border-l-2 border-blue-200 ml-3 pl-6 mb-8"><div className="absolute w-4 h-4 bg-blue-600 rounded-full -left-[9px] top-1"></div><h2 className="text-sm font-bold text-blue-600 uppercase mb-3">Education</h2>{formData.education?.map((e: any, i: number) => <div key={i} className="mb-3 avoid-break"><h3 className="font-bold text-gray-900">{e.degree}</h3><p className="text-sm text-gray-600">{e.school} | {e.year}</p></div>)}</div>
              <div className="relative border-l-2 border-blue-200 ml-3 pl-6 mb-8 avoid-break"><div className="absolute w-4 h-4 bg-blue-600 rounded-full -left-[9px] top-1"></div><h2 className="text-sm font-bold text-blue-600 uppercase mb-2">Skills</h2><div className="flex flex-wrap gap-2">{formData.skills?.map((s: any, i: number) => s && <span key={i} className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">{s}</span>)}</div></div>
              <div className="relative border-l-2 border-blue-200 ml-3 pl-6 avoid-break"><div className="absolute w-4 h-4 bg-blue-600 rounded-full -left-[9px] top-1"></div><h2 className="text-sm font-bold text-blue-600 uppercase mb-2">Languages</h2><div className="flex flex-wrap gap-2">{formData.languages?.map((l: any, i: number) => l.language && <span key={i} className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">{l.language}</span>)}</div></div>
            </div>
          )}

          {/* TEMPLATE 13: COMPACT */}
          {currentTemplate === 'compact' && (
            <div className="text-sm p-10">
              <div className="mb-4 border-b pb-2 avoid-break"><h1 className="text-2xl font-bold text-gray-900">{formData.fullName}</h1><p className="text-gray-600">{formData.jobTitle} | {formData.email} | {formData.phone} | {formData.address}</p></div>
              <div className="mb-3 avoid-break"><p className="text-gray-700">{formData.summary}</p></div>
              <div className="mb-3"><h2 className="font-bold text-gray-900 uppercase text-xs mb-1">Experience</h2>{formData.experience?.map((e: any, i: number) => <div key={i} className="mb-2 avoid-break"><span className="font-bold text-gray-800">{e.role}</span>, {e.company} <span className="text-gray-500">({e.duration})</span><p className="text-gray-600">{e.desc}</p></div>)}</div>
              <div className="mb-3"><h2 className="font-bold text-gray-900 uppercase text-xs mb-1">Education</h2>{formData.education?.map((e: any, i: number) => <div key={i} className="mb-1 avoid-break"><span className="font-bold text-gray-800">{e.degree}</span>, {e.school} <span className="text-gray-500">({e.year})</span></div>)}</div>
              <div className="mb-3 avoid-break"><h2 className="font-bold text-gray-900 uppercase text-xs mb-1">Skills</h2><p className="text-gray-700">{formData.skills?.join(', ')}</p></div>
              <div className="mb-3 avoid-break"><h2 className="font-bold text-gray-900 uppercase text-xs mb-1">Languages</h2><p className="text-gray-700">{formData.languages?.map((l: any) => l.language).join(', ')}</p></div>
              <div className="grid grid-cols-2 gap-4 avoid-break"><div><h2 className="font-bold text-gray-900 uppercase text-xs mb-1">Certifications</h2><p className="text-gray-700">{formData.certifications?.map((c: any) => c.name).join(', ')}</p></div><div><h2 className="font-bold text-gray-900 uppercase text-xs mb-1">References</h2><p className="text-gray-700">{formData.references?.map((r: any) => r.name).join(', ')}</p></div></div>
            </div>
          )}

          {/* TEMPLATE 14: BLUE CORPORATE */}
          {currentTemplate === 'bluecorporate' && (
            <div className="p-10">
              <div className="bg-blue-700 text-white p-6 rounded-t-xl mb-6 avoid-break"><h1 className="text-4xl font-bold">{formData.fullName}</h1><p className="text-blue-200 font-medium mt-1">{formData.jobTitle}</p><div className="flex gap-4 text-xs text-blue-200 mt-3"><span>{formData.email}</span> <span>•</span> <span>{formData.phone}</span> <span>•</span> <span>{formData.address}</span></div></div>
              <div className="px-4">
                <div className="mb-5 avoid-break"><h2 className="text-sm font-bold text-blue-700 uppercase border-b-2 border-blue-700 pb-1 mb-2">Profile</h2><p className="text-gray-700 text-sm">{formData.summary}</p></div>
                <div className="mb-5"><h2 className="text-sm font-bold text-blue-700 uppercase border-b-2 border-blue-700 pb-1 mb-2">Experience</h2>{formData.experience?.map((e: any, i: number) => <div key={i} className="mb-3 avoid-break"><div className="flex justify-between"><h3 className="font-bold text-gray-900">{e.role}</h3><span className="text-xs text-gray-500">{e.duration}</span></div><p className="text-xs text-blue-600 font-medium">{e.company}</p><p className="text-xs text-gray-600">{e.desc}</p></div>)}</div>
                <div className="mb-5"><h2 className="text-sm font-bold text-blue-700 uppercase border-b-2 border-blue-700 pb-1 mb-2">Education</h2>{formData.education?.map((e: any, i: number) => <div key={i} className="mb-2 avoid-break"><div className="flex justify-between"><h3 className="font-bold text-gray-900 text-sm">{e.degree}</h3><span className="text-xs text-gray-500">{e.year}</span></div><p className="text-xs text-gray-600">{e.school}</p></div>)}</div>
                <div className="grid grid-cols-2 gap-4 mb-4 avoid-break"><div><h2 className="text-sm font-bold text-blue-700 uppercase border-b-2 border-blue-700 pb-1 mb-2">Skills</h2><div className="flex flex-wrap gap-2">{formData.skills?.map((s: any, i: number) => s && <span key={i} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{s}</span>)}</div></div><div><h2 className="text-sm font-bold text-blue-700 uppercase border-b-2 border-blue-700 pb-1 mb-2">Languages</h2><ul className="text-xs text-gray-700 list-disc pl-4">{formData.languages?.map((l: any, i: number) => l.language && <li key={i}>{l.language}</li>)}</ul></div></div>
                <div className="grid grid-cols-2 gap-4 avoid-break">{formData.certifications?.some((c: any) => c.name) && (<div><h2 className="text-sm font-bold text-blue-700 uppercase border-b-2 border-blue-700 pb-1 mb-2">Certifications</h2><ul className="text-xs text-gray-700 list-disc pl-4">{formData.certifications.map((c: any, i: number) => c.name && <li key={i}>{c.name}</li>)}</ul></div>)}{formData.references?.some((r: any) => r.name) && (<div><h2 className="text-sm font-bold text-blue-700 uppercase border-b-2 border-blue-700 pb-1 mb-2">References</h2><ul className="text-xs text-gray-700 list-disc pl-4">{formData.references.map((r: any, i: number) => r.name && <li key={i}>{r.name}</li>)}</ul></div>)}</div>
              </div>
            </div>
          )}

          {/* TEMPLATE 15: RED EXECUTIVE */}
          {currentTemplate === 'redexecutive' && (
            <div className="border-t-[10px] border-red-700 pt-6 p-10">
              <div className="flex justify-between items-end border-b-2 border-red-700 pb-4 mb-6 avoid-break"><div><h1 className="text-4xl font-black text-gray-900">{formData.fullName}</h1><p className="text-lg text-red-700 font-semibold mt-1">{formData.jobTitle}</p></div><div className="text-right text-xs text-gray-500 space-y-1"><p>{formData.email}</p><p>{formData.phone}</p><p>{formData.address}</p></div></div>
              <div className="mb-5 avoid-break"><h2 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-1 border-b-2 border-red-700 inline-block pb-1">Profile</h2><p className="text-gray-700 text-sm leading-relaxed mt-2">{formData.summary}</p></div>
              <div className="mb-5"><h2 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-2 border-b-2 border-red-700 inline-block pb-1">Experience</h2>{formData.experience?.map((e: any, i: number) => <div key={i} className="mb-3 avoid-break"><div className="flex justify-between"><h3 className="font-bold text-gray-900 text-sm">{e.role}</h3><span className="text-xs text-gray-600">{e.duration}</span></div><p className="text-xs font-semibold text-red-700">{e.company}</p><p className="text-xs text-gray-600 mt-1">{e.desc}</p></div>)}</div>
              <div className="mb-5"><h2 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-2 border-b-2 border-red-700 inline-block pb-1">Education</h2>{formData.education?.map((e: any, i: number) => <div key={i} className="flex justify-between mb-2 avoid-break"><div><h3 className="font-bold text-gray-900 text-sm">{e.degree}</h3><p className="text-xs text-gray-600">{e.school}</p></div><span className="text-xs text-gray-600">{e.year}</span></div>)}</div>
              <div className="grid grid-cols-2 gap-4 mb-4 avoid-break"><div><h2 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-1 border-b-2 border-red-700 inline-block pb-1">Skills</h2><ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2">{formData.skills?.map((s: any, i: number) => s && <li key={i} className="text-sm text-gray-700">• {s}</li>)}</ul></div><div><h2 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-1 border-b-2 border-red-700 inline-block pb-1">Languages</h2><ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2">{formData.languages?.map((l: any, i: number) => l.language && <li key={i} className="text-sm text-gray-700">• {l.language}</li>)}</ul></div></div>
              <div className="grid grid-cols-2 gap-4 avoid-break">{formData.certifications?.some((c: any) => c.name) && (<div><h2 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-1 border-b-2 border-red-700 inline-block pb-1">Certifications</h2><ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2">{formData.certifications.map((c: any, i: number) => c.name && <li key={i} className="text-sm text-gray-700">• {c.name}</li>)}</ul></div>)}{formData.references?.some((r: any) => r.name) && (<div><h2 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-1 border-b-2 border-red-700 inline-block pb-1">References</h2><ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2">{formData.references.map((r: any, i: number) => r.name && <li key={i} className="text-sm text-gray-700">• {r.name}</li>)}</ul></div>)}</div>
            </div>
          )}

          {/* TEMPLATE 16: GREEN PROFESSIONAL */}
          {currentTemplate === 'greenprofessional' && (
            <div className="p-10">
              <div className="text-center mb-6 bg-green-50 p-6 rounded-xl border border-green-200 avoid-break"><h1 className="text-4xl font-bold text-green-900">{formData.fullName}</h1><p className="text-md text-green-700 font-semibold mt-1">{formData.jobTitle}</p><div className="flex justify-center gap-3 text-xs text-gray-600 mt-3"><span>{formData.email}</span> <span>|</span> <span>{formData.phone}</span> <span>|</span> <span>{formData.address}</span></div></div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h2 className="text-sm font-bold text-green-800 uppercase border-b border-green-300 pb-1 mb-2">Experience</h2>{formData.experience?.map((e: any, i: number) => <div key={i} className="mb-3 avoid-break"><h3 className="font-bold text-gray-900 text-sm">{e.role}</h3><p className="text-xs text-green-700 font-semibold">{e.company} | {e.duration}</p><p className="text-xs text-gray-600 mt-1">{e.desc}</p></div>)}
                  <h2 className="text-sm font-bold text-green-800 uppercase border-b border-green-300 pb-1 mb-2 mt-4">Education</h2>{formData.education?.map((e: any, i: number) => <div key={i} className="mb-2 avoid-break"><h3 className="font-bold text-gray-900 text-sm">{e.degree}</h3><p className="text-xs text-gray-600">{e.school} | {e.year}</p></div>)}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-green-800 uppercase border-b border-green-300 pb-1 mb-2">Summary</h2><p className="text-xs text-gray-700 leading-relaxed mb-4 avoid-break">{formData.summary}</p>
                  <h2 className="text-sm font-bold text-green-800 uppercase border-b border-green-300 pb-1 mb-2">Skills</h2><ul className="text-xs text-gray-700 space-y-1 mb-4">{formData.skills?.map((s: any, i: number) => s && <li key={i} className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>{s}</li>)}</ul>
                  <h2 className="text-sm font-bold text-green-800 uppercase border-b border-green-300 pb-1 mb-2">Languages</h2><ul className="text-xs text-gray-700 space-y-1 mb-4">{formData.languages?.map((l: any, i: number) => l.language && <li key={i}>{l.language}</li>)}</ul>
                  <h2 className="text-sm font-bold text-green-800 uppercase border-b border-green-300 pb-1 mb-2">Certifications</h2><ul className="text-xs text-gray-700 space-y-1 mb-4">{formData.certifications?.map((c: any, i: number) => c.name && <li key={i}>{c.name}</li>)}</ul>
                  <h2 className="text-sm font-bold text-green-800 uppercase border-b border-green-300 pb-1 mb-2">References</h2><ul className="text-xs text-gray-700 space-y-1">{formData.references?.map((r: any, i: number) => r.name && <li key={i}>{r.name}</li>)}</ul>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 17: DARK MODE */}
          {currentTemplate === 'darkmode' && (
            <div className="bg-gray-900 text-white p-8 rounded-xl h-full">
              <div className="border-b border-gray-700 pb-4 mb-6 avoid-break"><h1 className="text-4xl font-bold">{formData.fullName}</h1><p className="text-blue-400 font-medium mt-1">{formData.jobTitle}</p><div className="flex gap-4 text-xs text-gray-400 mt-3"><span>{formData.email}</span> <span>•</span> <span>{formData.phone}</span> <span>•</span> <span>{formData.address}</span></div></div>
              <div className="mb-6 avoid-break"><h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2">Summary</h2><p className="text-gray-300 text-sm">{formData.summary}</p></div>
              <div className="mb-6"><h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2">Experience</h2>{formData.experience?.map((e: any, i: number) => <div key={i} className="mb-3 avoid-break"><div className="flex justify-between"><h3 className="font-bold text-white text-sm">{e.role}</h3><span className="text-xs text-gray-400">{e.duration}</span></div><p className="text-xs text-blue-300 font-medium">{e.company}</p><p className="text-xs text-gray-400">{e.desc}</p></div>)}</div>
              <div className="mb-6"><h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2">Education</h2>{formData.education?.map((e: any, i: number) => <div key={i} className="mb-2 avoid-break"><div className="flex justify-between"><h3 className="font-bold text-white text-sm">{e.degree}</h3><span className="text-xs text-gray-400">{e.year}</span></div><p className="text-xs text-gray-400">{e.school}</p></div>)}</div>
              <div className="grid grid-cols-2 gap-4 mb-4 avoid-break"><div><h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2">Skills</h2><div className="flex flex-wrap gap-2">{formData.skills?.map((s: any, i: number) => s && <span key={i} className="bg-gray-800 text-blue-300 text-xs px-2 py-1 rounded border border-gray-700">{s}</span>)}</div></div><div><h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2">Languages</h2><ul className="text-xs text-gray-400 list-disc pl-4">{formData.languages?.map((l: any, i: number) => l.language && <li key={i}>{l.language}</li>)}</ul></div></div>
              <div className="grid grid-cols-2 gap-4 avoid-break"><div><h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2">Certifications</h2><ul className="text-xs text-gray-400 list-disc pl-4">{formData.certifications?.map((c: any, i: number) => c.name && <li key={i}>{c.name}</li>)}</ul></div><div><h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2">References</h2><ul className="text-xs text-gray-400 list-disc pl-4">{formData.references?.map((r: any, i: number) => r.name && <li key={i}>{r.name}</li>)}</ul></div></div>
            </div>
          )}

          {/* TEMPLATE 18: BLUE HEADER */}
          {currentTemplate === 'blueheader' && (
            <div className="bg-white h-full text-gray-800">
              <div className="bg-[#6CA0DC] text-white p-8 flex items-center justify-between avoid-break">
                 <div><h1 className="text-4xl font-bold uppercase tracking-wider">{formData.fullName}</h1><h2 className="text-lg font-medium mt-1 opacity-90">{formData.jobTitle}</h2></div>
                 <div className="text-xs text-right space-y-1"><p className="font-bold">Address:</p><p>{formData.address}</p><p className="font-bold mt-1">Phone:</p><p>{formData.phone}</p><p className="font-bold mt-1">Email:</p><p>{formData.email}</p></div>
              </div>
              <div className="p-8">
                {formData.summary && (<div className="mb-6 avoid-break"><h3 className="font-bold text-gray-800 text-sm mb-2 border-b-2 border-gray-300 pb-1">Summary</h3><p className="text-xs text-gray-600 leading-relaxed text-justify">{formData.summary}</p></div>)}
                <div className="grid grid-cols-3 gap-8">
                  <div className="col-span-2 space-y-6">
                    {formData.experience?.some((e: any) => e.role) && (<div><h3 className="font-bold text-gray-800 text-sm mb-2 border-b-2 border-gray-300 pb-1">Experience</h3>{formData.experience.map((e: any, i: number) => e.role && (<div key={i} className="mb-4 avoid-break"><div className="flex justify-between items-baseline mb-1"><h4 className="font-bold text-sm text-gray-900">{e.role}</h4><span className="text-[10px] font-semibold text-gray-600">{e.duration}</span></div><p className="text-xs font-semibold text-gray-700 mb-1">{e.company}</p><ul className="text-[10px] text-gray-600 list-disc pl-4 space-y-1">{e.desc.split('\n').map((line: string, idx: number) => line && <li key={idx}>{line}</li>)}</ul></div>))}</div>)}
                    {formData.education?.some((e: any) => e.degree) && (<div><h3 className="font-bold text-gray-800 text-sm mb-2 border-b-2 border-gray-300 pb-1">Education</h3>{formData.education.map((e: any, i: number) => e.degree && (<div key={i} className="mb-2 avoid-break"><div className="flex justify-between items-baseline"><h4 className="font-bold text-xs text-gray-900">{e.degree}</h4><span className="text-[10px] text-gray-500">{e.year}</span></div><p className="text-[10px] text-gray-600">{e.school}</p></div>))}</div>)}
                  </div>
                  <div className="col-span-1 space-y-6">
                    {formData.skills?.some((s: any) => s) && (<div className="avoid-break"><h3 className="font-bold text-gray-800 text-sm mb-2 border-b-2 border-gray-300 pb-1">Skill Highlights</h3><ul className="text-[10px] text-gray-600 list-disc pl-4 space-y-1">{formData.skills.map((s: any, i: number) => s && <li key={i}>{s}</li>)}</ul></div>)}
                    {formData.languages?.some((l: any) => l.language) && (<div className="avoid-break"><h3 className="font-bold text-gray-800 text-sm mb-2 border-b-2 border-gray-300 pb-1">Languages</h3><ul className="text-[10px] text-gray-600 list-disc pl-4 space-y-1">{formData.languages.map((l: any, i: number) => l.language && <li key={i}>{l.language} - {l.proficiency}</li>)}</ul></div>)}
                    {formData.certifications?.some((c: any) => c.name) && (<div className="avoid-break"><h3 className="font-bold text-gray-800 text-sm mb-2 border-b-2 border-gray-300 pb-1">Certifications</h3><ul className="text-[10px] text-gray-600 list-disc pl-4 space-y-1">{formData.certifications.map((c: any, i: number) => c.name && (<li key={i} className="flex flex-col avoid-break"><span>{c.name} {c.year && `(${c.year})`}</span>{c.fileUrl && <a href={c.fileUrl} target="_blank" className="text-blue-500 text-[9px] underline print:hidden">View Certificate</a>}</li>))}</ul></div>)}
                    {formData.references?.some((r: any) => r.name) && (<div className="avoid-break"><h3 className="font-bold text-gray-800 text-sm mb-2 border-b-2 border-gray-300 pb-1">References</h3><ul className="text-[10px] text-gray-600 list-disc pl-4 space-y-1">{formData.references.map((r: any, i: number) => r.name && <li key={i}>{r.name} - {r.contact}</li>)}</ul></div>)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 19: PROFESSIONAL (ATS) */}
          {currentTemplate === 'professional' && (
            <div className="bg-white h-full text-gray-800 p-10 print-area">
              <div className="border-b-2 border-gray-900 pb-4 mb-6 avoid-break"><h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">{formData.fullName}</h1><p className="text-lg text-blue-700 font-bold mt-1">{formData.jobTitle}</p><div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 mt-2 font-medium"><span>{formData.phone}</span> <span>•</span><span>{formData.email}</span> <span>•</span><span>{formData.address}</span></div></div>
              {formData.summary && (<div className="mb-6 avoid-break"><h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 border-b border-gray-300 pb-1">Professional Summary</h2><p className="text-xs text-gray-700 leading-relaxed text-justify">{formData.summary}</p></div>)}
              {formData.skills?.some((s: any) => s) && (<div className="mb-6 avoid-break"><h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 border-b border-gray-300 pb-1">Core Competencies</h2><div className="grid grid-cols-3 gap-x-4 gap-y-1">{formData.skills.map((s: any, i: number) => s && (<div key={i} className="flex items-center gap-2 text-xs text-gray-700"><span className="w-1 h-1 bg-gray-800 rounded-full"></span> {s}</div>))}</div></div>)}
              {formData.experience?.some((e: any) => e.role) && (<div className="mb-6"><h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-3 border-b border-gray-300 pb-1">Professional Experience</h2>{formData.experience.map((e: any, i: number) => e.role && (<div key={i} className="mb-4 avoid-break"><div className="flex justify-between items-baseline mb-1"><h3 className="font-bold text-sm text-gray-900">{e.role}</h3><span className="text-xs text-gray-600 font-semibold">{e.duration}</span></div><p className="text-xs text-blue-700 font-semibold mb-1">{e.company}</p><ul className="text-xs text-gray-600 list-disc pl-4 space-y-1 leading-relaxed">{e.desc.split('\n').map((line: string, idx: number) => line && <li key={idx}>{line}</li>)}</ul></div>))}</div>)}
              {formData.education?.some((e: any) => e.degree) && (<div className="mb-6 avoid-break"><h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-3 border-b border-gray-300 pb-1">Education</h2><div className="grid grid-cols-1 gap-2">{formData.education.map((e: any, i: number) => e.degree && (<div key={i} className="flex justify-between items-baseline text-xs"><div><span className="font-bold text-gray-900">{e.degree}</span>, <span className="text-gray-600">{e.school}</span></div><span className="text-gray-500 font-semibold">{e.year}</span></div>))}</div></div>)}
              <div className="grid grid-cols-2 gap-6 avoid-break">{formData.languages?.some((l: any) => l.language) && (<div><h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 border-b border-gray-300 pb-1">Languages</h2><p className="text-xs text-gray-700">{formData.languages.map((l: any) => l.language).filter(Boolean).join(', ')}</p></div>)}{formData.hobbies?.some((h: any) => h) && (<div><h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 border-b border-gray-300 pb-1">Interests</h2><p className="text-xs text-gray-700">{formData.hobbies.filter(Boolean).join(', ')}</p></div>)}</div>
              {formData.references?.some((r: any) => r.name) && (<div className="mt-6 avoid-break"><h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 border-b border-gray-300 pb-1">References</h2><p className="text-xs italic text-gray-600">References available upon request.</p></div>)}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}