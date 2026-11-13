'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Sparkles, ArrowLeft, Download, Printer, Plus, Trash2, Loader2, Camera, Upload, RefreshCw, Info } from 'lucide-react';
import Link from 'next/link';
import { supabase, saveDocumentRecord, checkUserLimit } from '@/lib/supabase';
import { downloadAsWord } from '@/lib/download-utils';

const dummyData = {
  fullName: 'Muhammad Ali',
  email: 'muhammad.ali@example.com',
  phone: '+1 234 567 8900',
  address: 'New York, USA',
  jobTitle: 'Software Engineer',
  summary: 'Detail-oriented Software Engineer with an academic background in computer science and experience spanning full-stack development, system architecture, and team collaboration. Focused on writing clean code, solving complex problems, and delivering high-quality results.',
  photoUrl: '',
  skills: ['JavaScript', 'React', 'Node.js', 'CSS', 'HTML', 'Python', 'SQL', 'Git'],
  education: [{ degree: 'BS Computer Science', school: 'Tech University', year: '2020 - 2024' }],
  experience: [{ role: 'Frontend Developer', company: 'Tech Corp', duration: '2022 - Present', desc: 'Developed responsive web applications.\nCollaborated with cross-functional teams to define and ship new features.' }],
  languages: [{ language: 'English', proficiency: 'Native' }, { language: 'Spanish', proficiency: 'Basic' }],
  certifications: [{ name: 'AWS Certified Developer', year: '2023', fileUrl: '' }],
  hobbies: ['Reading', 'Hiking', 'Coding'],
  references: [{ name: 'Jane Smith', role: 'CTO at Tech Corp', contact: 'jane@techcorp.com' }],
};

const emptyData = {
  fullName: '', email: '', phone: '', address: '', jobTitle: '', summary: '', photoUrl: '',
  skills: [''], education: [{ degree: '', school: '', year: '' }],
  experience: [{ role: '', company: '', duration: '', desc: '' }],
  languages: [{ language: '', proficiency: '' }], certifications: [{ name: '', year: '', fileUrl: '' }],
  hobbies: [''], references: [{ name: '', role: '', contact: '' }],
};

