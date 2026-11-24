'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, authedFetch } from '@/lib/supabase';
import { Building2, Loader2, ArrowLeft, Mail, Eye, EyeOff, ShieldCheck, Users } from 'lucide-react';

type Mode = 'login' | 'register';

export default function CompanyPortal() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [awaitingEmail, setAwaitingEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    email: '',
    password: '',
    companyName: '',
    contactName: '',
    website: '',
    industry: '',
    country: '',
  });

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const role = String(user?.user_metadata?.role || '').toLowerCase();
      if (user && role === 'company') {
        router.replace('/company/dashboard');
        return;
      }
      setChecking(false);
    };
    check();
  }, [router]);

  const change = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (form.companyName.trim().length < 2) {
      setErrorMsg('Please enter your company name.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            role: 'company',
            company_name: form.companyName,
            contact_name: form.contactName,
          },
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });
      if (error) throw error;

      if (data?.session) {
        const res = await authedFetch('/api/company/register', {
          method: 'POST',
          body: JSON.stringify({
            companyName: form.companyName,
            contactName: form.contactName,
            website: form.website,
            industry: form.industry,
            country: form.country,
          }),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || 'Could not create the company profile');
        router.replace('/company/dashboard');
        return;
      }

      setAwaitingEmail(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (error) throw error;

      const role = String(data.user?.user_metadata?.role || '').toLowerCase();
      if (role !== 'company') {
        await supabase.auth.signOut();
        throw new Error('This is a candidate account. Use the company signup form to create a recruiter account.');
      }

      // Self-heal a missing company row (e.g. email confirmation landed later).
      await authedFetch('/api/company/register', {
        method: 'POST',
        body: JSON.stringify({ companyName: data.user?.user_metadata?.company_name || 'Company' }),
      });

      router.replace('/company/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return <div className="min-h-screen bg-[#0B1120] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={48} /></div>;
  }

  if (awaitingEmail) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
          <Mail className="mx-auto mb-6 text-blue-500" size={56} />
          <h2 className="text-2xl font-bold text-white mb-3">Confirm your email</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            We sent a verification link to <strong className="text-white">{form.email}</strong>. Click it to activate the company account, then sign in here.
          </p>
          <button onClick={() => { setAwaitingEmail(false); setMode('login'); }} className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700">
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-white px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
          <ArrowLeft size={18} /> Back to CVNova
        </Link>

        <div className="grid gap-8 lg:grid-cols-2 items-start">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-300">
              <Building2 size={14} /> Company portal
            </div>
            <h1 className="text-4xl font-extrabold leading-tight">Hire candidates who chose to be discovered</h1>
            <p className="mt-4 text-gray-400 leading-relaxed">
              CVNova only lists candidates who gave explicit, revocable consent to CV sharing. Contact details stay hidden unless the candidate separately allowed company contact.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-2"><Users className="mt-0.5 text-blue-400" size={18} /> Browse opted-in CVs with ATS grade and template info.</li>
              <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 text-emerald-400" size={18} /> Consent is re-checked on every request — withdrawals apply instantly.</li>
              <li className="flex items-start gap-2"><Mail className="mt-0.5 text-purple-400" size={18} /> Message candidates from the CVNova domain and chat in-app.</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
            <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-black/30 p-1 text-sm font-bold">
              <button onClick={() => setMode('login')} className={`rounded-lg py-2 ${mode === 'login' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>Sign in</button>
              <button onClick={() => setMode('register')} className={`rounded-lg py-2 ${mode === 'register' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>Create account</button>
            </div>

            {errorMsg && (
              <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">{errorMsg}</p>
            )}

            <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-300">Work email</label>
                <input type="email" name="email" required value={form.email} onChange={change} placeholder="you@company.com" className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-300">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} name="password" required minLength={6} value={form.password} onChange={change} placeholder="••••••••" className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3 pr-11 text-sm text-white outline-none focus:border-blue-500" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-300">Company name</label>
                    <input type="text" name="companyName" required value={form.companyName} onChange={change} placeholder="Nexify Ltd" className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-blue-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-300">Contact person</label>
                      <input type="text" name="contactName" value={form.contactName} onChange={change} placeholder="Recruiter name" className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-300">Industry</label>
                      <input type="text" name="industry" value={form.industry} onChange={change} placeholder="Software" className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-300">Website</label>
                      <input type="text" name="website" value={form.website} onChange={change} placeholder="company.com" className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-300">Country</label>
                      <input type="text" name="country" value={form.country} onChange={change} placeholder="United Kingdom" className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-blue-500" />
                    </div>
                  </div>
                  <p className="text-[11px] leading-relaxed text-gray-400">
                    By creating an account you agree to use candidate data only for recruitment and to honour consent withdrawals immediately.
                  </p>
                </>
              )}

              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-3 text-sm font-bold text-white hover:from-blue-500 hover:to-purple-500 disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" size={18} /> : mode === 'login' ? 'Sign in to portal' : 'Create company account'}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-gray-500">
              Candidate? <Link href="/login" className="font-bold text-blue-400 hover:underline">Sign in here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

