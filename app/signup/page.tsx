'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { FileText, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function Signup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from('user_profiles').insert([
        { id: data.user.id, full_name: formData.fullName, email: formData.email }
      ]);
      alert("Account Created Successfully! Please Login.");
      router.push('/login');
    }
    setLoading(false);
  };

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
            <input type="text" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full px-4 py-3 rounded-xl border text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                value={formData.password} 
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                className="w-full px-4 py-3 rounded-xl border text-gray-900 pr-12" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                value={formData.confirmPassword} 
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} 
                className="w-full px-4 py-3 rounded-xl border text-gray-900 pr-12" 
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-bold hover:from-blue-500 hover:to-purple-500 transition disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Sign Up'}
          </button>
        </form>
        
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account? <Link href="/login" className="text-blue-600 font-bold hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}