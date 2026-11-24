'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Sparkles, ArrowLeft, Download, Printer, Plus, Trash2, Loader2, Camera, Upload, RefreshCw, Save, Lock, Crown } from 'lucide-react';
import Link from 'next/link';
import { supabase, saveDocumentRecord, checkUserLimit, incrementUserCount, authedFetch, fetchDocumentRecord, updateDocumentRecord, ownsDocument } from '@/lib/supabase';
import { downloadAsWord, downloadAsPDF } from '@/lib/download-utils';
import CVTemplateRenderer from '@/components/cv/CVTemplateRenderer';
import AtsBadge from '@/components/AtsBadge';
import PlanBadge from '@/components/PlanBadge';
import PricingModal, { type PricingReason } from '@/components/PricingModal';
import { TEMPLATES, EXTRA_CV_FIELDS, getTemplate, ATS_META } from '@/lib/templates';

const dummyData = {
  fullName: 'Muhammad Ali',
  email: 'muhammad.ali@example.com',
  phone: '+1 234 567 8900',
  address: 'New York, USA',
  jobTitle: 'Software Engineer',
  summary: 'Detail-oriented Software Engineer with an academic background in computer science and experience spanning full-stack development, system architecture, and team collaboration. Focused on writing clean code, solving complex problems, and delivering high-quality results.',
  photoUrl: '',
  linkedin: 'linkedin.com/in/muhammad-ali',
  instagram: 'instagram.com/muhammadali',
  indeed: 'indeed.com/r/muhammad-ali',
  cvnovaCode: 'ALI123',
  maritalStatus: 'Single',
  placeOfBirth: 'Karachi, Pakistan',
  nationality: 'Pakistani',
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
  linkedin: '', instagram: '', indeed: '', cvnovaCode: '', maritalStatus: '', placeOfBirth: '', nationality: '',
  skills: [''], education: [{ degree: '', school: '', year: '' }],
  experience: [{ role: '', company: '', duration: '', desc: '' }],
  languages: [{ language: '', proficiency: '' }], certifications: [{ name: '', year: '', fileUrl: '' }],
  hobbies: [''], references: [{ name: '', role: '', contact: '' }],
};

type Row = Record<string, unknown>;

// Saved document ka koi bhi field safely padhne ke liye: object na ho to khaali row.
const asRecord = (value: unknown): Row =>
  typeof value === 'object' && value !== null ? (value as Row) : {};

