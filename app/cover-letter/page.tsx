'use client';

import { useState } from 'react';
import { ArrowLeft, Printer, Download, Loader2, RefreshCw, Info, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { supabase, saveDocumentRecord, checkUserLimit, incrementUserCount } from '@/lib/supabase';
import { downloadAsWord } from '@/lib/download-utils';

const dummyData = {
  fullName: 'John Doe',
  email: 'johndoe@example.com',
  phone: '+1 234 567 8900',
  address: 'New York, USA',
  companyName: 'Tech Corp',
  companyAddress: '123 Innovation Drive, Silicon Valley, CA',
  jobTitle: 'Senior Software Engineer',
  hiringManager: 'Jane Smith',
  date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  body: `Dear Jane Smith,\n\nI am writing to express my strong interest in the Senior Software Engineer position at Tech Corp. With over 6 years of experience in building scalable web applications and a deep passion for clean, efficient code, I am confident in my ability to contribute effectively to your engineering team.\n\nSincerely,\nJohn Doe`
};

const emptyData = {
  fullName: '', email: '', phone: '', address: '',
  companyName: '', companyAddress: '', jobTitle: '',
  hiringManager: '', date: '', body: '',
};

export default function CoverLetter() {
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
    // Fake delay taake "Generating..." thori der dikhe
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    
    const generatedBody = `Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${formData.jobTitle || 'position'} at ${formData.companyName || 'your company'}. With a proven track record of delivering high-quality results and a passion for continuous improvement, I am confident in my ability to contribute effectively to your team.\n\nThroughout my career, I have developed strong skills in problem-solving, collaboration, and strategic planning. I am eager to bring my expertise to ${formData.companyName || 'your organization'} and help drive success.\n\nThank you for considering my application. I look forward to the opportunity to discuss how I can contribute to your team.\n\nSincerely,\n${formData.fullName || 'Your Name'}`;
    
    setFormData({ ...formData, body: generatedBody });
    setIsGenerating(false);
  };

  const handleAction = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    let userEmail = formData.email;
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
      documentType: 'Cover Letter',
      templateName: template,
      fullName: formData.fullName,
      email: userEmail,
      phone: formData.phone,
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
            {/* AI GENERATE BUTTON */}
            <button type="button" onClick={handleGenerateAI} disabled={isGenerating} className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-1.5 rounded-full disabled:opacity-50">
              {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {isGenerating ? 'Generating...' : 'Generate with AI'}
            </button>
          </div>
          <div className="mb-8">
            <textarea name="body" value={formData.body} onChange={handleChange} rows={10} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-y"></textarea>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button type="button" onClick={handleAction} disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-xl hover:bg-gray-800 font-bold text-sm transition disabled:opacity-50">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />} Print / PDF
            </button>
            <button type="button" onClick={() => downloadAsWord('cover-preview', formData.fullName || 'Cover-Letter')} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 font-bold text-sm transition">
              <Download size={18} /> Word Download
            </button>
          </div>
        </div>

        {/* RIGHT SIDE: LIVE PREVIEW */}
        <div id="cover-preview" className="bg-white shadow-2xl rounded-xl p-12 border border-gray-200 print:shadow-none print:border-none print:p-0 print-area h-fit min-h-[A4]">
          
          {/* Template 1: Modern */}
          {template === 'modern' && (
            <div>
              <div className="border-l-8 border-blue-600 pl-6 mb-8 avoid-break">
                <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">{formData.fullName}</h1>
                <div className="flex flex-wrap gap-2 text-sm text-blue-600 font-medium mt-2">
                  <span>{formData.email}</span> <span>•</span> <span>{formData.phone}</span> <span>•</span> <span>{formData.address}</span>
                </div>
              </div>
              <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-4 avoid-break">
                <div><p className="text-sm font-bold text-gray-900">{formData.date}</p></div>
                <div className="text-right text-sm text-gray-600">
                  <p className="font-bold text-gray-900">{formData.hiringManager}</p>
                  <p>{formData.companyName}</p>
                  <p>{formData.companyAddress}</p>
                </div>
              </div>
              <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{formData.body}</div>
            </div>
          )}

          {/* Template 2: Classic */}
          {template === 'classic' && (
            <div className="font-serif">
              <div className="text-center mb-10 avoid-break">
                <h1 className="text-3xl font-bold text-gray-900 mb-1">{formData.fullName}</h1>
                <p className="text-sm text-gray-600">{formData.address} | {formData.phone} | {formData.email}</p>
              </div>
              <div className="mb-8 text-sm text-gray-800 avoid-break">
                <p className="mb-4">{formData.date}</p>
                <p className="font-bold">{formData.hiringManager}</p>
                <p>{formData.companyName}</p>
                <p>{formData.companyAddress}</p>
              </div>
              <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{formData.body}</div>
            </div>
          )}

          {/* Template 3: Elegant (Naya) */}
          {template === 'elegant' && (
            <div className="font-serif p-4">
              <div className="text-center mb-10 border-b border-gray-300 pb-6 avoid-break">
                <h1 className="text-4xl font-normal text-gray-800 tracking-wider mb-2">{formData.fullName}</h1>
                <div className="flex justify-center gap-4 text-xs text-gray-500 mt-4">
                  <span>{formData.email}</span> <span>•</span> <span>{formData.phone}</span> <span>•</span> <span>{formData.address}</span>
                </div>
              </div>
              <div className="mb-8 text-sm text-gray-800 avoid-break flex justify-between">
                <div>
                  <p className="mb-4">{formData.date}</p>
                  <p className="font-bold">{formData.hiringManager}</p>
                  <p>{formData.companyName}</p>
                  <p>{formData.companyAddress}</p>
                </div>
              </div>
              <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{formData.body}</div>
            </div>
          )}

          {/* Template 4: Minimal (Naya) */}
          {template === 'minimal' && (
            <div className="font-sans p-6">
              <div className="mb-10 avoid-break">
                <h1 className="text-2xl text-gray-900 font-light mb-1">{formData.fullName}</h1>
                <p className="text-xs text-gray-500 uppercase tracking-widest">{formData.email} • {formData.phone}</p>
              </div>
              <div className="mb-8 text-xs text-gray-600 avoid-break">
                <p className="mb-2">{formData.date}</p>
                <p className="font-semibold">{formData.hiringManager}</p>
                <p>{formData.companyName}</p>
              </div>
              <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{formData.body}</div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}