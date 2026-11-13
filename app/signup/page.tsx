'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { FileText, Loader2, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function Signup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    setLoading(true);

    // Sirf Auth mein signup karein. Profile Database Trigger khud bana dega.
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: { full_name: formData.fullName }, // Trigger isko utha lega
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      }
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }
    
    setIsSuccess(true);
    setLoading(false);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center px-4 relative">
        <div className="bg-white/5 border border-white/10 p-10 rounded-3xl max-w-md w-full text-center shadow-2xl backdrop-blur-sm">
          <CheckCircle className="text-green-500 mx-auto mb-6" size={64} />
          <h2 className="text-2xl font-bold text-white mb-4">Verify Your Email</h2>
          <p className="text-gray-400 mb-6 leading-relaxed">
            A confirmation link has been sent to <span className="text-white font-bold">{formData.email}</span>. 
            Please check your inbox and click the link.
          </p>
          <Link href="/login" className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:from-blue-500 hover:to-purple-500 transition shadow-lg">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center px-4 relative">
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-gray-400 hover:text-white transition font-medium">
        <ArrowLeft size={20} /> Back to Home
      </Link>
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="bg-gradient-to-tr from-blue-500 to-purple-600 p-2 rounded-xl"><FileText className="text-white" size={20} /></div>
          <span className="text-2xl font-extrabold text-gray-900">CVNova</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Create Your Account</h1>
        
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
            <input type="text" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full px-4 py-3 rounded-xl border text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-3 rounded-xl border text-gray-900 pr-12 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
            <input type={showPassword ? "text" : "password"} required value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} className="w-full px-4 py-3 rounded-xl border text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-bold hover:from-blue-500 hover:to-purple-500 transition disabled:opacity-50 mt-2">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
}