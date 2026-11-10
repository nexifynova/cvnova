'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, X, ExternalLink, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    const { data } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
    if (data) setPayments(data);
    setLoading(false);
  };

  const handleAction = async (id: string, status: 'approved' | 'rejected', userId: string, packageType: string) => {
    // 1. Update Payment Status
    await supabase.from('payments').update({ status }).eq('id', id);

    // 2. Agar Approve hua, to User Profile Update karein
    if (status === 'approved') {
      let expiryDate = new Date();
      if (packageType === '3 Months') expiryDate.setMonth(expiryDate.getMonth() + 3);
      if (packageType === '6 Months') expiryDate.setMonth(expiryDate.getMonth() + 6);
      if (packageType === '1 Year') expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      if (packageType === '5 Years') expiryDate.setFullYear(expiryDate.getFullYear() + 5);

      await supabase.from('user_profiles').update({
        subscription_type: packageType,
        subscription_expiry: expiryDate.toISOString(),
        // Optional: Reset CV count on upgrade
        free_cv_count: 0 
      }).eq('id', userId);
    }

    fetchPayments(); // Refresh list
    alert(`Payment ${status} successfully!`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-100">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Payment Approvals</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">User Email</th>
                <th className="px-6 py-4 font-medium">Package</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Method</th>
                <th className="px-6 py-4 font-medium">Slip</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-500">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{p.user_email}</td>
                  <td className="px-6 py-4 text-blue-600 font-semibold">{p.package_type}</td>
                  <td className="px-6 py-4 font-bold">${p.amount}</td>
                  <td className="px-6 py-4">{p.payment_method}</td>
                  <td className="px-6 py-4">
                    <a href={p.slip_url} target="_blank" rel="noreferrer" className="text-blue-600 flex items-center gap-1 hover:underline">
                      View Slip <ExternalLink size={14} />
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      p.status === 'approved' ? 'bg-green-100 text-green-700' : 
                      p.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {p.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    {p.status === 'pending' && (
                      <>
                        <button onClick={() => handleAction(p.id, 'approved', p.user_id, p.package_type)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200" title="Approve">
                          <Check size={18} />
                        </button>
                        <button onClick={() => handleAction(p.id, 'rejected', p.user_id, p.package_type)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200" title="Reject">
                          <X size={18} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr><td colSpan={8} className="px-6 py-10 text-center text-gray-500">Koi payment record nahi mila.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}