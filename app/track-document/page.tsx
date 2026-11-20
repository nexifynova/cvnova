'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Loader2, ArrowLeft, Mail, Key, User, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function TrackDocument() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'email' | 'code'>('email');

  // States
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [shareCode, setShareCode] = useState('');
  
  // Results State
  const [documents, setDocuments] = useState<any[] | null>(null);

  const handleSearchByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setDocuments(null);
    try {
      const { data, error } = await supabase
        .from('generated_documents')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) {
        alert("No documents found for this email address.");
        return;
      }
      
      setDocuments(data);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !shareCode) {
      alert("Please enter both Full Name and Code.");
      return;
    }
    setLoading(true);
    setDocuments(null);
    try {
      const { data, error } = await supabase
        .from('generated_documents')
        .select('*')
        .eq('full_name', fullName)
        .eq('share_code', shareCode)
        .eq('is_shareable', true);

      if (error) throw error;
      if (!data || data.length === 0) {
        alert("Document not found. Please check your Full Name and Code.");
        return;
      }

      setDocuments(data);
    } catch (err: any) {
      alert("Document not found. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-white font-sans flex flex-col items-center py-20 px-4">
      
      <div className="w-full max-w-3xl mb-6">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition font-medium">
          <ArrowLeft size={18} /> Back to Home
        </Link>
      </div>

      <div className="bg-white/5 border border-white/10 p-8 rounded-3xl w-full max-w-3xl shadow-2xl backdrop-blur-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Track Your Document</h1>
          <p className="text-gray-400">Securely view and print your generated documents.</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-black/30 p-1 rounded-xl mb-6">
          <button
            onClick={() => { setActiveTab('email'); setDocuments(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition ${activeTab === 'email' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            <Mail size={18} /> By Email / Phone
          </button>
          <button
            onClick={() => { setActiveTab('code'); setDocuments(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition ${activeTab === 'code' ? 'bg-green-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            <Key size={18} /> By Name + Code
          </button>
        </div>

        {/* Email Form */}
        {activeTab === 'email' && (
          <form onSubmit={handleSearchByEmail} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-blue-500 text-white"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold transition flex justify-center items-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        )}

        {/* Code Form (Name + Code) */}
        {activeTab === 'code' && (
          <form onSubmit={handleSearchByCode} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Enter Full Name (as on document)"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-green-500 text-white"
                required
              />
            </div>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="6-digit secure code"
                value={shareCode}
                onChange={(e) => setShareCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full bg-black/30 border border-white/10 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-green-500 text-white uppercase tracking-widest font-mono"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-bold transition flex justify-center items-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        )}

        {/* Documents List Result */}
        {documents && documents.length > 0 && (
          <div className="mt-8 border-t border-white/10 pt-6">
            <h3 className="text-lg font-bold text-white mb-4">Your Documents</h3>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5 hover:border-white/20 transition">
                  <div>
                    <p className="text-white font-bold">{doc.full_name}</p>
                    <p className="text-xs text-gray-400">{doc.document_type} | {new Date(doc.created_at).toLocaleDateString()}</p>
                  </div>
                  <Link href={`/view/${doc.id}`} className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition">
                    <ExternalLink size={16} /> View
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}