'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { FileText, LogOut, Plus, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    setUser(user);

    // Profile fetch karein
    const { data: profileData } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
    if (profileData) setProfile(profileData);

    // Documents fetch karein (sirf is user ke)
    const { data: docs } = await supabase.from('generated_documents').select('*').eq('email', user.email).order('created_at', { ascending: false });
    if (docs) setDocuments(docs);
    
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-gradient-to-tr from-blue-500 to-purple-600 p-2 rounded-xl"><FileText className="text-white" size={20} /></div>
          <span className="text-xl font-extrabold text-gray-900">CVNova</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 hidden sm:block">Hi, {profile?.full_name || user.email}</span>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage your generated documents</p>
          </div>
          <Link href="/builder" className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 font-bold transition shadow-md">
            <Plus size={18} /> New CV
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Free CVs Used</p>
            <p className="text-3xl font-bold text-gray-900">{profile?.free_cv_count || 0} / 6</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Account Type</p>
            <p className="text-3xl font-bold text-gray-900 capitalize">{profile?.subscription_type || 'Free'}</p>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100"><h2 className="text-lg font-bold text-gray-900">My Documents</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Document Type</th>
                  <th className="px-6 py-3 font-medium">Template</th>
                  <th className="px-6 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-500">{new Date(doc.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-gray-600">{doc.document_type}</td>
                    <td className="px-6 py-4 capitalize text-gray-600">{doc.template_name}</td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/view/${doc.id}`} target="_blank" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-1.5 rounded-lg transition">
                        <ExternalLink size={14} /> View
                      </Link>
                    </td>
                  </tr>
                ))}
                {documents.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Abhi tak koi document nahi banaya. Naya CV banane ke liye "New CV" dabayein.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}