'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Mail, Phone, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ContactUs() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('app_settings').select('*').eq('id', 1).single();
      if (data) setSettings(data);
    };
    fetchSettings();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Yahan aap apni API call laga sakte hain
    setTimeout(() => {
      alert("Message sent successfully! We will get back to you soon.");
      setFormData({ name: '', email: '', message: '' });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-white font-sans">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Get in Touch</h1>
          <p className="text-gray-400 text-lg">Have questions? We're here to help.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
            <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-500/20 p-3 rounded-full text-blue-400"><Mail size={24} /></div>
                <div>
                  <p className="text-sm text-gray-400">Email Us</p>
                  <p className="font-semibold">{settings?.contact_email1 || 'info@nexifynova.co.uk'}</p>
                  <p className="font-semibold">{settings?.contact_email2 || 'support@nexifynova.co.uk'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-green-500/20 p-3 rounded-full text-green-400"><Phone size={24} /></div>
                <div>
                  <p className="text-sm text-gray-400">Call / WhatsApp</p>
                  <p className="font-semibold">{settings?.contact_phone || '+92 (300) 123-4567'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-purple-500/20 p-3 rounded-full text-purple-400"><MapPin size={24} /></div>
                <div>
                  <p className="text-sm text-gray-400">Location</p>
                  <p className="font-semibold">{settings?.contact_location || 'Karachi, Pakistan'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
            <h2 className="text-2xl font-bold mb-6">Send a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" required placeholder="Your Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500" />
              <input type="email" required placeholder="Your Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500" />
              <textarea rows={4} required placeholder="Your Message" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500"></textarea>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition flex justify-center">
                {loading ? <Loader2 className="animate-spin" /> : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}