'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, authedFetch } from '@/lib/supabase';
import Link from 'next/link';
import { FileText, Loader2, ArrowLeft, Eye, EyeOff, Mail, ShieldCheck } from 'lucide-react';
import { CONSENT_VERSION } from '@/lib/account-status';

export default function Signup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  // Every consent box starts unchecked. Nothing is pre-ticked for the user.
  const [consent, setConsent] = useState({ shareCv: false, allowContact: false, marketing: false });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    setLoading(true);

    // 1. Supabase Signup (Supabase will send the Confirm Email)
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          role: 'candidate',
          consent_share_cv: consent.shareCv,
          consent_company_contact: consent.shareCv && consent.allowContact,
          consent_marketing: consent.marketing,
          consent_version: CONSENT_VERSION,
        },
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      }
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    // When email confirmation is disabled Supabase returns a session right away,
    // so persist the (unchecked-by-default) choices immediately. With confirmation
    // enabled the same flags travel in metadata and are mirrored by
    // /api/account/status on the first authenticated request.
    if (data?.session) {
      try {
        await authedFetch('/api/account/consent', {
          method: 'POST',
          body: JSON.stringify({ ...consent, version: CONSENT_VERSION }),
        });
      } catch {
        /* non-blocking: metadata copy still survives */
      }
    }
    
    // 2. Send Professional Welcome Email via Resend
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: formData.email,
          subject: 'Welcome to CVNova! 🚀 Let\'s build your career',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #2563eb; margin: 0;">CVNova</h1>
                <p style="color: #64748b; font-size: 14px;">by NexifyNova</p>
              </div>
              <h2 style="color: #333;">Welcome, ${formData.fullName}! 🎉</h2>
              <p style="color: #475569; line-height: 1.6;">
                Thank you for creating an account with CVNova. We are thrilled to have you on board!
              </p>
              <p style="color: #475569; line-height: 1.6;">
                You can now create professional, ATS-friendly CVs, Cover Letters, and Experience Letters in minutes using our AI-powered tools.
              </p>
              <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-weight: bold; color: #333;">Next Steps:</p>
                <ol style="margin: 10px 0 0 0; padding-left: 20px; color: #475569;">
                  <li>Verify your email address (Check your inbox for the confirmation link).</li>
                  <li>Log in to your dashboard.</li>
                  <li>Start building your first CV!</li>
                </ol>
              </div>
              <div style="text-align: center; margin-top: 30px;">
                <a href="${window.location.origin}/login" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Go to Dashboard</a>
              </div>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 40px; text-align: center;">
                If you have any questions, reply to this email or contact us at support@nexifynova.co.uk
              </p>
            </div>
          `
        })
      });
    } catch (emailError) {
      console.error("Welcome email failed to send", emailError);
    }
    
    setIsSuccess(true);
    setLoading(false);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center px-4 relative">
        <div className="bg-white/5 border border-white/10 p-10 rounded-3xl max-w-md w-full text-center shadow-2xl backdrop-blur-sm">
          <Mail className="text-blue-500 mx-auto mb-6" size={64} />
          <h2 className="text-2xl font-bold text-white mb-4">Check Your Email</h2>
          <p className="text-gray-400 mb-6 leading-relaxed">
            We have sent a <strong className="text-white">Verification Link</strong> to <span className="text-white font-bold">{formData.email}</span>.
            <br/><br/>
            Please check your inbox (and spam folder) and click that link to activate your account. You will also receive a separate Welcome Email.
          </p>
          <Link href="/login" className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:from-blue-500 hover:to-purple-500 transition shadow-lg">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center px-4 relative">
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-gray-400 hover:text-white transition font-medium">
        <ArrowLeft size={20} /> Back to Home
      </Link>
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="bg-gradient-to-tr from-blue-500 to-purple-600 p-2 rounded-xl"><FileText className="text-white" size={20} /></div>
          <span className="text-2xl font-extrabold text-gray-900">CVNova</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Create Your Account</h1>
        
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
            <input type="text" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full px-4 py-3 rounded-xl border text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-3 rounded-xl border text-gray-900 pr-12 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
            <input type={showPassword ? "text" : "password"} required value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} className="w-full px-4 py-3 rounded-xl border text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••" />
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-600">
              <ShieldCheck size={14} className="text-blue-600" /> Privacy choices (optional)
            </p>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={consent.shareCv}
                onChange={(e) => setConsent({ ...consent, shareCv: e.target.checked, allowContact: e.target.checked ? consent.allowContact : false })}
                className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-600 leading-relaxed">
                <strong className="text-gray-800">Show my CV to companies.</strong> Only CVs you also mark public in your dashboard appear in the company portal. You can turn this off any time.
              </span>
            </label>
            <label className={`flex items-start gap-2 ${consent.shareCv ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
              <input
                type="checkbox"
                disabled={!consent.shareCv}
                checked={consent.allowContact}
                onChange={(e) => setConsent({ ...consent, allowContact: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-600 leading-relaxed">
                <strong className="text-gray-800">Let companies contact me.</strong> Without this, companies can view your CV but your email, phone and social links stay hidden.
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={consent.marketing}
                onChange={(e) => setConsent({ ...consent, marketing: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-600 leading-relaxed">
                Send me career tips and product updates. No spam, unsubscribe anytime.
              </span>
            </label>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-bold hover:from-blue-500 hover:to-purple-500 transition disabled:opacity-50 mt-2">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
}