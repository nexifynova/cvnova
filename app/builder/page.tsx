'use client';

import { useState } from 'react';
import { Sparkles, ArrowLeft, Download, Printer } from 'lucide-react';
import Link from 'next/link';

export default function Builder() {
  const [formData, setFormData] = useState({
    fullName: 'Muhammad Ali',
    email: 'muhammad.ali@example.com',
    phone: '+92 300 1234567',
    jobTitle: 'Software Engineer',
    summary: 'Passionate software engineer with experience in building modern web applications. Skilled in React, Next.js, and Node.js.',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

      {/* Main Content - Split Layout */}
      <main className="flex-grow max-w-[1400px] mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Side: Form */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 h-fit print:hidden">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Enter Your Details</h1>
          
          <form className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="e.g. Muhammad Ali" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Job Title</label>
              <input type="text" name="jobTitle" value={formData.jobTitle} onChange={handleChange} placeholder="e.g. Software Engineer" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="ali@example.com" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="+92 3xx xxxxxxx" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-semibold text-gray-700">Professional Summary</label>
                <button type="button" className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-1.5 rounded-full hover:from-purple-500 hover:to-blue-500 transition shadow-sm">
                  <Sparkles size={14} /> Generate with AI
                </button>
              </div>
              <textarea name="summary" value={formData.summary} onChange={handleChange} rows={5} placeholder="Write a short professional summary..." className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-gray-900"></textarea>
            </div>

            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
              <button type="button" onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 font-bold transition">
                <Printer size={18} /> Print CV
              </button>
              <button type="button" className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-bold transition">
                <Download size={18} /> Download PDF
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Live Preview (A4 Size) */}
        <div className="bg-white shadow-2xl rounded-xl p-10 border border-gray-200 print:shadow-none print:border-none print:p-0">
          {/* CV Header */}
          <div className="border-b-2 border-gray-800 pb-4 mb-6">
            <h1 className="text-4xl font-extrabold text-gray-900 uppercase tracking-wide">
              {formData.fullName || 'Your Name'}
            </h1>
            <p className="text-xl text-blue-600 font-semibold mt-1">
              {formData.jobTitle || 'Your Job Title'}
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-3">
              <span>{formData.email || 'your@email.com'}</span>
              <span>•</span>
              <span>{formData.phone || 'Your Phone'}</span>
            </div>
          </div>

          {/* CV Body - Summary */}
          <div className="mb-8">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-3 border-b border-gray-300 pb-1">Professional Summary</h2>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
              {formData.summary || 'Your professional summary will appear here.'}
            </p>
          </div>

          {/* Placeholder for more sections */}
          <div className="text-gray-400 text-sm italic text-center mt-20 print:hidden">
            --- More sections (Experience, Education, Skills) coming soon in next step ---
          </div>
        </div>

      </main>
    </div>
  );
}