'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { CheckCircle, Loader2, FileText } from 'lucide-react';

export default function AuthConfirm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Supabase automatically handles the session from the URL hash
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // User is logged in, redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      }
      setLoading(false);
    };
    checkSession();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1120]">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4">
      <div className="bg-white/5 border border-white/10 p-10 rounded-3xl max-w-lg w-full text-center shadow-2xl backdrop-blur-sm">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="text-green-400" size={40} />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">Email Confirmed!</h1>
        <p className="text-gray-300 mb-8 leading-relaxed">
          Welcome to <span className="font-bold text-blue-400">CVNova</span> by NexifyNova. Your account has been successfully verified. You will be redirected to your dashboard shortly.
        </p>

        <div className="bg-black/30 p-4 rounded-xl mb-8 text-left">
          <p className="text-sm text-gray-400 mb-2">Need help? Contact us at:</p>
          <p className="text-sm text-white font-mono">info@nexifynova.co.uk</p>
          <p className="text-sm text-white font-mono">support@nexifynova.co.uk</p>
        </div>

        <Link href="/dashboard" className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-bold hover:from-blue-500 hover:to-purple-500 transition shadow-lg">
          <FileText size={18} /> Go to Dashboard Now
        </Link>
      </div>
    </div>
  );
}