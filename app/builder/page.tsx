'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Sparkles, ArrowLeft, Download, Printer, Plus, Trash2, Loader2, Camera, Upload } from 'lucide-react';
import Link from 'next/link';
import { supabase, saveDocumentRecord, checkUserLimit, incrementUserCount } from '@/lib/supabase';

export default function Builder() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    jobTitle: '',
    summary: '',
    photoUrl: '',
    skills: [''],
    education: [{ degree: '', school: '', year: '' }],
    experience: [{ role: '', company: '', duration: '', desc: '' }],
    languages: [{ language: '', proficiency: '' }],
    certifications: [{ name: '', year: '', fileUrl: '' }],
    hobbies: [''],
    references: [{ name: '', role: '', contact: '' }],
  });

  const [template, setTemplate] = useState('classicgray'); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCert, setUploadingCert] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const certInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Profile Photo Upload
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

  // Certificate Upload
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
        body: JSON.stringify({ jobTitle: formData.jobTitle, skills: formData.skills.join(', ') }),
      });
      const data = await response.json();
      if (data.summary) setFormData({ ...formData, summary: data.summary });
    } catch (error) {
      alert("Failed to generate AI summary.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAction = async () => {
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
        return;
      }
    }

    await saveDocumentRecord({
      documentType: 'CV',
      templateName: template,
      fullName: formData.fullName,
      email: userEmail,
      phone: formData.phone,
      fullData: formData,
    });

    if (isLoggedIn) await incrementUserCount(userEmail);
    window.print();
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

      <main className="flex-grow max-w-[1500px] mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT SIDE: FORM */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit max-h-[85vh] overflow-y-auto print:hidden">
          
          <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h3 className="text-sm font-bold text-gray-800 mb-2">Choose Template Design (18 Options):</h3>
            <div className="flex flex-wrap gap-2">
              {['classicgray', 'modern', 'classic', 'minimal', 'creative', 'executive', 'elegant', 'tech', 'corporate', 'simple', 'bold', 'timeline', 'compact', 'bluecorporate', 'redexecutive', 'greenprofessional', 'darkmode', 'blueheader'].map((t) => (
                <button key={t} onClick={() => setTemplate(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${template === t ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Profile Photo (Optional)</h1>
          <div className="mb-8 flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center overflow-hidden relative">
              {formData.photoUrl ? (
                <Image src={formData.photoUrl} alt="Profile" fill className="object-cover" />
              ) : (
                <Camera className="text-gray-400" size={24} />
              )}
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
            <h1 className="text-xl font-bold text-gray-900">Skills</h1>
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

          {/* CERTIFICATIONS with Upload Option */}
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
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={(el) => { certInputRefs.current[index] = el; }} 
                    onChange={(e) => handleCertUpload(e, index)} 
                    className="hidden" 
                  />
                  <button 
                    type="button"
                    onClick={() => certInputRefs.current[index]?.click()} 
                    disabled={uploadingCert === index}
                    className="flex items-center gap-1.5 bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-300 transition"
                  >
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
              <Printer size={18} /> Print CV
            </button>
            <button type="button" onClick={handleAction} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 font-bold text-sm transition">
              <Download size={18} /> Download
            </button>
          </div>
        </div>

        {/* RIGHT SIDE: LIVE CV PREVIEW */}
        <div className="bg-white shadow-2xl rounded-xl border border-gray-200 print:shadow-none print:border-none print:p-0 h-fit min-h-[A4] overflow-hidden">
          
          {/* TEMPLATE 1: CLASSIC GRAY */}
          {template === 'classicgray' && (
            <div className="bg-white h-full text-gray-800">
              <div className="flex h-full">
                <div className="w-[35%] bg-[#E5E7EB] p-6 flex flex-col">
                  {formData.photoUrl ? (
                    <img src={formData.photoUrl} alt="Profile" className="w-32 h-32 object-cover rounded-full mx-auto mb-6 border-4 border-white shadow-sm" />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gray-300 mx-auto mb-6 border-4 border-white"></div>
                  )}
                  
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
                    <ul className="text-[11px] list-disc pl-4 space-y-1">
                      {formData.skills.map((s, i) => s && <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                  )}

                  {formData.languages.some(l => l.language) && (
                  <div className="w-full mb-6">
                    <h3 className="font-bold text-gray-900 border-b border-gray-400 pb-1 mb-3 uppercase text-sm">Languages</h3>
                    <ul className="text-[11px] list-disc pl-4 space-y-1">
                      {formData.languages.map((l, i) => l.language && <li key={i}>{l.language} – {l.proficiency}</li>)}
                    </ul>
                  </div>
                  )}

                  {formData.hobbies.some(h => h) && (
                  <div className="w-full mb-6">
                    <h3 className="font-bold text-gray-900 border-b border-gray-400 pb-1 mb-3 uppercase text-sm">Hobbies</h3>
                    <ul className="text-[11px] list-disc pl-4 space-y-1">
                      {formData.hobbies.map((h, i) => h && <li key={i}>{h}</li>)}
                    </ul>
                  </div>
                  )}
                </div>

                <div className="w-[65%] p-8 bg-white">
                  <div className="mb-6 border-b-2 border-gray-200 pb-4">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-wide uppercase">{formData.fullName}</h1>
                    <h2 className="text-lg text-[#D97706] font-semibold mt-1">{formData.jobTitle}</h2>
                  </div>
                  
                  {formData.summary && (
                  <div className="mb-6">
                    <h3 className="font-bold text-gray-800 text-sm mb-2 uppercase tracking-wider border-b border-gray-200 pb-1">Summary</h3>
                    <p className="text-[11px] text-gray-700 leading-relaxed text-justify">{formData.summary}</p>
                  </div>
                  )}

                  {formData.experience.some(e => e.role) && (
                  <div className="mb-6">
                    <h3 className="font-bold text-gray-800 text-sm mb-3 uppercase tracking-wider border-b border-gray-200 pb-1">Experience</h3>
                    {formData.experience.map((e, i) => e.role && (
                      <div key={i} className="mb-4">
                        <div className="flex justify-between items-baseline mb-1">
                          <h4 className="font-bold text-xs text-gray-900">{e.role}</h4>
                          <span className="text-[10px] text-gray-500">{e.duration}</span>
                        </div>
                        <p className="text-[11px] text-gray-800 italic mb-1">{e.company}</p>
                        <ul className="text-[10px] text-gray-600 list-disc pl-4 space-y-1 leading-relaxed">
                          {e.desc.split('\n').map((line, idx) => line && <li key={idx}>{line}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                  )}

                  {formData.education.some(e => e.degree) && (
                  <div className="mb-6">
                    <h3 className="font-bold text-gray-800 text-sm mb-3 uppercase tracking-wider border-b border-gray-200 pb-1">Education</h3>
                    {formData.education.map((e, i) => e.degree && (
                      <div key={i} className="mb-2">
                        <div className="flex justify-between items-baseline">
                          <h4 className="font-bold text-xs text-gray-900">{e.degree}</h4>
                          <span className="text-[10px] text-gray-500">{e.year}</span>
                        </div>
                        <p className="text-[10px] text-gray-600">{e.school}</p>
                      </div>
                    ))}
                  </div>
                  )}

                  {formData.certifications.some(c => c.name) && (
                  <div className="mb-6">
                    <h3 className="font-bold text-gray-800 text-sm mb-3 uppercase tracking-wider border-b border-gray-200 pb-1">Certifications</h3>
                    {formData.certifications.map((c, i) => c.name && (
                      <div key={i} className="mb-2 text-[11px] flex justify-between items-center">
                        <div>
                          <span className="font-bold text-gray-900">{c.name}</span> {c.year && `(${c.year})`}
                        </div>
                        {c.fileUrl && (
                          <a href={c.fileUrl} target="_blank" className="text-blue-500 text-[10px] underline print:hidden">View Cert</a>
                        )}
                      </div>
                    ))}
                  </div>
                  )}

                  {formData.references.some(r => r.name) && (
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm mb-3 uppercase tracking-wider border-b border-gray-200 pb-1">References</h3>
                    <div className="text-[11px]">
                      <p className="italic text-gray-600">References available on request</p>
                      {formData.references.map((r, i) => r.name && (
                        <div key={i} className="mt-2">
                          <p className="font-bold text-gray-900">{r.name}</p>
                          <p className="text-gray-600">{r.role} | {r.contact}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 2: MODERN */}
          {template === 'modern' && (
            <div className="bg-white h-full text-gray-800 p-8">
              <div className="flex gap-6 mb-6">
                {formData.photoUrl && (
                  <img src={formData.photoUrl} alt="Profile" className="w-32 h-32 object-cover" />
                )}
                <div className="flex-1 bg-gray-100 p-4">
                   <p className="text-xs text-gray-700 leading-relaxed text-justify">
                     {formData.summary || "Senior Web Developer specializing in front end development. Experienced with all stages of the development cycle for dynamic web projects."}
                   </p>
                </div>
              </div>

              <div className="bg-gray-600 text-white p-3 mb-6">
                <h1 className="text-3xl font-bold uppercase tracking-wide">{formData.fullName}</h1>
              </div>

              <div className="flex gap-6">
                <div className="w-1/3">
                  <div className="mb-4 text-xs">
                    <p><strong>Phone:</strong><br/>{formData.phone}</p>
                    <p className="mt-2"><strong>E-Mail:</strong><br/>{formData.email}</p>
                    <p className="mt-2"><strong>Address:</strong><br/>{formData.address}</p>
                  </div>

                  {formData.skills.some(s => s) && (
                  <div className="mb-4">
                    <h3 className="font-bold text-gray-800 text-sm mb-2 border-b border-gray-300 pb-1 uppercase tracking-wide">Skill Highlights</h3>
                    <ul className="text-[10px] text-gray-700 list-disc pl-4 space-y-1">
                      {formData.skills.map((s, i) => s && <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                  )}

                  {formData.languages.some(l => l.language) && (
                  <div className="mb-4">
                    <h3 className="font-bold text-gray-800 text-sm mb-2 border-b border-gray-300 pb-1 uppercase tracking-wide">Languages</h3>
                    <ul className="text-[10px] text-gray-700 list-disc pl-4 space-y-1">
                      {formData.languages.map((l, i) => l.language && <li key={i}>{l.language} - {l.proficiency}</li>)}
                    </ul>
                  </div>
                  )}

                  {formData.hobbies.some(h => h) && (
                  <div className="mb-4">
                    <h3 className="font-bold text-gray-800 text-sm mb-2 border-b border-gray-300 pb-1 uppercase tracking-wide">Hobbies</h3>
                    <ul className="text-[10px] text-gray-700 list-disc pl-4 space-y-1">
                      {formData.hobbies.map((h, i) => h && <li key={i}>{h}</li>)}
                    </ul>
                  </div>
                  )}
                </div>

                <div className="w-2/3">
                  {formData.experience.some(e => e.role) && (
                  <div className="mb-5">
                    <h3 className="font-bold text-gray-800 text-sm mb-3 border-b border-gray-300 pb-1 uppercase tracking-wide">Experience</h3>
                    {formData.experience.map((e, i) => e.role && (
                      <div key={i} className="mb-4">
                        <div className="flex justify-between items-baseline mb-1">
                          <h4 className="font-bold text-xs text-gray-900">{e.role} {e.company && `- ${e.company}`}</h4>
                          <span className="text-[10px] text-gray-600">{e.duration}</span>
                        </div>
                        <ul className="text-[10px] text-gray-600 list-disc pl-4 space-y-1 leading-relaxed">
                          {e.desc.split('\n').map((line, idx) => line && <li key={idx}>{line}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                  )}

                  {formData.education.some(e => e.degree) && (
                  <div className="mb-5">
                    <h3 className="font-bold text-gray-800 text-sm mb-3 border-b border-gray-300 pb-1 uppercase tracking-wide">Education</h3>
                    {formData.education.map((e, i) => e.degree && (
                      <div key={i} className="mb-2">
                        <div className="flex justify-between items-baseline">
                          <h4 className="font-bold text-xs text-gray-900">{e.degree}</h4>
                          <span className="text-[10px] text-gray-500">{e.year}</span>
                        </div>
                        <p className="text-[10px] text-gray-600">{e.school}</p>
                      </div>
                    ))}
                  </div>
                  )}

                  {formData.certifications.some(c => c.name) && (
                  <div className="mb-5">
                    <h3 className="font-bold text-gray-800 text-sm mb-3 border-b border-gray-300 pb-1 uppercase tracking-wide">Certifications</h3>
                    <ul className="text-[10px] text-gray-600 space-y-1">
                      {formData.certifications.map((c, i) => c.name && (
                        <li key={i}>
                          <span className="font-bold text-gray-900">{c.name}</span> {c.year && `(${c.year})`}
                          {c.fileUrl && <a href={c.fileUrl} target="_blank" className="text-blue-500 ml-2 underline print:hidden">View</a>}
                        </li>
                      ))}
                    </ul>
                  </div>
                  )}

                  {formData.references.some(r => r.name) && (
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm mb-3 border-b border-gray-300 pb-1 uppercase tracking-wide">References</h3>
                    <p className="text-[10px] italic text-gray-600 mb-2">References available on request</p>
                    {formData.references.map((r, i) => r.name && (
                      <div key={i} className="mb-2 text-[10px]">
                        <p className="font-bold text-gray-900">{r.name}</p>
                        <p className="text-gray-600">{r.role} | {r.contact}</p>
                      </div>
                    ))}
                  </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 3: CLASSIC */}
          {template === 'classic' && (
            <div className="p-10">
              <div className="text-center border-b-2 border-gray-900 pb-4 mb-6">
                <h1 className="text-3xl font-serif font-bold text-gray-900 tracking-wide">{formData.fullName}</h1>
                <p className="text-md text-gray-600 mt-1">{formData.jobTitle}</p>
                <div className="flex justify-center gap-3 text-xs text-gray-500 mt-2"><span>{formData.email}</span> <span>|</span> <span>{formData.phone}</span> <span>|</span> <span>{formData.address}</span></div>
              </div>
              <div className="mb-5"><h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1">Summary</h2><p className="text-gray-700 text-sm leading-relaxed">{formData.summary}</p></div>
              <div className="mb-5">
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2">Experience</h2>
                {formData.experience.map((exp, i) => (
                  <div key={i} className="mb-3">
                    <div className="flex justify-between"><h3 className="font-bold text-gray-900 text-sm">{exp.company}</h3><span className="text-xs text-gray-600">{exp.duration}</span></div>
                    <p className="text-xs italic text-gray-700">{exp.role}</p>
                    <p className="text-xs text-gray-600 mt-1">{exp.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mb-5">
                <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2">Education</h2>
                {formData.education.map((edu, i) => (
                  <div key={i} className="flex justify-between mb-2">
                    <div><h3 className="font-bold text-gray-900 text-sm">{edu.degree}</h3><p className="text-xs text-gray-600">{edu.school}</p></div>
                    <span className="text-xs text-gray-600">{edu.year}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1">Skills</h2>
                  <ul className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, i) => skill && (
                      <li key={i} className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded">{skill}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1">Languages</h2>
                  <ul className="text-sm text-gray-700 list-disc pl-4">
                    {formData.languages.map((l, i) => l.language && <li key={i}>{l.language} - {l.proficiency}</li>)}
                  </ul>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {formData.certifications.some(c=>c.name) && (
                  <div>
                    <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1">Certifications</h2>
                    <ul className="text-sm text-gray-700 flex flex-col gap-1">
                      {formData.certifications.map((c, i) => c.name && <li key={i}>{c.name} {c.year && `(${c.year})`}</li>)}
                    </ul>
                  </div>
                )}
                {formData.references.some(r=>r.name) && (
                  <div>
                    <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1">References</h2>
                    <ul className="text-sm text-gray-700">
                      {formData.references.map((r, i) => r.name && <li key={i}>{r.name} - {r.contact}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TEMPLATE 4: MINIMAL */}
          {template === 'minimal' && (
            <div className="font-light p-10">
              <div className="mb-8">
                <h1 className="text-4xl text-gray-900 mb-1">{formData.fullName}</h1>
                <p className="text-gray-500 uppercase tracking-widest text-sm">{formData.jobTitle}</p>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-1 text-xs text-gray-500 space-y-4">
                  <div><h3 className="font-bold text-gray-900 uppercase tracking-wider mb-1">Contact</h3><p>{formData.email}</p><p>{formData.phone}</p><p>{formData.address}</p></div>
                  <div><h3 className="font-bold text-gray-900 uppercase tracking-wider mb-1">Skills</h3><ul className="list-disc pl-4">{formData.skills.map((s, i) => s && <li key={i}>{s}</li>)}</ul></div>
                  <div><h3 className="font-bold text-gray-900 uppercase tracking-wider mb-1">Languages</h3><ul className="list-disc pl-4">{formData.languages.map((l, i) => l.language && <li key={i}>{l.language} ({l.proficiency})</li>)}</ul></div>
                  <div><h3 className="font-bold text-gray-900 uppercase tracking-wider mb-1">Certifications</h3><ul className="list-disc pl-4">{formData.certifications.map((c, i) => c.name && <li key={i}>{c.name} ({c.year})</li>)}</ul></div>
                  <div><h3 className="font-bold text-gray-900 uppercase tracking-wider mb-1">Hobbies</h3><ul className="list-disc pl-4">{formData.hobbies.map((h, i) => h && <li key={i}>{h}</li>)}</ul></div>
                  <div><h3 className="font-bold text-gray-900 uppercase tracking-wider mb-1">References</h3><ul className="list-disc pl-4">{formData.references.map((r, i) => r.name && <li key={i}>{r.name}</li>)}</ul></div>
                </div>
                <div className="col-span-2 space-y-6">
                  <div><h3 className="font-bold text-gray-900 uppercase tracking-wider text-sm border-b pb-1 mb-2">Profile</h3><p className="text-sm text-gray-700 leading-relaxed">{formData.summary}</p></div>
                  <div><h3 className="font-bold text-gray-900 uppercase tracking-wider text-sm border-b pb-1 mb-2">Experience</h3>{formData.experience.map((e, i) => <div key={i} className="mb-4"><h4 className="font-bold text-gray-800">{e.role}</h4><p className="text-xs text-gray-500 mb-1">{e.company} | {e.duration}</p><p className="text-sm text-gray-700">{e.desc}</p></div>)}</div>
                  <div><h3 className="font-bold text-gray-900 uppercase tracking-wider text-sm border-b pb-1 mb-2">Education</h3>{formData.education.map((e, i) => <div key={i} className="mb-4"><h4 className="font-bold text-gray-800">{e.degree}</h4><p className="text-xs text-gray-500 mb-1">{e.school} | {e.year}</p></div>)}</div>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 5: CREATIVE */}
          {template === 'creative' && (
            <div className="flex flex-col h-full p-10">
              <div className="bg-gray-900 text-white p-6 rounded-t-xl mb-6">
                <h1 className="text-4xl font-bold">{formData.fullName}</h1>
                <p className="text-blue-300 font-medium mt-1">{formData.jobTitle}</p>
              </div>
              <div className="flex gap-6 px-2">
                <div className="w-1/3">
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 text-blue-600">Contact</h2>
                  <div className="text-xs text-gray-700 space-y-1 mb-6">
                    <p>{formData.email}</p><p>{formData.phone}</p><p>{formData.address}</p>
                  </div>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 text-blue-600">Skills</h2>
                  <ul className="text-xs text-gray-700 space-y-1 mb-6">{formData.skills.map((s, i) => s && <li key={i}>• {s}</li>)}</ul>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 text-blue-600">Languages</h2>
                  <ul className="text-xs text-gray-700 space-y-1 mb-6">{formData.languages.map((l, i) => l.language && <li key={i}>• {l.language}</li>)}</ul>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 text-blue-600">Education</h2>
                  {formData.education.map((e, i) => <div key={i} className="mb-3 text-xs"><p className="font-bold text-gray-900">{e.degree}</p><p>{e.school}</p><p className="text-gray-500">{e.year}</p></div>)}
                </div>
                <div className="w-2/3">
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 text-blue-600">Profile</h2>
                  <p className="text-sm text-gray-700 leading-relaxed mb-6">{formData.summary}</p>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 text-blue-600">Experience</h2>
                  {formData.experience.map((e, i) => <div key={i} className="mb-4"><h3 className="font-bold text-gray-900 text-sm">{e.role}</h3><p className="text-xs text-blue-600 font-semibold mb-1">{e.company} | {e.duration}</p><p className="text-xs text-gray-700 leading-relaxed">{e.desc}</p></div>)}
                  
                  {formData.certifications.some(c=>c.name) && (
                  <div className="mt-6">
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 text-blue-600">Certifications</h2>
                    <ul className="text-xs text-gray-700 space-y-1">{formData.certifications.map((c, i) => c.name && <li key={i}>• {c.name} {c.year && `(${c.year})`}</li>)}</ul>
                  </div>
                  )}
                  {formData.references.some(r=>r.name) && (
                  <div className="mt-6">
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 text-blue-600">References</h2>
                    <ul className="text-xs text-gray-700 space-y-1">{formData.references.map((r, i) => r.name && <li key={i}>• {r.name} | {r.contact}</li>)}</ul>
                  </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 6: EXECUTIVE */}
          {template === 'executive' && (
            <div className="border-t-[10px] border-gray-900 pt-6 p-10">
              <div className="flex justify-between items-end border-b-2 border-gray-300 pb-4 mb-6">
                <div><h1 className="text-4xl font-black text-gray-900">{formData.fullName}</h1><p className="text-lg text-gray-600 mt-1">{formData.jobTitle}</p></div>
                <div className="text-right text-xs text-gray-500 space-y-1"><p>{formData.email}</p><p>{formData.phone}</p><p>{formData.address}</p></div>
              </div>
              <div className="mb-5"><h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1 border-b-2 border-gray-900 inline-block pb-1">Profile</h2><p className="text-gray-700 text-sm leading-relaxed mt-2">{formData.summary}</p></div>
              <div className="mb-5"><h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2 border-b-2 border-gray-900 inline-block pb-1">Experience</h2>{formData.experience.map((e, i) => <div key={i} className="mb-3"><div className="flex justify-between"><h3 className="font-bold text-gray-900 text-sm">{e.role}</h3><span className="text-xs text-gray-600">{e.duration}</span></div><p className="text-xs font-semibold text-gray-700">{e.company}</p><p className="text-xs text-gray-600 mt-1">{e.desc}</p></div>)}</div>
              <div className="mb-5"><h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2 border-b-2 border-gray-900 inline-block pb-1">Education</h2>{formData.education.map((e, i) => <div key={i} className="flex justify-between mb-2"><div><h3 className="font-bold text-gray-900 text-sm">{e.degree}</h3><p className="text-xs text-gray-600">{e.school}</p></div><span className="text-xs text-gray-600">{e.year}</span></div>)}</div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1 border-b-2 border-gray-900 inline-block pb-1">Skills</h2><ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2">{formData.skills.map((s, i) => s && <li key={i} className="text-sm text-gray-700">• {s}</li>)}</ul></div>
                <div><h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1 border-b-2 border-gray-900 inline-block pb-1">Languages</h2><ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2">{formData.languages.map((l, i) => l.language && <li key={i} className="text-sm text-gray-700">• {l.language}</li>)}</ul></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {formData.certifications.some(c=>c.name) && (
                  <div><h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1 border-b-2 border-gray-900 inline-block pb-1">Certifications</h2><ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2">{formData.certifications.map((c, i) => c.name && <li key={i} className="text-sm text-gray-700">• {c.name}</li>)}</ul></div>
                )}
                {formData.references.some(r=>r.name) && (
                  <div><h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1 border-b-2 border-gray-900 inline-block pb-1">References</h2><ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2">{formData.references.map((r, i) => r.name && <li key={i} className="text-sm text-gray-700">• {r.name}</li>)}</ul></div>
                )}
              </div>
            </div>
          )}

          {/* TEMPLATE 7: ELEGANT */}
          {template === 'elegant' && (
            <div className="font-serif p-10">
              <div className="text-center mb-8 border-b border-gray-300 pb-6">
                <h1 className="text-4xl font-normal text-gray-800 tracking-wider mb-2">{formData.fullName}</h1>
                <p className="text-sm text-gray-500 uppercase tracking-[0.3em]">{formData.jobTitle}</p>
                <div className="flex justify-center gap-4 text-xs text-gray-500 mt-4"><span>{formData.email}</span> <span>•</span> <span>{formData.phone}</span> <span>•</span> <span>{formData.address}</span></div>
              </div>
              <div className="grid grid-cols-12 gap-8">
                <div className="col-span-8 space-y-6">
                  <div><h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3 pb-1 border-b border-gray-200">Experience</h2>{formData.experience.map((e, i) => <div key={i} className="mb-4"><h3 className="font-bold text-gray-900 text-sm">{e.role}</h3><p className="text-xs italic text-gray-600 mb-1">{e.company} | {e.duration}</p><p className="text-xs text-gray-700 leading-relaxed">{e.desc}</p></div>)}</div>
                  <div><h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3 pb-1 border-b border-gray-200">Education</h2>{formData.education.map((e, i) => <div key={i} className="mb-3"><h3 className="font-bold text-gray-900 text-sm">{e.degree}</h3><p className="text-xs text-gray-600">{e.school} | {e.year}</p></div>)}</div>
                </div>
                <div className="col-span-4 space-y-6">
                  <div><h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3 pb-1 border-b border-gray-200">Profile</h2><p className="text-xs text-gray-700 leading-relaxed">{formData.summary}</p></div>
                  <div><h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3 pb-1 border-b border-gray-200">Skills</h2><ul className="text-xs text-gray-700 space-y-1">{formData.skills.map((s, i) => s && <li key={i}>{s}</li>)}</ul></div>
                  <div><h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3 pb-1 border-b border-gray-200">Languages</h2><ul className="text-xs text-gray-700 space-y-1">{formData.languages.map((l, i) => l.language && <li key={i}>{l.language}</li>)}</ul></div>
                  <div><h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3 pb-1 border-b border-gray-200">Certifications</h2><ul className="text-xs text-gray-700 space-y-1">{formData.certifications.map((c, i) => c.name && <li key={i}>{c.name}</li>)}</ul></div>
                  <div><h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3 pb-1 border-b border-gray-200">References</h2><ul className="text-xs text-gray-700 space-y-1">{formData.references.map((r, i) => r.name && <li key={i}>{r.name}</li>)}</ul></div>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 8: TECH */}
          {template === 'tech' && (
            <div className="font-mono text-sm p-10">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">{formData.fullName}</h1>
                <p className="text-blue-600">{formData.jobTitle}</p>
                <div className="text-xs text-gray-500 mt-2">[{formData.email}] [{formData.phone}] [{formData.address}]</div>
              </div>
              <div className="mb-4"><span className="text-blue-600 font-bold">## Summary</span><p className="text-gray-700 mt-1">{formData.summary}</p></div>
              <div className="mb-4"><span className="text-blue-600 font-bold">## Experience</span>{formData.experience.map((e, i) => <div key={i} className="mt-2"><p className="font-bold text-gray-900">{e.role} @ {e.company} ({e.duration})</p><p className="text-gray-600">{e.desc}</p></div>)}</div>
              <div className="mb-4"><span className="text-blue-600 font-bold">## Education</span>{formData.education.map((e, i) => <div key={i} className="mt-2"><p className="font-bold text-gray-900">{e.degree}</p><p className="text-gray-600">{e.school} ({e.year})</p></div>)}</div>
              <div className="mb-4"><span className="text-blue-600 font-bold">## Skills</span><p className="text-gray-700 mt-1">{formData.skills.join(', ')}</p></div>
              <div className="mb-4"><span className="text-blue-600 font-bold">## Languages</span><p className="text-gray-700 mt-1">{formData.languages.map(l=>l.language).join(', ')}</p></div>
              <div className="mb-4"><span className="text-blue-600 font-bold">## Certifications</span><ul className="text-gray-700 mt-1 list-disc pl-4">{formData.certifications.map((c,i) => c.name && <li key={i}>{c.name} ({c.year})</li>)}</ul></div>
              <div><span className="text-blue-600 font-bold">## References</span><ul className="text-gray-700 mt-1 list-disc pl-4">{formData.references.map((r,i) => r.name && <li key={i}>{r.name} - {r.contact}</li>)}</ul></div>
            </div>
          )}

          {/* TEMPLATE 9: CORPORATE */}
          {template === 'corporate' && (
            <div className="p-10">
              <div className="bg-blue-900 text-white p-6 mb-6">
                <h1 className="text-3xl font-bold uppercase tracking-wider">{formData.fullName}</h1>
                <p className="text-blue-200 mt-1">{formData.jobTitle}</p>
                <div className="flex gap-4 text-xs text-blue-200 mt-3"><span>{formData.email}</span> <span>|</span> <span>{formData.phone}</span> <span>|</span> <span>{formData.address}</span></div>
              </div>
              <div className="px-4">
                <div className="mb-6"><h2 className="text-sm font-bold text-blue-900 uppercase border-b border-blue-900 pb-1 mb-2">Profile</h2><p className="text-gray-700 text-sm">{formData.summary}</p></div>
                <div className="mb-6"><h2 className="text-sm font-bold text-blue-900 uppercase border-b border-blue-900 pb-1 mb-2">Experience</h2>{formData.experience.map((e, i) => <div key={i} className="mb-3"><div className="flex justify-between"><h3 className="font-bold text-gray-900">{e.role}</h3><span className="text-xs text-gray-500">{e.duration}</span></div><p className="text-xs text-blue-700 font-medium">{e.company}</p><p className="text-xs text-gray-600">{e.desc}</p></div>)}</div>
                <div className="mb-6"><h2 className="text-sm font-bold text-blue-900 uppercase border-b border-blue-900 pb-1 mb-2">Education</h2>{formData.education.map((e, i) => <div key={i} className="mb-2"><div className="flex justify-between"><h3 className="font-bold text-gray-900 text-sm">{e.degree}</h3><span className="text-xs text-gray-500">{e.year}</span></div><p className="text-xs text-gray-600">{e.school}</p></div>)}</div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><h2 className="text-sm font-bold text-blue-900 uppercase border-b border-blue-900 pb-1 mb-2">Skills</h2><div className="flex flex-wrap gap-2">{formData.skills.map((s, i) => s && <span key={i} className="bg-blue-50 text-blue-800 text-xs px-2 py-1 rounded border border-blue-200">{s}</span>)}</div></div>
                  <div><h2 className="text-sm font-bold text-blue-900 uppercase border-b border-blue-900 pb-1 mb-2">Languages</h2><ul className="text-xs text-gray-700 list-disc pl-4">{formData.languages.map((l, i) => l.language && <li key={i}>{l.language}</li>)}</ul></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {formData.certifications.some(c=>c.name) && (
                    <div><h2 className="text-sm font-bold text-blue-900 uppercase border-b border-blue-900 pb-1 mb-2">Certifications</h2><ul className="text-xs text-gray-700 list-disc pl-4">{formData.certifications.map((c, i) => c.name && <li key={i}>{c.name}</li>)}</ul></div>
                  )}
                  {formData.references.some(r=>r.name) && (
                    <div><h2 className="text-sm font-bold text-blue-900 uppercase border-b border-blue-900 pb-1 mb-2">References</h2><ul className="text-xs text-gray-700 list-disc pl-4">{formData.references.map((r, i) => r.name && <li key={i}>{r.name}</li>)}</ul></div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 10: SIMPLE */}
          {template === 'simple' && (
            <div className="text-gray-800 p-10">
              <div className="mb-6">
                <h1 className="text-3xl font-bold">{formData.fullName}</h1>
                <p className="text-gray-600">{formData.jobTitle}</p>
                <p className="text-xs text-gray-500 mt-1">{formData.email} | {formData.phone} | {formData.address}</p>
              </div>
              <hr className="mb-4 border-gray-300" />
              <div className="mb-4"><h2 className="font-bold text-gray-900 mb-1">Summary</h2><p className="text-sm text-gray-700">{formData.summary}</p></div>
              <hr className="mb-4 border-gray-300" />
              <div className="mb-4"><h2 className="font-bold text-gray-900 mb-2">Experience</h2>{formData.experience.map((e, i) => <div key={i} className="mb-3"><div className="flex justify-between"><h3 className="font-semibold text-sm">{e.role}</h3><span className="text-xs text-gray-500">{e.duration}</span></div><p className="text-xs text-gray-600 italic">{e.company}</p><p className="text-sm text-gray-700 mt-1">{e.desc}</p></div>)}</div>
              <hr className="mb-4 border-gray-300" />
              <div className="mb-4"><h2 className="font-bold text-gray-900 mb-2">Education</h2>{formData.education.map((e, i) => <div key={i} className="mb-2"><div className="flex justify-between"><h3 className="font-semibold text-sm">{e.degree}</h3><span className="text-xs text-gray-500">{e.year}</span></div><p className="text-sm text-gray-600">{e.school}</p></div>)}</div>
              <hr className="mb-4 border-gray-300" />
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><h2 className="font-bold text-gray-900 mb-1">Skills</h2><p className="text-sm text-gray-700">{formData.skills.join(' • ')}</p></div>
                <div><h2 className="font-bold text-gray-900 mb-1">Languages</h2><p className="text-sm text-gray-700">{formData.languages.map(l=>l.language).join(' • ')}</p></div>
              </div>
              <hr className="mb-4 border-gray-300" />
              <div className="grid grid-cols-2 gap-4">
                <div><h2 className="font-bold text-gray-900 mb-1">Certifications</h2><p className="text-sm text-gray-700">{formData.certifications.map(c=>c.name).join(' • ')}</p></div>
                <div><h2 className="font-bold text-gray-900 mb-1">References</h2><p className="text-sm text-gray-700">{formData.references.map(r=>r.name).join(' • ')}</p></div>
              </div>
            </div>
          )}

          {/* TEMPLATE 11: BOLD */}
          {template === 'bold' && (
            <div className="p-10">
              <div className="mb-6">
                <h1 className="text-5xl font-black text-gray-900 uppercase leading-none">{formData.fullName}</h1>
                <p className="text-xl font-bold text-gray-500 mt-1">{formData.jobTitle}</p>
              </div>
              <div className="bg-gray-100 p-4 mb-6 flex gap-4 text-xs font-semibold text-gray-600">{formData.email} <span>/</span> {formData.phone} <span>/</span> {formData.address}</div>
              <div className="mb-6"><h2 className="text-xl font-black text-gray-900 uppercase mb-2">Profile</h2><p className="text-sm text-gray-700">{formData.summary}</p></div>
              <div className="mb-6"><h2 className="text-xl font-black text-gray-900 uppercase mb-3">Experience</h2>{formData.experience.map((e, i) => <div key={i} className="mb-4"><h3 className="font-bold text-lg text-gray-900">{e.role}</h3><p className="text-xs font-bold text-gray-500 uppercase">{e.company} / {e.duration}</p><p className="text-sm text-gray-700 mt-1">{e.desc}</p></div>)}</div>
              <div className="mb-6"><h2 className="text-xl font-black text-gray-900 uppercase mb-3">Education</h2>{formData.education.map((e, i) => <div key={i} className="mb-3"><h3 className="font-bold text-lg text-gray-900">{e.degree}</h3><p className="text-sm text-gray-600">{e.school} / {e.year}</p></div>)}</div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><h2 className="text-xl font-black text-gray-900 uppercase mb-2">Skills</h2><ul className="grid grid-cols-1 gap-2">{formData.skills.map((s, i) => s && <li key={i} className="font-bold text-gray-800 text-sm border-l-4 border-gray-900 pl-2">{s}</li>)}</ul></div>
                <div><h2 className="text-xl font-black text-gray-900 uppercase mb-2">Languages</h2><ul className="grid grid-cols-1 gap-2">{formData.languages.map((l, i) => l.language && <li key={i} className="font-bold text-gray-800 text-sm border-l-4 border-gray-500 pl-2">{l.language}</li>)}</ul></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><h2 className="text-xl font-black text-gray-900 uppercase mb-2">Certifications</h2><ul className="grid grid-cols-1 gap-2">{formData.certifications.map((c, i) => c.name && <li key={i} className="font-bold text-gray-800 text-sm border-l-4 border-gray-900 pl-2">{c.name}</li>)}</ul></div>
                <div><h2 className="text-xl font-black text-gray-900 uppercase mb-2">References</h2><ul className="grid grid-cols-1 gap-2">{formData.references.map((r, i) => r.name && <li key={i} className="font-bold text-gray-800 text-sm border-l-4 border-gray-500 pl-2">{r.name}</li>)}</ul></div>
              </div>
            </div>
          )}

          {/* TEMPLATE 12: TIMELINE */}
          {template === 'timeline' && (
            <div className="p-10">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">{formData.fullName}</h1>
                <p className="text-gray-500">{formData.jobTitle}</p>
                <div className="text-xs text-gray-400 mt-2">{formData.email} • {formData.phone} • {formData.address}</div>
              </div>
              <div className="relative border-l-2 border-blue-200 ml-3 pl-6 mb-8">
                <div className="absolute w-4 h-4 bg-blue-600 rounded-full -left-[9px] top-1"></div>
                <h2 className="text-sm font-bold text-blue-600 uppercase mb-2">Summary</h2>
                <p className="text-sm text-gray-700">{formData.summary}</p>
              </div>
              <div className="relative border-l-2 border-blue-200 ml-3 pl-6 mb-8">
                <div className="absolute w-4 h-4 bg-blue-600 rounded-full -left-[9px] top-1"></div>
                <h2 className="text-sm font-bold text-blue-600 uppercase mb-3">Experience</h2>
                {formData.experience.map((e, i) => <div key={i} className="mb-4"><h3 className="font-bold text-gray-900">{e.role}</h3><p className="text-xs text-gray-500 mb-1">{e.company} | {e.duration}</p><p className="text-sm text-gray-700">{e.desc}</p></div>)}
              </div>
              <div className="relative border-l-2 border-blue-200 ml-3 pl-6 mb-8">
                <div className="absolute w-4 h-4 bg-blue-600 rounded-full -left-[9px] top-1"></div>
                <h2 className="text-sm font-bold text-blue-600 uppercase mb-3">Education</h2>
                {formData.education.map((e, i) => <div key={i} className="mb-3"><h3 className="font-bold text-gray-900">{e.degree}</h3><p className="text-sm text-gray-600">{e.school} | {e.year}</p></div>)}
              </div>
              <div className="relative border-l-2 border-blue-200 ml-3 pl-6 mb-8">
                <div className="absolute w-4 h-4 bg-blue-600 rounded-full -left-[9px] top-1"></div>
                <h2 className="text-sm font-bold text-blue-600 uppercase mb-2">Skills</h2>
                <div className="flex flex-wrap gap-2">{formData.skills.map((s, i) => s && <span key={i} className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">{s}</span>)}</div>
              </div>
              <div className="relative border-l-2 border-blue-200 ml-3 pl-6">
                <div className="absolute w-4 h-4 bg-blue-600 rounded-full -left-[9px] top-1"></div>
                <h2 className="text-sm font-bold text-blue-600 uppercase mb-2">Languages</h2>
                <div className="flex flex-wrap gap-2">{formData.languages.map((l, i) => l.language && <span key={i} className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">{l.language}</span>)}</div>
              </div>
            </div>
          )}

          {/* TEMPLATE 13: COMPACT */}
          {template === 'compact' && (
            <div className="text-sm p-10">
              <div className="mb-4 border-b pb-2"><h1 className="text-2xl font-bold text-gray-900">{formData.fullName}</h1><p className="text-gray-600">{formData.jobTitle} | {formData.email} | {formData.phone} | {formData.address}</p></div>
              <div className="mb-3"><p className="text-gray-700">{formData.summary}</p></div>
              <div className="mb-3"><h2 className="font-bold text-gray-900 uppercase text-xs mb-1">Experience</h2>{formData.experience.map((e, i) => <div key={i} className="mb-2"><span className="font-bold text-gray-800">{e.role}</span>, {e.company} <span className="text-gray-500">({e.duration})</span><p className="text-gray-600">{e.desc}</p></div>)}</div>
              <div className="mb-3"><h2 className="font-bold text-gray-900 uppercase text-xs mb-1">Education</h2>{formData.education.map((e, i) => <div key={i} className="mb-1"><span className="font-bold text-gray-800">{e.degree}</span>, {e.school} <span className="text-gray-500">({e.year})</span></div>)}</div>
              <div className="mb-3"><h2 className="font-bold text-gray-900 uppercase text-xs mb-1">Skills</h2><p className="text-gray-700">{formData.skills.join(', ')}</p></div>
              <div className="mb-3"><h2 className="font-bold text-gray-900 uppercase text-xs mb-1">Languages</h2><p className="text-gray-700">{formData.languages.map(l=>l.language).join(', ')}</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div><h2 className="font-bold text-gray-900 uppercase text-xs mb-1">Certifications</h2><p className="text-gray-700">{formData.certifications.map(c=>c.name).join(', ')}</p></div>
                <div><h2 className="font-bold text-gray-900 uppercase text-xs mb-1">References</h2><p className="text-gray-700">{formData.references.map(r=>r.name).join(', ')}</p></div>
              </div>
            </div>
          )}

          {/* TEMPLATE 14: BLUE CORPORATE */}
          {template === 'bluecorporate' && (
            <div className="p-10">
              <div className="bg-blue-700 text-white p-6 rounded-t-xl mb-6">
                <h1 className="text-4xl font-bold">{formData.fullName}</h1>
                <p className="text-blue-200 font-medium mt-1">{formData.jobTitle}</p>
                <div className="flex gap-4 text-xs text-blue-200 mt-3">
                  <span>{formData.email}</span> <span>•</span> <span>{formData.phone}</span> <span>•</span> <span>{formData.address}</span>
                </div>
              </div>
              <div className="px-4">
                <div className="mb-5"><h2 className="text-sm font-bold text-blue-700 uppercase border-b-2 border-blue-700 pb-1 mb-2">Profile</h2><p className="text-gray-700 text-sm">{formData.summary}</p></div>
                <div className="mb-5"><h2 className="text-sm font-bold text-blue-700 uppercase border-b-2 border-blue-700 pb-1 mb-2">Experience</h2>{formData.experience.map((e, i) => <div key={i} className="mb-3"><div className="flex justify-between"><h3 className="font-bold text-gray-900">{e.role}</h3><span className="text-xs text-gray-500">{e.duration}</span></div><p className="text-xs text-blue-600 font-medium">{e.company}</p><p className="text-xs text-gray-600">{e.desc}</p></div>)}</div>
                <div className="mb-5"><h2 className="text-sm font-bold text-blue-700 uppercase border-b-2 border-blue-700 pb-1 mb-2">Education</h2>{formData.education.map((e, i) => <div key={i} className="mb-2"><div className="flex justify-between"><h3 className="font-bold text-gray-900 text-sm">{e.degree}</h3><span className="text-xs text-gray-500">{e.year}</span></div><p className="text-xs text-gray-600">{e.school}</p></div>)}</div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><h2 className="text-sm font-bold text-blue-700 uppercase border-b-2 border-blue-700 pb-1 mb-2">Skills</h2><div className="flex flex-wrap gap-2">{formData.skills.map((s, i) => s && <span key={i} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{s}</span>)}</div></div>
                  <div><h2 className="text-sm font-bold text-blue-700 uppercase border-b-2 border-blue-700 pb-1 mb-2">Languages</h2><ul className="text-xs text-gray-700 list-disc pl-4">{formData.languages.map((l, i) => l.language && <li key={i}>{l.language}</li>)}</ul></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {formData.certifications.some(c=>c.name) && (
                    <div><h2 className="text-sm font-bold text-blue-700 uppercase border-b-2 border-blue-700 pb-1 mb-2">Certifications</h2><ul className="text-xs text-gray-700 list-disc pl-4">{formData.certifications.map((c, i) => c.name && <li key={i}>{c.name}</li>)}</ul></div>
                  )}
                  {formData.references.some(r=>r.name) && (
                    <div><h2 className="text-sm font-bold text-blue-700 uppercase border-b-2 border-blue-700 pb-1 mb-2">References</h2><ul className="text-xs text-gray-700 list-disc pl-4">{formData.references.map((r, i) => r.name && <li key={i}>{r.name}</li>)}</ul></div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 15: RED EXECUTIVE */}
          {template === 'redexecutive' && (
            <div className="border-t-[10px] border-red-700 pt-6 p-10">
              <div className="flex justify-between items-end border-b-2 border-red-700 pb-4 mb-6">
                <div><h1 className="text-4xl font-black text-gray-900">{formData.fullName}</h1><p className="text-lg text-red-700 font-semibold mt-1">{formData.jobTitle}</p></div>
                <div className="text-right text-xs text-gray-500 space-y-1"><p>{formData.email}</p><p>{formData.phone}</p><p>{formData.address}</p></div>
              </div>
              <div className="mb-5"><h2 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-1 border-b-2 border-red-700 inline-block pb-1">Profile</h2><p className="text-gray-700 text-sm leading-relaxed mt-2">{formData.summary}</p></div>
              <div className="mb-5"><h2 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-2 border-b-2 border-red-700 inline-block pb-1">Experience</h2>{formData.experience.map((e, i) => <div key={i} className="mb-3"><div className="flex justify-between"><h3 className="font-bold text-gray-900 text-sm">{e.role}</h3><span className="text-xs text-gray-600">{e.duration}</span></div><p className="text-xs font-semibold text-red-700">{e.company}</p><p className="text-xs text-gray-600 mt-1">{e.desc}</p></div>)}</div>
              <div className="mb-5"><h2 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-2 border-b-2 border-red-700 inline-block pb-1">Education</h2>{formData.education.map((e, i) => <div key={i} className="flex justify-between mb-2"><div><h3 className="font-bold text-gray-900 text-sm">{e.degree}</h3><p className="text-xs text-gray-600">{e.school}</p></div><span className="text-xs text-gray-600">{e.year}</span></div>)}</div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><h2 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-1 border-b-2 border-red-700 inline-block pb-1">Skills</h2><ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2">{formData.skills.map((s, i) => s && <li key={i} className="text-sm text-gray-700">• {s}</li>)}</ul></div>
                <div><h2 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-1 border-b-2 border-red-700 inline-block pb-1">Languages</h2><ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2">{formData.languages.map((l, i) => l.language && <li key={i} className="text-sm text-gray-700">• {l.language}</li>)}</ul></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {formData.certifications.some(c=>c.name) && (
                  <div><h2 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-1 border-b-2 border-red-700 inline-block pb-1">Certifications</h2><ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2">{formData.certifications.map((c, i) => c.name && <li key={i} className="text-sm text-gray-700">• {c.name}</li>)}</ul></div>
                )}
                {formData.references.some(r=>r.name) && (
                  <div><h2 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-1 border-b-2 border-red-700 inline-block pb-1">References</h2><ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2">{formData.references.map((r, i) => r.name && <li key={i} className="text-sm text-gray-700">• {r.name}</li>)}</ul></div>
                )}
              </div>
            </div>
          )}

          {/* TEMPLATE 16: GREEN PROFESSIONAL */}
          {template === 'greenprofessional' && (
            <div className="p-10">
              <div className="text-center mb-6 bg-green-50 p-6 rounded-xl border border-green-200">
                <h1 className="text-4xl font-bold text-green-900">{formData.fullName}</h1>
                <p className="text-md text-green-700 font-semibold mt-1">{formData.jobTitle}</p>
                <div className="flex justify-center gap-3 text-xs text-gray-600 mt-3"><span>{formData.email}</span> <span>|</span> <span>{formData.phone}</span> <span>|</span> <span>{formData.address}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h2 className="text-sm font-bold text-green-800 uppercase border-b border-green-300 pb-1 mb-2">Experience</h2>
                  {formData.experience.map((e, i) => <div key={i} className="mb-3"><h3 className="font-bold text-gray-900 text-sm">{e.role}</h3><p className="text-xs text-green-700 font-semibold">{e.company} | {e.duration}</p><p className="text-xs text-gray-600 mt-1">{e.desc}</p></div>)}
                  <h2 className="text-sm font-bold text-green-800 uppercase border-b border-green-300 pb-1 mb-2 mt-4">Education</h2>
                  {formData.education.map((e, i) => <div key={i} className="mb-2"><h3 className="font-bold text-gray-900 text-sm">{e.degree}</h3><p className="text-xs text-gray-600">{e.school} | {e.year}</p></div>)}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-green-800 uppercase border-b border-green-300 pb-1 mb-2">Summary</h2>
                  <p className="text-xs text-gray-700 leading-relaxed mb-4">{formData.summary}</p>
                  <h2 className="text-sm font-bold text-green-800 uppercase border-b border-green-300 pb-1 mb-2">Skills</h2>
                  <ul className="text-xs text-gray-700 space-y-1 mb-4">{formData.skills.map((s, i) => s && <li key={i} className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>{s}</li>)}</ul>
                  <h2 className="text-sm font-bold text-green-800 uppercase border-b border-green-300 pb-1 mb-2">Languages</h2>
                  <ul className="text-xs text-gray-700 space-y-1 mb-4">{formData.languages.map((l, i) => l.language && <li key={i}>{l.language}</li>)}</ul>
                  <h2 className="text-sm font-bold text-green-800 uppercase border-b border-green-300 pb-1 mb-2">Certifications</h2>
                  <ul className="text-xs text-gray-700 space-y-1 mb-4">{formData.certifications.map((c, i) => c.name && <li key={i}>{c.name}</li>)}</ul>
                  <h2 className="text-sm font-bold text-green-800 uppercase border-b border-green-300 pb-1 mb-2">References</h2>
                  <ul className="text-xs text-gray-700 space-y-1">{formData.references.map((r, i) => r.name && <li key={i}>{r.name}</li>)}</ul>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 17: DARK MODE */}
          {template === 'darkmode' && (
            <div className="bg-gray-900 text-white p-8 rounded-xl h-full">
              <div className="border-b border-gray-700 pb-4 mb-6">
                <h1 className="text-4xl font-bold">{formData.fullName}</h1>
                <p className="text-blue-400 font-medium mt-1">{formData.jobTitle}</p>
                <div className="flex gap-4 text-xs text-gray-400 mt-3"><span>{formData.email}</span> <span>•</span> <span>{formData.phone}</span> <span>•</span> <span>{formData.address}</span></div>
              </div>
              <div className="mb-6"><h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2">Summary</h2><p className="text-gray-300 text-sm">{formData.summary}</p></div>
              <div className="mb-6"><h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2">Experience</h2>{formData.experience.map((e, i) => <div key={i} className="mb-3"><div className="flex justify-between"><h3 className="font-bold text-white text-sm">{e.role}</h3><span className="text-xs text-gray-400">{e.duration}</span></div><p className="text-xs text-blue-300 font-medium">{e.company}</p><p className="text-xs text-gray-400">{e.desc}</p></div>)}</div>
              <div className="mb-6"><h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2">Education</h2>{formData.education.map((e, i) => <div key={i} className="mb-2"><div className="flex justify-between"><h3 className="font-bold text-white text-sm">{e.degree}</h3><span className="text-xs text-gray-400">{e.year}</span></div><p className="text-xs text-gray-400">{e.school}</p></div>)}</div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2">Skills</h2><div className="flex flex-wrap gap-2">{formData.skills.map((s, i) => s && <span key={i} className="bg-gray-800 text-blue-300 text-xs px-2 py-1 rounded border border-gray-700">{s}</span>)}</div></div>
                <div><h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2">Languages</h2><ul className="text-xs text-gray-400 list-disc pl-4">{formData.languages.map((l, i) => l.language && <li key={i}>{l.language}</li>)}</ul></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2">Certifications</h2><ul className="text-xs text-gray-400 list-disc pl-4">{formData.certifications.map((c, i) => c.name && <li key={i}>{c.name}</li>)}</ul></div>
                <div><h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2">References</h2><ul className="text-xs text-gray-400 list-disc pl-4">{formData.references.map((r, i) => r.name && <li key={i}>{r.name}</li>)}</ul></div>
              </div>
            </div>
          )}

          {/* TEMPLATE 18: BLUE HEADER */}
          {template === 'blueheader' && (
            <div className="bg-white h-full text-gray-800">
              <div className="bg-[#6CA0DC] text-white p-8 flex items-center justify-between">
                 <div>
                   <h1 className="text-4xl font-bold uppercase tracking-wider">{formData.fullName}</h1>
                   <h2 className="text-lg font-medium mt-1 opacity-90">{formData.jobTitle}</h2>
                 </div>
                 <div className="text-xs text-right space-y-1">
                   <p className="font-bold">Address:</p><p>{formData.address}</p>
                   <p className="font-bold mt-1">Phone:</p><p>{formData.phone}</p>
                   <p className="font-bold mt-1">Email:</p><p>{formData.email}</p>
                 </div>
              </div>
              <div className="p-8">
                {formData.summary && (
                <div className="mb-6">
                  <h3 className="font-bold text-gray-800 text-sm mb-2 border-b-2 border-gray-300 pb-1">Summary</h3>
                  <p className="text-xs text-gray-600 leading-relaxed text-justify">{formData.summary}</p>
                </div>
                )}
                
                <div className="grid grid-cols-3 gap-8">
                  <div className="col-span-2 space-y-6">
                    {formData.experience.some(e => e.role) && (
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm mb-2 border-b-2 border-gray-300 pb-1">Experience</h3>
                      {formData.experience.map((e, i) => e.role && (
                        <div key={i} className="mb-4">
                          <div className="flex justify-between items-baseline mb-1">
                            <h4 className="font-bold text-sm text-gray-900">{e.role}</h4>
                            <span className="text-[10px] font-semibold text-gray-600">{e.duration}</span>
                          </div>
                          <p className="text-xs font-semibold text-gray-700 mb-1">{e.company}</p>
                          <ul className="text-[10px] text-gray-600 list-disc pl-4 space-y-1">
                            {e.desc.split('\n').map((line, idx) => line && <li key={idx}>{line}</li>)}
                          </ul>
                        </div>
                      ))}
                    </div>
                    )}
                    {formData.education.some(e => e.degree) && (
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm mb-2 border-b-2 border-gray-300 pb-1">Education</h3>
                      {formData.education.map((e, i) => e.degree && (
                        <div key={i} className="mb-2">
                          <div className="flex justify-between items-baseline">
                            <h4 className="font-bold text-xs text-gray-900">{e.degree}</h4>
                            <span className="text-[10px] text-gray-500">{e.year}</span>
                          </div>
                          <p className="text-[10px] text-gray-600">{e.school}</p>
                        </div>
                      ))}
                    </div>
                    )}
                  </div>
                  
                  <div className="col-span-1 space-y-6">
                    {formData.skills.some(s => s) && (
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm mb-2 border-b-2 border-gray-300 pb-1">Skill Highlights</h3>
                      <ul className="text-[10px] text-gray-600 list-disc pl-4 space-y-1">
                        {formData.skills.map((s, i) => s && <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    )}
                    {formData.languages.some(l => l.language) && (
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm mb-2 border-b-2 border-gray-300 pb-1">Languages</h3>
                      <ul className="text-[10px] text-gray-600 list-disc pl-4 space-y-1">
                        {formData.languages.map((l, i) => l.language && <li key={i}>{l.language} - {l.proficiency}</li>)}
                      </ul>
                    </div>
                    )}
                    {formData.certifications.some(c => c.name) && (
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm mb-2 border-b-2 border-gray-300 pb-1">Certifications</h3>
                      <ul className="text-[10px] text-gray-600 list-disc pl-4 space-y-1">
                        {formData.certifications.map((c, i) => c.name && (
                          <li key={i} className="flex flex-col">
                            <span>{c.name} {c.year && `(${c.year})`}</span>
                            {c.fileUrl && <a href={c.fileUrl} target="_blank" className="text-blue-500 text-[9px] underline print:hidden">View Certificate</a>}
                          </li>
                        ))}
                      </ul>
                    </div>
                    )}
                    {formData.references.some(r => r.name) && (
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm mb-2 border-b-2 border-gray-300 pb-1">References</h3>
                      <ul className="text-[10px] text-gray-600 list-disc pl-4 space-y-1">
                        {formData.references.map((r, i) => r.name && <li key={i}>{r.name} - {r.contact}</li>)}
                      </ul>
                    </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}