'use client';

import { useState } from 'react';
import { ArrowLeft, Printer, Download, Loader2, RefreshCw, Info, Sparkles, Save } from 'lucide-react';
import Link from 'next/link';
import { supabase, saveDocumentRecord, checkUserLimit, incrementUserCount } from '@/lib/supabase';
import { downloadAsWord, downloadAsPDF } from '@/lib/download-utils';

const dummyData = {
  fullName: 'Muhammad Ali',
  email: 'muhammad.ali@example.com',
  phone: '+92 300 1234567',
  address: 'Karachi, Pakistan',
  companyName: 'Zaman Trading',
  companyAddress: 'Shahrah-e-Faisal, Karachi',
  jobTitle: 'Assistant Accounts',
  hiringManager: 'Ahmed Khan',
  date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  body: `Dear Ahmed Khan,\n\nI am writing to express my strong interest in the Assistant Accounts position at Zaman Trading. With my background in accounting and finance, I am confident in my ability to contribute effectively to your team.\n\nSincerely,\nMuhammad Ali`
};

const emptyData = {
  fullName: '', email: '', phone: '', address: '',
  companyName: '', companyAddress: '', jobTitle: '',
  hiringManager: '', date: '', body: '',
};

export default function CoverLetter() {
  const [formData, setFormData] = useState(dummyData);
  const [template, setTemplate] = useState('modern');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // Duplicate save se bachne ke liye last saved document ka snapshot
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string | null>(null);

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
    try {
      const response = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobTitle: formData.jobTitle, 
          companyName: formData.companyName, 
          fullName: formData.fullName 
        }),
      });

      if (!response.ok) throw new Error(`API Error: Status ${response.status}.`);
      const data = await response.json();
      if (data.body) setFormData({ ...formData, body: data.body });
      else alert("AI se response nahi mila.");
    } catch (error: any) {
      alert("AI Error: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAction = async (actionType: 'print' | 'save') => {
    const { data: { user } } = await supabase.auth.getUser();
    let userEmail = formData.email;
    let isLoggedIn = false;

    if (user && user.email) {
      userEmail = user.email;
      isLoggedIn = true;
      
      const limitCheck = await checkUserLimit(userEmail);
      if (!limitCheck.allowed) {
        alert("You have reached your document limit for your current plan. Please upgrade to continue.");
        window.location.href = '/payment';
        return;
      }
    } else {
      alert("Aap login nahi hain.");
      window.location.href = '/login';
      return;
    }

    if (actionType === 'save') setIsSaving(true);

    // Same letter dobara save karne se CV/document count double na ho
    const snapshot = JSON.stringify({ template, formData });
    const alreadySaved = snapshot === lastSavedSnapshot;

    try {
      if (!alreadySaved) {
        await saveDocumentRecord({
          documentType: 'Cover Letter',
          templateName: template,
          fullName: formData.fullName,
          email: userEmail,
          phone: formData.phone,
          fullData: formData,
        });

        if (isLoggedIn) await incrementUserCount(userEmail);
        setLastSavedSnapshot(snapshot);
      }

      if (actionType === 'save') {
        // Save hone ke baad dashboard kholne ka option
        if (confirm("✅ Cover Letter successfully saved to your Dashboard!\n\nAb My Dashboard kholein?")) {
          window.location.href = '/dashboard';
        }
      } else {
        setTimeout(() => { window.print(); }, 500);
      }
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      if (actionType === 'save') setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 print:hidden">
        <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium">
          <ArrowLeft size={20} /> Back to Home
        </Link>
        <div className="font-bold text-xl text-blue-600">Cover Letter Builder</div>
        <div className="w-24"></div>
      </nav>

      <main className="flex-grow max-w-[1500px] mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8 print:block print:p-0 print:m-0 print:max-w-none">
        
        {/* LEFT SIDE: FORM */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit max-h-[85vh] overflow-y-auto print:hidden">
          
          <div className="mb-6 bg-green-50 border border-green-200 p-4 rounded-xl flex items-start gap-3">
            <Info className="text-green-600 shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800 mb-2">Sample letter filled. Replace or clear to start fresh.</p>
              <button onClick={resetForm} className="flex items-center gap-2 bg-white text-green-700 border border-green-300 px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-100 transition shadow-sm">
                <RefreshCw size={16} /> Clear & Start Fresh
              </button>
            </div>
          </div>

          <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h3 className="text-sm font-bold text-gray-800 mb-2">Choose Design:</h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setTemplate('modern')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${template === 'modern' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}>Modern</button>
              <button onClick={() => setTemplate('classic')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${template === 'classic' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border'}`}>Classic</button>
              <button onClick={() => setTemplate('elegant')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${template === 'elegant' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 border'}`}>Elegant</button>
              <button onClick={() => setTemplate('minimal')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${template === 'minimal' ? 'bg-gray-500 text-white' : 'bg-white text-gray-700 border'}`}>Minimal</button>
            </div>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Your Details</h1>
          <div className="space-y-4 mb-8">
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label><input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border text-sm" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border text-sm" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label><input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border text-sm" /></div>
            </div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Address</label><input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border text-sm" /></div>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Company Details</h1>
          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Company Name</label><input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border text-sm" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Job Title</label><input type="text" name="jobTitle" value={formData.jobTitle} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border text-sm" /></div>
            </div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Company Address</label><input type="text" name="companyAddress" value={formData.companyAddress} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border text-sm" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Hiring Manager</label><input type="text" name="hiringManager" value={formData.hiringManager} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border text-sm" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Date</label><input type="text" name="date" value={formData.date} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border text-sm" /></div>
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

          <div className="flex flex-col gap-2 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => handleAction('save')} disabled={isSaving} className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white px-2 py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 transition shadow-md disabled:opacity-60">
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isSaving ? 'Saving to Dashboard...' : 'Save on Dashboard'}
            </button>
            <p className="text-[11px] text-gray-500 text-center">
              Ye letter aap ke <strong>My Dashboard</strong> mein save ho jayegi. Print / PDF / Word sirf copy download karne ke liye hain.
            </p>
            <div className="flex gap-2 w-full mt-1">
              <button type="button" onClick={() => handleAction('print')} className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white px-2 py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition">
                <Printer size={18} /> Print
              </button>
              <button type="button" onClick={() => downloadAsPDF('cover-letter-preview', formData.fullName || 'Cover_Letter')} className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-2 py-3 rounded-xl font-bold text-sm hover:bg-red-700 transition">
                <Download size={18} /> PDF
              </button>
              <button type="button" onClick={() => downloadAsWord('cover-letter-preview', formData.fullName || 'Cover_Letter')} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-2 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition">
                <Download size={18} /> Word
              </button>
            </div>
          </div>
        </div>
                {/* RIGHT SIDE: LIVE PREVIEW */}
        <div className="py-4 lg:py-8 overflow-x-auto print:p-0">
          <div id="cover-letter-preview" className="print-area max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-2xl">
            
            {/* MODERN TEMPLATE */}
            {template === 'modern' && (
              <div className="p-10 h-full flex flex-col">
                <div className="border-b-4 border-gray-900 pb-4 mb-6 avoid-break">
                  <h1 className="text-3xl font-black text-gray-900 uppercase">{formData.fullName}</h1>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-600 mt-2 font-medium">
                    <span>{formData.email}</span> <span>•</span> <span>{formData.phone}</span> <span>•</span> <span>{formData.address}</span>
                  </div>
                </div>
                <div className="mb-6 flex justify-between items-end avoid-break">
                  <div>
                    <p className="font-bold text-gray-900">{formData.date}</p>
                    <p className="mt-4 font-bold text-gray-800">{formData.hiringManager}</p>
                    <p className="text-gray-700">{formData.companyName}</p>
                    <p className="text-gray-700">{formData.companyAddress}</p>
                  </div>
                </div>
                <div className="mb-4 avoid-break">
                  <p className="font-bold text-gray-900 text-lg mb-2">Subject: Application for {formData.jobTitle}</p>
                </div>
                <div className="flex-1 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap avoid-break">
                  {formData.body}
                </div>
              </div>
            )}

            {/* CLASSIC TEMPLATE */}
            {template === 'classic' && (
              <div className="p-10 h-full flex flex-col font-serif">
                <div className="text-center border-b border-gray-300 pb-4 mb-6 avoid-break">
                  <h1 className="text-2xl font-bold text-gray-900 tracking-widest uppercase">{formData.fullName}</h1>
                  <p className="text-sm text-gray-600 mt-1">{formData.address}</p>
                  <p className="text-sm text-gray-600 mt-1">{formData.email} | {formData.phone}</p>
                </div>
                <p className="mb-6 text-gray-800">{formData.date}</p>
                <div className="mb-6 text-gray-800">
                  <p className="font-bold">{formData.hiringManager}</p>
                  <p>{formData.companyName}</p>
                  <p>{formData.companyAddress}</p>
                </div>
                <div className="flex-1 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap avoid-break">
                  {formData.body}
                </div>
              </div>
            )}

            {/* ELEGANT TEMPLATE */}
            {template === 'elegant' && (
              <div className="p-10 h-full flex flex-col font-light">
                <div className="mb-8 avoid-break">
                  <h1 className="text-4xl text-gray-900 mb-2">{formData.fullName}</h1>
                  <p className="text-sm text-gray-500 uppercase tracking-widest">{formData.jobTitle}</p>
                  <div className="mt-2 text-xs text-gray-500">{formData.email} • {formData.phone} • {formData.address}</div>
                </div>
                <div className="flex justify-between mb-8 text-sm text-gray-700 avoid-break">
                  <div>
                    <p className="font-bold text-gray-900">{formData.companyName}</p>
                    <p>{formData.companyAddress}</p>
                  </div>
                  <p>{formData.date}</p>
                </div>
                <div className="flex-1 text-sm text-gray-800 leading-loose whitespace-pre-wrap avoid-break">
                  {formData.body}
                </div>
              </div>
            )}

            {/* MINIMAL TEMPLATE */}
            {template === 'minimal' && (
              <div className="p-10 h-full flex flex-col">
                <div className="mb-8 avoid-break">
                  <h1 className="text-2xl font-semibold text-gray-900">{formData.fullName}</h1>
                  <p className="text-sm text-gray-600 mt-1">{formData.email} | {formData.phone}</p>
                </div>
                <p className="mb-4 text-sm text-gray-800">{formData.date}</p>
                <div className="mb-6 text-sm text-gray-800">
                  <p>{formData.hiringManager}</p>
                  <p>{formData.companyName}</p>
                </div>
                <div className="flex-1 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap avoid-break">
                  {formData.body}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}