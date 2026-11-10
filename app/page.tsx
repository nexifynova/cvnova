'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Settings, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({
    easy_paisa_enabled: true,
    easy_paisa_number: '',
    easy_paisa_name: '',
    binance_enabled: true,
    binance_id: '',
    binance_name: '',
    bank_enabled: false,
    bank_name: '',
    bank_account_name: '',
    bank_branch: '',
    bank_account_number: '',
    bank_iban: '',
    package_3m_price: 5,
    package_6m_price: 8,
    package_1y_price: 12,
    package_5y_price: 40,
    additional_cv_price: 1.00,
    cvs_per_dollar: 1,
    free_cv_limit: 6,
    enable_ai: true,
    enable_cover_letter: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from('app_settings').select('*').eq('id', 1).single();
    if (data) setSettings(data);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('app_settings').update({
      ...settings,
      updated_at: new Date().toISOString(),
    }).eq('id', 1);

    if (error) {
      alert("Error saving settings: " + error.message);
    } else {
      alert("Settings Saved Successfully!");
    }
    setSaving(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setSettings({ ...settings, [name]: val });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={48} /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {/* Back Button Fixed */}
            <button onClick={() => window.history.back()} className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-100 transition">
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
          </div>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 font-bold transition shadow-md disabled:opacity-50">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Limits */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 border-b pb-2"><Settings size={20} className="text-blue-600" /><h2 className="text-lg font-bold">Free Limits</h2></div>
            <div className="space-y-4">
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Free CVs per User</label><input type="number" name="free_cv_limit" value={settings.free_cv_limit} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border" /></div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 border-b pb-2"><Settings size={20} className="text-green-600" /><h2 className="text-lg font-bold">Pricing</h2></div>
            <div className="space-y-4">
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Additional CV Price (USD)</label><input type="number" step="0.01" name="additional_cv_price" value={settings.additional_cv_price} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border" /></div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">CVs per {settings.additional_cv_price} USD</label>
                <input type="number" name="cvs_per_dollar" value={settings.cvs_per_dollar} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border" />
                <p className="text-xs text-gray-500 mt-1">Yani {settings.additional_cv_price}$ mein kitni CVs milengi.</p>
              </div>
            </div>
          </div>

          {/* Packages */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2">
            <div className="flex items-center gap-2 mb-4 border-b pb-2"><Settings size={20} className="text-orange-600" /><h2 className="text-lg font-bold">Package Pricing (USD)</h2></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">3 Months</label><input type="number" step="0.01" name="package_3m_price" value={settings.package_3m_price} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">6 Months</label><input type="number" step="0.01" name="package_6m_price" value={settings.package_6m_price} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">1 Year</label><input type="number" step="0.01" name="package_1y_price" value={settings.package_1y_price} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">5 Years</label><input type="number" step="0.01" name="package_5y_price" value={settings.package_5y_price} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border" /></div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2">
            <div className="flex items-center gap-2 mb-4 border-b pb-2"><Settings size={20} className="text-purple-600" /><h2 className="text-lg font-bold">Payment Methods</h2></div>
            <div className="space-y-6">
              {/* EasyPaisa */}
              <div className="border rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2"><input type="checkbox" name="easy_paisa_enabled" checked={settings.easy_paisa_enabled} onChange={handleChange} className="w-5 h-5" /><label className="font-bold text-gray-800">EasyPaisa</label></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs text-gray-500 mb-1">Account Number</label><input type="text" name="easy_paisa_number" value={settings.easy_paisa_number} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Account Name</label><input type="text" name="easy_paisa_name" value={settings.easy_paisa_name} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border" /></div>
                </div>
              </div>
              
              {/* Binance */}
              <div className="border rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2"><input type="checkbox" name="binance_enabled" checked={settings.binance_enabled} onChange={handleChange} className="w-5 h-5" /><label className="font-bold text-gray-800">Binance (Crypto)</label></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs text-gray-500 mb-1">Pay ID</label><input type="text" name="binance_id" value={settings.binance_id} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Account Name</label><input type="text" name="binance_name" value={settings.binance_name} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border" /></div>
                </div>
              </div>

              {/* Bank */}
              <div className="border rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2"><input type="checkbox" name="bank_enabled" checked={settings.bank_enabled} onChange={handleChange} className="w-5 h-5" /><label className="font-bold text-gray-800">Bank Transfer</label></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-xs text-gray-500 mb-1">Account Holder Name</label><input type="text" name="bank_account_name" value={settings.bank_account_name} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Bank Name</label><input type="text" name="bank_name" value={settings.bank_name} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Branch</label><input type="text" name="bank_branch" value={settings.bank_branch} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Account Number</label><input type="text" name="bank_account_number" value={settings.bank_account_number} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border" /></div>
                  <div className="sm:col-span-2"><label className="block text-xs text-gray-500 mb-1">IBAN (Optional)</label><input type="text" name="bank_iban" value={settings.bank_iban} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border" /></div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Control */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2">
            <div className="flex items-center gap-2 mb-4 border-b pb-2"><Settings size={20} className="text-blue-600" /><h2 className="text-lg font-bold">Feature Control</h2></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition">
                <input type="checkbox" name="enable_ai" checked={settings.enable_ai} onChange={handleChange} className="w-5 h-5" />
                <div><p className="font-semibold text-gray-900">Enable AI Generator</p><p className="text-xs text-gray-500">Allow users to generate summaries with AI</p></div>
              </label>
              <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition">
                <input type="checkbox" name="enable_cover_letter" checked={settings.enable_cover_letter} onChange={handleChange} className="w-5 h-5" />
                <div><p className="font-semibold text-gray-900">Enable Cover Letters</p><p className="text-xs text-gray-500">Allow users to create cover letters</p></div>
              </label>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}