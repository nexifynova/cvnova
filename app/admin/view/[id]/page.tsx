'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ViewCV() {
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState<string | null>(null);

  // Build ke waqt error na aaye, iske liye useEffect use kar rahe hain
  useEffect(() => {
    // URL se ID nikalna
    const pathParts = window.location.pathname.split('/');
    const docId = pathParts[pathParts.length - 1];
    setId(docId);
  }, []);

  useEffect(() => {
    if (id) {
      fetchDocument(id);
    }
  }, [id]);

  const fetchDocument = async (docId: string) => {
    const { data, error } = await supabase
      .from('generated_documents')
      .select('*')
      .eq('id', docId)
      .single();

    if (data) setDoc(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Record Not Found</h1>
        <Link href="/admin" className="text-blue-600 hover:underline">Back to Admin</Link>
      </div>
    );
  }

  const data = doc.full_data;

  return (
    <div className="min-h-screen bg-gray-200 py-8 px-4 font-sans">
      <div className="max-w-4xl mx-auto mb-4 flex justify-between items-center">
        <Link href="/admin" className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm text-gray-700 hover:text-blue-600 font-medium">
          <ArrowLeft size={18} /> Back to Admin
        </Link>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm text-sm text-gray-500">
          User: <span className="font-bold text-gray-900">{doc.full_name}</span> | Type: {doc.document_type}
        </div>
      </div>

      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-xl p-10 min-h-[A4]">
        <div className="border-b-2 border-blue-600 pb-4 mb-6">
          <h1 className="text-4xl font-extrabold text-gray-900 uppercase">{data.fullName}</h1>
          <p className="text-xl text-blue-600 font-semibold mt-1">{data.jobTitle}</p>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-3">
            <span>{data.email}</span> <span>•</span> <span>{data.phone}</span> <span>•</span> <span>{data.address}</span>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1">Summary</h2>
          <p className="text-gray-700 text-sm leading-relaxed">{data.summary}</p>
        </div>

        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1">Experience</h2>
          {data.experience?.map((exp: any, i: number) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between items-baseline">
                <h3 className="font-bold text-gray-900 text-sm">{exp.role}</h3>
                <span className="text-xs text-gray-500 font-medium">{exp.duration}</span>
              </div>
              <p className="text-xs text-blue-600 font-semibold mb-1">{exp.company}</p>
              <p className="text-xs text-gray-600 leading-relaxed">{exp.desc}</p>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1">Education</h2>
          {data.education?.map((edu: any, i: number) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between items-baseline">
                <h3 className="font-bold text-gray-900 text-sm">{edu.degree}</h3>
                <span className="text-xs text-gray-500">{edu.year}</span>
              </div>
              <p className="text-xs text-gray-600">{edu.school}</p>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1">Skills</h2>
          <ul className="grid grid-cols-2 gap-1">
            {data.skills?.map((skill: string, i: number) => skill && (
              <li key={i} className="flex items-center gap-2 text-sm text-gray-700"><span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span> {skill}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}