export default function Builder() {
  const [formData, setFormData] = useState(dummyData);
  const [template, setTemplate] = useState('classicgray');
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCert, setUploadingCert] = useState<number | null>(null);
  // "Save on Dashboard" ke liye: loading state + last saved snapshot (duplicate save se bachne ke liye)
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string | null>(null);
  const [account, setAccount] = useState<any>(null);
  const [pricing, setPricing] = useState<{ open: boolean; reason: PricingReason }>({ open: false, reason: 'upgrade' });
  // ?edit=<id> — dashboard se aya hua document (edit mode)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshAccount = async () => {
    try {
      const res = await authedFetch('/api/account/status');
      const data = await res.json();
      if (!data.error) setAccount(data);
    } catch {
      /* offline or migration not applied yet */
    }
  };

  // Saved document ko builder form ki shape mein laata hai (blank rows included).
  const toBuilderData = (raw: unknown) => {
    const src = asRecord(raw);
    const str = (value: unknown) => (typeof value === 'string' ? value : value == null ? '' : String(value));
    const rows = <T,>(value: unknown, empty: T, map: (item: Row) => T): T[] => {
      const list = Array.isArray(value) ? value.map((item) => map(asRecord(item))) : [];
      return list.length ? list : [empty];
    };

    return {
      fullName: str(src.fullName),
      email: str(src.email),
      phone: str(src.phone),
      address: str(src.address),
      jobTitle: str(src.jobTitle),
      summary: str(src.summary),
      photoUrl: str(src.photoUrl),
      linkedin: str(src.linkedin),
      instagram: str(src.instagram),
      indeed: str(src.indeed),
      cvnovaCode: str(src.cvnovaCode),
      maritalStatus: str(src.maritalStatus),
      placeOfBirth: str(src.placeOfBirth),
      nationality: str(src.nationality),
      skills: rows(src.skills, '', (s) => str(s)),
      education: rows(src.education, { degree: '', school: '', year: '' }, (e) => ({ degree: str(e?.degree), school: str(e?.school), year: str(e?.year) })),
      experience: rows(src.experience, { role: '', company: '', duration: '', desc: '' }, (e) => ({ role: str(e?.role), company: str(e?.company), duration: str(e?.duration), desc: str(e?.desc) })),
      languages: rows(src.languages, { language: '', proficiency: '' }, (l) => ({ language: str(l?.language), proficiency: str(l?.proficiency) })),
      certifications: rows(src.certifications, { name: '', year: '', fileUrl: '' }, (c) => ({ name: str(c?.name), year: str(c?.year), fileUrl: str(c?.fileUrl) })),
      hobbies: rows(src.hobbies, '', (h) => str(h)),
      references: rows(src.references, { name: '', role: '', contact: '' }, (r) => ({ name: str(r?.name), role: str(r?.role), contact: str(r?.contact) })),
    };
  };

  const loadDocumentForEdit = async (id: string) => {
    try {
      const [{ data: { user } }, doc] = await Promise.all([supabase.auth.getUser(), fetchDocumentRecord(id)]);

      if (!doc || !user) {
        alert('Ye document load nahi ho saka. Dobara dashboard se try karein.');
        window.location.href = '/dashboard';
        return;
      }

      // Sirf CV builder yahan khulta hai — letter edit apne builder mein hota hai
      if ((doc.document_type || 'CV') !== 'CV') {
        window.location.href = `/view/${id}`;
        return;
      }

      if (!ownsDocument(doc, user)) {
        alert('Ye document aap ke account ka nahi hai, is liye edit nahi ho sakta.');
        window.location.href = `/view/${id}`;
        return;
      }

      const loaded = toBuilderData(doc.full_data);
      const loadedTemplate = getTemplate(doc.template_name).id;

      setFormData(loaded);
      setTemplate(loadedTemplate);
      setEditingId(doc.id);
      // Loaded document hi current state hai — baghair change save karne par
      // duplicate record na bane.
      setLastSavedSnapshot(JSON.stringify({ template: loadedTemplate, formData: loaded }));
    } catch (error) {
      console.error('Load document error:', error);
      alert('Document load karte waqt error aya.');
      window.location.href = '/dashboard';
    } finally {
      setLoadingDoc(false);
    }
  };

  // Mount par chalta hai: edit link (?edit=id) ho to saved document load karo,
  // warna sample/dummy data hi dikhao. State updates effect body ke bahar
  // rakhe gaye hain taake cascading render na ho.
  useEffect(() => {
    refreshAccount();
    const editId = new URLSearchParams(window.location.search).get('edit');
    if (editId) {
      // Document load async hai — agle frame par start karte hain taake effect
      // synchronously state update na kare.
      const frame = requestAnimationFrame(() => {
        void loadDocumentForEdit(editId);
      });
      return () => cancelAnimationFrame(frame);
    }
    const frame = requestAnimationFrame(() => setLoadingDoc(false));
    return () => cancelAnimationFrame(frame);
  }, []);

  const isPaidAccount = account?.plan?.isPaid === true || account?.plan?.isReactivated === true;

  const chooseTemplate = (id: string) => {
    const meta = getTemplate(id);
    if (meta.tier === 'premium' && !isPaidAccount) {
      setPricing({ open: true, reason: 'template_locked' });
      return;
    }
    setTemplate(id);
  };


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
      alert("Error uploading image.");
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
      alert("Error uploading certificate.");
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
      
      if (!response.ok) {
        throw new Error(data.error || "API error aya hai.");
      }

      if (data.summary) {
        setFormData({ ...formData, summary: data.summary, skills: data.skills });
      }
    } catch (error: any) {
      alert("AI Error: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // actionType: 'print' = sirf print, 'save' = My Dashboard mein save karke dashboard kholna
  const handleAction = async (actionType: 'print' | 'save' = 'print') => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || !user.email) {
      alert("Aap login nahi hain.");
      window.location.href = '/login';
      return;
    }

    // Same CV ko baar baar save karne se CV count double na ho
    const snapshot = JSON.stringify({ template, formData });
    const alreadySaved = snapshot === lastSavedSnapshot;
    const isEditing = !!editingId;

    // Edit mode mein naya document create nahi hota, is liye template gate aur
    // document limit check skip hote hain.
    // Naya document hai to hi limit check karo (already saved document count nahi barhata)
    if (!isEditing && !alreadySaved) {
      // Server-side gate: premium templates, 3 free Blue ATS uses and trial expiry.
      try {
        const gateRes = await authedFetch('/api/templates/use', {
          method: 'POST',
          body: JSON.stringify({ templateId: template, consume: true }),
        });
        const gate = await gateRes.json();
        if (!gate.allowed) {
          const reason: PricingReason =
            gate.reason === 'ats_limit' ? 'ats_limit'
            : gate.reason === 'trial_expired' ? 'trial_expired'
            : gate.reason === 'template_locked' ? 'template_locked'
            : 'upgrade';
          setPricing({ open: true, reason });
          refreshAccount();
          return;
        }
        if (typeof gate.atsUsed === 'number') {
          setAccount((prev: any) => (prev ? { ...prev, ats: { ...prev.ats, used: gate.atsUsed } } : prev));
        }
      } catch {
        /* gate offline — fall back to the legacy limit check below */
      }

      const limitCheck = await checkUserLimit(user.email);
      if (limitCheck.reason === 'error_fallback') {
        alert("Profile database mein nahi mili.");
        return;
      }
      if (!limitCheck.allowed) {
        setPricing({ open: true, reason: limitCheck.reason === 'trial_expired' ? 'trial_expired' : 'limit_reached' });
        return;
      }
    }

    if (actionType === 'save') setIsSaving(true);

    try {
      if (isEditing) {
        // Existing document ko UPDATE karo — naya record insert na karo
        if (!alreadySaved) {
          const updated = await updateDocumentRecord(editingId!, {
            templateName: template,
            fullName: formData.fullName,
            phone: formData.phone,
            fullData: formData,
            atsTier: getTemplate(template).ats,
            templateTier: getTemplate(template).tier,
          });
          if (!updated) {
            alert('Document update nahi ho saka. Login aur internet connection check karein.');
            return;
          }
          setLastSavedSnapshot(snapshot);
        }
      } else if (!alreadySaved) {
        await saveDocumentRecord({
          documentType: 'CV', templateName: template, fullName: formData.fullName,
          email: user.email, phone: formData.phone, fullData: formData,
          userId: user.id,
          isPublic: false,
          atsTier: getTemplate(template).ats,
          templateTier: getTemplate(template).tier,
        });

        await incrementUserCount(user.email);
        setLastSavedSnapshot(snapshot);
      }

      if (actionType === 'save') {
        // Save/update hone ke baad user ko sahi document dikhao
        const message = isEditing
          ? "✅ CV updated! Aap ka wahi dashboard document update ho gaya hai.\n\nDocument dekhein?"
          : "✅ CV successfully saved to your Dashboard!\n\nAb My Dashboard kholein?";
        if (confirm(message)) {
          window.location.href = isEditing ? `/view/${editingId}` : '/dashboard';
        }
      } else {
        setTimeout(() => {
          window.print();
        }, 500);
      }
    } finally {
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
        <div className="font-bold text-xl text-blue-600">CVNova Builder{editingId ? ' — Editing' : ''}</div>
        <div className="w-24"></div>
      </nav>

      <main className="flex-grow max-w-[1500px] mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8 print:block print:p-0 print:m-0 print:max-w-none">
        
        {/* LEFT SIDE: FORM */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit max-h-[85vh] overflow-y-auto print:hidden">
          {account?.plan?.isLocked && (
            <div className="mb-4 flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-red-700"><strong>Your 2-month free trial has ended.</strong> Your saved CVs are safe — reactivate to keep creating.</p>
              <button onClick={() => setPricing({ open: true, reason: 'trial_expired' })} className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700">
                <Crown size={14} /> Reactivate $2
              </button>
            </div>
          )}

          <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-gray-800">Choose Template ({TEMPLATES.length} options)</h3>
              <div className="flex flex-wrap items-center gap-2 text-[10px]">
                <AtsBadge tier={getTemplate(template).ats} size="xs" />
                {account?.ats && !account.ats.unlimited && (
                  <span className={`rounded-full px-2 py-1 font-bold ${account.ats.exhausted ? 'bg-red-100 text-red-700' : 'border bg-white text-gray-600'}`}>
                    Blue ATS {account.ats.used}/{account.ats.limit}
                  </span>
                )}
                <PlanBadge plan={account?.plan} size="sm" hideSubtitle />
              </div>
            </div>
            <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
              {TEMPLATES.map((t) => {
                const locked = t.tier === 'premium' && !isPaidAccount;
                const active = template === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => chooseTemplate(t.id)}
                    title={t.description}
                    className={`relative flex flex-col items-start gap-1 rounded-lg border p-2 text-left transition ${active ? 'border-blue-600 bg-white ring-2 ring-blue-500' : 'border-gray-200 bg-white hover:border-blue-300'}`}
                  >
                    <span className="flex w-full items-center justify-between gap-1">
                      <span className="text-xs font-bold text-gray-800">{t.name}</span>
                      {locked ? <Lock size={12} className="shrink-0 text-amber-500" /> : <AtsBadge tier={t.ats} size="xs" />}
                    </span>
                    <span className="text-[10px] capitalize text-gray-500">{t.category}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[10px] text-gray-500">{getTemplate(template).description} — {ATS_META[getTemplate(template).ats].hint}</p>
          </div>

          <div className={`mb-6 flex flex-col items-start justify-between gap-4 rounded-xl border p-4 sm:flex-row sm:items-center ${editingId ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'}`}>
            <p className={`text-sm font-medium ${editingId ? 'text-amber-900' : 'text-green-800'}`}>
              {editingId
                ? `Aap apna saved CV edit kar rahe hain${formData.fullName ? ` — ${formData.fullName}` : ''}. Save karne par yahi document update hoga, naya nahi banega.`
                : 'Sample CV is filled. Replace text or clear it.'}
            </p>
            <div className="flex items-center gap-2">
              {editingId && (
                <Link href={`/view/${editingId}`} className="flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-bold text-amber-800 hover:bg-amber-100">View Saved CV</Link>
              )}
              <button onClick={resetForm} className={`flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-bold ${editingId ? 'border-amber-300 text-amber-800 hover:bg-amber-100' : 'border-green-300 text-green-700 hover:bg-green-100'}`}><RefreshCw size={16} /> Clear</button>
            </div>
          </div>

          <h1 className="text-xl font-bold mb-4 border-b pb-2">Profile Photo (Optional)</h1>
          <div className="mb-8 flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-200 border-2 border-dashed flex items-center justify-center overflow-hidden relative">
              {formData.photoUrl ? <Image src={formData.photoUrl} alt="Profile" fill className="object-cover" /> : <Camera className="text-gray-400" size={24} />}
            </div>
            <div>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} disabled={uploadingImage} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">{uploadingImage ? 'Uploading...' : 'Upload Photo'}</button>
            </div>
          </div>

          <h1 className="text-xl font-bold mb-4 border-b pb-2">Personal Details</h1>
          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold mb-1">Full Name</label><input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border text-sm" /></div>
              <div><label className="block text-xs font-semibold mb-1">Job Title</label><input type="text" name="jobTitle" value={formData.jobTitle} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border text-sm" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold mb-1">Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border text-sm" /></div>
              <div><label className="block text-xs font-semibold mb-1">Phone</label><input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border text-sm" /></div>
            </div>
            <div><label className="block text-xs font-semibold mb-1">Address</label><input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border text-sm" /></div>
          </div>

          <h1 className="text-xl font-bold mb-4 border-b pb-2">Online Presence &amp; Personal Details</h1>
          <p className="mb-3 text-[11px] text-gray-500">These fields appear on every one of the 25 templates. Leave any field empty to hide it.</p>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {EXTRA_CV_FIELDS.map((field) => (
              <div key={field.key}>
                <label className="mb-1 block text-xs font-semibold">{field.label}</label>
                <input
                  type="text"
                  value={(formData as any)[field.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value } as any)}
                  placeholder={field.placeholder}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>

          <h1 className="text-xl font-bold mb-4 border-b pb-2">Professional Summary</h1>
          <div className="mb-8">
            <textarea name="summary" value={formData.summary} onChange={handleChange} rows={3} className="w-full px-3 py-2 rounded-lg border text-sm resize-none"></textarea>
            <button type="button" onClick={handleGenerateAI} disabled={isGenerating} className="mt-2 flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-1.5 rounded-full disabled:opacity-50">
              {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} {isGenerating ? 'Generating...' : 'Generate with AI'}
            </button>
          </div>

          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h1 className="text-xl font-bold">Skills</h1>
            <button onClick={() => addArrayItem('skills', '')} className="text-blue-600 text-sm font-bold flex items-center gap-1"><Plus size={16} /> Add</button>
          </div>
          <div className="space-y-2 mb-8">
            {formData.skills.map((skill, index) => (
              <div key={index} className="flex gap-2">
                <input type="text" value={skill} onChange={(e) => handleArrayChange('skills', index, null, e.target.value)} className="flex-1 px-3 py-2 rounded-lg border text-sm" />
                <button onClick={() => removeArrayItem('skills', index)} className="text-red-500 p-2"><Trash2 size={18} /></button>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h1 className="text-xl font-bold">Experience</h1>
            <button onClick={() => addArrayItem('experience', { role: '', company: '', duration: '', desc: '' })} className="text-blue-600 text-sm font-bold flex items-center gap-1"><Plus size={16} /> Add</button>
          </div>
          <div className="space-y-4 mb-8">
            {formData.experience.map((exp, index) => (
              <div key={index} className="p-3 border rounded-lg bg-gray-50 relative">
                <button onClick={() => removeArrayItem('experience', index)} className="absolute top-2 right-2 text-red-400"><Trash2 size={16} /></button>
                <div className="grid grid-cols-2 gap-2 mb-2 pr-6">
                  <input type="text" placeholder="Role" value={exp.role} onChange={(e) => handleArrayChange('experience', index, 'role', e.target.value)} className="px-2 py-1.5 border rounded text-sm w-full" />
                  <input type="text" placeholder="Company" value={exp.company} onChange={(e) => handleArrayChange('experience', index, 'company', e.target.value)} className="px-2 py-1.5 border rounded text-sm w-full" />
                </div>
                <input type="text" placeholder="Duration" value={exp.duration} onChange={(e) => handleArrayChange('experience', index, 'duration', e.target.value)} className="px-2 py-1.5 border rounded text-sm w-full mb-2" />
                <textarea placeholder="Description" value={exp.desc} onChange={(e) => handleArrayChange('experience', index, 'desc', e.target.value)} rows={2} className="px-2 py-1.5 border rounded text-sm w-full resize-none"></textarea>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h1 className="text-xl font-bold">Education</h1>
            <button onClick={() => addArrayItem('education', { degree: '', school: '', year: '' })} className="text-blue-600 text-sm font-bold flex items-center gap-1"><Plus size={16} /> Add</button>
          </div>
          <div className="space-y-4 mb-8">
            {formData.education.map((edu, index) => (
              <div key={index} className="p-3 border rounded-lg bg-gray-50 relative">
                <button onClick={() => removeArrayItem('education', index)} className="absolute top-2 right-2 text-red-400"><Trash2 size={16} /></button>
                <input type="text" placeholder="Degree" value={edu.degree} onChange={(e) => handleArrayChange('education', index, 'degree', e.target.value)} className="px-2 py-1.5 border rounded text-sm w-full mb-2 pr-6" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="School" value={edu.school} onChange={(e) => handleArrayChange('education', index, 'school', e.target.value)} className="px-2 py-1.5 border rounded text-sm w-full" />
                  <input type="text" placeholder="Year" value={edu.year} onChange={(e) => handleArrayChange('education', index, 'year', e.target.value)} className="px-2 py-1.5 border rounded text-sm w-full" />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mb-4 border-b pb-2 mt-8">
            <h1 className="text-xl font-bold">Languages</h1>
            <button onClick={() => addArrayItem('languages', { language: '', proficiency: '' })} className="text-blue-600 text-sm font-bold flex items-center gap-1"><Plus size={16} /> Add</button>
          </div>
          <div className="space-y-2 mb-8">
            {formData.languages.map((lang: any, index: number) => (
              <div key={index} className="flex gap-2">
                <input type="text" placeholder="Language" value={lang.language} onChange={(e) => handleArrayChange('languages', index, 'language', e.target.value)} className="flex-1 px-3 py-2 rounded-lg border text-sm" />
                <input type="text" placeholder="Proficiency" value={lang.proficiency} onChange={(e) => handleArrayChange('languages', index, 'proficiency', e.target.value)} className="flex-1 px-3 py-2 rounded-lg border text-sm" />
                <button onClick={() => removeArrayItem('languages', index)} className="text-red-500 p-2"><Trash2 size={18} /></button>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h1 className="text-xl font-bold">Certifications</h1>
            <button onClick={() => addArrayItem('certifications', { name: '', year: '', fileUrl: '' })} className="text-blue-600 text-sm font-bold flex items-center gap-1"><Plus size={16} /> Add</button>
          </div>
          <div className="space-y-4 mb-8">
            {formData.certifications.map((cert: any, index: number) => (
              <div key={index} className="p-3 border rounded-lg bg-gray-50 relative">
                <button onClick={() => removeArrayItem('certifications', index)} className="absolute top-2 right-2 text-red-400"><Trash2 size={16} /></button>
                <div className="grid grid-cols-2 gap-2 mb-2 pr-6">
                  <input type="text" placeholder="Certification Name" value={cert.name} onChange={(e) => handleArrayChange('certifications', index, 'name', e.target.value)} className="px-2 py-1.5 border rounded text-sm w-full" />
                  <input type="text" placeholder="Year" value={cert.year} onChange={(e) => handleArrayChange('certifications', index, 'year', e.target.value)} className="px-2 py-1.5 border rounded text-sm w-full" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer bg-white border px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1">
                    {uploadingCert === index ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} 
                    {cert.fileUrl ? 'Change File' : 'Upload Cert'}
                    <input type="file" className="hidden" onChange={(e) => handleCertUpload(e, index)} />
                  </label>
                  {cert.fileUrl && <span className="text-xs text-green-600 font-semibold">Uploaded ✓</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h1 className="text-xl font-bold">Hobbies</h1>
            <button onClick={() => addArrayItem('hobbies', '')} className="text-blue-600 text-sm font-bold flex items-center gap-1"><Plus size={16} /> Add</button>
          </div>
          <div className="space-y-2 mb-8">
            {formData.hobbies.map((hobby: any, index: number) => (
              <div key={index} className="flex gap-2">
                <input type="text" value={hobby} onChange={(e) => handleArrayChange('hobbies', index, null, e.target.value)} className="flex-1 px-3 py-2 rounded-lg border text-sm" />
                <button onClick={() => removeArrayItem('hobbies', index)} className="text-red-500 p-2"><Trash2 size={18} /></button>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h1 className="text-xl font-bold">References</h1>
            <button onClick={() => addArrayItem('references', { name: '', role: '', contact: '' })} className="text-blue-600 text-sm font-bold flex items-center gap-1"><Plus size={16} /> Add</button>
          </div>
          <div className="space-y-4 mb-8">
            {formData.references.map((ref: any, index: number) => (
              <div key={index} className="p-3 border rounded-lg bg-gray-50 relative">
                <button onClick={() => removeArrayItem('references', index)} className="absolute top-2 right-2 text-red-400"><Trash2 size={16} /></button>
                <div className="grid grid-cols-1 gap-2 pr-6">
                  <input type="text" placeholder="Name" value={ref.name} onChange={(e) => handleArrayChange('references', index, 'name', e.target.value)} className="px-2 py-1.5 border rounded text-sm w-full" />
                  <input type="text" placeholder="Role / Company" value={ref.role} onChange={(e) => handleArrayChange('references', index, 'role', e.target.value)} className="px-2 py-1.5 border rounded text-sm w-full" />
                  <input type="text" placeholder="Contact (Email/Phone)" value={ref.contact} onChange={(e) => handleArrayChange('references', index, 'contact', e.target.value)} className="px-2 py-1.5 border rounded text-sm w-full" />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-200">
            {/* 🚨 SAVE ON DASHBOARD: ye CV user ke apne profile/dashboard mein save karta hai */}
            <button type="button" onClick={() => handleAction('save')} disabled={isSaving} className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white px-3 py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 transition shadow-md disabled:opacity-60">
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isSaving ? 'Saving...' : editingId ? 'Update Document' : 'Save on Dashboard'}
            </button>
            <p className="text-[11px] text-gray-500 text-center mt-2">
              {editingId
                ? 'Ye changes aap ke My Dashboard wale isi document mein save honge.'
                : 'Ye CV aap ke My Dashboard mein save ho jayegi. Print / PDF / Word sirf copy download karne ke liye hain.'}
            </p>

            <div className="flex gap-2 mt-3">
              <button type="button" onClick={() => handleAction('print')} className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white px-2 py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition">
                <Printer size={18} /> Print
              </button>
              <button type="button" onClick={() => downloadAsPDF('cv-preview', formData.fullName || 'CV')} className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-2 py-3 rounded-xl font-bold text-sm hover:bg-red-700 transition">
                <Download size={18} /> PDF
              </button>
              <button type="button" onClick={() => downloadAsWord('cv-preview', formData.fullName || 'CV')} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-2 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition">
                <Download size={18} /> Word
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: LIVE PREVIEW — one shared renderer for all 25 templates */}
        <div className="py-4 lg:py-8 overflow-x-auto print:p-0">
          <div id="cv-preview" className="print-area max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-2xl">
            <CVTemplateRenderer template={template} formData={formData} />
          </div>
          <p className="mt-3 text-center text-[11px] text-gray-500 print:hidden">
            Tip: Blue ATS templates give the highest automated-screening pass rate.
          </p>
        </div>
      </main>

      <PricingModal
        open={pricing.open}
        reason={pricing.reason}
        onClose={() => setPricing({ open: false, reason: 'upgrade' })}
        atsUsed={account?.ats?.used}
        atsLimit={account?.ats?.limit}
        reactivationPrice={account?.limits?.reactivationPrice || 2}
      />
    </div>
  );
}
