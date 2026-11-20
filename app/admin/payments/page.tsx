'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, X, ExternalLink, Loader2, ArrowLeft, Clock, CheckCircle2, XCircle, Search, RefreshCcw } from 'lucide-react';
import Link from 'next/link';

export default function AdminPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching payments:", error);
      alert("Database Error: " + error.message);
    } else if (data) {
      setPayments(data);
    }
    setLoading(false);
  };

  const handleAction = async (payment: any, actionStatus: 'approved' | 'rejected') => {
    const isReverting = (payment.status === 'approved' && actionStatus === 'rejected');
    const confirmText = isReverting ? 'disapprove (revert)' : actionStatus;

    if (!confirm(`Are you sure you want to ${confirmText} this payment?`)) return;
    
    setProcessing(payment.id);

    try {
      // 1. Update Payment Status
      const { error: payError } = await supabase
        .from('payments')
        .update({ status: actionStatus, approved_at: new Date().toISOString() })
        .eq('id', payment.id);

      if (payError) throw payError;

      // 2. Handle User Profile Updates
      if (actionStatus === 'approved') {
        const { data: currentProfile } = await supabase.from('user_profiles').select('*').eq('id', payment.user_id).single();
        
        if (payment.package_type === 'Additional CVs') {
          const { data: settings } = await supabase.from('app_settings').select('cvs_per_price').eq('id', 1).single();
          const cvsBought = settings?.cvs_per_price || 5;
          const currentTotal = currentProfile?.total_allowed_cvs || 1;
          
          await supabase.from('user_profiles').update({ total_allowed_cvs: currentTotal + cvsBought }).eq('id', payment.user_id);
        } else {
          // Calculate New Package CVs and Expiry
          let monthsToAdd = 0;
          let cvsToAdd = 0;
          if (payment.package_type === '3 Months') { monthsToAdd = 3; cvsToAdd = 25; }
          if (payment.package_type === '6 Months') { monthsToAdd = 6; cvsToAdd = 45; }
          if (payment.package_type === '1 Year') { monthsToAdd = 12; cvsToAdd = 60; }
          if (payment.package_type === '5 Years') { monthsToAdd = 60; cvsToAdd = 250; }

          // Expiry Date Calculation (Pick the longest one)
          let newExpiryDate = new Date();
          if (currentProfile?.subscription_expiry && new Date(currentProfile.subscription_expiry) > new Date()) {
            newExpiryDate = new Date(currentProfile.subscription_expiry);
          }
          const newPackageExpiry = new Date();
          newPackageExpiry.setMonth(newPackageExpiry.getMonth() + monthsToAdd);
          if (newPackageExpiry > newExpiryDate) newExpiryDate = newPackageExpiry;

          // Total CVs Addition
          const newTotalCVs = (currentProfile?.total_allowed_cvs || 0) + cvsToAdd;

          await supabase.from('user_profiles').update({
            subscription_type: payment.package_type,
            subscription_expiry: newExpiryDate.toISOString(),
            total_allowed_cvs: newTotalCVs
          }).eq('id', payment.user_id);
        }
      } 
      else if (isReverting) {
        // Disapprove Logic (Minus CVs)
        if (payment.package_type === 'Additional CVs') {
          const { data: settings } = await supabase.from('app_settings').select('cvs_per_price').eq('id', 1).single();
          const cvsBought = settings?.cvs_per_price || 5;
          const currentTotal = currentProfile?.total_allowed_cvs || 1;
          await supabase.from('user_profiles').update({ total_allowed_cvs: Math.max(1, currentTotal - cvsBought) }).eq('id', payment.user_id);
        } else {
          // Revert to Free
          await supabase.from('user_profiles').update({
            subscription_type: 'free',
            subscription_expiry: null,
            total_allowed_cvs: 10 // Default free limit
          }).eq('id', payment.user_id);
        }
      }

      alert(`Payment successfully ${isReverting ? 'reverted' : actionStatus}!`);
      fetchPayments();
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) || p.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-100 transition"><ArrowLeft size={20} /></Link>
          <div><h1 className="text-3xl font-bold text-gray-900">Payment Approvals</h1><p className="text-sm text-gray-500 mt-1">Approve or disapprove user payments</p></div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Search by email or transaction ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white" /></div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-3 rounded-xl border border-gray-200 outline-none bg-white font-medium"><option value="all">All Status</option><option value="pending">Pending Only</option><option value="approved">Approved Only</option><option value="rejected">Rejected Only</option></select>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600"><tr><th className="px-6 py-4 font-medium">Date</th><th className="px-6 py-4 font-medium">User Email</th><th className="px-6 py-4 font-medium">Package</th><th className="px-6 py-4 font-medium">Amount</th><th className="px-6 py-4 font-medium">Status</th><th className="px-6 py-4 font-medium">Actions</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{p.user_email}</td>
                    <td className="px-6 py-4 text-blue-600 font-semibold whitespace-nowrap">{p.package_type}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">${p.amount}</td>
                    <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${p.status === 'approved' ? 'bg-green-100 text-green-700' : p.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.status === 'approved' && <CheckCircle2 size={12}/>}{p.status === 'rejected' && <XCircle size={12}/>}{p.status === 'pending' && <Clock size={12}/>}{p.status.toUpperCase()}</span></td>
                    <td className="px-6 py-4">
                      {p.status === 'pending' ? (
                        <div className="flex gap-2"><button onClick={() => handleAction(p, 'approved')} disabled={processing === p.id} className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition font-medium text-xs disabled:opacity-50">{processing === p.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Approve</button><button onClick={() => handleAction(p, 'rejected')} disabled={processing === p.id} className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition font-medium text-xs disabled:opacity-50">{processing === p.id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />} Reject</button></div>
                      ) : (<span className="text-xs text-gray-400 italic">Processed</span>)}
                    </td>
                  </tr>
                ))}
                {filteredPayments.length === 0 && (<tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">No payments found.</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}