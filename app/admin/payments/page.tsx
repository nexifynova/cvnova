'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, X, ExternalLink, Loader2, ArrowLeft, Clock, CheckCircle2, XCircle, Search, RefreshCcw } from 'lucide-react';
import Link from 'next/link';

// 🚨 Status labels: "pending" ka matlab hai payment abhi CHECKING PROCESS mein hai
const STATUS_LABEL: Record<string, string> = {
  pending: 'In Checking',
  approved: 'Approved',
  rejected: 'Rejected',
};

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

  // 🚨 Admin ke paas har payment ka FULL status control hai:
  //   pending  = "Payment in checking process" (abhi verify ho rahi hai)
  //   approved = payment received -> user ko plan/CVs mil jate hain
  //   rejected = payment reject -> agar pehle approved thi to benefit revert ho jata hai
  // Admin kisi bhi waqt koi bhi status laga sakta hai (galti se approve/reject bhi theek ho sakta hai).
  const handleAction = async (payment: any, newStatus: 'pending' | 'approved' | 'rejected') => {
    const wasApproved = payment.status === 'approved';
    const willBeApproved = newStatus === 'approved';
    const isGranting = !wasApproved && willBeApproved;   // grant a new benefit
    const isReverting = wasApproved && !willBeApproved;  // take back a granted benefit

    const confirmMessages: Record<string, string> = {
      approved: isGranting
        ? 'APPROVE this payment (the user will receive the plan/CVs)'
        : 'mark this payment as APPROVED',
      rejected: isReverting
        ? 'DISAPPROVE this payment (the user\'s plan/CVs will be reverted)'
        : 'REJECT this payment',
      pending: isReverting
        ? 'move this payment back to IN CHECKING (the user\'s plan/CVs will be reverted)'
        : 'mark this payment as IN CHECKING (the payment is being verified)',
    };

    if (!confirm(`Are you sure you want to ${confirmMessages[newStatus]}?`)) return;
    
    setProcessing(payment.id);

    try {
      // 1. Update Payment Status
      const { error: payError } = await supabase
        .from('payments')
        .update({
          status: newStatus,
          approved_at: willBeApproved ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      if (payError) throw payError;

      // Get current profile OUTSIDE the if/else blocks so it's available for both
      const { data: currentProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', payment.user_id)
        .single();

      // 2. Handle User Profile Updates
      if (isGranting) {
        if (payment.package_type === 'Reactivation') {
          // One-time $2 reactivation: unlock creation for 30 days and reset the
          // free Blue ATS counter. No subscription is created.
          const reactivatedUntil = new Date();
          reactivatedUntil.setDate(reactivatedUntil.getDate() + 30);
          await supabase.from('user_profiles').update({
            reactivated_until: reactivatedUntil.toISOString(),
            blue_ats_used: 0,
          }).eq('id', payment.user_id);
        } else if (payment.package_type === 'Additional CVs') {
          const { data: settings } = await supabase.from('app_settings').select('cvs_per_price').eq('id', 1).single();
          const cvsBought = Number(settings?.cvs_per_price) || 5;
          const currentTotal = currentProfile?.total_allowed_cvs || 1;
          
          await supabase.from('user_profiles').update({ total_allowed_cvs: currentTotal + cvsBought }).eq('id', payment.user_id);
        } else {
          // 🚨 Plan ki CVs aur months admin settings se lo (hardcoded nahi),
          // taake "5 Years = 250 CVs" jaisi configured values hi apply hon.
          const { data: settings } = await supabase.from('app_settings').select('*').eq('id', 1).single();
          const planConfig: Record<string, { months: number; cvs: number }> = {
            '3 Months': { months: 3, cvs: Number(settings?.cvs_3m) || 25 },
            '6 Months': { months: 6, cvs: Number(settings?.cvs_6m) || 45 },
            '1 Year': { months: 12, cvs: Number(settings?.cvs_1y) || 60 },
            '5 Years': { months: 60, cvs: Number(settings?.cvs_5y) || 250 },
          };
          const plan = planConfig[payment.package_type];
          const monthsToAdd = plan?.months || 0;
          const cvsToAdd = plan?.cvs || 0;

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
        const { data: revertSettings } = await supabase.from('app_settings').select('*').eq('id', 1).single();
        if (payment.package_type === 'Reactivation') {
          // Reverting a reactivation locks creation again (trial stays expired).
          await supabase.from('user_profiles').update({ reactivated_until: null }).eq('id', payment.user_id);
        } else if (payment.package_type === 'Additional CVs') {
          const cvsBought = Number(revertSettings?.cvs_per_price) || 5;
          const currentTotal = currentProfile?.total_allowed_cvs || 1;
          await supabase.from('user_profiles').update({ total_allowed_cvs: Math.max(1, currentTotal - cvsBought) }).eq('id', payment.user_id);
        } else {
          // Revert to Free (free limit admin settings se)
          await supabase.from('user_profiles').update({
            subscription_type: 'free',
            subscription_expiry: null,
            total_allowed_cvs: Number(revertSettings?.free_cv_limit) || 10
          }).eq('id', payment.user_id);
        }
      }

      alert(`Payment status updated to "${STATUS_LABEL[newStatus]}".`);
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
          <div><h1 className="text-3xl font-bold text-gray-900">Payment Approvals</h1><p className="text-sm text-gray-500 mt-1">Approve, disapprove or set In Checking — you control every payment&apos;s status</p></div>
        </div>

        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm rounded-xl px-4 py-3 mb-6 flex items-start gap-2">
          <Clock size={18} className="mt-0.5 shrink-0" />
          <p>
            <strong>Status control:</strong> <em>In Checking</em> = the payment is being verified, <em>Approved</em> = payment received (the plan/CVs are granted to the user),
            <em> Rejected</em> = payment rejected. If you approved by mistake, click <strong>Disapprove</strong> — the user&apos;s CVs and plan revert automatically, and approving again
            restores them. Approved revenue appears in <Link href="/admin/revenue" className="underline font-bold">Revenue Received</Link> automatically.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Search by email or transaction ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white" /></div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-3 rounded-xl border border-gray-200 outline-none bg-white font-medium"><option value="all">All Status</option><option value="pending">In Checking</option><option value="approved">Approved Only</option><option value="rejected">Rejected Only</option></select>
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
                    <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${p.status === 'approved' ? 'bg-green-100 text-green-700' : p.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.status === 'approved' && <CheckCircle2 size={12}/>}{p.status === 'rejected' && <XCircle size={12}/>}{p.status === 'pending' && <Clock size={12}/>}{(STATUS_LABEL[p.status] || p.status).toUpperCase()}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {p.status !== 'approved' && (
                          <button onClick={() => handleAction(p, 'approved')} disabled={processing === p.id} title="Approve payment" className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition font-medium text-xs disabled:opacity-50">
                            {processing === p.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Approve
                          </button>
                        )}
                        {p.status !== 'pending' && (
                          <button onClick={() => handleAction(p, 'pending')} disabled={processing === p.id} title="Payment is being verified" className="flex items-center gap-1 bg-amber-500 text-white px-3 py-2 rounded-lg hover:bg-amber-600 transition font-medium text-xs disabled:opacity-50">
                            {processing === p.id ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />} In Checking
                          </button>
                        )}
                        {p.status !== 'rejected' && (
                          <button onClick={() => handleAction(p, 'rejected')} disabled={processing === p.id} title={p.status === 'approved' ? 'Disapprove & revert plan/CVs' : 'Reject payment'} className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition font-medium text-xs disabled:opacity-50">
                            {processing === p.id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />} {p.status === 'approved' ? 'Disapprove' : 'Reject'}
                          </button>
                        )}
                      </div>
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