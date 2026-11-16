'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Loader2, ArrowLeft, FileText, Key, Mail, User } from 'lucide-react';
import Link from 'next/link';

export default function TrackDocument() {
  const [searchMode, setSearchMode] = useState<'contact' | 'code'>('contact');
  const [searchQuery, setSearchQuery] = useState(''); // For Email/Phone
  const [searchName, setSearchName] = useState(''); // For Name + Code
  const [searchCode, setSearchCode] = useState(''); // For Name + Code
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<any[] | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    setDocuments(null);

    if (searchMode === 'contact') {
      if (!searchQuery.trim()) { setLoading(false); return; }
      
      // Search by Email or Phone
      const { data, error } = await supabase
        .from('generated_documents')
        .select('*')
        .or(`email.eq.${searchQuery.trim()},phone.eq.${searchQuery.trim()}`)
        .order('created_at', { ascending: false });

      if (!error && data) setDocuments(data);
      else setDocuments([]);
    } else {
      // Search by Name + Share Code
      if (!searchCode.trim() || searchCode.length !== 4) {
        alert("Please enter a valid 4-digit share code.");
        setLoading(false);
        return;
      }
      if (!searchName.trim()) {
        alert("Please enter the name that was on the document.");
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('generated_documents')
        .select('*')
        // ILIKE ka matlab hai case-insensitive (Faisal aur faisal dono chalega)
        .ilike('full_name', searchName.trim()) 
        .eq('share_code', searchCode.trim())
        .eq('is_shareable', true)
        .order('created_at', { ascending: false });

      if (!error && data) setDocuments(data);
      else setDocuments([]);
    }
    
    setLoading(false);
  };

  const handleReset = () => {
    setSearched(false);
    setDocuments(null);
    setSearchQuery('');
    setSearchName('');
    setSearchCode('');
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-white p-6 font-sans">
      <div className="max-w-3xl mx-auto pt-10">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 w-fit">
          <ArrowLeft size={20} /> Back to Home
        </Link>
        
        <div className="bg-white/5 p-8 rounded-3xl border border-white/10 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Track Your Document</h1>
            <p className="text-gray-400 text-sm">Securely view and print your generated documents.</p>
          </div>

          {!searched ? (
            <div className="space-y-6">
              {/* Tabs */}
              <div className="flex bg-black/30 p-1 rounded-xl">
                <button 
                  onClick={() => { setSearchMode('contact'); setSearchQuery(''); setSearchName(''); setSearchCode(''); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition ${searchMode === 'contact' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                >
                  <Mail size={16} /> By Email / Phone
                </button>
                <button 
                  onClick={() => { setSearchMode('code'); setSearchQuery(''); setSearchName(''); setSearchCode(''); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition ${searchMode === 'code' ? 'bg-green-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                >
                  <Key size={16} /> By Name + Code
                </button>
              </div>

              {/* Search Form */}
              <form onSubmit={handleSearch} className="space-y-4">
                {searchMode === 'contact' ? (
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                      type="text" 
                      required
                      placeholder="Enter your email or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#0B1120] border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-[2]">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input 
                        type="text" 
                        required
                        placeholder="Enter Full Name (as on document)"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        className="w-full bg-[#0B1120] border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white outline-none focus:border-green-500"
                      />
                    </div>
                    <div className="relative flex-1">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input 
                        type="text" 
                        required
                        placeholder="4-digit code"
                        value={searchCode}
                        onChange={(e) => setSearchCode(e.target.value.replace(/\D/g, '').slice(0,4))}
                        maxLength={4}
                        className="w-full bg-[#0B1120] border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white outline-none focus:border-green-500 font-mono tracking-widest"
                      />
                    </div>
                  </div>
                )}
                
                <button type="submit" disabled={loading} className={`w-full py-3 rounded-xl font-bold transition flex items-center justify-center ${searchMode === 'code' ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
                  {loading ? <Loader2 size={20} className="animate-spin" /> : 'Search'}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-lg font-bold">Search Results</h2>
                <button onClick={handleReset} className="text-sm font-semibold text-blue-400 hover:text-blue-300">Search Again</button>
              </div>

              {loading ? (
                 <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
              ) : documents && documents.length > 0 ? (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="bg-black/30 p-5 rounded-xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-white/20 transition">
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-500/20 p-3 rounded-full text-blue-400"><FileText size={24} /></div>
                        <div>
                          <p className="font-bold text-white text-lg">{doc.full_name}</p>
                          <p className="text-sm text-gray-400">{doc.document_type} <span className="mx-1">•</span> {new Date(doc.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Link href={`/view/${doc.id}`} target="_blank" className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition">
                          <Search size={16} /> View Document
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400 bg-black/20 rounded-xl">
                  <FileText size={48} className="mx-auto mb-3 text-gray-600" />
                  <p>No documents found.</p>
                  <p className="text-xs mt-1">Please check the details and try again.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}