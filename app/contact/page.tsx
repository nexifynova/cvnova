'use client';

import Navbar from '@/components/Navbar';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactUs() {
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
                  <p className="font-semibold">info@nexifynova.co.uk</p>
                  <p className="font-semibold">support@nexifynova.co.uk</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-green-500/20 p-3 rounded-full text-green-400"><Phone size={24} /></div>
                <div>
                  <p className="text-sm text-gray-400">Call Us</p>
                  <p className="font-semibold">+92 (300) 123-4567</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-purple-500/20 p-3 rounded-full text-purple-400"><MapPin size={24} /></div>
                <div>
                  <p className="text-sm text-gray-400">Location</p>
                  <p className="font-semibold">Karachi, Pakistan</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
            <h2 className="text-2xl font-bold mb-6">Send a Message</h2>
            <form className="space-y-4">
              <input type="text" placeholder="Your Name" className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500" />
              <input type="email" placeholder="Your Email" className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500" />
              <textarea rows={4} placeholder="Your Message" className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500"></textarea>
              <button type="button" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition">Send Message</button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}