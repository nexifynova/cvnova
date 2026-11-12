'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, Loader2, ArrowLeft, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    packageType: '6 Months',
    amount: 8,
    paymentMethod: 'EasyPaisa',
    transactionId: '',
    slipFile: null as File | null
  });

  useEffect(() => {
    const getUserAndSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUser(user);

      const { data } = await supabase.from('app_settings').select('*').eq('id', 1).single();
      if (data) setSettings(data);
    };
    getUserAndSettings();
  }, [router]);

    const handlePackageChange = (e: any) => {
    const pkg = e.target.value;
    let amt = 8;
    if (pkg === '3 Months') amt = settings?.package_3m_price || 5;
    if (pkg === '6 Months') amt = settings?.package_6m_price || 8;
    if (pkg === '1 Year') amt = settings?.package_1y_price || 12;
    if (pkg === '5 Years') amt = settings?.package_5y_price || 40;
    if (pkg === 'Additional CVs') amt = settings?.additional_cv_price || 1.11; // Naya Option
    setFormData({ ...formData, packageType: pkg, amount: amt });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, slipFile: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.slipFile) { alert("Please upload payment slip"); return; }
    setLoading(true);

    try {
      const fileExt = formData.slipFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('payment-slips')
        .upload(fileName, formData.slipFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('payment-slips').getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('payments').insert([{
        user_id: user.id,
        user_email: user.email,
        package_type: formData.packageType,
        amount: formData.amount,
        payment_method: formData.paymentMethod,
        transaction_id: formData.transactionId,
        slip_url: urlData.publicUrl,
        status: 'pending'
      }]);

      if (dbError) throw dbError;

      setSuccess(true);
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center text-white p-4">
        <div className="bg-white/5 p-8 rounded-3xl border border-white/10 text-center max-w-md">
          <CheckCircle className="text-green-500 mx-auto mb-4" size={64} />
          <h2 className="text-2xl font-bold mb-2">Payment Submitted!</h2>
          <p className="text-gray-400 mb-4">Aapki slip admin ko bhej di gayi hai. Approve hone par aapka account Pro ho jayega.</p>
          <div className="bg-yellow-500/20 border border-yellow-500/30 p-4 rounded-xl mb-6 text-left">
            <p className="text-yellow-300 text-sm font-bold flex items-center gap-2 mb-1"><Clock size={16}/> Approval Time:</p>
            <p className="text-gray-300 text-xs">Admin aapki payment ko <b>30 minutes se 24 hours</b> ke andar approve karega. Approve hone par aapka account automatic Pro ban jayega.</p>
          </div>
          <Link href="/dashboard" className="inline-block bg-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition">Go to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-white p-6 font-sans">
      <div className="max-w-2xl mx-auto">
        <Link href="/#pricing" className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
          <ArrowLeft size={20} /> Back to Pricing
        </Link>
        
        <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
          <h1 className="text-3xl font-bold mb-2">Complete Your Payment</h1>
          <p className="text-gray-400 text-sm mb-6">Payment slip upload karein aur admin approval ka intezar karein.</p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Select Package</label>
                            <select value={formData.packageType} onChange={handlePackageChange} className="w-full bg-[#0B1120] border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500">
                <option value="3 Months">3 Months - ${settings?.package_3m_price}</option>
                <option value="6 Months">6 Months - ${settings?.package_6m_price}</option>
                <option value="1 Year">1 Year - ${settings?.package_1y_price}</option>
                <option value="5 Years">5 Years - ${settings?.package_5y_price}</option>
                {/* Naya Option Yahan Add Karein */}
                <option value="Additional CVs">Buy {settings?.cvs_per_price || 5} Extra CVs - ${settings?.additional_cv_price || 1.11}</option>
              </select>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl text-sm space-y-2">
              <p className="font-bold text-blue-300">Amount to Pay: ${formData.amount}</p>
              {settings?.easy_paisa_enabled && (
                <p>EasyPaisa: <span className="font-mono text-white">{settings.easy_paisa_number}</span> ({settings.easy_paisa_name})</p>
              )}
              {settings?.binance_enabled && (
                <p>Binance ID: <span className="font-mono text-white">{settings.binance_id}</span></p>
              )}
              {settings?.bank_enabled && (
                <>
                  <p>Bank: <span className="font-mono text-white">{settings.bank_name}</span></p>
                  <p>Account: <span className="font-mono text-white">{settings.bank_account_number}</span> ({settings.bank_account_name})</p>
                  {settings.bank_iban && <p>IBAN: <span className="font-mono text-white">{settings.bank_iban}</span></p>}
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Select Payment Method Used</label>
              <select value={formData.paymentMethod} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})} className="w-full bg-[#0B1120] border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500">
                {settings?.easy_paisa_enabled && <option value="EasyPaisa">EasyPaisa</option>}
                {settings?.binance_enabled && <option value="Binance">Binance</option>}
                {settings?.bank_enabled && <option value="Bank">Bank Transfer</option>}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Transaction ID / TID (Optional)</label>
              <input type="text" placeholder="e.g. 123456789" value={formData.transactionId} onChange={(e) => setFormData({...formData, transactionId: e.target.value})} className="w-full bg-[#0B1120] border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Upload Payment Slip (Screenshot)</label>
              <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-blue-500 transition relative">
                <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-sm text-gray-400">{formData.slipFile ? formData.slipFile.name : 'Click or drag to upload image'}</p>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl">
              <p className="text-yellow-300 text-sm font-bold flex items-center gap-2 mb-1"><AlertCircle size={16}/> Important Note:</p>
              <p className="text-gray-400 text-xs">Payment submit karne ke baad admin aapki slip ko <b>30 minutes se 24 hours</b> ke andar verify karega. Approve hone par aapka account automatic Pro mein convert ho jayega aur aap unlimited documents bana sakenge.</p>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold hover:from-blue-500 hover:to-purple-500 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" /> : 'Submit Payment Proof'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}