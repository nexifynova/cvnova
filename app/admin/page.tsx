'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FileText, Mail, Briefcase, ExternalLink, Phone, Settings, Users, Trash2, Loader2, ShieldCheck, CreditCard, Search, Eye, Filter, FolderOpen } from 'lucide-react';
import Link from 'next/link';

export default function AdminPanel() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalCV: 0, totalCover: 0, totalExp: 0 });
  const [activeTab, setActiveTab] = useState<'records' | 'users'>('records');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Search & Filter States
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [docFilter, setDocFilter] = useState('All');
  const [docSearchEmail, setDocSearchEmail] = useState(''); // New state for filtering docs by email

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
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
      fetchData(); 
    } catch (error: any) {
      alert("Failed to delete user: " + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handlePasswordReset = async (email: string) => {
    if(!confirm(`Send password reset link to ${email}?`)) return;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) alert("Error: " + error.message);
    else alert("Password reset link sent successfully!");
  };

  // Filter users by name or email
  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
    (u.full_name && u.full_name.toLowerCase().includes(userSearchTerm.toLowerCase()))
  );

  // Filter documents by type AND by user email (if clicked from users tab)
  const filteredDocs = documents.filter(d => {
    const matchesType = docFilter === 'All' || d.document_type === docFilter;
    const matchesEmail = docSearchEmail ? d.email?.toLowerCase() === docSearchEmail.toLowerCase() : true;
    return matchesType && matchesEmail;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">CVNova Admin Panel</h1>
        
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/payments" className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 bg-white px-4 py-2 rounded-lg border shadow-sm transition">
            <CreditCard size={16} /> Payments
          </Link>
          <Link href="/admin/settings" className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 bg-white px-4 py-2 rounded-lg border shadow-sm transition">
            <Settings size={16} /> Settings
          </Link>
          <Link href="/" className="text-sm font-medium text-blue-600 hover:underline">
            Back to Website
          </Link>
        </div>
      </div>
      
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

      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('records')}
          className={`pb-3 px-2 font-bold text-sm transition ${activeTab === 'records' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
        >
          Recent Records
        </button>
        <button 
          onClick={() => { setActiveTab('users'); setDocSearchEmail(''); }}
          className={`pb-3 px-2 font-bold text-sm transition flex items-center gap-2 ${activeTab === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
        >
          <Users size={16} /> Registered Users ({users.length})
        </button>
      </div>

      {activeTab === 'records' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900">
                {docSearchEmail ? `Documents for: ${docSearchEmail}` : 'Recent Documents'}
              </h2>
              {docSearchEmail && (
                <button onClick={() => setDocSearchEmail('')} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded font-semibold hover:bg-red-100">
                  Clear Filter
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border">
              <Filter size={16} className="text-gray-500" />
              <select 
                value={docFilter} 
                onChange={(e) => setDocFilter(e.target.value)}
                className="bg-transparent text-sm font-medium outline-none cursor-pointer"
              >
                <option value="All">All Documents</option>
                <option value="CV">CV Only</option>
                <option value="Cover Letter">Cover Letters Only</option>
                <option value="Experience Letter">Experience Letters Only</option>
              </select>
            </div>
          </div>
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
                {filteredDocs.map((doc) => (
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
                {filteredDocs.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-bold text-gray-900">Registered Users</h2>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search by name or email..." 
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{user.full_name || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-600 flex items-center gap-2">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 font-bold text-blue-600">{user.free_cv_count || 0}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${user.subscription_type === 'free' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                        {user.subscription_type || 'Free'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      {/* Naya Button: View User Documents */}
                      <button 
                        onClick={() => { setActiveTab('records'); setDocSearchEmail(user.email); setDocFilter('All'); }}
                        title="View User's Documents"
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 px-3 py-1.5 rounded-lg transition"
                      >
                        <FolderOpen size={14} /> Docs
                      </button>

                      <button 
                        onClick={() => handlePasswordReset(user.email)}
                        title="Manage Password (Reset Link)"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-1.5 rounded-lg transition"
                      >
                        <Eye size={14} /> Reset
                      </button>
                      
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
                {filteredUsers.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No users found matching your search.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}