'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, LogOut, LayoutDashboard, ChevronDown, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Session check karein
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkUser();

    // Auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <nav className="bg-[#0B1120]/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2">
        <div className="bg-gradient-to-tr from-blue-500 to-purple-600 p-2 rounded-xl">
          <FileText className="text-white" size={20} />
        </div>
        <span className="text-2xl font-extrabold tracking-tight text-white">CVNova</span>
      </Link>
      
      <div className="hidden md:flex gap-6 text-sm font-medium text-gray-300">
        <Link href="/builder" className="hover:text-white transition">CV Builder</Link>
        <Link href="/cover-letter" className="hover:text-white transition">Cover Letter</Link>
        <Link href="/experience-letter" className="hover:text-white transition">Experience Letter</Link>
        <Link href="/#pricing" className="hover:text-white transition">Pricing</Link>
      </div>

      <div className="flex gap-4 items-center">
        {user ? (
          // LOGGED IN VIEW (Hover Profile Dropdown)
          <div 
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <button className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full border border-white/20 hover:bg-white/20 transition">
              <User size={18} />
              <span className="text-sm font-semibold truncate max-w-[100px]">{user.email?.split('@')[0]}</span>
              <ChevronDown size={16} className={`transition-transform ${isHovered ? 'rotate-180' : ''}`} />
            </button>

            {isHovered && (
              <div className="absolute right-0 mt-2 w-48 bg-[#1A233A] border border-white/10 rounded-xl shadow-2xl py-2 flex flex-col">
                <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition">
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition text-left">
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          // LOGGED OUT VIEW
          <>
            <Link href="/login" className="text-sm font-semibold text-gray-300 hover:text-white transition">Log in</Link>
            <Link href="/signup" className="bg-white text-[#0B1120] text-sm px-5 py-2.5 rounded-full hover:bg-gray-200 font-bold shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all transform hover:-translate-y-0.5">Get Started Free</Link>
          </>
        )}
      </div>
    </nav>
  );
}