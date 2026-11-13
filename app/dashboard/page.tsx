'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { FileText, LogOut, Plus, ExternalLink, Loader2, Mail, Briefcase, CreditCard, Clock, CheckCircle2, XCircle, ShieldCheck, Crown } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [freeLimit, setFreeLimit] = useState(1);
  const [timeLeft, setTimeLeft] = useState('');

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

    const { data: settingsData } = await supabase.from('app_settings').select('free_cv_limit').eq('id', 1).single();
    if (settingsData) setFreeLimit(settingsData.free_cv_limit || 1);

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
            {/* NAYA BUTTON: Buy Packages */}
            <Link href="/payment" className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-5 py-2.5 rounded-xl hover:from-orange-600 hover:to-yellow-600 font-bold transition shadow-lg text-sm animate-pulse">
              <Crown size={18} /> Buy Packages
            </Link>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1 flex items-center gap-2"><FileText size={16}/> Free CVs Used</p>
            <p className="text-3xl font-bold text-gray-900">{profile?.free_cv_count || 0} / {freeLimit}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1 flex items-center gap-2"><ShieldCheck size={16}/> Account Type</p>
            <p className="text-3xl font-bold text-gray-900 capitalize">{profile?.subscription_type || 'Free'}</p>
          </div>
          
          {/* Expiry Timer Card */}
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

        {/* Payments History Section */}
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

        {/* Documents Section */}
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
                      <Link href={`/view/${doc.id}`} target="_blank" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-1.5 rounded-lg transition">
                        <ExternalLink size={14} /> View
                      </Link>
                    </td>
                  </tr>
                ))}
                {documents.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No documents generated yet. Select an option above to start.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}