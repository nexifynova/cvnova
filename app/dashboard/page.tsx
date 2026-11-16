'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { FileText, LogOut, Plus, ExternalLink, Loader2, Mail, Briefcase, CreditCard, Clock, CheckCircle2, XCircle, ShieldCheck, Crown, Search, Filter, Calendar, Edit2, X, Share2, RefreshCw, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState('');

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');

  // Rename Document State
  const [renamingDoc, setRenamingDoc] = useState<any>(null);
  const [newDocName, setNewDocName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Share Code State
  const [sharingDoc, setSharingDoc] = useState<any>(null);
  const [shareCode, setShareCode] = useState('');
  const [isShareable, setIsShareable] = useState(false);
  const [isSavingShare, setIsSavingShare] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (!profile?.subscription_expiry) return;

    const interval = setInterval(() => {
      const expiry = new Date(profile.subscription_expiry).getTime();
      const now = new Date().getTime();
      const distance = expiry - now;

      if (distance < 0) {
        setTimeLeft('Expired');
        clearInterval(interval);
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [profile]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    setUser(user);

    const { data: profileData } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
    if (profileData) setProfile(profileData);

    const { data: settingsData } = await supabase.from('app_settings').select('*').eq('id', 1).single();
    if (settingsData) setSettings(settingsData);

    const { data: docs } = await supabase.from('generated_documents').select('*').eq('email', user.email).order('created_at', { ascending: false });
    if (docs) setDocuments(docs);

    const { data: pays } = await supabase.from('payments').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (pays) setPayments(pays);
    
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document? This action cannot be undone.")) return;

    try {
      const { error } = await supabase.from('generated_documents').delete().eq('id', docId);
      if (error) throw error;
      
      setDocuments(documents.filter(d => d.id !== docId));
      alert("Document deleted successfully.");
    } catch (error: any) {
      alert("Error deleting document: " + error.message);
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim() || !renamingDoc) return;
    setIsRenaming(true);

    try {
      const { error } = await supabase
        .from('generated_documents')
        .update({ full_name: newDocName.trim() })
        .eq('id', renamingDoc.id);

      if (error) throw error;

      setDocuments(documents.map(d => d.id === renamingDoc.id ? { ...d, full_name: newDocName.trim() } : d));
      setRenamingDoc(null);
    } catch (error: any) {
      alert("Error renaming document: " + error.message);
    } finally {
      setIsRenaming(false);
    }
  };

  const openShareModal = (doc: any) => {
    setSharingDoc(doc);
    setShareCode(doc.share_code || '');
    setIsShareable(doc.is_shareable || false);
  };

  const generateRandomCode = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setShareCode(code);
    setIsShareable(true);
  };

  const resetShareCode = () => {
    setShareCode('');
    setIsShareable(false);
  };

  const handleSaveShareCode = async () => {
    if (!sharingDoc) return;
    if (isShareable && shareCode && shareCode.length !== 4) {
      alert("Share code must be exactly 4 digits.");
      return;
    }

    setIsSavingShare(true);
    try {
      const { error } = await supabase
        .from('generated_documents')
        .update({ 
          share_code: shareCode || null, 
          is_shareable: isShareable 
        })
        .eq('id', sharingDoc.id);

      if (error) throw error;

      setDocuments(documents.map(d => d.id === sharingDoc.id ? { ...d, share_code: shareCode, is_shareable: isShareable } : d));
      setSharingDoc(null);
      alert("Share settings updated!");
    } catch (error: any) {
      alert("Error saving share code: " + error.message);
    } finally {
      setIsSavingShare(false);
    }
  };

  let currentLimit = settings?.free_cv_limit || 1;
  let limitLabel = "Free CVs";
  if (profile?.subscription_type === '3 Months') { currentLimit = settings?.cvs_3m || 10; limitLabel = "Package CVs"; }
  if (profile?.subscription_type === '6 Months') { currentLimit = settings?.cvs_6m || 20; limitLabel = "Package CVs"; }
  if (profile?.subscription_type === '1 Year') { currentLimit = settings?.cvs_1y || 50; limitLabel = "Package CVs"; }
  if (profile?.subscription_type === '5 Years') { currentLimit = settings?.cvs_5y || 100; limitLabel = "Package CVs"; }

  const filteredDocuments = documents.filter((doc) => {
    if (searchTerm && !doc.full_name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterType !== 'All' && doc.document_type !== filterType) return false;
    if (filterFromDate) {
      const from = new Date(filterFromDate);
      const docDate = new Date(doc.created_at);
      if (docDate < from) return false;
    }
    if (filterToDate) {
      const to = new Date(filterToDate);
      to.setDate(to.getDate() + 1);
      const docDate = new Date(doc.created_at);
      if (docDate > to) return false;
    }
    return true;
  });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-gradient-to-tr from-blue-500 to-purple-600 p-2 rounded-xl"><FileText className="text-white" size={20} /></div>
          <span className="text-xl font-extrabold text-gray-900">{settings?.site_name || 'CVNova'}</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 hidden sm:block">Hi, {profile?.full_name || user.email}</span>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage your generated documents and payments</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/builder" className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 font-bold transition shadow-md text-sm">
              <Plus size={18} /> New CV
            </Link>
            <Link href="/cover-letter" className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl hover:bg-green-700 font-bold transition shadow-md text-sm">
              <Mail size={18} /> Cover Letter
            </Link>
            <Link href="/experience-letter" className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl hover:bg-purple-700 font-bold transition shadow-md text-sm">
              <Briefcase size={18} /> Experience Letter
            </Link>
            <Link href="/payment" className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-5 py-2.5 rounded-xl hover:from-orange-600 hover:to-yellow-600 font-bold transition shadow-lg text-sm animate-pulse">
              <Crown size={18} /> Buy Packages
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1 flex items-center gap-2"><FileText size={16}/> {limitLabel} Used</p>
            <p className="text-3xl font-bold text-gray-900">{profile?.free_cv_count || 0} / {currentLimit}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1 flex items-center gap-2"><ShieldCheck size={16}/> Account Type</p>
            <p className="text-3xl font-bold text-gray-900 capitalize">{profile?.subscription_type || 'Free'}</p>
          </div>
          
          <div className={`p-6 rounded-2xl shadow-sm border ${profile?.subscription_type !== 'free' && timeLeft !== 'Expired' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}>
            <p className="text-sm text-gray-500 mb-1 flex items-center gap-2"><Clock size={16}/> Subscription Expiry</p>
            {profile?.subscription_type !== 'free' && profile?.subscription_expiry ? (
              <div>
                <p className={`text-2xl font-bold ${timeLeft === 'Expired' ? 'text-red-600' : 'text-green-700'}`}>
                  {timeLeft === 'Expired' ? 'Expired' : timeLeft}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Expires on: {new Date(profile.subscription_expiry).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <p className="text-xl font-bold text-gray-400 mt-2">No Active Plan</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-10">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="text-blue-600" size={20} />
              <h2 className="text-lg font-bold text-gray-900">My Payment History</h2>
            </div>
            <Link href="/payment" className="text-sm font-bold text-blue-600 hover:underline">Upgrade Now</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Package</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-500">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{p.package_type}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">${p.amount}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${
                        p.status === 'approved' ? 'bg-green-100 text-green-700' : 
                        p.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {p.status === 'approved' && <CheckCircle2 size={12}/>}
                        {p.status === 'rejected' && <XCircle size={12}/>}
                        {p.status === 'pending' && <Clock size={12}/>}
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No payments made yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-lg font-bold text-gray-900">My Documents</h2>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search by name..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-48"
                />
              </div>
              
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="pl-9 pr-8 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white cursor-pointer"
                >
                  <option value="All">All Types</option>
                  <option value="CV">CV</option>
                  <option value="Cover Letter">Cover Letter</option>
                  <option value="Experience Letter">Experience Letter</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-1">
                <Calendar size={16} className="text-gray-400" />
                <input type="date" value={filterFromDate} onChange={(e) => setFilterFromDate(e.target.value)} className="text-sm outline-none bg-transparent" title="From Date" />
                <span className="text-gray-400">-</span>
                <input type="date" value={filterToDate} onChange={(e) => setFilterToDate(e.target.value)} className="text-sm outline-none bg-transparent" title="To Date" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Document Type</th>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Template</th>
                  <th className="px-6 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-500">{new Date(doc.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{doc.document_type}</td>
                    <td className="px-6 py-4 text-gray-900 flex items-center gap-2">
                      {doc.full_name}
                      <button 
                        onClick={() => { setRenamingDoc(doc); setNewDocName(doc.full_name || ''); }} 
                        className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-1.5 rounded transition"
                        title="Rename Document"
                      >
                        <Edit2 size={14} />
                      </button>
                    </td>
                    <td className="px-6 py-4 capitalize text-gray-600">{doc.template_name}</td>
                    <td className="px-6 py-4 flex gap-2">
                      <Link href={`/view/${doc.id}`} target="_blank" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-1.5 rounded-lg transition">
                        <ExternalLink size={14} /> View
                      </Link>
                      <button 
                        onClick={() => openShareModal(doc)}
                        className={`inline-flex items-center gap-1 font-medium px-3 py-1.5 rounded-lg transition ${doc.is_shareable && doc.share_code ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}
                        title="Share Document"
                      >
                        <Share2 size={14} /> Share
                      </button>
                      <button 
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-medium bg-red-50 px-3 py-1.5 rounded-lg transition"
                        title="Delete Document"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredDocuments.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No documents found matching your criteria.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Rename Modal */}
      {renamingDoc && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Rename Document</h2>
              <button onClick={() => setRenamingDoc(null)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleRenameSubmit} className="p-5">
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Document Name</label>
                <input 
                  type="text" 
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="Enter new name"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setRenamingDoc(null)}
                  className="px-4 py-2 rounded-lg font-semibold text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isRenaming}
                  className="px-4 py-2 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isRenaming ? <Loader2 size={16} className="animate-spin" /> : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Code Modal */}
      {sharingDoc && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Share2 size={18}/> Share Document</h2>
              <button onClick={() => setSharingDoc(null)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-1">4-Digit Share Code</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={shareCode}
                    onChange={(e) => setShareCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none tracking-widest text-lg font-mono" 
                    placeholder="e.g. 1234"
                    maxLength={4}
                  />
                  <button 
                    onClick={generateRandomCode}
                    className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition"
                    title="Generate Random Code"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>
              </div>

              <div className="mb-6 flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                <span className="text-sm font-semibold text-gray-700">Share Permission</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={isShareable}
                    onChange={(e) => setIsShareable(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  <span className="ml-2 text-xs font-bold text-gray-600">{isShareable ? 'ALLOWED' : 'BLOCKED'}</span>
                </label>
              </div>

              <div className="flex justify-between items-center">
                <button 
                  type="button" 
                  onClick={resetShareCode}
                  className="px-4 py-2 rounded-lg font-semibold text-red-600 hover:bg-red-50 transition text-sm"
                >
                  Reset Code
                </button>
                <button 
                  onClick={handleSaveShareCode}
                  disabled={isSavingShare}
                  className="px-5 py-2 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 text-sm"
                >
                  {isSavingShare ? <Loader2 size={16} className="animate-spin" /> : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}