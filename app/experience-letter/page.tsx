'use client';

import { useState } from 'react';
import { ArrowLeft, Printer, Download, Loader2, RefreshCw, Info } from 'lucide-react';
import Link from 'next/link';
import { supabase, saveDocumentRecord, checkUserLimit, incrementUserCount } from '@/lib/supabase';

// Demo Data
const dummyData = {
  companyName: 'Tech Corp Solutions',
  companyAddress: '123 Business Avenue, Karachi, Pakistan',
  date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  employeeName: 'John Doe',
  employeeDesignation: 'Senior Software Engineer',
  joiningDate: 'January 15, 2020',
  leavingDate: 'October 31, 2026',
  body: `This is to certify that Mr. John Doe was employed with Tech Corp Solutions as a Senior Software Engineer from January 15, 2020 to October 31, 2026.\n\nDuring his tenure, he was responsible for leading the frontend development team, architecting scalable web applications, and maintaining high code quality standards. He consistently demonstrated exceptional technical skills, dedication, and a strong work ethic.\n\nJohn was a valuable asset to our organization, known for his problem-solving abilities and collaborative spirit. He handled all his responsibilities with utmost professionalism and integrity.\n\nWe wish him great success in all his future endeavors.`,
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    if(confirm("Are you sure you want to clear all data and start fresh?")) {
      setFormData(emptyData);
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
              <p className="text-sm font-medium text-green-800 mb-2">
                We've filled a sample experience letter for you. Replace the details or clear it to start fresh.
              </p>
              <button 
                onClick={resetForm}
                className="flex items-center gap-2 bg-white text-green-700 border border-green-300 px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-100 transition shadow-sm"
              >
                <RefreshCw size={16} /> Clear & Start Fresh
              </button>
            </div>
          </div>

          <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h3 className="text-sm font-bold text-gray-800 mb-2">Choose Design:</h3>
            <div className="flex gap-2">
              <button onClick={() => setTemplate('modern')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${template === 'modern' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}>Modern Header</button>
              <button onClick={() => setTemplate('classic')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${template === 'classic' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border'}`}>Classic Formal</button>
            </div>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Company Details</h1>
          <div className="space-y-4 mb-8">
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Company Name</label><input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Company Address</label><input type="text" name="companyAddress" value={formData.companyAddress} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Date</label><input type="text" name="date" value={formData.date} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Employee Details</h1>
          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Employee Name</label><input type="text" name="employeeName" value={formData.employeeName} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Designation</label><input type="text" name="employeeDesignation" value={formData.employeeDesignation} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Joining Date</label><input type="text" name="joiningDate" value={formData.joiningDate} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Leaving Date</label><input type="text" name="leavingDate" value={formData.leavingDate} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
            </div>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Letter Body</h1>
          <div className="mb-8">
            <textarea name="body" value={formData.body} onChange={handleChange} rows={10} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-y"></textarea>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Signatory Details</h1>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Name</label><input type="text" name="signatoryName" value={formData.signatoryName} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Designation</label><input type="text" name="signatoryDesignation" value={formData.signatoryDesignation} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button type="button" onClick={handleAction} disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-xl hover:bg-gray-800 font-bold text-sm transition disabled:opacity-50">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />} Print Letter
            </button>
            <button type="button" onClick={handleAction} disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 font-bold text-sm transition disabled:opacity-50">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} Download PDF
            </button>
          </div>
        </div>

        {/* RIGHT SIDE: LIVE PREVIEW */}
        <div className="bg-white shadow-2xl rounded-xl p-12 border border-gray-200 print:shadow-none print:border-none print:p-0 print-area h-fit min-h-[A4]">
          
          {template === 'modern' && (
            <div>
              <div className="bg-gray-900 text-white p-8 rounded-b-xl mb-8 -mt-12 -mx-12 avoid-break">
                <h1 className="text-3xl font-bold tracking-wide">{formData.companyName}</h1>
                <p className="text-gray-300 text-sm mt-1">{formData.companyAddress}</p>
              </div>
              
              <div className="mb-6 text-sm text-gray-700 avoid-break">
                <p className="font-semibold">Date: {formData.date}</p>
              </div>

              <div className="mb-8 avoid-break">
                <h2 className="text-xl font-bold text-gray-900 mb-4">TO WHOM IT MAY CONCERN</h2>
                <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {formData.body}
                </div>
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

          {template === 'classic' && (
            <div className="font-serif">
              <div className="text-center border-b-4 border-double border-gray-800 pb-4 mb-8 avoid-break">
                <h1 className="text-3xl font-bold uppercase tracking-widest text-gray-900">{formData.companyName}</h1>
                <p className="text-sm text-gray-600 mt-1">{formData.companyAddress}</p>
              </div>

              <div className="mb-6 text-sm text-gray-800 avoid-break">
                <p>{formData.date}</p>
              </div>

              <div className="text-center mb-8 avoid-break">
                <h2 className="text-lg font-bold underline text-gray-900 tracking-wider">EXPERIENCE CERTIFICATE</h2>
              </div>

              <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap mb-12">
                {formData.body}
              </div>

              <div className="flex justify-between items-end mt-16 text-sm text-gray-800 avoid-break">
                <div>
                  <p className="border-t border-gray-400 pt-1 w-40 text-center">Employee Signature</p>
                </div>
                <div>
                  <p className="font-bold">{formData.signatoryName}</p>
                  <p className="text-xs text-gray-500">{formData.signatoryDesignation}</p>
                  <p className="border-t border-gray-400 pt-1 w-40 text-center mt-1">Authorized Signature</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}