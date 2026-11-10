'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { FileText, Loader2, ArrowLeft } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center px-4 relative">
      {/* Back to Home Button */}
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-gray-400 hover:text-white transition font-medium">
        <ArrowLeft size={20} /> Back to Home
      </Link>

      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="bg-gradient-to-tr from-blue-500 to-purple-600 p-2 rounded-xl"><FileText className="text-white" size={20} /></div>
          <span className="text-2xl font-extrabold text-gray-900">CVNova</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Welcome Back</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-3 rounded-xl border text-gray-900" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-bold hover:from-blue-500 hover:to-purple-500 transition disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Log In'}
          </button>
        </form>
        
        <p className="text-center text-sm text-gray-500 mt-4">
          Don't have an account? <Link href="/signup" className="text-blue-600 font-bold hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}