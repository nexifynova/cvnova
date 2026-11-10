import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { supabase } from '@/lib/supabase';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Generate dynamic metadata based on DB settings
export async function generateMetadata(): Promise<Metadata> {
  const { data } = await supabase.from('app_settings').select('site_favicon_url').eq('id', 1).single();
  
  return {
    title: "CVNova - AI Resume Builder",
    description: "Create professional, ATS-friendly CVs, Cover Letters, and Experience Letters in minutes.",
    icons: {
      icon: data?.site_favicon_url || '/favicon.ico',
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}