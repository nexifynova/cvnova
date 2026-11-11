'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, X, ExternalLink, Loader2, ArrowLeft, Clock, CheckCircle2, XCircle, Search } from 'lucide-react';
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
    const { data } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
    if (data) setPayments(data);
    setLoading(false);
  };

  const handleAction = async (payment: any, status: 'approved' | 'rejected') => {
    if (!confirm(`Are you sure you want to ${status} this payment?`)) return;
    
    setProcessing(payment.id);

    try {
      const { error: payError } = await supabase
        .from('payments')
        .update({ status, approved_at: new Date().toISOString() })
        .eq('id', payment.id);

      if (payError) throw payError;

      if (status === 'approved') {
        const expiryDate = new Date();
        if (payment.package_type === '3 Months') expiryDate.setMonth(expiryDate.getMonth() + 3);
        if (payment.package_type === '6 Months') expiryDate.setMonth(expiryDate.getMonth() + 6);
        if (payment.package_type === '1 Year') expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        if (payment.package_type === '5 Years') expiryDate.setFullYear(expiryDate.getFullYear() + 5);

        const { error: userError } = await supabase.from('user_profiles').update({
          subscription_type: payment.package_type,
          subscription_expiry: expiryDate.toISOString(),
          free_cv_count: 0
        }).eq('id', payment.user_id);
        
        if (userError) throw userError;
      }

      alert(`Payment ${status} successfully! User's account has been updated.`);
      fetchPayments();
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-100 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payment Approvals</h1>
            <p className="text-sm text-gray-500 mt-1">Approve user payments to upgrade their account</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <p className="text-xs text-gray-500">Total Requests</p>
            <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 shadow-sm">
            <p className="text-xs text-yellow-700 font-semibold">Pending</p>
            <p className="text-2xl font-bold text-yellow-800">{payments.filter(p => p.status === 'pending').length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-xl border border-green-200 shadow-sm">
            <p className="text-xs text-green-700 font-semibold">Approved</p>
            <p className="text-2xl font-bold text-green-800">{payments.filter(p => p.status === 'approved').length}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-xl border border-red-200 shadow-sm">
            <p className="text-xs text-red-700 font-semibold">Rejected</p>
            <p className="text-2xl font-bold text-red-800">{payments.filter(p => p.status === 'rejected').length}</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by email or transaction ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-200 outline-none bg-white font-medium"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Only</option>
            <option value="approved">Approved Only</option>
            <option value="rejected">Rejected Only</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">User Email</th>
                  <th className="px-6 py-4 font-medium">Package</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Method</th>
                  <th className="px-6 py-4 font-medium">TID</th>
                  <th className="px-6 py-4 font-medium">Slip</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{p.user_email}</td>
                    <td className="px-6 py-4 text-blue-600 font-semibold whitespace-nowrap">{p.package_type}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">${p.amount}</td>
                    <td className="px-6 py-4 text-gray-700">{p.payment_method}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-xs">{p.transaction_id || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <a href={p.slip_url} target="_blank" rel="noreferrer" className="text-blue-600 flex items-center gap-1 hover:underline font-medium">
                        View <ExternalLink size={14} />
                      </a>
                    </td>
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
                    <td className="px-6 py-4">
                      {p.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleAction(p, 'approved')} 
                            disabled={processing === p.id}
                            className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition font-medium text-xs disabled:opacity-50"
                          >
                            {processing === p.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Approve
                          </button>
                          <button 
                            onClick={() => handleAction(p, 'rejected')} 
                            disabled={processing === p.id}
                            className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition font-medium text-xs disabled:opacity-50"
                          >
                            {processing === p.id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />} Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredPayments.length === 0 && (
                  <tr><td colSpan={9} className="px-6 py-10 text-center text-gray-500">No payments found matching your criteria.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}