export default function Builder() {
  const [formData, setFormData] = useState(dummyData);
  const [template, setTemplate] = useState('classicgray');
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCert, setUploadingCert] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const certInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    if (confirm("Are you sure you want to clear all data and start fresh?")) {
      setFormData(emptyData);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `profile-${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('cv-photos').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('cv-photos').getPublicUrl(fileName);
      setFormData({ ...formData, photoUrl: data.publicUrl });
    } catch (error: any) {
      alert("Error uploading image. Make sure 'cv-photos' bucket is created and set to Public.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCertUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCert(index);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `cert-${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('certificates').upload(fileName, file);
      if (error) throw error;
      const { data } = await supabase.storage.from('certificates').getPublicUrl(fileName);
      const newCert = [...formData.certifications];
      newCert[index].fileUrl = data.publicUrl;
      setFormData({ ...formData, certifications: newCert });
    } catch (error: any) {
      alert("Error uploading certificate. Make sure 'certificates' bucket is created and set to Public.");
    } finally {
      setUploadingCert(null);
    }
  };

  const handleArrayChange = (field: keyof typeof formData, index: number, key: string | null, value: string) => {
    const newArray = [...(formData[field] as any[])];
    if (key) {
      newArray[index] = { ...newArray[index], [key]: value };
    } else {
      newArray[index] = value;
    }
    setFormData({ ...formData, [field]: newArray });
  };

  const addArrayItem = (field: keyof typeof formData, emptyItem: any) => {
    setFormData({ ...formData, [field]: [...(formData[field] as any[]), emptyItem] });
  };

  const removeArrayItem = (field: keyof typeof formData, index: number) => {
    setFormData({ ...formData, [field]: (formData[field] as any[]).filter((_, i) => i !== index) });
  };

  const handleGenerateAI = async () => {
    if (!formData.jobTitle) { alert("Please enter a Job Title first."); return; }
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobTitle: formData.jobTitle, 
          experience: formData.experience, 
          education: formData.education 
        }),
      });
      const data = await response.json();
      if (data.summary) {
        setFormData({ 
          ...formData, 
          summary: data.summary,
          skills: data.skills // Skills bhi update karein
        });
      }
    } catch (error) {
      alert("Failed to generate AI summary.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAction = async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || !user.email) {
      alert("Aap login nahi hain. Meharbani farma kar pehle login karein.");
      window.location.href = '/login';
      return;
    }

    let userEmail = user.email;

    // Limit Check
    const limitCheck = await checkUserLimit(userEmail);
    
    if (limitCheck.reason === 'error_fallback') {
      alert("Aap ki profile database mein nahi mili. Meharbani farma kar dobara signup karein ya support se rabta karein.");
      return;
    }

    if (!limitCheck.allowed) {
      alert("You have reached your free limit. Please upgrade to continue.");
      window.location.href = '/payment';
      return;
    }

    // Save record
    await saveDocumentRecord({
      documentType: 'CV',
      templateName: template,
      fullName: formData.fullName,
      email: userEmail,
      phone: formData.phone,
      fullData: formData,
    });

    // Print dialog kholne se pehle wait
    setTimeout(() => {
      window.print();
    }, 500); 
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 print:hidden">
        <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium">
          <ArrowLeft size={20} /> Back to Home
        </Link>
        <div className="font-bold text-xl text-blue-600">CVNova Builder</div>
        <div className="w-24"></div>
      </nav>

      <main className="flex-grow max-w-[1500px] mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8 print:block print:p-0 print:m-0 print:max-w-none">

        {/* LEFT SIDE: FORM */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit max-h-[85vh] overflow-y-auto print:hidden">
          <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h3 className="text-sm font-bold text-gray-800 mb-2">Choose Template Design (19 Options):</h3>
            <div className="flex flex-wrap gap-2">
              {['classicgray', 'modern', 'classic', 'minimal', 'creative', 'executive', 'elegant', 'tech', 'corporate', 'simple', 'bold', 'timeline', 'compact', 'bluecorporate', 'redexecutive', 'greenprofessional', 'darkmode', 'blueheader', 'professional'].map((t) => (
                <button key={t} onClick={() => setTemplate(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${template === t ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6 bg-green-50 border border-green-200 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Info className="text-green-600 shrink-0 mt-0.5" size={20} />
              <p className="text-sm font-medium text-green-800">
                Don't worry! We've filled a sample CV for you. Just replace the text in the fields below with your own details, or clear it to start fresh.
              </p>
            </div>
            <button onClick={resetForm} className="flex items-center gap-2 bg-white text-green-700 border border-green-300 px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-100 transition shadow-sm shrink-0 w-full sm:w-auto justify-center">
              <RefreshCw size={16} /> Clear & Start Fresh
            </button>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Profile Photo (Optional)</h1>
          <div className="mb-8 flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center overflow-hidden relative">
              {formData.photoUrl ? <Image src={formData.photoUrl} alt="Profile" fill className="object-cover" /> : <Camera className="text-gray-400" size={24} />}
            </div>
            <div>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} disabled={uploadingImage} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
                {uploadingImage ? 'Uploading...' : 'Upload Photo'}
              </button>
              <p className="text-xs text-gray-500 mt-1">JPG, PNG max 2MB.</p>
            </div>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Personal Details</h1>
          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label><input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Job Title</label><input type="text" name="jobTitle" value={formData.jobTitle} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label><input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
            </div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Address / City</label><input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Professional Summary</h1>
          <div className="mb-8">
            <textarea name="summary" value={formData.summary} onChange={handleChange} rows={3} className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"></textarea>
            <button type="button" onClick={handleGenerateAI} disabled={isGenerating} className="mt-2 flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-1.5 rounded-full disabled:opacity-50">
              {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {isGenerating ? 'Generating...' : 'Generate with AI'}
            </button>
          </div>

          {/* SKILLS */}
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h1 className="text-xl font-bold text-gray-900">Skills / Core Competencies</h1>
            <button onClick={() => addArrayItem('skills', '')} className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-1"><Plus size={16} /> Add Skill</button>
          </div>
          <div className="space-y-2 mb-8">
            {formData.skills.map((skill, index) => (
              <div key={index} className="flex gap-2">
                <input type="text" value={skill} onChange={(e) => handleArrayChange('skills', index, null, e.target.value)} placeholder="e.g. React" className="flex-1 px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                <button onClick={() => removeArrayItem('skills', index)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={18} /></button>
              </div>
            ))}
          </div>

          {/* EXPERIENCE */}
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h1 className="text-xl font-bold text-gray-900">Experience</h1>
            <button onClick={() => addArrayItem('experience', { role: '', company: '', duration: '', desc: '' })} className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-1"><Plus size={16} /> Add</button>
          </div>
          <div className="space-y-4 mb-8">
            {formData.experience.map((exp, index) => (
              <div key={index} className="p-3 border rounded-lg bg-gray-50 relative">
                <button onClick={() => removeArrayItem('experience', index)} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                <div className="grid grid-cols-2 gap-2 mb-2 pr-6">
                  <input type="text" placeholder="Job Role" value={exp.role} onChange={(e) => handleArrayChange('experience', index, 'role', e.target.value)} className="px-2 py-1.5 border rounded text-sm w-full" />
                  <input type="text" placeholder="Company" value={exp.company} onChange={(e) => handleArrayChange('experience', index, 'company', e.target.value)} className="px-2 py-1.5 border rounded text-sm w-full" />
                </div>
                <input type="text" placeholder="Duration (e.g. 2022 - Present)" value={exp.duration} onChange={(e) => handleArrayChange('experience', index, 'duration', e.target.value)} className="px-2 py-1.5 border rounded text-sm w-full mb-2" />
                <textarea placeholder="Job Description" value={exp.desc} onChange={(e) => handleArrayChange('experience', index, 'desc', e.target.value)} rows={2} className="px-2 py-1.5 border rounded text-sm w-full resize-none"></textarea>
              </div>
            ))}
          </div>

          {/* EDUCATION */}
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h1 className="text-xl font-bold text-gray-900">Education</h1>
            <button onClick={() => addArrayItem('education', { degree: '', school: '', year: '' })} className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-1"><Plus size={16} /> Add</button>
          </div>
          <div className="space-y-4 mb-8">
            {formData.education.map((edu, index) => (
              <div key={index} className="p-3 border rounded-lg bg-gray-50 relative">
                <button onClick={() => removeArrayItem('education', index)} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                <input type="text" placeholder="Degree (e.g. BS Computer Science)" value={edu.degree} onChange={(e) => handleArrayChange('education', index, 'degree', e.target.value)} className="px-2 py-1.5 border rounded text-sm w-full mb-2 pr-6" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="School/University" value={edu.school} onChange={(e) => handleArrayChange('education', index, 'school', e.target.value)} className="px-2 py-1.5 border rounded text-sm w-full" />
                  <input type="text" placeholder="Year" value={edu.year} onChange={(e) => handleArrayChange('education', index, 'year', e.target.value)} className="px-2 py-1.5 border rounded text-sm w-full" />
                </div>
              </div>
            ))}
          </div>

          {/* LANGUAGES */}
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h1 className="text-xl font-bold text-gray-900">Languages</h1>
            <button onClick={() => addArrayItem('languages', { language: '', proficiency: '' })} className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-1"><Plus size={16} /> Add</button>
          </div>
          <div className="space-y-4 mb-8">
            {formData.languages.map((lang, index) => (
              <div key={index} className="flex gap-2 relative pr-8">
                <input type="text" placeholder="Language (e.g. English)" value={lang.language} onChange={(e) => handleArrayChange('languages', index, 'language', e.target.value)} className="flex-1 px-3 py-2 rounded-lg border text-sm" />
                <input type="text" placeholder="Proficiency (e.g. Native)" value={lang.proficiency} onChange={(e) => handleArrayChange('languages', index, 'proficiency', e.target.value)} className="flex-1 px-3 py-2 rounded-lg border text-sm" />
                <button onClick={() => removeArrayItem('languages', index)} className="absolute right-0 top-2 text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
              </div>
            ))}
          </div>

          {/* CERTIFICATIONS */}
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h1 className="text-xl font-bold text-gray-900">Certifications</h1>
            <button onClick={() => addArrayItem('certifications', { name: '', year: '', fileUrl: '' })} className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-1"><Plus size={16} /> Add</button>
          </div>
          <div className="space-y-4 mb-8">
            {formData.certifications.map((cert, index) => (
              <div key={index} className="p-3 border rounded-lg bg-gray-50 relative">
                <button onClick={() => removeArrayItem('certifications', index)} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                <div className="flex gap-2 mb-2 pr-6">
                  <input type="text" placeholder="Certification Name" value={cert.name} onChange={(e) => handleArrayChange('certifications', index, 'name', e.target.value)} className="flex-1 px-3 py-2 rounded-lg border text-sm" />
                  <input type="text" placeholder="Year" value={cert.year} onChange={(e) => handleArrayChange('certifications', index, 'year', e.target.value)} className="w-24 px-3 py-2 rounded-lg border text-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="file" accept="image/*" ref={(el) => { certInputRefs.current[index] = el; }} onChange={(e) => handleCertUpload(e, index)} className="hidden" />
                  <button type="button" onClick={() => certInputRefs.current[index]?.click()} disabled={uploadingCert === index} className="flex items-center gap-1.5 bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-300 transition">
                    {uploadingCert === index ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {cert.fileUrl ? 'Change Certificate' : 'Upload Certificate (Optional)'}
                  </button>
                  {cert.fileUrl && <span className="text-xs text-green-600 font-medium">Uploaded ✓</span>}
                </div>
              </div>
            ))}
          </div>

          {/* HOBBIES */}
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h1 className="text-xl font-bold text-gray-900">Hobbies</h1>
            <button onClick={() => addArrayItem('hobbies', '')} className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-1"><Plus size={16} /> Add</button>
          </div>
          <div className="space-y-2 mb-8">
            {formData.hobbies.map((hobby, index) => (
              <div key={index} className="flex gap-2">
                <input type="text" value={hobby} onChange={(e) => handleArrayChange('hobbies', index, null, e.target.value)} placeholder="e.g. Reading" className="flex-1 px-3 py-2 rounded-lg border text-sm" />
                <button onClick={() => removeArrayItem('hobbies', index)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={18} /></button>
              </div>
            ))}
          </div>

          {/* REFERENCES */}
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h1 className="text-xl font-bold text-gray-900">References</h1>
            <button onClick={() => addArrayItem('references', { name: '', role: '', contact: '' })} className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-1"><Plus size={16} /> Add</button>
          </div>
          <div className="space-y-4 mb-8">
            {formData.references.map((ref, index) => (
              <div key={index} className="p-3 border rounded-lg bg-gray-50 relative">
                <button onClick={() => removeArrayItem('references', index)} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                <div className="grid grid-cols-2 gap-2 mb-2 pr-6">
                  <input type="text" placeholder="Name" value={ref.name} onChange={(e) => handleArrayChange('references', index, 'name', e.target.value)} className="px-2 py-1.5 border rounded text-sm w-full" />
                  <input type="text" placeholder="Role/Company" value={ref.role} onChange={(e) => handleArrayChange('references', index, 'role', e.target.value)} className="px-2 py-1.5 border rounded text-sm w-full" />
                </div>
                <input type="text" placeholder="Contact Info (Email/Phone)" value={ref.contact} onChange={(e) => handleArrayChange('references', index, 'contact', e.target.value)} className="px-2 py-1.5 border rounded text-sm w-full" />
              </div>
            ))}
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button type="button" onClick={handleAction} className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-xl hover:bg-gray-800 font-bold text-sm transition">
              <Printer size={18} /> Print / PDF
            </button>
            <button type="button" onClick={() => downloadAsWord('cv-preview', formData.fullName || 'CV')} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 font-bold text-sm transition">
              <Download size={18} /> Word Download
            </button>
          </div>
        </div>

        {/* RIGHT SIDE: LIVE CV PREVIEW */}
        <div className="py-4 lg:py-8 overflow-x-auto print:p-0">
          <div id="cv-preview" className="print-area max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-2xl border border-gray-200 print:shadow-none print:border-none">
            
            {/* TEMPLATE 1: CLASSIC GRAY */}
            {template === 'classicgray' && (
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
                    {formData.skills.some(s => s) && (
                    <div className="w-full mb-6">
                      <h3 className="font-bold text-gray-900 border-b border-gray-400 pb-1 mb-3 uppercase text-sm">Skill Highlights</h3>
                      <ul className="text-[11px] list-disc pl-4 space-y-1">{formData.skills.map((s, i) => s && <li key={i}>{s}</li>)}</ul>
                    </div>
                    )}
                    {formData.languages.some(l => l.language) && (
                    <div className="w-full mb-6">
                      <h3 className="font-bold text-gray-900 border-b border-gray-400 pb-1 mb-3 uppercase text-sm">Languages</h3>
                      <ul className="text-[11px] list-disc pl-4 space-y-1">{formData.languages.map((l, i) => l.language && <li key={i}>{l.language} – {l.proficiency}</li>)}</ul>
                    </div>
                    )}
                    {formData.hobbies.some(h => h) && (
                    <div className="w-full mb-6">
                      <h3 className="font-bold text-gray-900 border-b border-gray-400 pb-1 mb-3 uppercase text-sm">Hobbies</h3>
                      <ul className="text-[11px] list-disc pl-4 space-y-1">{formData.hobbies.map((h, i) => h && <li key={i}>{h}</li>)}</ul>
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
                    {formData.experience.some(e => e.role) && (
                    <div className="mb-6">
                      <h3 className="font-bold text-gray-800 text-sm mb-3 uppercase tracking-wider border-b border-gray-200 pb-1">Experience</h3>
                      {formData.experience.map((e, i) => e.role && (
                        <div key={i} className="mb-4 avoid-break">
                          <div className="flex justify-between items-baseline mb-1"><h4 className="font-bold text-xs text-gray-900">{e.role}</h4><span className="text-[10px] text-gray-500">{e.duration}</span></div>
                          <p className="text-[11px] text-gray-800 italic mb-1">{e.company}</p>
                          <ul className="text-[10px] text-gray-600 list-disc pl-4 space-y-1 leading-relaxed">{e.desc.split('\n').map((line, idx) => line && <li key={idx}>{line}</li>)}</ul>
                        </div>
                      ))}
                    </div>
                    )}
                    {formData.education.some(e => e.degree) && (
                    <div className="mb-6">
                      <h3 className="font-bold text-gray-800 text-sm mb-3 uppercase tracking-wider border-b border-gray-200 pb-1">Education</h3>
                      {formData.education.map((e, i) => e.degree && (
                        <div key={i} className="mb-2 avoid-break">
                          <div className="flex justify-between items-baseline"><h4 className="font-bold text-xs text-gray-900">{e.degree}</h4><span className="text-[10px] text-gray-500">{e.year}</span></div>
                          <p className="text-[10px] text-gray-600">{e.school}</p>
                        </div>
                      ))}
                    </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* YAHAN AAP BAQI 18 TEMPLATES KA CODE PATE KAR DEIN (Jo aapki file mein hain) */}
            {/* TEMPLATE 2: MODERN */}
            {template === 'modern' && (
              <div className="bg-white h-full text-gray-800 p-8">
                <div className="flex gap-6 mb-6 avoid-break">
                  {formData.photoUrl && <img src={formData.photoUrl} alt="Profile" className="w-32 h-32 object-cover" />}
                  <div className="flex-1 bg-gray-100 p-4"><p className="text-xs text-gray-700 leading-relaxed text-justify">{formData.summary}</p></div>
                </div>
                <div className="bg-gray-600 text-white p-3 mb-6 avoid-break"><h1 className="text-3xl font-bold uppercase tracking-wide">{formData.fullName}</h1></div>
                <div className="flex gap-6">
                  <div className="w-1/3">
                    <div className="mb-4 text-xs avoid-break"><p><strong>Phone:</strong><br/>{formData.phone}</p><p className="mt-2"><strong>E-Mail:</strong><br/>{formData.email}</p></div>
                    {formData.skills.some(s => s) && (<div className="mb-4 avoid-break"><h3 className="font-bold text-sm mb-2 border-b pb-1 uppercase">Skills</h3><ul className="text-[10px] list-disc pl-4">{formData.skills.map((s, i) => s && <li key={i}>{s}</li>)}</ul></div>)}
                  </div>
                  <div className="w-2/3">
                    {formData.experience.some(e => e.role) && (
                    <div className="mb-5">
                      <h3 className="font-bold text-sm mb-3 border-b pb-1 uppercase">Experience</h3>
                      {formData.experience.map((e, i) => e.role && (<div key={i} className="mb-4 avoid-break"><div className="flex justify-between items-baseline mb-1"><h4 className="font-bold text-xs text-gray-900">{e.role} {e.company && `- ${e.company}`}</h4><span className="text-[10px]">{e.duration}</span></div><ul className="text-[10px] text-gray-600 list-disc pl-4">{e.desc.split('\n').map((line, idx) => line && <li key={idx}>{line}</li>)}</ul></div>))}
                    </div>
                    )}
                    {formData.education.some(e => e.degree) && (
                    <div className="mb-5">
                      <h3 className="font-bold text-sm mb-3 border-b pb-1 uppercase">Education</h3>
                      {formData.education.map((e, i) => e.degree && (<div key={i} className="mb-2 avoid-break"><div className="flex justify-between items-baseline"><h4 className="font-bold text-xs text-gray-900">{e.degree}</h4><span className="text-[10px]">{e.year}</span></div><p className="text-[10px] text-gray-600">{e.school}</p></div>))}
                    </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ... BAQI TEMPLATES YAHAN PATE KAREIN ... */}

          </div>
        </div>
      </main>
    </div>
  );
}