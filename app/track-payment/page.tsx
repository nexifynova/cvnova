'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Loader2, ArrowLeft, CheckCircle2, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function TrackPayment() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<any[] | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setSearched(true);

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPayments(data);
    } else {
      setPayments([]);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-white p-6 font-sans">
      <div className="max-w-2xl mx-auto pt-10">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 w-fit">
          <ArrowLeft size={20} /> Back to Home
        </Link>
        
        <div className="bg-white/5 p-8 rounded-3xl border border-white/10 shadow-2xl">
          <h1 className="text-3xl font-bold mb-2">Track Your Payment</h1>
          <p className="text-gray-400 text-sm mb-8">Enter the email address you used during payment to check your approval status.</p>
          
          <form onSubmit={handleSearch} className="flex gap-2 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="email" 
                required
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0B1120] border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>
            <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold transition flex items-center justify-center min-w-[100px]">
              {loading ? <Loader2 size={20} className="animate-spin" /> : 'Search'}
            </button>
          </form>

          {searched && !loading && payments && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold border-b border-white/10 pb-2">Your Payment History</h2>
              
              {payments.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <XCircle size={48} className="mx-auto mb-3 text-red-500/50" />
                  <p>No payment records found for this email.</p>
                </div>
              ) : (
                payments.map((p) => (
                  <div key={p.id} className="bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <p className="font-bold text-white">{p.package_type}</p>
                      <p className="text-sm text-gray-400">Amount: ${p.amount} | TID: {p.transaction_id || 'N/A'}</p>
                      <p className="text-xs text-gray-500 mt-1">Date: {new Date(p.created_at).toLocaleDateString()}</p>
                    </div>
                    
                    <div>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 w-fit ${
                        p.status === 'approved' ? 'bg-green-500/20 text-green-400' : 
                        p.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {p.status === 'approved' && <CheckCircle2 size={14}/>}
                        {p.status === 'rejected' && <XCircle size={14}/>}
                        {p.status === 'pending' && <Clock size={14}/>}
                        {p.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}