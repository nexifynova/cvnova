'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import { Loader2, ArrowLeft, Printer, Save, LayoutTemplate } from 'lucide-react';
import Link from 'next/link';

export default function PublicViewCV() {
  const params = useParams();
  const id = params.id as string;
  
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
      
      {/* Top Navigation Bar (Print ke waqt hide ho jayega) */}
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
                    {formData.skills.some((s:any) => s) && (
                    <div className="w-full mb-6">
                      <h3 className="font-bold text-gray-900 border-b border-gray-400 pb-1 mb-3 uppercase text-sm">Skill Highlights</h3>
                      <ul className="text-[11px] list-disc pl-4 space-y-1">{formData.skills.map((s:any, i:number) => s && <li key={i}>{s}</li>)}</ul>
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
                    {formData.experience.some((e:any) => e.role) && (
                    <div className="mb-6">
                      <h3 className="font-bold text-gray-800 text-sm mb-3 uppercase tracking-wider border-b border-gray-200 pb-1">Experience</h3>
                      {formData.experience.map((e:any, i:number) => e.role && (
                        <div key={i} className="mb-4 avoid-break">
                          <div className="flex justify-between items-baseline mb-1"><h4 className="font-bold text-xs text-gray-900">{e.role}</h4><span className="text-[10px] text-gray-500">{e.duration}</span></div>
                          <p className="text-[11px] text-gray-800 italic mb-1">{e.company}</p>
                          <ul className="text-[10px] text-gray-600 list-disc pl-4 space-y-1 leading-relaxed">{e.desc.split('\n').map((line:string, idx:number) => line && <li key={idx}>{line}</li>)}</ul>
                        </div>
                      ))}
                    </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Yahan baaki 18 templates ke conditions `{currentTemplate === 'modern' && (...)}` aise aayenge */}
            {/* Aap Builder wale code se copy karke yahan paste kar dein, bas 'template' ko 'currentTemplate' se replace kar dein */}

        </div>
      </div>
    </div>
  );
}