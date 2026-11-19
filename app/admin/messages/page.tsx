'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Mail, Trash2, Reply, X, Send, CheckCircle2 } from 'lucide-react';

export default function AdminMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Reply Modal State
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [replySubject, setReplySubject] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    const { data } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
    if (data) setMessages(data);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    // Update local state for instant UI feedback
    setMessages(messages.map(m => m.id === id ? { ...m, is_read: true } : m));
    // Update database
    await supabase.from('contact_messages').update({ is_read: true }).eq('id', id);
  };

  const deleteMessage = async (id: string) => {
    if(!confirm("Delete this message?")) return;
    await supabase.from('contact_messages').delete().eq('id', id);
    fetchMessages();
  };

  const openReplyModal = (msg: any) => {
    setSelectedMessage(msg);
    setReplySubject(`Re: Inquiry from ${msg.name}`);
    setReplyBody(`Hi ${msg.name},\n\nThank you for reaching out to CVNova. \n\n(Write your reply here...)\n\nBest regards,\nCVNova Support Team`);
    setIsReplyModalOpen(true);
    
    // Mark as read when opened for reply
    if (!msg.is_read) markAsRead(msg.id);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage) return;
    setSendingReply(true);

    try {
      const htmlBody = replyBody.replace(/\n/g, '<br/>');
      
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedMessage.email,
          subject: replySubject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
              <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2563eb;">
                <p style="font-size: 12px; color: #64748b; margin: 0;">Original Message:</p>
                <p style="font-size: 13px; font-style: italic; color: #475569; margin-top: 5px;">"${selectedMessage.message}"</p>
              </div>
              <div style="line-height: 1.6;">
                ${htmlBody}
              </div>
            </div>
          `
        })
      });

      if (!res.ok) throw new Error('Failed to send email');

      alert("Reply sent successfully!");
      setIsReplyModalOpen(false);
    } catch (error: any) {
      alert("Error sending reply: " + error.message);
    } finally {
      setSendingReply(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        Support Messages
      </h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Message</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {messages.map((msg) => (
              <tr 
                key={msg.id} 
                className={`transition-colors ${msg.is_read ? 'hover:bg-gray-50 bg-white' : 'bg-blue-50/30 hover:bg-blue-50/50'}`}
                onClick={() => { if(!msg.is_read) markAsRead(msg.id); }}
              >
                <td className="px-6 py-4">
                  {msg.is_read ? (
                    <CheckCircle2 className="text-gray-300" size={18} />
                  ) : (
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" title="Unread Message"></div>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{new Date(msg.created_at).toLocaleDateString()}</td>
                <td className={`px-6 py-4 ${msg.is_read ? 'font-medium text-gray-700' : 'font-bold text-gray-900'}`}>{msg.name}</td>
                <td className="px-6 py-4 text-gray-600">{msg.email}</td>
                <td className={`px-6 py-4 max-w-xs truncate ${msg.is_read ? 'text-gray-500' : 'text-gray-900 font-medium'}`}>{msg.message}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); openReplyModal(msg); }} 
                      className="text-blue-600 hover:text-blue-800 p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                      title="Reply via Email"
                    >
                      <Reply size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id); }} 
                      className="text-red-500 hover:text-red-700 p-2 bg-red-50 hover:bg-red-100 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {messages.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No messages found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Reply Modal */}
      {isReplyModalOpen && selectedMessage && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Mail size={20} className="text-blue-600" /> Reply to {selectedMessage.name}
              </h2>
              <button onClick={() => setIsReplyModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSendReply} className="p-6 flex-1 flex flex-col">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">To:</label>
                <input type="text" value={selectedMessage.email} disabled className="w-full px-3 py-2 bg-gray-100 border rounded-lg text-sm text-gray-500 cursor-not-allowed" />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Subject:</label>
                <input 
                  type="text" 
                  value={replySubject} 
                  onChange={(e) => setReplySubject(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  required
                />
              </div>
              
              <div className="mb-6 flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Message:</label>
                <textarea 
                  value={replyBody} 
                  onChange={(e) => setReplyBody(e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" 
                  required
                ></textarea>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsReplyModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={sendingReply}
                  className="px-5 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {sendingReply ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} 
                  {sendingReply ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}