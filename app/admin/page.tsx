'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FileText, Mail, Briefcase } from 'lucide-react';

export default function AdminPanel() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalCV: 0, totalCover: 0, totalExp: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('generated_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDocuments(data);
      const cvs = data.filter(d => d.document_type === 'CV').length;
      const covers = data.filter(d => d.document_type === 'Cover Letter').length;
      const exps = data.filter(d => d.document_type === 'Experience Letter').length;
      setStats({ totalCV: cvs, totalCover: covers, totalExp: exps });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">CVNova Admin Panel</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><FileText size={24} /></div>
          <div><p className="text-sm text-gray-500">Total CVs Generated</p><p className="text-2xl font-bold text-gray-900">{stats.totalCV}</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-xl"><Mail size={24} /></div>
          <div><p className="text-sm text-gray-500">Cover Letters</p><p className="text-2xl font-bold text-gray-900">{stats.totalCover}</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><Briefcase size={24} /></div>
          <div><p className="text-sm text-gray-500">Experience Letters</p><p className="text-2xl font-bold text-gray-900">{stats.totalExp}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100"><h2 className="text-lg font-bold text-gray-900">Recent Records</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Document</th>
                <th className="px-6 py-3 font-medium">Template</th>
                <th className="px-6 py-3 font-medium">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-500">{new Date(doc.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{doc.full_name}</td>
                  <td className="px-6 py-4 text-gray-600">{doc.document_type}</td>
                  <td className="px-6 py-4 capitalize text-gray-600">{doc.template_name}</td>
                  <td className="px-6 py-4 text-gray-500">{doc.email}</td>
                </tr>
              ))}
              {documents.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Abhi tak koi record nahi hai.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}