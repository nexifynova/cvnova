import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CVNova - AI Resume & Document Builder",
  description: "Create professional, ATS-friendly CVs, Cover Letters, and Experience Letters in minutes. Built by NexifyNova.",
  keywords: ["CV Builder", "Resume Maker", "Cover Letter", "Experience Letter", "AI CV", "Pakistan Resume"],
  authors: [{ name: "NexifyNova", url: "https://www.nexifynova.co.uk" }],
  openGraph: {
    title: "CVNova - Build Your Dream Career",
    description: "Create professional, ATS-friendly CVs, Cover Letters, and Experience Letters in minutes.",
    url: "https://cvnova-one.vercel.app",
    siteName: "CVNova",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CVNova - AI Resume Builder",
    description: "Create professional documents in minutes.",
  },
  icons: {
    icon: '/favicon.ico', 
  },
};

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