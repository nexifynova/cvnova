'use client';

import { useState } from 'react';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import Link from 'next/link';

export default function ExperienceLetter() {
  const [formData, setFormData] = useState({
    companyName: 'Zaman Trading',
    companyAddress: 'Karachi, Pakistan',
    date: 'November 9, 2026',
    employeeName: 'Faisal Ilyas',
    employeeDesignation: 'Assistant Accounts',
    joiningDate: 'January 1, 2022',
    leavingDate: 'Present',
    body: 'This is to certify that Mr. Faisal Ilyas was employed with Zaman Trading as an Assistant Accounts from January 1, 2022 to Present. During his tenure, he demonstrated excellent skills in financial reporting and data analysis. He was a dedicated and hardworking employee.\n\nWe wish him the best of luck in his future endeavors.',
    signatoryName: 'HR Manager',
    signatoryDesignation: 'Human Resources Department'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
        <div className="font-bold text-xl text-blue-600">Experience Letter Builder</div>
        <div className="w-24"></div>
      </nav>

      <main className="flex-grow max-w-[1500px] mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT SIDE: FORM */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit max-h-[85vh] overflow-y-auto print:hidden">
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
            <button type="button" onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-xl hover:bg-gray-800 font-bold text-sm transition">
              <Printer size={18} /> Print Letter
            </button>
            <button type="button" className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 font-bold text-sm transition">
              <Download size={18} /> Download PDF
            </button>
          </div>
        </div>

        {/* RIGHT SIDE: LIVE PREVIEW */}
        <div className="bg-white shadow-2xl rounded-xl p-12 border border-gray-200 print:shadow-none print:border-none print:p-0 h-fit min-h-[A4]">
          <div className="mb-8 border-b-2 border-gray-800 pb-4">
            <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wider">{formData.companyName}</h1>
            <p className="text-sm text-gray-500">{formData.companyAddress}</p>
          </div>

          <div className="mb-8 text-sm text-gray-700">
            <p className="font-semibold">Date: {formData.date}</p>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 underline mb-6 text-center uppercase tracking-widest">To Whom It May Concern</h2>
            <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
              {formData.body}
            </div>
          </div>

          <div className="mt-16 text-sm text-gray-700">
            <p>Sincerely,</p>
            <div className="mt-8 pt-4 border-t border-gray-400 w-48">
              <p className="font-bold">{formData.signatoryName}</p>
              <p className="text-xs text-gray-500">{formData.signatoryDesignation}</p>
              <p className="text-xs text-gray-500">{formData.companyName}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}