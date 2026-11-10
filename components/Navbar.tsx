'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FileText, LogOut, LayoutDashboard, ChevronDown, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const router = useRouter();
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkUser();

    // Fetch dynamic settings for Logo & Menu
    const fetchSettings = async () => {
      const { data } = await supabase.from('app_settings').select('site_logo_url, nav_menu').eq('id', 1).single();
      if (data) setSettings(data);
    };
    fetchSettings();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleMouseEnter = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => {
      setIsHovered(false);
    }, 150); 
  };

  // Default menu (agar database se load na ho)
  const defaultMenu = [
    { label: 'CV Builder', href: '/builder', visible: true },
    { label: 'Cover Letter', href: '/cover-letter', visible: true },
    { label: 'Experience Letter', href: '/experience-letter', visible: true },
    { label: 'Contact Us', href: '/contact', visible: true },
    { label: 'Pricing', href: '/#pricing', visible: true },
  ];

  const activeMenu = settings?.nav_menu && settings.nav_menu.length > 0 
    ? settings.nav_menu.filter((m: any) => m.visible) 
    : defaultMenu;

  return (
    <nav className="bg-[#0B1120]/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      
      {/* LOGO */}
      <Link href="/" className="flex items-center gap-2">
        {settings?.site_logo_url ? (
          <div className="h-10 w-auto relative">
            <img src={settings.site_logo_url} alt="CVNova Logo" className="h-10 w-auto object-contain" />
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-tr from-blue-500 to-purple-600 p-2 rounded-xl">
              <FileText className="text-white" size={20} />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">CVNova</span>
          </>
        )}
      </Link>
      
      {/* MENU */}
      <div className="hidden md:flex gap-6 text-sm font-medium text-gray-300">
        {activeMenu.map((item: any, idx: number) => (
          <Link key={idx} href={item.href} className="hover:text-white transition">
            {item.label}
          </Link>
        ))}
      </div>

      {/* USER ACTIONS */}
      <div className="flex gap-4 items-center">
        {user ? (
          <div className="relative py-2" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <button className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full border border-white/20 hover:bg-white/20 transition">
              <User size={18} />
              <span className="text-sm font-semibold truncate max-w-[100px]">{user.email?.split('@')[0]}</span>
              <ChevronDown size={16} className={`transition-transform ${isHovered ? 'rotate-180' : ''}`} />
            </button>

            {isHovered && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-[#1A233A] border border-white/10 rounded-xl shadow-2xl py-2 flex flex-col">
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
          <>
            <Link href="/login" className="text-sm font-semibold text-gray-300 hover:text-white transition">Log in</Link>
            <Link href="/signup" className="bg-white text-[#0B1120] text-sm px-5 py-2.5 rounded-full hover:bg-gray-200 font-bold shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all transform hover:-translate-y-0.5">Get Started Free</Link>
          </>
        )}
      </div>
    </nav>
  );
}