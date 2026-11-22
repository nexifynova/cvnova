'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Settings, CreditCard, MessageSquare, ArrowLeft, Image as ImageIcon, Link as LinkIcon, IndianRupee, Phone, LogOut, Key, X, Loader2, Eye, EyeOff, Headphones, TrendingUp } from 'lucide-react';
import { Suspense, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

function SidebarNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Support Notification State
  const [unreadSupport, setUnreadSupport] = useState(0);

  useEffect(() => {
    // Check for unread messages every 10 seconds
    const fetchUnread = async () => {
      const { count } = await supabase.from('contact_messages').select('*', { count: 'exact', head: true }).eq('is_read', false);
      if (count !== null) setUnreadSupport(count);
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Payments', href: '/admin/payments', icon: CreditCard },
    { name: 'Revenue Received', href: '/admin/revenue', icon: TrendingUp },
    { name: 'Support / Messages', href: '/admin/messages', icon: Headphones, badge: unreadSupport },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const subItems = [
    { name: 'Branding & Hero', href: '/admin/settings?tab=branding', icon: ImageIcon },
    { name: 'Navbar Menu', href: '/admin/settings?tab=menu', icon: LinkIcon },
    { name: 'Pricing', href: '/admin/settings?tab=pricing', icon: IndianRupee },
    { name: 'Contact Us', href: '/admin/settings?tab=contact', icon: Phone },
  ];

  const handleLogout = async () => {
    await fetch('/api/admin-logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert("Admin password updated successfully!");
      setIsPasswordModalOpen(false);
      setNewPassword('');
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <nav className="flex-1 px-4 space-y-1 mt-4 flex flex-col">
        <div className="flex-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-all duration-200 mt-2
                  ${isActive ? 'bg-blue-600 text-white font-semibold shadow-md' : 'text-gray-400 hover:bg-white/10 hover:text-white'}
                `}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} /> {item.name}
                </div>
                {item.badge && item.badge > 0 ? (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{item.badge}</span>
                ) : null}
              </Link>
            );
          })}

          <div className="pl-4 pt-4 pb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Settings</div>
          {subItems.map((item) => {
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all duration-200 ml-2 text-gray-400 hover:bg-white/10 hover:text-white`}
              >
                <item.icon size={16} /> {item.name}
              </Link>
            );
          })}
        </div>

        <div className="mt-auto pb-6 pt-4 border-t border-white/10 space-y-2">
          <button 
            onClick={() => setIsPasswordModalOpen(true)} 
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-sm text-gray-400 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <Key size={20} /> Change Password
          </button>
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </nav>

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Key size={20} className="text-blue-600" /> Change Admin Password</h2>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-gray-400 hover:text-gray-700"><X size={24} /></button>
            </div>
            <form onSubmit={handlePasswordChange} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className="w-full px-4 py-3 rounded-xl border text-gray-900 pr-12 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter new password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Minimum 6 characters required.</p>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition">Cancel</button>
                <button type="submit" disabled={updating} className="px-5 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50">{updating ? <Loader2 size={18} className="animate-spin" /> : 'Update Password'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function AdminContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/admin/login') return <>{children}</>;
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-[#0B1120] text-white flex flex-col border-r border-white/10 h-screen sticky top-0">
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition font-bold text-sm"><ArrowLeft size={16} /> Back to Website</Link>
          <h2 className="text-xl font-bold mt-4">Admin Panel</h2>
        </div>
        <Suspense fallback={<div className="p-4 text-gray-400">Loading menu...</div>}><SidebarNavigation /></Suspense>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50">Loading Admin Panel...</div>}>
      <AdminContent>{children}</AdminContent>
    </Suspense>
  );
}