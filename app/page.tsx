import Link from 'next/link';
import Image from 'next/image';
import { FileText, Sparkles, Download, CheckCircle, ArrowRight, Star, Mail, Briefcase } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0B1120] text-white flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      
      {/* Modern Navbar */}
      <nav className="bg-[#0B1120]/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-tr from-blue-500 to-purple-600 p-2 rounded-xl">
            <FileText className="text-white" size={20} />
          </div>
          <span className="text-2xl font-extrabold tracking-tight">CVNova</span>
        </div>
        
        {/* Naye Links yahan add kiye hain */}
        <div className="hidden md:flex gap-6 text-sm font-medium text-gray-300">
          <Link href="/builder" className="hover:text-white transition">CV Builder</Link>
          <Link href="/cover-letter" className="hover:text-white transition">Cover Letter</Link>
          <Link href="/experience-letter" className="hover:text-white transition">Experience Letter</Link>
        </div>

        <div className="flex gap-4 items-center">
          <Link href="/login" className="text-sm font-semibold text-gray-300 hover:text-white transition">Log in</Link>
          <Link href="/signup" className="bg-white text-[#0B1120] text-sm px-5 py-2.5 rounded-full hover:bg-gray-200 font-bold shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all transform hover:-translate-y-0.5">Get Started Free</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/30 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-purple-600/20 blur-[100px] rounded-full pointer-events-none"></div>

        <section className="max-w-7xl mx-auto px-6 py-20 lg:py-32 flex flex-col lg:flex-row items-center gap-16 relative z-10">
          
          {/* Left Text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-blue-300 px-4 py-1.5 rounded-full text-sm font-semibold mb-8 backdrop-blur-sm">
              <Sparkles size={16} className="text-yellow-400" />
              <span>AI-Powered Career Tools 2.0</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight">
              Career growth <br className="hidden lg:block"/> done <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">right.</span>
            </h1>
            <p className="mt-6 text-lg text-gray-400 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Create professional, ATS-friendly CVs, Cover Letters, and Experience Letters in minutes. Let our AI write your next career move.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/builder" className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full hover:from-blue-500 hover:to-purple-500 text-lg font-bold shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all transform hover:-translate-y-1">
                Build My CV Now <ArrowRight size={20} />
              </Link>
            </div>
          </div>

          {/* Right Image */}
          <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
            <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-2 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <Image 
                  src="/hero.png" 
                  alt="CVNova Professional Resume Builder" 
                  width={800} 
                  height={600} 
                  className="rounded-2xl w-full h-auto object-cover"
                  priority
                />
            </div>
          </div>
        </section>

        {/* Tools Section (3 Cards) */}
        <section id="features" className="py-24 relative z-10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-5xl font-bold mb-6">Everything you need <br/> to get <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">hired.</span></h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* CV Builder Card */}
              <Link href="/builder" className="group bg-white/5 p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition duration-300 cursor-pointer">
                <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/30 group-hover:scale-110 transition">
                  <FileText className="text-blue-400" size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3">CV Builder</h3>
                <p className="text-gray-400 leading-relaxed">Create a professional resume with 12+ modern templates and real-time preview.</p>
              </Link>
              
              {/* Cover Letter Card */}
              <Link href="/cover-letter" className="group bg-white/5 p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition duration-300 cursor-pointer">
                <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center mb-6 border border-green-500/30 group-hover:scale-110 transition">
                  <Mail className="text-green-400" size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3">Cover Letter</h3>
                <p className="text-gray-400 leading-relaxed">Stand out with a tailored cover letter that complements your CV perfectly.</p>
              </Link>
              
              {/* Experience Letter Card */}
              <Link href="/experience-letter" className="group bg-white/5 p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition duration-300 cursor-pointer">
                <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/30 group-hover:scale-110 transition">
                  <Briefcase className="text-purple-400" size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3">Experience Letter</h3>
                <p className="text-gray-400 leading-relaxed">Generate professional experience letters for your employees or yourself.</p>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-gray-500 relative z-10">
        <p>© 2026 CVNova. All rights reserved.</p>
      </footer>
    </div>
  );
}