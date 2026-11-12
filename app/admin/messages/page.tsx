'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Mail, Trash2 } from 'lucide-react';

export default function AdminMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    const { data } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
    if (data) setMessages(data);
    setLoading(false);
  };

  const deleteMessage = async (id: string) => {
    if(!confirm("Delete this message?")) return;
    await supabase.from('contact_messages').delete().eq('id', id);
    fetchMessages();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Contact Messages</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Message</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {messages.map((msg) => (
              <tr key={msg.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-gray-500">{new Date(msg.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-medium text-gray-900">{msg.name}</td>
                <td className="px-6 py-4 text-gray-600">{msg.email}</td>
                <td className="px-6 py-4 text-gray-700">{msg.message}</td>
                <td className="px-6 py-4">
                  <button onClick={() => deleteMessage(msg.id)} className="text-red-500 hover:text-red-700 p-2 bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {messages.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No messages found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}