'use client';

import { useEffect, useState } from 'react';
import { supabase, authedFetch } from '@/lib/supabase';
import { Loader2, ArrowLeft, Printer, Save, LayoutTemplate, Edit } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation'; // <--- YE IMPORTANT HAI
import CVTemplateRenderer from '@/components/cv/CVTemplateRenderer';
import { TEMPLATES, ATS_META } from '@/lib/templates';

export function ViewCVClient({ id }: { id: string }) {
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState('classicgray');
  // Ownership flag: sirf document ka asli owner hi owner-only controls dekh sakta hai
  const [isOwner, setIsOwner] = useState(false);
  
  const searchParams = useSearchParams();
  const isTracked = searchParams.get('track') === 'true'; // <--- YE PRIVACY CHECK HAI

  useEffect(() => {
    if (id) fetchDocument(id);
  }, [id]);

  const fetchDocument = async (docId: string) => {
    try {
      // generated_documents par anon select band hai (supabase/rls_fix.sql),
      // is liye viewer service-role API se document load karta hai.
      const res = await fetch(`/api/documents/${docId}`, { cache: 'no-store' });
      const payload = await res.json().catch(() => ({}));
      const data = res.ok ? payload.document : null;
      if (data) {
        setDoc(data);
        setCurrentTemplate(data.template_name || 'classicgray');

        // 🚨 PRIVACY: check karo ke viewer is document ka owner hai ya nahi.
        // Track-document / email se aane wale shared viewers ko owner controls
        // (Back to Dashboard, Edit, Save) kabhi nahi milna chahiye.
        try {
          const { data: { user } } = await supabase.auth.getUser();
          const ownerEmail = String(data.email || '').trim().toLowerCase();
          const myEmail = String(user?.email || '').trim().toLowerCase();
          const ownedByMe = !!user && (data.user_id
            ? data.user_id === user.id
            : (!!myEmail && ownerEmail === myEmail));
          setIsOwner(ownedByMe);
        } catch {
          setIsOwner(false);
        }
      }
    } catch {
      /* document not reachable */
    }
    setLoading(false);
  };

  const handleSaveTemplate = async () => {
    // Sirf owner hi document ka design save kar sakta hai
    if (!isOwner) return;
    setSaving(true);
    try {
      const res = await authedFetch(`/api/documents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ templateName: currentTemplate }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save the design');
      alert("Template updated successfully!");
    } catch (error: any) {
      alert("Error saving template: " + (error?.message || 'unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;
  if (!doc) return <div className="text-center py-20 font-bold">Document Not Found</div>;

  const formData = doc.full_data;
  
  // Determine the edit link based on document type
  let editLink = `/builder?edit=${id}`;
  if (doc.document_type === 'Cover Letter') editLink = `/cover-letter?edit=${id}`;
  if (doc.document_type === 'Experience Letter') editLink = `/experience-letter?edit=${id}`;

  return (
    <div className="min-h-screen bg-gray-200 font-sans">
      {/* Top Navigation Bar */}
      <div className="bg-white shadow-sm py-4 px-6 sticky top-0 z-50 print:hidden">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* ðŸš¨ PRIVACY FIX: "Back to Dashboard" sirf document ka asli owner dekhega.
              Shared / track-document viewer ko sirf view-mode milta hai. */}
          <div>
            {isOwner && !isTracked && (
              <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium">
                <ArrowLeft size={18} /> Back to Dashboard
              </Link>
            )}
            {isTracked && (
              <Link href="/track-document" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium">
                <ArrowLeft size={18} /> Back to Track Document
              </Link>
            )}
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* Template Switcher (Only for CV) */}
            {doc.document_type === 'CV' && (
              <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border">
                <LayoutTemplate size={18} className="text-gray-500 ml-2" />
                <select value={currentTemplate} onChange={(e) => setCurrentTemplate(e.target.value)} className="bg-transparent outline-none text-sm font-semibold capitalize cursor-pointer py-1 pr-4">
                  {TEMPLATES.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {ATS_META[t.ats].short}{t.tier === 'premium' ? ' (Premium)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {doc.document_type === 'CV' && isOwner && (
              <button onClick={handleSaveTemplate} disabled={saving} className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-100 transition">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Design
              </button>
            )}

            {/* EDIT BUTTON (Sirf owner ke liye, track/shared view mein kabhi nahi) */}
            {!isTracked && isOwner && (
              <Link href={editLink} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition shadow-sm">
                <Edit size={16} /> Edit Document
              </Link>
            )}

            <button onClick={() => window.print()} className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-800 transition">
              <Printer size={16} /> Print / PDF
            </button>
          </div>
        </div>
      </div>

      {/* Actual CV Preview Area */}
      <div className="py-10 px-4 overflow-x-auto">
        <div id="cv-preview" className="print-area max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-2xl">
          
          <CVTemplateRenderer template={currentTemplate} formData={formData} />
        </div>
      </div>
    </div>
  );
}
