'use client';

import { useState } from 'react';
import { ArrowLeft, Printer, Download, Loader2, RefreshCw, Info, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { supabase, saveDocumentRecord, checkUserLimit, incrementUserCount } from '@/lib/supabase';
import { downloadAsWord } from '@/lib/download-utils';

const dummyData = {
  companyName: 'Tech Corp Solutions',
  companyAddress: '123 Business Avenue, Karachi, Pakistan',
  date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  employeeName: 'John Doe',
  employeeDesignation: 'Senior Software Engineer',
  joiningDate: 'January 15, 2020',
  leavingDate: 'October 31, 2026',
  body: `This is to certify that Mr. John Doe was employed with Tech Corp Solutions as a Senior Software Engineer from January 15, 2020 to October 31, 2026.\n\nDuring his tenure, he was responsible for leading the frontend development team, architecting scalable web applications, and maintaining high code quality standards. He consistently demonstrated exceptional technical skills, dedication, and a strong work ethic.\n\nWe wish him great success in all his future endeavors.`,
  signatoryName: 'Jane Smith',
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
      const response = await fetch('/api/generate-experience-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          employeeName: formData.employeeName,
          employeeDesignation: formData.employeeDesignation,
          companyName: formData.companyName,
          joiningDate: formData.joiningDate,
          leavingDate: formData.leavingDate
        }),
      });
      const data = await response.json();
      if (data.body) {
        setFormData({ ...formData, body: data.body });
      }
    } catch (error) {
      alert("Failed to generate AI letter.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAction = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    let userEmail = 'N/A';
    let isLoggedIn = false;

    if (user && user.email) {
      userEmail = user.email;
      isLoggedIn = true;
      
      const limitCheck = await checkUserLimit(userEmail);
      if (!limitCheck.allowed) {
        alert("You have reached your free limit. Please upgrade to continue.");
        window.location.href = '/#pricing';
        setLoading(false);
        return;
      }
    }

    await saveDocumentRecord({
      documentType: 'Experience Letter',
      templateName: template,
      fullName: formData.employeeName,
      email: userEmail,
      phone: 'N/A',
      fullData: formData,
    });

    if (isLoggedIn) await incrementUserCount(userEmail);
    
    setLoading(false);
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 print:hidden">
        <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium">
          <ArrowLeft size={20} /> Back to Home
        </Link>
        <div className="font-bold text-xl text-blue-600">Experience Letter Builder</div>
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
            {/* AI GENERATE BUTTON */}
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

          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button type="button" onClick={handleAction} disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-xl hover:bg-gray-800 font-bold text-sm transition disabled:opacity-50">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />} Print / PDF
            </button>
            <button type="button" onClick={() => downloadAsWord('exp-preview', formData.employeeName || 'Experience-Letter')} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 font-bold text-sm transition">
              <Download size={18} /> Word Download
            </button>
          </div>
        </div>

        {/* RIGHT SIDE: LIVE PREVIEW */}
        <div id="exp-preview" className="bg-white shadow-2xl rounded-xl p-12 border border-gray-200 print:shadow-none print:border-none print:p-0 print-area h-fit min-h-[A4]">
          
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

          {/* Template 3: Corporate (Naya) */}
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

          {/* Template 4: Modern Dark (Naya) */}
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
      </main>
    </div>
  );
}