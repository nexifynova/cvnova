'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock, Mail, Loader2, Eye, EyeOff } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    // Query ke zariye database se check karein
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', cleanEmail)
      .eq('password', cleanPassword)
      .maybeSingle();

    if (error) {
      alert(`Database Error: ${error.message}\n\nKya aapne Supabase mein admin_users table banai hai?`);
      setLoading(false);
      return;
    }

    if (!data) {
      alert(`Invalid Credentials!\n\nDatabase mein yeh email/password nahi mila.\nEmail: ${cleanEmail}\nPass: ${cleanPassword}\n\nPlease Supabase Table Editor mein check karein.`);
      setLoading(false);
      return;
    }

    // Session save karein
    localStorage.setItem('admin_logged_in', 'true');
    router.push('/admin');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">Admin Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="admin@cvnova.co.uk" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full pl-10 pr-12 py-3 rounded-xl border text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="••••••••" 
              />
              {/* Eye Icon add kar diya gaya hai */}
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex justify-center">
            {loading ? <Loader2 className="animate-spin" /> : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}