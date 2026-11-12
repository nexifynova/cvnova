'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FileText, Sparkles, ArrowRight, Mail, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

export default function Home() {
  const [settings, setSettings] = useState<any>(null);
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 4000, stopOnInteraction: false })]);
  
  const scrollPrev = useCallback(() => { if (emblaApi) emblaApi.scrollPrev(); }, [emblaApi]);
  const scrollNext = useCallback(() => { if (emblaApi) emblaApi.scrollNext(); }, [emblaApi]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from('app_settings').select('*').eq('id', 1).single();
    if (data) {
      setSettings(data);
      if (emblaApi) {
        const autoplay = emblaApi.plugins().autoplay;
        if (autoplay) autoplay.options.delay = data.hero_slider_interval || 4000;
      }
    }
  };

  if (!settings) return <div className="min-h-screen bg-[#0B1120]" />;

  const heroImages = settings.hero_images && settings.hero_images.length > 0 ? settings.hero_images : [];

  return (
    <div className="min-h-screen bg-[#0B1120] text-white flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      
      <Navbar />

      <main className="flex-grow relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/30 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-purple-600/20 blur-[100px] rounded-full pointer-events-none"></div>

        <section className="max-w-7xl mx-auto px-6 py-20 lg:py-32 flex flex-col lg:flex-row items-center gap-16 relative z-10">
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

          <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
            {/* Badge ko slider ke bahar rakha hai taake cut na ho */}
            <Link href="/payment" className="absolute -top-6 -right-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-black w-24 h-24 rounded-full flex flex-col items-center justify-center font-bold shadow-[0_0_30px_rgba(250,204,21,0.8)] animate-bounce z-30 border-4 border-[#0B1120]">
              <span className="text-[10px] uppercase tracking-wider">Special</span>
              <span className="text-xl leading-none">Offer</span>
              <span className="text-[9px] mt-1 bg-black text-white px-2 py-0.5 rounded">Buy Now</span>
            </Link>

            <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-2 transform rotate-2 hover:rotate-0 transition-transform duration-500">
              {heroImages.length > 0 ? (
                <div className="overflow-hidden rounded-2xl relative group" ref={emblaRef}>
                  <div className="flex">
                    {heroImages.map((img: string, index: number) => (
                      <div key={index} className="flex-[0_0_100%] min-w-0 relative aspect-[4/3]">
                        <Image src={img} alt={`CVNova Slide ${index + 1}`} fill className="object-cover" priority={index === 0} />
                      </div>
                    ))}
                  </div>
                  {heroImages.length > 1 && (
                    <>
                      <button onClick={scrollPrev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition z-10"><ChevronLeft size={20} /></button>
                      <button onClick={scrollNext} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition z-10"><ChevronRight size={20} /></button>
                    </>
                  )}
                </div>
              ) : (
                <div className="w-full aspect-[4/3] rounded-2xl bg-gradient-to-br from-blue-900/50 to-purple-900/50 flex items-center justify-center border border-white/10">
                  <p className="text-gray-400 text-sm font-medium">Upload images from Admin Settings</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="features" className="py-24 relative z-10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-5xl font-bold mb-6">Everything you need <br/> to get <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">hired.</span></h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/builder" className="group bg-white/5 p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition duration-300 cursor-pointer">
                <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/30 group-hover:scale-110 transition"><FileText className="text-blue-400" size={28} /></div>
                <h3 className="text-xl font-bold mb-3">CV Builder</h3>
                <p className="text-gray-400 leading-relaxed">Create a professional resume with 19+ modern templates and real-time preview.</p>
              </Link>
              <Link href="/cover-letter" className="group bg-white/5 p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition duration-300 cursor-pointer">
                <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center mb-6 border border-green-500/30 group-hover:scale-110 transition"><Mail className="text-green-400" size={28} /></div>
                <h3 className="text-xl font-bold mb-3">Cover Letter</h3>
                <p className="text-gray-400 leading-relaxed">Stand out with a tailored cover letter that complements your CV perfectly.</p>
              </Link>
              <Link href="/experience-letter" className="group bg-white/5 p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition duration-300 cursor-pointer">
                <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/30 group-hover:scale-110 transition"><Briefcase className="text-purple-400" size={28} /></div>
                <h3 className="text-xl font-bold mb-3">Experience Letter</h3>
                <p className="text-gray-400 leading-relaxed">Generate professional experience letters for your employees or yourself.</p>
              </Link>
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" className="py-24 relative z-10 bg-black/20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-5xl font-bold mb-6">Simple, transparent <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">pricing.</span></h2>
              <p className="text-gray-400 max-w-2xl mx-auto mb-6">Choose the plan that fits your needs. No hidden fees.</p>
              
              {/* Payment Gateways Info */}
              <div className="flex flex-wrap justify-center gap-4 items-center mb-10">
                <span className="text-sm text-gray-400">We accept:</span>
                {settings?.easy_paisa_enabled && <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold border border-white/20">EasyPaisa</span>}
                {settings?.binance_enabled && <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold border border-white/20">Binance</span>}
                {settings?.bank_enabled && <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold border border-white/20">Bank Transfer</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {/* 3 Months */}
              <div className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:border-blue-500/50 transition duration-300 relative">
                <h3 className="text-xl font-bold mb-2">3 Months</h3>
                <p className="text-gray-400 text-sm mb-6">Perfect for a quick job search.</p>
                <div className="text-4xl font-extrabold mb-6">${settings.package_3m_price}</div>
                <Link href="/payment" className="w-full flex items-center justify-center bg-white/10 text-white px-4 py-3 rounded-xl hover:bg-white/20 font-bold transition">Upgrade</Link>
              </div>

              {/* 6 Months */}
              <div className="bg-gradient-to-b from-blue-900/40 to-purple-900/40 p-8 rounded-3xl border border-blue-500/50 transition duration-300 relative transform lg:-translate-y-4 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-4 py-1 rounded-full">MOST POPULAR</div>
                <h3 className="text-xl font-bold mb-2">6 Months</h3>
                <p className="text-blue-200 text-sm mb-6">Best value for serious professionals.</p>
                <div className="text-4xl font-extrabold mb-6">${settings.package_6m_price}</div>
                <Link href="/payment" className="w-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-xl hover:from-blue-500 hover:to-purple-500 font-bold transition shadow-lg">Upgrade</Link>
              </div>

              {/* 1 Year */}
              <div className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:border-blue-500/50 transition duration-300 relative">
                <h3 className="text-xl font-bold mb-2">1 Year</h3>
                <p className="text-gray-400 text-sm mb-6">Long-term career growth plan.</p>
                <div className="text-4xl font-extrabold mb-6">${settings.package_1y_price}</div>
                <Link href="/payment" className="w-full flex items-center justify-center bg-white/10 text-white px-4 py-3 rounded-xl hover:bg-white/20 font-bold transition">Upgrade</Link>
              </div>

              {/* 5 Years */}
              <div className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:border-blue-500/50 transition duration-300 relative">
                <h3 className="text-xl font-bold mb-2">5 Years</h3>
                <p className="text-gray-400 text-sm mb-6">Lifetime access for experts.</p>
                <div className="text-4xl font-extrabold mb-6">${settings.package_5y_price}</div>
                <Link href="/payment" className="w-full flex items-center justify-center bg-white/10 text-white px-4 py-3 rounded-xl hover:bg-white/20 font-bold transition">Upgrade</Link>
              </div>
            </div>

            {/* Additional CVs Box */}
            <div className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:border-blue-500/50 transition duration-300 relative max-w-md mx-auto">
              <h3 className="text-xl font-bold mb-2">Need Extra CVs?</h3>
              <p className="text-gray-400 text-sm mb-6">Buy extra CV downloads without a subscription.</p>
              <div className="text-4xl font-extrabold mb-6">
                ${settings.additional_cv_price} <span className="text-sm font-normal text-gray-400">for {settings.cvs_per_price} CVs</span>
              </div>
              <Link href="/payment" className="w-full flex items-center justify-center bg-white/10 text-white px-4 py-3 rounded-xl hover:bg-white/20 font-bold transition">
                Buy Extra CVs
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-gray-500 relative z-10">
        <p className="text-white text-lg font-bold mb-4">This project presented and designed by <span className="text-blue-400">Nexify Nova</span></p>
        
        <div className="flex flex-col items-center justify-center gap-2 mb-6 text-gray-400">
          <p>Website: <a href="https://www.nexifynova.co.uk" target="_blank" className="text-blue-400 hover:underline">www.nexifynova.co.uk</a></p>
          <p>UK-Address: Berkeley square House, London W1J 6JD</p>
          <p>Cell Number / WhatsApp (UK & Intl): <a href="https://wa.me/447564920084" className="text-green-400 hover:underline">+44 7564 920084</a></p>
          <p>For Pakistan: <a href="https://wa.me/923493709850" className="text-green-400 hover:underline">+92 349 3709850</a></p>
        </div>

        <p className="text-xs text-gray-600">© 2026 CVNova. All rights reserved.</p>
      </footer>
    </div>
  );
}