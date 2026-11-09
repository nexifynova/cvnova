'use client';

import { useState } from 'react';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import Link from 'next/link';
import { saveDocumentRecord } from '@/lib/supabase';

export default function CoverLetter() {
  const [formData, setFormData] = useState({
    fullName: 'Faisal Ilyas',
    email: 'faisal@nexifynova.co.uk',
    phone: '+92 3122777836',
    address: 'Karachi, Pakistan',
    companyName: 'Zaman Trading',
    companyAddress: 'Karachi, Pakistan',
    jobTitle: 'Assistant Accounts',
    hiringManager: 'Hiring Manager',
    date: 'November 9, 2026',
    body: 'Dear Hiring Manager,\n\nI am writing to express my strong interest in the Assistant Accounts position at Zaman Trading. With my background in accounting and finance, I am confident in my ability to contribute effectively to your team.\n\nThroughout my career, I have developed strong skills in financial reporting, data analysis, and client communication. I am eager to bring my expertise to your organization and help drive success.\n\nThank you for considering my application. I look forward to the opportunity to discuss how I can contribute to your team.\n\nSincerely,\nFaisal Ilyas',
  });

  const [template, setTemplate] = useState('modern');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAction = async () => {
    await saveDocumentRecord({
      documentType: 'Cover Letter',
      templateName: template,
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      fullData: formData,
    });
    window.print();
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

      <main className="flex-grow max-w-[1500px] mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT SIDE: FORM */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit max-h-[85vh] overflow-y-auto print:hidden">
          
          <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h3 className="text-sm font-bold text-gray-800 mb-2">Choose Design:</h3>
            <div className="flex gap-2">
              <button onClick={() => setTemplate('modern')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${template === 'modern' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}>Modern (Blue)</button>
              <button onClick={() => setTemplate('classic')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${template === 'classic' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border'}`}>Classic (Black)</button>
            </div>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Your Details</h1>
          <div className="space-y-4 mb-8">
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label><input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label><input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
            </div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Address</label><input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Company Details</h1>
          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Company Name</label><input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Job Title</label><input type="text" name="jobTitle" value={formData.jobTitle} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
            </div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Company Address</label><input type="text" name="companyAddress" value={formData.companyAddress} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Hiring Manager Name</label><input type="text" name="hiringManager" value={formData.hiringManager} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Date</label><input type="text" name="date" value={formData.date} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
            </div>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Letter Body</h1>
          <div className="mb-8">
            <textarea name="body" value={formData.body} onChange={handleChange} rows={12} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-y"></textarea>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button type="button" onClick={handleAction} className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-xl hover:bg-gray-800 font-bold text-sm transition">
              <Printer size={18} /> Print Letter
            </button>
            <button type="button" onClick={handleAction} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 font-bold text-sm transition">
              <Download size={18} /> Download PDF
            </button>
          </div>
        </div>

        {/* RIGHT SIDE: LIVE PREVIEW */}
        <div className="bg-white shadow-2xl rounded-xl p-12 border border-gray-200 print:shadow-none print:border-none print:p-0 h-fit min-h-[A4]">
          
          {template === 'modern' && (
            <div>
              <div className="border-l-8 border-blue-600 pl-6 mb-8">
                <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">{formData.fullName}</h1>
                <div className="flex flex-wrap gap-2 text-sm text-blue-600 font-medium mt-2">
                  <span>{formData.email}</span> <span>•</span> <span>{formData.phone}</span> <span>•</span> <span>{formData.address}</span>
                </div>
              </div>

              <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-4">
                <div>
                  <p className="text-sm font-bold text-gray-900">{formData.date}</p>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <p className="font-bold text-gray-900">{formData.hiringManager}</p>
                  <p>{formData.companyName}</p>
                  <p>{formData.companyAddress}</p>
                </div>
              </div>

              <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {formData.body}
              </div>
            </div>
          )}

          {template === 'classic' && (
            <div className="font-serif">
              <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-gray-900 mb-1">{formData.fullName}</h1>
                <p className="text-sm text-gray-600">{formData.address} | {formData.phone} | {formData.email}</p>
              </div>

              <div className="mb-8 text-sm text-gray-800">
                <p className="mb-4">{formData.date}</p>
                <p className="font-bold">{formData.hiringManager}</p>
                <p>{formData.companyName}</p>
                <p>{formData.companyAddress}</p>
              </div>

              <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {formData.body}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}