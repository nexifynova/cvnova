'use client';

import { useState } from 'react';
import { ArrowLeft, Save, Settings } from 'lucide-react';
import Link from 'next/link';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    freeCvLimit: 3,
    pricePerCv: 5,
    currency: 'USD',
    defaultTemplate: 'modern',
    enableAI: true,
    enableCoverLetter: true,
  });

  const handleSave = () => {
    alert("Settings Saved Successfully! (Demo)");
    // Baad mein yahan database mein save karenge
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-100 transition">
              <ArrowLeft size={20} className="text-gray-600" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
          </div>
          <button onClick={handleSave} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 font-bold transition shadow-md">
            <Save size={18} /> Save Changes
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Limits */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 border-b pb-2">
              <Settings size={20} className="text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">Free Limits</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Free CVs per User</label>
                <input type="number" value={settings.freeCvLimit} onChange={(e) => setSettings({...settings, freeCvLimit: parseInt(e.target.value)})} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 border-b pb-2">
              <Settings size={20} className="text-green-600" />
              <h2 className="text-lg font-bold text-gray-900">Pricing</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Price per Additional CV</label>
                <div className="flex gap-2">
                  <input type="number" value={settings.pricePerCv} onChange={(e) => setSettings({...settings, pricePerCv: parseInt(e.target.value)})} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-green-500 outline-none" />
                  <select value={settings.currency} onChange={(e) => setSettings({...settings, currency: e.target.value})} className="px-4 py-2 rounded-lg border bg-gray-50 outline-none">
                    <option value="USD">USD ($)</option>
                    <option value="PKR">PKR (Rs)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2">
            <div className="flex items-center gap-2 mb-4 border-b pb-2">
              <Settings size={20} className="text-purple-600" />
              <h2 className="text-lg font-bold text-gray-900">Feature Control</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition">
                <input type="checkbox" checked={settings.enableAI} onChange={(e) => setSettings({...settings, enableAI: e.target.checked})} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                <div><p className="font-semibold text-gray-900">Enable AI Generator</p><p className="text-xs text-gray-500">Allow users to generate summaries with AI</p></div>
              </label>
              <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition">
                <input type="checkbox" checked={settings.enableCoverLetter} onChange={(e) => setSettings({...settings, enableCoverLetter: e.target.checked})} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                <div><p className="font-semibold text-gray-900">Enable Cover Letters</p><p className="text-xs text-gray-500">Allow users to create cover letters</p></div>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          <p>CVNova Admin Panel v1.0 - All changes are demo only for now.</p>
        </div>
      </div>
    </div>
  );
}