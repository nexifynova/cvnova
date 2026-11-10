'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FileText, Mail, Briefcase, ExternalLink, Phone, Settings, Users, Trash2, Loader2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function AdminPanel() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalCV: 0, totalCover: 0, totalExp: 0 });
  const [activeTab, setActiveTab] = useState<'records' | 'users'>('records');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Fetch Documents
    const { data: docData } = await supabase
      .from('generated_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (docData) {
      setDocuments(docData);
      const cvs = docData.filter(d => d.document_type === 'CV').length;
      const covers = docData.filter(d => d.document_type === 'Cover Letter').length;
      const exps = docData.filter(d => d.document_type === 'Experience Letter').length;
      setStats({ totalCV: cvs, totalCover: covers, totalExp: exps });
    }

    // Fetch Users
    const { data: userData } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (userData) setUsers(userData);
    
    setLoading(false);
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete user: ${email}? \n\nThis will delete their profile and all generated documents permanently.`);
    if (!confirmDelete) return;

    setDeletingId(userId);
    try {
      const res = await fetch('/api/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert("User deleted successfully!");
      fetchData(); // Refresh list
    } catch (error: any) {
      alert("Failed to delete user: " + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">CVNova Admin Panel</h1>
        
        <div className="flex items-center gap-4">
          <Link href="/admin/settings" className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 bg-white px-4 py-2 rounded-lg border shadow-sm transition">
            <Settings size={16} /> Settings
          </Link>
          <Link href="/" className="text-sm font-medium text-blue-600 hover:underline">
            Back to Website
          </Link>
        </div>
      </div>
      
      {/* Stats Cards */}
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

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('records')}
          className={`pb-3 px-2 font-bold text-sm transition ${activeTab === 'records' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
        >
          Recent Records
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-2 font-bold text-sm transition flex items-center gap-2 ${activeTab === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
        >
          <Users size={16} /> Registered Users ({users.length})
        </button>
      </div>

      {/* ================= RECORDS TAB ================= */}
      {activeTab === 'records' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100"><h2 className="text-lg font-bold text-gray-900">Recent Documents</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Phone</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Document</th>
                  <th className="px-6 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-500">{new Date(doc.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{doc.full_name}</td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center gap-1"><Phone size={14} className="text-gray-400" /> {doc.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{doc.email}</td>
                    <td className="px-6 py-4 text-gray-600">{doc.document_type}</td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/view/${doc.id}`} target="_blank" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-1.5 rounded-lg transition">
                        <ExternalLink size={14} /> View
                      </Link>
                    </td>
                  </tr>
                ))}
                {documents.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Abhi tak koi record nahi hai.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= USERS TAB ================= */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Registered Users</h2>
            <p className="text-xs text-gray-500 flex items-center gap-1"><ShieldCheck size={14} className="text-green-500"/> Deleting a user removes all their data</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-6 py-3 font-medium">Date Joined</th>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">CVs Used</th>
                  <th className="px-6 py-3 font-medium">Plan</th>
                  <th className="px-6 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{user.full_name || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 font-bold text-blue-600">{user.free_cv_count || 0}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${user.subscription_type === 'free' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                        {user.subscription_type || 'Free'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        disabled={deletingId === user.id}
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-medium bg-red-50 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                      >
                        {deletingId === user.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No users registered yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}