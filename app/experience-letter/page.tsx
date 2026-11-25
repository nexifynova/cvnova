'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Printer, Download, Loader2, RefreshCw, Info, Sparkles, Save } from 'lucide-react';
import Link from 'next/link';
import { supabase, saveDocumentRecord, checkUserLimit, incrementUserCount, fetchDocumentRecord, updateDocumentRecord, ownsDocument } from '@/lib/supabase';
import { downloadAsWord, downloadAsPDF } from '@/lib/download-utils';
import { toText } from '@/components/cv/shared';

const EXPERIENCE_LETTER_TEMPLATES = ['modern', 'classic', 'corporate', 'modernDark'];

const dummyData = {
  companyName: 'Zaman Trading',
  companyAddress: 'Shahrah-e-Faisal, Karachi, Pakistan',
  date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  employeeName: 'Muhammad Ali',
  employeeDesignation: 'Assistant Accounts',
  joiningDate: 'January 15, 2020',
  leavingDate: 'October 31, 2026',
  body: `This is to certify that Mr. Muhammad Ali was employed with Zaman Trading as an Assistant Accounts from January 15, 2020 to October 31, 2026.\n\nDuring his tenure, he was responsible for managing financial records, assisting in daily accounting tasks, and maintaining high accuracy standards. He consistently demonstrated exceptional dedication and a strong work ethic.\n\nWe wish him great success in all his future endeavors.`,
  signatoryName: 'Ahmed Khan',
  signatoryDesignation: 'Head of Human Resources',
};

const emptyData = {
  companyName: '', companyAddress: '', date: '',
  employeeName: '', employeeDesignation: '', joiningDate: '', leavingDate: '',
  body: '', signatoryName: '', signatoryDesignation: ''
};

