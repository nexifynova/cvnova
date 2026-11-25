'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, Loader2, ArrowLeft, CheckCircle, Clock, AlertCircle, Globe, Crown } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CURRENCIES, detectCurrency, formatLocal, getCurrency } from '@/lib/currency';

const PACKAGE_KEYS = ['3 Months', '6 Months', '1 Year', '5 Years', 'Additional CVs', 'Reactivation'] as const;
type PackageKey = (typeof PACKAGE_KEYS)[number];

// Single price resolver so the dropdown, the amount box and the stored record
// can never disagree.
function packagePrice(pkg: PackageKey, settings: any): number {
  if (!settings) return 0;
  switch (pkg) {
    case '3 Months': return Number(settings.package_3m_price) || 5;
    case '6 Months': return Number(settings.package_6m_price) || 8;
    case '1 Year': return Number(settings.package_1y_price) || 12;
    case '5 Years': return Number(settings.package_5y_price) || 40;
    case 'Additional CVs': return Number(settings.additional_cv_price) || 1;
    case 'Reactivation': return Number(settings.reactivation_price) || 2;
    default: return 0;
  }
}

// Only rails the admin has switched on are offered.
function paymentMethods(settings: any) {
  const methods: { value: string; label: string }[] = [];
  if (settings?.skrill_enabled) methods.push({ value: 'Skrill', label: 'Skrill' });
  if (settings?.payoneer_enabled) methods.push({ value: 'Payoneer', label: 'Payoneer' });
  if (settings?.easy_paisa_enabled) methods.push({ value: 'EasyPaisa', label: 'EasyPaisa' });
  if (settings?.binance_enabled) methods.push({ value: 'Binance', label: 'Binance' });
  if (settings?.bank_enabled) methods.push({ value: 'Bank', label: 'Bank Transfer' });
  return methods;
}

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedPackage = (searchParams.get('package') || '6 Months') as PackageKey;

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [currency, setCurrency] = useState('USD');
  
  const [formData, setFormData] = useState({
    packageType: (PACKAGE_KEYS.includes(requestedPackage) ? requestedPackage : '6 Months') as PackageKey,
    amount: 8,
    paymentMethod: 'EasyPaisa',
    transactionId: '',
    slipFile: null as File | null
  });

  useEffect(() => {
    setCurrency(detectCurrency());
  }, []);

  useEffect(() => {
    const getUserAndSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUser(user);

      const { data } = await supabase.from('app_settings').select('*').eq('id', 1).single();
      if (data) {
        setSettings(data);
        const pkg = PACKAGE_KEYS.includes(requestedPackage) ? requestedPackage : '6 Months';
        const methods = paymentMethods(data);
        setFormData((prev) => ({
          ...prev,
          packageType: pkg,
          amount: packagePrice(pkg, data) || prev.amount,
          paymentMethod: methods.some((m) => m.value === prev.paymentMethod) ? prev.paymentMethod : (methods[0]?.value || 'EasyPaisa'),
        }));
      }
    };
    getUserAndSettings();
  }, [router, requestedPackage]);

  const methods = paymentMethods(settings);
  const isReactivation = formData.packageType === 'Reactivation';

  const handlePackageChange = (e: any) => {
    const pkg = e.target.value as PackageKey;
    setFormData({ ...formData, packageType: pkg, amount: packagePrice(pkg, settings) });
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
          <p className="text-gray-400 mb-4">Your slip has been sent to the admin. Your account becomes Pro as soon as it is approved.</p>
          <div className="bg-yellow-500/20 border border-yellow-500/30 p-4 rounded-xl mb-6 text-left">
            <p className="text-yellow-300 text-sm font-bold flex items-center gap-2 mb-1"><Clock size={16}/> Approval Time:</p>
            <p className="text-gray-300 text-xs">The admin will approve your payment within <b>30 minutes to 24 hours</b>. Your account is upgraded to Pro automatically on approval.</p>
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
          <p className="text-gray-400 text-sm mb-6">Use one of the methods below to pay, then upload your slip.</p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Select Package</label>
              <select value={formData.packageType} onChange={handlePackageChange} className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 appearance-none cursor-pointer">
                <option value="3 Months">3 Months - ${packagePrice('3 Months', settings)}</option>
                <option value="6 Months">6 Months - ${packagePrice('6 Months', settings)}</option>
                <option value="1 Year">1 Year - ${packagePrice('1 Year', settings)}</option>
                <option value="5 Years">5 Years - ${packagePrice('5 Years', settings)}</option>
                <option value="Additional CVs">Buy {settings?.cvs_per_price || 5} Extra CVs - ${packagePrice('Additional CVs', settings)}</option>
                <option value="Reactivation">Account Reactivation - ${packagePrice('Reactivation', settings)}</option>
              </select>
            </div>

            {isReactivation && (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <Crown className="mt-0.5 shrink-0 text-emerald-300" size={18} />
                <p className="text-xs text-emerald-100">
                  <strong className="block text-sm text-emerald-200">One-time reactivation</strong>
                  Unlocks document creation again, unlocks all 25 templates and resets the free Blue ATS counter — no subscription, no recurring charge.
                </p>
              </div>
            )}

            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl text-sm space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold text-blue-300">Amount to Pay: ${formData.amount} USD</p>
                <label className="flex items-center gap-1 text-[11px] text-gray-300">
                  <Globe size={12} />
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="rounded-md border border-white/20 bg-black/40 px-2 py-1 text-[11px] text-white outline-none">
                    {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select>
                </label>
              </div>
              {currency !== 'USD' && (
                <p className="text-xs text-blue-200">
                  ≈ {formatLocal(formData.amount, settings, currency)} at today's rate ({getCurrency(currency).name}). Send the USD amount above — the local figure is for reference only.
                </p>
              )}
              <p className="text-gray-400">Please transfer the exact amount to any of these accounts:</p>
              {settings?.skrill_enabled && (
                <p className="text-white">Skrill: <span className="font-mono bg-white/10 px-2 py-0.5 rounded">{settings.skrill_email}</span>{settings.skrill_name ? ` (${settings.skrill_name})` : ''}</p>
              )}
              {settings?.payoneer_enabled && (
                <p className="text-white">Payoneer: <span className="font-mono bg-white/10 px-2 py-0.5 rounded">{settings.payoneer_email}</span>{settings.payoneer_name ? ` (${settings.payoneer_name})` : ''}</p>
              )}
              {settings?.easy_paisa_enabled && (
                <p className="text-white">EasyPaisa: <span className="font-mono bg-white/10 px-2 py-0.5 rounded">{settings.easy_paisa_number}</span> ({settings.easy_paisa_name})</p>
              )}
              {settings?.binance_enabled && (
                <p className="text-white">Binance ID: <span className="font-mono bg-white/10 px-2 py-0.5 rounded">{settings.binance_id}</span></p>
              )}
              {settings?.bank_enabled && (
                <>
                  <p className="text-white">Bank: <span className="font-mono bg-white/10 px-2 py-0.5 rounded">{settings.bank_name}</span></p>
                  <p className="text-white">Account: <span className="font-mono bg-white/10 px-2 py-0.5 rounded">{settings.bank_account_number}</span> ({settings.bank_account_name})</p>
                  {settings.bank_iban && <p className="text-white">IBAN: <span className="font-mono bg-white/10 px-2 py-0.5 rounded">{settings.bank_iban}</span></p>}
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Which method did you use?</label>
              <select value={formData.paymentMethod} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})} className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 appearance-none cursor-pointer">
                {methods.length === 0 && <option value="Manual">Manual transfer</option>}
                {methods.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              {methods.length === 0 && (
                <p className="mt-2 text-[11px] text-amber-300">No payment rails are enabled yet. Contact support and we will send you the current account details.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Transaction ID / TID (Optional)</label>
              <input type="text" placeholder="e.g. 123456789" value={formData.transactionId} onChange={(e) => setFormData({...formData, transactionId: e.target.value})} className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500" />
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
              <p className="text-gray-400 text-xs">After you submit, the admin verifies your slip within <b>30 minutes to 24 hours</b>. Your account updates automatically on approval.{isReactivation ? ' Reactivation is applied immediately on approval and resets your Blue ATS counter.' : ' You will be able to create unlimited documents.'}</p>
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

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B1120] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={48} /></div>}>
      <PaymentContent />
    </Suspense>
  );
}
