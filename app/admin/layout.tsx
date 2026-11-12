'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Settings, CreditCard, MessageSquare, ArrowLeft, Image as ImageIcon, Link as LinkIcon, IndianRupee, Phone } from 'lucide-react';
import { Suspense, useEffect } from 'react';

function SidebarNavigation() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Payments', href: '/admin/payments', icon: CreditCard },
    { name: 'Messages', href: '/admin/messages', icon: MessageSquare },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const subItems = [
    { name: 'Branding & Hero', href: '/admin/settings?tab=branding', icon: ImageIcon },
    { name: 'Navbar Menu', href: '/admin/settings?tab=menu', icon: LinkIcon },
    { name: 'Pricing', href: '/admin/settings?tab=pricing', icon: IndianRupee },
    { name: 'Contact Us', href: '/admin/settings?tab=contact', icon: Phone },
  ];

  return (
    <nav className="flex-1 px-4 space-y-1 mt-4">
      {menuItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link 
            key={item.name} 
            href={item.href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 mt-2
              ${isActive ? 'bg-blue-600 text-white font-semibold shadow-md' : 'text-gray-400 hover:bg-white/10 hover:text-white'}
            `}
          >
            <item.icon size={20} /> {item.name}
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
    </nav>
  );
}

// Yahan humne AdminContent ko alag kiya taake use Suspense mein daal sakein
function AdminContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/admin/login') return;
    const isAdmin = localStorage.getItem('admin_logged_in');
    if (!isAdmin) {
      router.push('/admin/login');
    }
  }, [pathname, router]);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-[#0B1120] text-white flex flex-col border-r border-white/10">
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition font-bold text-sm">
            <ArrowLeft size={16} /> Back to Website
          </Link>
          <h2 className="text-xl font-bold mt-4">Admin Panel</h2>
        </div>
        <Suspense fallback={<div className="p-4 text-gray-400">Loading menu...</div>}>
          <SidebarNavigation />
        </Suspense>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}

// Yeh main export hai jo Suspense use karta hai
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50">Loading Admin Panel...</div>}>
      <AdminContent>{children}</AdminContent>
    </Suspense>
  );
}