export default function ExperienceLetter() {
  const [formData, setFormData] = useState(dummyData);
  const [template, setTemplate] = useState('modern');
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  // "Save on Dashboard" ke liye: loading state + last saved snapshot (duplicate save se bachne ke liye)
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string | null>(null);
  // ?edit=<id> — dashboard se aya hua saved letter (edit mode)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(true);

  const loadDocumentForEdit = async (id: string) => {
    try {
      const [{ data: { user } }, doc] = await Promise.all([supabase.auth.getUser(), fetchDocumentRecord(id)]);

      if (!doc || !user) {
        alert('Ye document load nahi ho saka. Dobara dashboard se try karein.');
        window.location.href = '/dashboard';
        return;
      }

      // Ye builder sirf experience letters ke liye hai
      if ((doc.document_type || 'Experience Letter') !== 'Experience Letter') {
        window.location.href = `/view/${id}`;
        return;
      }

      if (!ownsDocument(doc, user)) {
        alert('Ye document aap ke account ka nahi hai, is liye edit nahi ho sakta.');
        window.location.href = `/view/${id}`;
        return;
      }

      const src = doc.full_data || {};
      const str = (value: unknown) => toText(value);
      const loaded = {
        companyName: str(src.companyName),
        companyAddress: str(src.companyAddress),
        date: str(src.date),
        employeeName: str(src.employeeName),
        employeeDesignation: str(src.employeeDesignation),
        joiningDate: str(src.joiningDate),
        leavingDate: str(src.leavingDate),
        body: str(src.body),
        signatoryName: str(src.signatoryName),
        signatoryDesignation: str(src.signatoryDesignation),
      };
      const templateName = String(doc.template_name || 'modern');
      const loadedTemplate = EXPERIENCE_LETTER_TEMPLATES.includes(templateName) ? templateName : 'modern';

      setFormData(loaded);
      setTemplate(loadedTemplate);
      setEditingId(doc.id);
      // Loaded letter hi current state hai — baghair change save par duplicate na bane
      setLastSavedSnapshot(JSON.stringify({ template: loadedTemplate, formData: loaded }));
    } catch (error) {
      console.error('Load document error:', error);
      alert('Document load karte waqt error aya.');
      window.location.href = '/dashboard';
    } finally {
      setLoadingDoc(false);
    }
  };

  // Mount par chalta hai: edit link (?edit=id) ho to saved letter load karo,
  // warna sample data hi dikhao. State updates effect body ke bahar rakhe gaye
  // hain taake cascading render na ho.
  useEffect(() => {
    const editId = new URLSearchParams(window.location.search).get('edit');
    if (editId) {
      // Load async hai — agle frame par start karte hain taake effect
      // synchronously state update na kare.
      const frame = requestAnimationFrame(() => {
        void loadDocumentForEdit(editId);
      });
      return () => cancelAnimationFrame(frame);
    }
    const frame = requestAnimationFrame(() => setLoadingDoc(false));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    if(confirm("Are you sure you want to clear all data and start fresh?")) {
      setFormData(emptyData);
    }
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const generatedBody = `This is to certify that Mr./Ms. ${formData.employeeName || 'Employee Name'} was employed with ${formData.companyName || 'Our Company'} as a ${formData.employeeDesignation || 'Professional'} from ${formData.joiningDate || 'Start Date'} to ${formData.leavingDate || 'End Date'}.\n\nDuring their tenure, they were responsible for key operational tasks and consistently demonstrated exceptional skills, dedication, and a strong work ethic. They were a valuable asset to our organization, known for their problem-solving abilities and collaborative spirit.\n\nWe wish them great success in all future endeavors.`;
    
    setFormData({ ...formData, body: generatedBody });
    setIsGenerating(false);
  };

  // actionType: 'print' = sirf print, 'save' = My Dashboard mein save karke dashboard kholna
  const handleAction = async (actionType: 'print' | 'save' = 'print') => {
    if (actionType === 'save') setIsSaving(true); else setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    let userEmail = 'N/A';
    let isLoggedIn = false;

    if (user && user.email) {
      userEmail = user.email;
      isLoggedIn = true;

      // Edit mode mein naya document create nahi hota — limit check skip
      if (!editingId) {
        const limitCheck = await checkUserLimit(userEmail);
        if (!limitCheck.allowed) {
          alert("You have reached your document limit for your current plan. Please upgrade to continue.");
          window.location.href = '/payment';
          setLoading(false);
          setIsSaving(false);
          return;
        }
      }
    } else if (actionType === 'save') {
      // Dashboard mein save karne ke liye login zaroori hai
      alert("Experience Letter apne Dashboard mein save karne ke liye pehle login karein.");
      window.location.href = '/login';
      setLoading(false);
      setIsSaving(false);
      return;
    }

    // Same letter dobara save karne se document count double na ho
    const snapshot = JSON.stringify({ template, formData });
    const alreadySaved = snapshot === lastSavedSnapshot;

    try {
      if (editingId) {
        // Existing letter ko UPDATE karo — naya document insert na karo
        if (!alreadySaved) {
          const updated = await updateDocumentRecord(editingId, {
            templateName: template,
            fullName: formData.employeeName,
            phone: 'N/A',
            fullData: formData,
          });
          if (!updated) {
            alert('Letter update nahi ho saka. Login aur internet connection check karein.');
            return;
          }
          setLastSavedSnapshot(snapshot);
        }
      } else if (!alreadySaved) {
        await saveDocumentRecord({
          documentType: 'Experience Letter',
          templateName: template,
          fullName: formData.employeeName,
          email: userEmail,
          phone: 'N/A',
          fullData: formData,
        });

        if (isLoggedIn) await incrementUserCount(userEmail);
        setLastSavedSnapshot(snapshot);
      }

      if (actionType === 'save') {
        // Save/update hone ke baad sahi document dikhao
        const message = editingId
          ? "✅ Experience Letter updated! Aap ka wahi dashboard document update ho gaya hai.\n\nDocument dekhein?"
          : "✅ Experience Letter successfully saved to your Dashboard!\n\nAb My Dashboard kholein?";
        if (confirm(message)) {
          window.location.href = editingId ? `/view/${editingId}` : '/dashboard';
        }
      } else {
        setTimeout(() => { window.print(); }, 500);
      }
    } finally {
      setLoading(false);
      setIsSaving(false);
    }
  };

  if (loadingDoc) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-3 font-sans">
        <Loader2 size={32} className="animate-spin text-blue-600" />
        <p className="text-sm font-medium text-gray-600">Loading your document…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 print:hidden">
        <Link href={editingId ? `/view/${editingId}` : '/'} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium">
          <ArrowLeft size={20} /> {editingId ? 'Back to Document' : 'Back to Home'}
        </Link>
        <div className="font-bold text-xl text-blue-600">Experience Letter Builder{editingId ? ' — Editing' : ''}</div>
        <div className="w-24"></div>
      </nav>

      <main className="flex-grow max-w-[1500px] mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8 print:block print:p-0 print:m-0 print:max-w-none">
        
        {/* LEFT SIDE: FORM */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit max-h-[85vh] overflow-y-auto print:hidden">
          
          <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 border ${editingId ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
            <Info className={editingId ? 'text-amber-600 shrink-0 mt-0.5' : 'text-green-600 shrink-0 mt-0.5'} size={20} />
            <div className="flex-1">
              <p className={`text-sm font-medium mb-2 ${editingId ? 'text-amber-900' : 'text-green-800'}`}>
                {editingId
                  ? `Aap apna saved experience letter edit kar rahe hain${formData.employeeName ? ` — ${formData.employeeName}` : ''}. Save karne par yahi letter update hoga.`
                  : 'Sample letter filled. Replace or clear to start fresh.'}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {editingId && (
                  <Link href={`/view/${editingId}`} className="flex items-center gap-2 bg-white text-amber-800 border border-amber-300 px-4 py-2 rounded-lg font-bold text-sm hover:bg-amber-100 transition shadow-sm">
                    View Saved Letter
                  </Link>
                )}
                <button onClick={resetForm} className={`flex items-center gap-2 bg-white border px-4 py-2 rounded-lg font-bold text-sm transition shadow-sm ${editingId ? 'text-amber-800 border-amber-300 hover:bg-amber-100' : 'text-green-700 border-green-300 hover:bg-green-100'}`}>
                  <RefreshCw size={16} /> Clear & Start Fresh
                </button>
              </div>
            </div>
          </div>

          <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h3 className="text-sm font-bold text-gray-800 mb-2">Choose Design:</h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setTemplate('modern')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${template === 'modern' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}>Modern Header</button>
              <button onClick={() => setTemplate('classic')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${template === 'classic' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border'}`}>Classic Formal</button>
              <button onClick={() => setTemplate('corporate')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${template === 'corporate' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border'}`}>Corporate</button>
              <button onClick={() => setTemplate('modernDark')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${template === 'modernDark' ? 'bg-slate-800 text-white' : 'bg-white text-gray-700 border'}`}>Modern Dark</button>
            </div>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Company Details</h1>
          <div className="space-y-4 mb-8">
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Company Name</label><input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border text-sm" /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Company Address</label><input type="text" name="companyAddress" value={formData.companyAddress} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border text-sm" /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Date</label><input type="text" name="date" value={formData.date} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border text-sm" /></div>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Employee Details</h1>
          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Employee Name</label><input type="text" name="employeeName" value={formData.employeeName} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border text-sm" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Designation</label><input type="text" name="employeeDesignation" value={formData.employeeDesignation} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border text-sm" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Joining Date</label><input type="text" name="joiningDate" value={formData.joiningDate} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border text-sm" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Leaving Date</label><input type="text" name="leavingDate" value={formData.leavingDate} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border text-sm" /></div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h1 className="text-xl font-bold text-gray-900">Letter Body</h1>
            <button type="button" onClick={handleGenerateAI} disabled={isGenerating} className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-1.5 rounded-full disabled:opacity-50">
              {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {isGenerating ? 'Generating...' : 'Generate with AI'}
            </button>
          </div>
          <div className="mb-8">
            <textarea name="body" value={formData.body} onChange={handleChange} rows={10} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-y"></textarea>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Signatory Details</h1>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Name</label><input type="text" name="signatoryName" value={formData.signatoryName} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border text-sm" /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Designation</label><input type="text" name="signatoryDesignation" value={formData.signatoryDesignation} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border text-sm" /></div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            {/* 🚨 SAVE ON DASHBOARD: ye letter user ke apne profile/dashboard mein save karta hai */}
            <button type="button" onClick={() => handleAction('save')} disabled={isSaving} className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white px-3 py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 transition shadow-md disabled:opacity-60">
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isSaving ? 'Saving...' : editingId ? 'Update Letter' : 'Save on Dashboard'}
            </button>
            <p className="text-[11px] text-gray-500 text-center mt-2">
              {editingId
                ? 'Ye changes aap ke My Dashboard wale isi letter mein save honge.'
                : <>Ye letter aap ke <strong>My Dashboard</strong> mein save ho jayegi. Print / PDF / Word sirf copy download karne ke liye hain.</>}
            </p>

            <div className="flex gap-2 mt-3">
              <button type="button" onClick={() => handleAction('print')} disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white px-2 py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition disabled:opacity-50">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />} Print
              </button>
              <button type="button" onClick={() => downloadAsPDF('exp-preview', formData.employeeName || 'Experience-Letter')} className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-2 py-3 rounded-xl font-bold text-sm hover:bg-red-700 transition">
                <Download size={18} /> PDF
              </button>
              <button type="button" onClick={() => downloadAsWord('exp-preview', formData.employeeName || 'Experience-Letter')} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-2 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition">
                <Download size={18} /> Word
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: LIVE PREVIEW */}
        <div className="py-4 lg:py-8 overflow-x-auto print:p-0">
          <div id="exp-preview" className="print-area max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-2xl p-12">
            
            {/* Template 1: Modern */}
            {template === 'modern' && (
              <div>
                <div className="bg-gray-900 text-white p-8 rounded-b-xl mb-8 -mt-12 -mx-12 avoid-break">
                  <h1 className="text-3xl font-bold tracking-wide">{formData.companyName}</h1>
                  <p className="text-gray-300 text-sm mt-1">{formData.companyAddress}</p>
                </div>
                <div className="mb-6 text-sm text-gray-700 avoid-break"><p className="font-semibold">Date: {formData.date}</p></div>
                <div className="mb-8 avoid-break">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">TO WHOM IT MAY CONCERN</h2>
                  <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{formData.body}</div>
                </div>
                <div className="mt-16 text-sm text-gray-700 avoid-break">
                  <p>Sincerely,</p>
                  <div className="mt-12 pt-2 border-t border-gray-400 w-48">
                    <p className="font-bold">{formData.signatoryName}</p>
                    <p className="text-xs text-gray-500">{formData.signatoryDesignation}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Template 2: Classic */}
            {template === 'classic' && (
              <div className="font-serif">
                <div className="text-center border-b-4 border-double border-gray-800 pb-4 mb-8 avoid-break">
                  <h1 className="text-3xl font-bold uppercase tracking-widest text-gray-900">{formData.companyName}</h1>
                  <p className="text-sm text-gray-600 mt-1">{formData.companyAddress}</p>
                </div>
                <div className="mb-6 text-sm text-gray-800 avoid-break"><p>{formData.date}</p></div>
                <div className="text-center mb-8 avoid-break"><h2 className="text-lg font-bold underline text-gray-900 tracking-wider">EXPERIENCE CERTIFICATE</h2></div>
                <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap mb-12">{formData.body}</div>
                <div className="flex justify-between items-end mt-16 text-sm text-gray-800 avoid-break">
                  <div><p className="border-t border-gray-400 pt-1 w-40 text-center">Employee Signature</p></div>
                  <div>
                    <p className="font-bold">{formData.signatoryName}</p>
                    <p className="text-xs text-gray-500">{formData.signatoryDesignation}</p>
                    <p className="border-t border-gray-400 pt-1 w-40 text-center mt-1">Authorized Signature</p>
                  </div>
                </div>
              </div>
            )}

            {/* Template 3: Corporate */}
            {template === 'corporate' && (
              <div className="font-sans">
                <div className="border-l-8 border-indigo-600 pl-6 mb-8 avoid-break">
                  <h1 className="text-3xl font-bold text-gray-900">{formData.companyName}</h1>
                  <p className="text-sm text-gray-500 mt-1">{formData.companyAddress}</p>
                </div>
                <div className="mb-8 flex justify-between text-sm text-gray-700 avoid-break">
                  <p>Date: {formData.date}</p>
                  <p>Ref: EXP-2026</p>
                </div>
                <div className="mb-8 avoid-break">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wider">Experience Certificate</h2>
                  <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{formData.body}</div>
                </div>
                <div className="mt-16 text-sm text-gray-700 avoid-break">
                  <div className="w-48">
                    <p className="font-bold">{formData.signatoryName}</p>
                    <p className="text-xs text-gray-500">{formData.signatoryDesignation}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Template 4: Modern Dark */}
            {template === 'modernDark' && (
              <div className="bg-slate-800 text-white p-10 rounded-xl min-h-[800px] font-sans">
                <div className="flex justify-between items-start border-b border-slate-600 pb-6 mb-8 avoid-break">
                  <div>
                    <h1 className="text-2xl font-bold">{formData.companyName}</h1>
                    <p className="text-xs text-slate-400 mt-1">{formData.companyAddress}</p>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <p>Date: {formData.date}</p>
                  </div>
                </div>
                <div className="mb-8 avoid-break">
                  <h2 className="text-xl font-light text-blue-400 mb-4 tracking-widest uppercase">To Whom It May Concern</h2>
                  <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{formData.body}</div>
                </div>
                <div className="mt-20 text-sm text-slate-300 avoid-break">
                  <p className="mb-8">Sincerely,</p>
                  <div className="border-t border-slate-600 pt-2 w-48">
                    <p className="font-bold text-white">{formData.signatoryName}</p>
                    <p className="text-xs text-slate-400">{formData.signatoryDesignation}</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}