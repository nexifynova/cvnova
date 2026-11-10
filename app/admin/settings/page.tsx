'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Loader2, Upload, Plus, Trash2, ArrowUp, ArrowDown, Image as ImageIcon, Link as LinkIcon, IndianRupee, Package } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<any>({
    additional_cv_price: 1.00, cvs_per_price: 1, free_cv_limit: 6,
    package_3m_price: 5, package_6m_price: 8, package_1y_price: 12, package_5y_price: 40,
    easy_paisa_enabled: true, easy_paisa_number: '', easy_paisa_name: '',
    binance_enabled: true, binance_id: '', binance_name: '',
    bank_enabled: false, bank_name: '', bank_account_name: '', bank_branch: '', bank_account_number: '', bank_iban: '',
    site_logo_url: '', site_favicon_url: '', hero_images: [], hero_slider_interval: 4000, nav_menu: [],
  });

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from('app_settings').select('*').eq('id', 1).single();
    if (data) setSettings(data);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('app_settings').update({
      ...settings, updated_at: new Date().toISOString(),
    }).eq('id', 1);

    if (error) alert("Error: " + error.message);
    else alert("Settings Saved Successfully!");
    setSaving(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    let val: any = value;
    if (type === 'checkbox') val = (e.target as HTMLInputElement).checked;
    else if (type === 'number') val = parseFloat(value) || 0;
    setSettings({ ...settings, [name]: val });
  };

  const uploadFile = async (file: File, type: 'logo' | 'favicon' | 'hero') => {
    try {
      setUploading(type);
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('site-assets').upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('site-assets').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error: any) {
      alert("Upload error: " + error.message);
      return null;
    } finally { setUploading(null); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const url = await uploadFile(e.target.files[0], 'logo');
    if (url) setSettings({ ...settings, site_logo_url: url });
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const url = await uploadFile(e.target.files[0], 'favicon');
    if (url) setSettings({ ...settings, site_favicon_url: url });
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const url = await uploadFile(e.target.files[0], 'hero');
    if (url) setSettings({ ...settings, hero_images: [...(settings.hero_images || []), url] });
  };

  const removeHeroImage = (index: number) => {
    const newImages = [...(settings.hero_images || [])];
    newImages.splice(index, 1);
    setSettings({ ...settings, hero_images: newImages });
  };

  const addMenuItem = () => {
    setSettings({ ...settings, nav_menu: [...(settings.nav_menu || []), { id: Date.now().toString(), label: 'New Link', href: '/', visible: true }] });
  };
  const updateMenuItem = (index: number, key: string, value: any) => {
    const newMenu = [...(settings.nav_menu || [])]; newMenu[index] = { ...newMenu[index], [key]: value }; setSettings({ ...settings, nav_menu: newMenu });
  };
  const removeMenuItem = (index: number) => {
    const newMenu = [...(settings.nav_menu || [])]; newMenu.splice(index, 1); setSettings({ ...settings, nav_menu: newMenu });
  };
  const moveMenuItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === (settings.nav_menu?.length || 0) - 1) return;
    const newMenu = [...(settings.nav_menu || [])]; const temp = newMenu[index];
    newMenu[index] = newMenu[index + (direction === 'up' ? -1 : 1)]; newMenu[index + (direction === 'up' ? -1 : 1)] = temp;
    setSettings({ ...settings, nav_menu: newMenu });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={48} /></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans pb-20">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-100 transition"><ArrowLeft size={20} className="text-gray-600" /></Link>
            <h1 className="text-3xl font-bold text-gray-900">Website Settings</h1>
          </div>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 font-bold transition shadow-md disabled:opacity-50">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}{saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* BRANDING */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2">
            <h2 className="text-lg font-bold mb-4 border-b pb-2 flex items-center gap-2"><ImageIcon size={20} className="text-blue-600"/> Branding (Logo & Favicon)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="border p-4 rounded-xl flex flex-col items-center justify-center gap-3">
                <p className="text-sm font-semibold text-gray-700">Website Logo</p>
                {settings.site_logo_url ? <img src={settings.site_logo_url} alt="Logo" className="h-12 object-contain" /> : <div className="h-12 text-xs text-gray-400">No Logo</div>}
                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2">
                  {uploading === 'logo' ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}Upload Logo
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
              </div>
              <div className="border p-4 rounded-xl flex flex-col items-center justify-center gap-3">
                <p className="text-sm font-semibold text-gray-700">Favicon (Tab Icon)</p>
                {settings.site_favicon_url ? <img src={settings.site_favicon_url} alt="Favicon" className="h-10 object-contain" /> : <div className="h-10 text-xs text-gray-400">No Icon</div>}
                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2">
                  {uploading === 'favicon' ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}Upload Favicon
                  <input type="file" accept="image/*" className="hidden" onChange={handleFaviconUpload} />
                </label>
              </div>
            </div>
          </div>

          {/* HERO SLIDER */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2">
            <h2 className="text-lg font-bold mb-4 border-b pb-2 flex items-center gap-2"><ImageIcon size={20} className="text-purple-600"/> Hero Section Slider</h2>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Slider Speed (ms)</label>
              <input type="number" name="hero_slider_interval" value={settings.hero_slider_interval} onChange={handleChange} className="w-full max-w-xs px-4 py-2 rounded-lg border" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(settings.hero_images || []).map((img: string, idx: number) => (
                <div key={idx} className="relative group rounded-lg overflow-hidden border aspect-video">
                  <img src={img} alt={`Hero ${idx}`} className="w-full h-full object-cover" />
                  <button onClick={() => removeHeroImage(idx)} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-md opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                </div>
              ))}
              <label className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center aspect-video cursor-pointer hover:bg-gray-50">
                {uploading === 'hero' ? <Loader2 size={24} className="animate-spin text-blue-600" /> : <Plus size={24} className="text-gray-400" />}
                <span className="text-xs font-semibold text-gray-500 mt-2">Add Image</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleHeroUpload} />
              </label>
            </div>
          </div>

          {/* NAVBAR MENU */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-lg font-bold flex items-center gap-2"><LinkIcon size={20} className="text-green-600"/> Navbar Menu Links</h2>
              <button onClick={addMenuItem} className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-800"><Plus size={16} /> Add Link</button>
            </div>
            <div className="space-y-3">
              {(settings.nav_menu || []).map((menu: any, index: number) => (
                <div key={menu.id || index} className="flex flex-col sm:flex-row items-center gap-2 bg-gray-50 p-2 rounded-lg border">
                  <label className="flex items-center gap-2 shrink-0 px-2"><input type="checkbox" checked={menu.visible} onChange={(e) => updateMenuItem(index, 'visible', e.target.checked)} className="w-4 h-4" /><span className="text-xs text-gray-600">Show</span></label>
                  <input type="text" value={menu.label} onChange={(e) => updateMenuItem(index, 'label', e.target.value)} placeholder="Label" className="flex-1 px-3 py-1.5 rounded border text-sm w-full" />
                  <input type="text" value={menu.href} onChange={(e) => updateMenuItem(index, 'href', e.target.value)} placeholder="URL" className="flex-1 px-3 py-1.5 rounded border text-sm w-full" />
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => moveMenuItem(index, 'up')} className="p-1.5 bg-white border rounded text-gray-600 hover:bg-gray-100"><ArrowUp size={16} /></button>
                    <button onClick={() => moveMenuItem(index, 'down')} className="p-1.5 bg-white border rounded text-gray-600 hover:bg-gray-100"><ArrowDown size={16} /></button>
                    <button onClick={() => removeMenuItem(index)} className="p-1.5 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PRICING & PACKAGES */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2">
            <h2 className="text-lg font-bold mb-4 border-b pb-2 flex items-center gap-2"><IndianRupee size={20} className="text-orange-500"/> Pricing & Packages</h2>
            <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
              <h3 className="text-sm font-bold text-gray-800 mb-2">Additional CVs (For Free Users)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Price (USD)</label><input type="number" step="0.01" name="additional_cv_price" value={settings.additional_cv_price} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border" /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">How many CVs for this price?</label><input type="number" name="cvs_per_price" value={settings.cvs_per_price} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border" /></div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2"><Package size={16}/> Subscription Packages (Pricing)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">3 Months</label><input type="number" step="0.01" name="package_3m_price" value={settings.package_3m_price} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border" /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">6 Months</label><input type="number" step="0.01" name="package_6m_price" value={settings.package_6m_price} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border" /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">1 Year</label><input type="number" step="0.01" name="package_1y_price" value={settings.package_1y_price} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border" /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">5 Years</label><input type="number" step="0.01" name="package_5y_price" value={settings.package_5y_price} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border" /></div>
              </div>
            </div>
          </div>

          {/* OTHER SETTINGS */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2">
            <h2 className="text-lg font-bold mb-4 border-b pb-2 text-gray-500">Free Limits & Payment Methods</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Free CVs per User</label><input type="number" name="free_cv_limit" value={settings.free_cv_limit} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border" /></div>
            </div>
            <div className="space-y-4">
               <div className="p-4 border rounded-xl"><div className="flex items-center gap-2 mb-2"><input type="checkbox" name="easy_paisa_enabled" checked={settings.easy_paisa_enabled} onChange={handleChange} className="w-4 h-4"/><label className="text-sm font-bold">EasyPaisa</label></div><div className="grid grid-cols-2 gap-2"><input type="text" name="easy_paisa_number" value={settings.easy_paisa_number} onChange={handleChange} placeholder="Number" className="px-2 py-1 border rounded text-sm"/><input type="text" name="easy_paisa_name" value={settings.easy_paisa_name} onChange={handleChange} placeholder="Name" className="px-2 py-1 border rounded text-sm"/></div></div>
               <div className="p-4 border rounded-xl"><div className="flex items-center gap-2 mb-2"><input type="checkbox" name="binance_enabled" checked={settings.binance_enabled} onChange={handleChange} className="w-4 h-4"/><label className="text-sm font-bold">Binance</label></div><div className="grid grid-cols-2 gap-2"><input type="text" name="binance_id" value={settings.binance_id} onChange={handleChange} placeholder="Pay ID" className="px-2 py-1 border rounded text-sm"/><input type="text" name="binance_name" value={settings.binance_name} onChange={handleChange} placeholder="Name" className="px-2 py-1 border rounded text-sm"/></div></div>
               <div className="p-4 border rounded-xl"><div className="flex items-center gap-2 mb-2"><input type="checkbox" name="bank_enabled" checked={settings.bank_enabled} onChange={handleChange} className="w-4 h-4"/><label className="text-sm font-bold">Bank Transfer</label></div><div className="grid grid-cols-2 gap-2"><input type="text" name="bank_account_name" value={settings.bank_account_name} onChange={handleChange} placeholder="Account Holder" className="px-2 py-1 border rounded text-sm"/><input type="text" name="bank_account_number" value={settings.bank_account_number} onChange={handleChange} placeholder="Account Number" className="px-2 py-1 border rounded text-sm"/></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}