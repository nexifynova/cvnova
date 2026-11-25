'use client';

import { useEffect, useState } from 'react';
import { supabase, authedFetch } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { FileText, LogOut, Plus, ExternalLink, Loader2, Mail, Briefcase, CreditCard, Clock, CheckCircle2, XCircle, ShieldCheck, Crown, Search, Filter, Calendar, Edit2, X, Share2, RefreshCw, Trash2, Send, Eye, EyeOff, MessageSquare, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import AtsBadge from '@/components/AtsBadge';
import PlanBadge from '@/components/PlanBadge';
import { getTemplate } from '@/lib/templates';
import JobFieldsDropdown from '@/components/JobFieldsDropdown';

// Plan name -> the app_settings column holding that plan's CV allowance
const PLAN_CV_SETTING_KEY: Record<string, string> = {
  '3 Months': 'cvs_3m',
  '6 Months': 'cvs_6m',
  '1 Year': 'cvs_1y',
  '5 Years': 'cvs_5y',
};

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState('');

  // Plan / consent / quota state (server computed so the UI can never drift)
  const [account, setAccount] = useState<any>(null);
  const [consent, setConsent] = useState({ shareCv: false, allowContact: false, marketing: false });
  const [consentSaving, setConsentSaving] = useState(false);
  const [consentFlash, setConsentFlash] = useState(false);
  const [visibilitySaving, setVisibilitySaving] = useState<string | null>(null);
  const [inbox, setInbox] = useState<any[]>([]);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replySending, setReplySending] = useState<string | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);

  // Filters & Modals State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [renamingDoc, setRenamingDoc] = useState<any>(null);
  const [newDocName, setNewDocName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [sharingDoc, setSharingDoc] = useState<any>(null);
  const [shareCode, setShareCode] = useState('');
  const [isShareable, setIsShareable] = useState(false);
  const [isSavingShare, setIsSavingShare] = useState(false);
  const [emailingDoc, setEmailingDoc] = useState<any>(null);
  const [emailTo, setEmailTo] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (!profile?.subscription_expiry) return;
    const interval = setInterval(() => {
      const expiry = new Date(profile.subscription_expiry).getTime();
      const now = new Date().getTime();
      const distance = expiry - now;
      if (distance < 0) { setTimeLeft('Expired'); clearInterval(interval); }
      else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [profile]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUser(user);

    const { data: profileData } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
    const { data: settingsData } = await supabase.from('app_settings').select('*').eq('id', 1).single();
    if (settingsData) setSettings(settingsData);

    if (profileData) {
      // 🚨 SELF-HEAL: if the CV allowance that comes with the plan is lower in
      // the DB than in admin settings (e.g. 5 Years should be 250 CVs but was
      // saved as 100), overwrite it with the correct admin value.
      const planKey = PLAN_CV_SETTING_KEY[profileData.subscription_type];
      const planCVs = planKey ? Number(settingsData?.[planKey]) || 0 : 0;
      if (profileData.subscription_type !== 'free' && planCVs > (Number(profileData.total_allowed_cvs) || 0)) {
        const { error: healError } = await supabase
          .from('user_profiles')
          .update({ total_allowed_cvs: planCVs })
          .eq('id', user.id);
        if (!healError) profileData.total_allowed_cvs = planCVs;
      }
      setProfile(profileData);
    }

    const { data: docs } = await supabase.from('generated_documents').select('*').eq('email', user.email).order('created_at', { ascending: false });
    if (docs) setDocuments(docs);

    const { data: pays } = await supabase.from('payments').select('*').eq('user_id', user.id).eq('status', 'approved').order('created_at', { ascending: false });
    if (pays) setPayments(pays);

    await Promise.all([loadAccountState(), loadInbox(), loadJobs()]);
    
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleDeleteDocument = async (docId: string, currentUsed: number) => {
    if (!confirm("Are you sure you want to delete this document? Your usage limit will be restored.")) return;
    try {
      const { error } = await supabase.from('generated_documents').delete().eq('id', docId);
      if (error) throw error;
      const newCount = Math.max(0, currentUsed - 1);
      await supabase.from('user_profiles').update({ free_cv_count: newCount }).eq('id', user.id);
      setDocuments(documents.filter(d => d.id !== docId));
      setProfile({ ...profile, free_cv_count: newCount });
      alert("Document deleted and usage restored.");
    } catch (error: any) { alert("Error deleting document: " + error.message); }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim() || !renamingDoc) return;
    setIsRenaming(true);
    try {
      const { error } = await supabase.from('generated_documents').update({ full_name: newDocName.trim() }).eq('id', renamingDoc.id);
      if (error) throw error;
      setDocuments(documents.map(d => d.id === renamingDoc.id ? { ...d, full_name: newDocName.trim() } : d));
      setRenamingDoc(null);
    } catch (error: any) { alert("Error renaming document: " + error.message); } finally { setIsRenaming(false); }
  };

  const openShareModal = (doc: any) => { setSharingDoc(doc); setShareCode(doc.share_code || ''); setIsShareable(doc.is_shareable || false); };
  
  const generateRandomCode = () => { 
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setShareCode(code); 
    setIsShareable(true); 
  };
  
  const handleSaveShareCode = async () => {
    if (!sharingDoc) return;
    if (isShareable && shareCode && shareCode.length !== 6) { alert("Share code must be exactly 6 characters."); return; }
    setIsSavingShare(true);
    try {
      const { error } = await supabase.from('generated_documents').update({ share_code: shareCode || null, is_shareable: isShareable }).eq('id', sharingDoc.id);
      if (error) {
        if (error.code === '23505') { alert("This code is already in use by another user."); setIsSavingShare(false); return; }
        throw error;
      }
      setDocuments(documents.map(d => d.id === sharingDoc.id ? { ...d, share_code: shareCode, is_shareable: isShareable } : d));
      setSharingDoc(null);
      alert("Share settings updated!");
    } catch (error: any) { alert("Error saving share code: " + error.message); } finally { setIsSavingShare(false); }
  };

  const handleEmailDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTo || !emailingDoc) return;
    setIsSendingEmail(true);
    try {
      const viewLink = `${window.location.origin}/view/${emailingDoc.id}`;
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailTo,
          subject: `${user.user_metadata?.full_name || profile?.full_name || 'User'} shared a document with you`,
          html: `<div style="font-family: Arial; padding: 20px;"><h2>Document Shared with You</h2><p>${user.user_metadata?.full_name || 'A CVNova User'} shared: <b>${emailingDoc.full_name}</b></p><a href="${viewLink}">View Document</a></div>`
        })
      });
      if (!res.ok) throw new Error('Failed to send email');
      alert("Document emailed successfully!"); setEmailingDoc(null); setEmailTo('');
    } catch (error: any) { alert("Error: " + error.message); } finally { setIsSendingEmail(false); }
  };

  // 🚨 FIXED: Limit = the plan's CV allowance from admin settings or the
  // purchased total, whichever is higher. This prevents a 5 Years plan
  // ($40 = 250 CVs) from incorrectly showing "2 / 100".
  const isPlanActive = !!profile?.subscription_type && profile.subscription_type !== 'free'
    && (!profile?.subscription_expiry || new Date(profile.subscription_expiry) > new Date());
  let currentLimit = settings?.free_cv_limit || 1;
  if (isPlanActive) {
    const planKey = PLAN_CV_SETTING_KEY[profile.subscription_type];
    const planCVs = planKey ? Number(settings?.[planKey]) || 0 : 0;
    currentLimit = Math.max(Number(profile?.total_allowed_cvs) || 0, planCVs) || currentLimit;
  }

  const filteredDocuments = documents.filter((doc) => {
    if (searchTerm && !doc.full_name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterType !== 'All' && doc.document_type !== filterType) return false;
    if (filterFromDate && new Date(doc.created_at) < new Date(filterFromDate)) return false;
    if (filterToDate) {
      const to = new Date(filterToDate); to.setDate(to.getDate() + 1);
      if (new Date(doc.created_at) > to) return false;
    }
    return true;
  });

  const loadAccountState = async () => {
    try {
      const res = await authedFetch('/api/account/status');
      const data = await res.json();
      if (!res.ok || data.error) return;
      setAccount(data);
      setConsent({
        shareCv: data.consent?.shareCv === true,
        allowContact: data.consent?.allowContact === true,
        marketing: data.consent?.marketing === true,
      });
    } catch {
      /* migration not applied yet — legacy dashboard keeps working */
    }
  };

  const loadInbox = async () => {
    try {
      const res = await authedFetch('/api/company/messages');
      const data = await res.json();
      if (res.ok && Array.isArray(data.messages)) setInbox(data.messages);
    } catch {
      /* company portal not enabled */
    }
  };

  const loadJobs = async () => {
    try {
      const res = await authedFetch('/api/jobs');
      const data = await res.json();
      if (res.ok && Array.isArray(data.jobs)) setJobs(data.jobs);
    } catch {
      /* job board not enabled yet */
    }
  };

  const saveConsent = async (patch: Partial<typeof consent>) => {
    const previous = consent;
    const next = { ...consent, ...patch };
    // Contact consent is meaningless without CV sharing consent.
    if (!next.shareCv) next.allowContact = false;
    setConsent(next);
    setConsentSaving(true);
    try {
      const res = await authedFetch('/api/account/consent', {
        method: 'POST',
        body: JSON.stringify({ shareCv: next.shareCv, allowContact: next.allowContact, marketing: next.marketing }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Consent could not be saved');
      if (!next.shareCv) {
        setDocuments((docs) => docs.map((d) => ({ ...d, is_public: false })));
      }
      await loadAccountState();
    } catch (err: any) {
      // Roll the checkbox back so the UI never shows a state that wasn't saved.
      setConsent(previous);
      const message = String(err?.message || err);
      const migrationHint = /column|schema|does not exist/i.test(message)
        ? '\n\nNew database columns are missing. Open Supabase → SQL Editor, run supabase/cvnova_upgrade.sql and click "Run", then try again.'
        : '';
      alert("Consent could not be saved. " + message + migrationHint);
    } finally {
      setConsentSaving(false);
    }
  };

  const toggleDocVisibility = async (doc: any) => {
    if (doc.document_type && doc.document_type !== 'CV') {
      alert("Only CVs can be shared with companies.");
      return;
    }
    if (!consent.shareCv) {
      // Instead of a dead-end alert, guide the user straight to the privacy centre.
      setConsentFlash(true);
      document.getElementById('consent-centre')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(() => setConsentFlash(false), 2600);
      return;
    }
    const next = doc.is_public !== true;
    setVisibilitySaving(doc.id);
    try {
      const res = await authedFetch('/api/documents/visibility', {
        method: 'POST',
        body: JSON.stringify({ documentId: doc.id, isPublic: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error === 'consent_required' ? "Turn on CV sharing consent first." : (data.error || 'Could not update visibility'));
        return;
      }
      setDocuments((docs) => docs.map((d) => (d.id === doc.id ? { ...d, is_public: next } : d)));
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setVisibilitySaving(null);
    }
  };

  const sendReply = async (companyId: string, documentId: string | null) => {
    const text = (replyDrafts[companyId] || '').trim();
    if (!text) return;
    setReplySending(companyId);
    try {
      const res = await authedFetch('/api/company/messages', {
        method: 'POST',
        body: JSON.stringify({ companyId, documentId, body: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Message failed');
      setReplyDrafts((drafts) => ({ ...drafts, [companyId]: '' }));
      await loadInbox();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setReplySending(null);
    }
  };

  // One thread per company so a candidate can reply privately.
  const inboxThreads = Object.values(
    inbox.reduce((acc: Record<string, { companyId: string; companyName: string; messages: any[] }>, m: any) => {
      const key = m.company_id || 'unknown';
      acc[key] = acc[key] || { companyId: key, companyName: m.companyName || 'Company', messages: [] };
      acc[key].messages.push(m);
      return acc;
    }, {}),
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;
    return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-gradient-to-tr from-blue-500 to-purple-600 p-2 rounded-xl"><FileText className="text-white" size={20} /></div>
          <span className="text-xl font-extrabold text-gray-900">{settings?.site_name || 'CVNova'}</span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/chat" className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100">
            <MessageSquare size={17} /> Chat
          </Link>
          <span className="text-sm text-gray-600 hidden sm:block">Hi, {profile?.full_name || user.email}</span>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700"><LogOut size={18} /> Logout</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {account?.plan?.isLocked && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 shrink-0 text-red-600" size={20} />
              <div>
                <p className="font-bold text-red-800">Your 2-month free trial has ended</p>
                <p className="text-sm text-red-700">Your saved documents are safe and still downloadable. Reactivate once for ${account?.limits?.reactivationPrice || 2} to keep creating CVs.</p>
              </div>
            </div>
            <Link href="/payment?package=Reactivation" className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700">
              <Crown size={16} /> Reactivate ${account?.limits?.reactivationPrice || 2}
            </Link>
          </div>
        )}

        {!account?.plan?.isLocked && account?.plan?.isTrial && account.plan.daysLeft <= 14 && (
          <div className="mb-6 flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-amber-800">
              <Clock size={16} /> <strong>Trial ends in {account.plan.daysLeft} day{account.plan.daysLeft === 1 ? '' : 's'}.</strong> Compare plans before creation locks.
            </p>
            <Link href="/#pricing" className="font-bold text-amber-800 underline">View plans</Link>
          </div>
        )}

        {account?.plan?.isReactivated && (
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <CheckCircle2 size={16} /> Reactivation active — you can create documents again. All templates unlocked.
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div><h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1><p className="text-gray-500 mt-1">Manage your generated documents and payments</p></div>
          <div className="flex flex-wrap gap-2">
            <Link href="/builder" className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 font-bold transition shadow-md text-sm"><Plus size={18} /> New CV</Link>
            <Link href="/cover-letter" className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl hover:bg-green-700 font-bold transition shadow-md text-sm"><Mail size={18} /> Cover Letter</Link>
            <Link href="/experience-letter" className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl hover:bg-purple-700 font-bold transition shadow-md text-sm"><Briefcase size={18} /> Experience Letter</Link>
            <Link href="/chat" className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 font-bold transition shadow-md text-sm"><MessageSquare size={18} /> Chat Room</Link>
            <Link href="/payment" className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-5 py-2.5 rounded-xl hover:from-orange-600 hover:to-yellow-600 font-bold transition shadow-lg text-sm animate-pulse"><Crown size={18} /> Buy Packages</Link>
          </div>
        </div>

        {settings?.show_job_fields_dashboard !== false && (
          <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
            <div>
              <p className="text-sm font-bold text-indigo-900">Find people in your field</p>
              <p className="text-xs text-indigo-700">Pick a field to open the chat room with matching professionals.</p>
            </div>
            <JobFieldsDropdown variant="light" label="Your field" />
          </div>
        )}

        {settings?.show_jobs_on_dashboard !== false && (
          <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="text-blue-600" size={20} />
                <h2 className="text-lg font-bold text-gray-900">Latest jobs</h2>
              </div>
              <span className="text-xs font-semibold text-gray-500">
                {jobs.length} open role{jobs.length === 1 ? '' : 's'}
              </span>
            </div>

            {jobs.length === 0 ? (
              <p className="text-sm text-gray-500">
                No roles posted yet. Hiring companies publish openings here — check back soon.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {jobs.slice(0, 6).map((job: any) => (
                  <div key={job.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-sm font-bold text-gray-900">{job.title}</p>
                    <p className="mt-0.5 text-xs font-semibold text-indigo-700">
                      {job.companyName}
                      {job.location ? ` · ${job.location}` : ''}
                      {job.industry ? ` · ${job.industry}` : ''}
                    </p>
                    {job.description && (
                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-gray-600">{job.description}</p>
                    )}
                    <p className="mt-2 font-mono text-[11px] text-gray-500">{job.companyChatId || 'Chat ID pending'}</p>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-3 text-[11px] text-gray-500">
              Open the Chat Room and search a company&apos;s chat ID to message the recruiter directly.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1 flex items-center gap-2"><FileText size={16}/> CVs Used</p>
            <p className="text-3xl font-bold text-gray-900">{profile?.free_cv_count || 0} / {currentLimit}</p>
            {account?.ats && (
              <p className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${account.ats.unlimited ? 'bg-emerald-100 text-emerald-700' : account.ats.exhausted ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                <ShieldCheck size={11} /> Blue ATS {account.ats.unlimited ? 'unlimited' : `${account.ats.used}/${account.ats.limit}`}
              </p>
            )}
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-2 flex items-center gap-2"><ShieldCheck size={16}/> Account Type</p>
            <PlanBadge profile={profile} plan={account?.plan} size="lg" />
          </div>
          <div className={`p-6 rounded-2xl shadow-sm border ${profile?.subscription_type !== 'free' && timeLeft !== 'Expired' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}>
            <p className="text-sm text-gray-500 mb-1 flex items-center gap-2"><Clock size={16}/> Subscription Expiry</p>
            {profile?.subscription_type !== 'free' && profile?.subscription_expiry ? (
              <div><p className={`text-2xl font-bold ${timeLeft === 'Expired' ? 'text-red-600' : 'text-green-700'}`}>{timeLeft === 'Expired' ? 'Expired' : timeLeft}</p><p className="text-xs text-gray-500 mt-1">Expires on: {new Date(profile.subscription_expiry).toLocaleDateString()}</p></div>
            ) : <p className="text-xl font-bold text-gray-400 mt-2">No Active Plan</p>}
          </div>
        </div>

        <div id="consent-centre" className={`bg-white p-6 rounded-2xl shadow-sm border mb-6 transition-all ${consentFlash ? 'border-blue-400 ring-2 ring-blue-300' : 'border-gray-100'}`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2"><ShieldCheck className="text-blue-600" size={20} /><h2 className="text-lg font-bold text-gray-900">Privacy &amp; Consent Centre</h2></div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Policy {account?.consent?.version || 'v1'}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <span>
                <span className="block text-sm font-bold text-gray-900">Show my CV to companies</span>
                <span className="block text-xs text-gray-500 mt-0.5">Off by default. Companies only see CVs you additionally mark public.</span>
              </span>
              <input type="checkbox" checked={consent.shareCv} disabled={consentSaving} onChange={(e) => saveConsent({ shareCv: e.target.checked })} className="mt-1 h-5 w-5 shrink-0 rounded text-blue-600 focus:ring-blue-500" />
            </label>

            <label className={`flex items-start justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 ${consent.shareCv ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
              <span>
                <span className="block text-sm font-bold text-gray-900">Let companies contact me</span>
                <span className="block text-xs text-gray-500 mt-0.5">Otherwise your email, phone and social links stay hidden.</span>
              </span>
              <input type="checkbox" checked={consent.allowContact} disabled={!consent.shareCv || consentSaving} onChange={(e) => saveConsent({ allowContact: e.target.checked })} className="mt-1 h-5 w-5 shrink-0 rounded text-blue-600 focus:ring-blue-500" />
            </label>

            <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <span>
                <span className="block text-sm font-bold text-gray-900">Career tips &amp; updates</span>
                <span className="block text-xs text-gray-500 mt-0.5">Marketing only. Never affects document creation.</span>
              </span>
              <input type="checkbox" checked={consent.marketing} disabled={consentSaving} onChange={(e) => saveConsent({ marketing: e.target.checked })} className="mt-1 h-5 w-5 shrink-0 rounded text-blue-600 focus:ring-blue-500" />
            </label>
          </div>

          <p className="mt-3 text-[11px] text-gray-500">
            {account?.consent?.updatedAt ? `Last updated ${new Date(account.consent.updatedAt).toLocaleString()}. ` : ''}
            Withdraw consent at any time — your CVs leave the company pool immediately.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2"><MessageSquare className="text-purple-600" size={20} /><h2 className="text-lg font-bold text-gray-900">Company Inbox</h2></div>
            <span className="text-xs font-semibold text-gray-500">{inboxThreads.length} conversation{inboxThreads.length === 1 ? '' : 's'}</span>
          </div>

          {inboxThreads.length === 0 ? (
            <p className="text-sm text-gray-500">No messages yet. Turn on CV sharing so recruiters can find and contact you.</p>
          ) : (
            <div className="space-y-3">
              {(inboxOpen ? inboxThreads : inboxThreads.slice(0, 2)).map((thread: any) => {
                const last = thread.messages[thread.messages.length - 1];
                return (
                  <div key={thread.companyId} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold text-gray-900">{thread.companyName}</p>
                      <span className="shrink-0 text-[10px] text-gray-400">{new Date(last.created_at).toLocaleString()}</span>
                    </div>
                    <div className="mt-2 max-h-40 space-y-1.5 overflow-y-auto">
                      {thread.messages.map((m: any) => (
                        <p key={m.id} className={`text-xs ${m.sender === 'candidate' ? 'text-right font-medium text-blue-700' : 'text-gray-700'}`}>
                          <span className={`inline-block rounded-lg px-2 py-1 ${m.sender === 'candidate' ? 'bg-blue-100' : 'bg-white border border-gray-200'}`}>{m.body}</span>
                        </p>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={replyDrafts[thread.companyId] || ''}
                        onChange={(e) => setReplyDrafts((drafts) => ({ ...drafts, [thread.companyId]: e.target.value }))}
                        placeholder="Reply privately..."
                        className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button onClick={() => sendReply(thread.companyId, last.document_id || null)} disabled={replySending === thread.companyId || !(replyDrafts[thread.companyId] || '').trim()} className="flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-2 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-50">
                        {replySending === thread.companyId ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Reply
                      </button>
                    </div>
                  </div>
                );
              })}
              {inboxThreads.length > 2 && (
                <button onClick={() => setInboxOpen(!inboxOpen)} className="w-full text-xs font-bold text-purple-600 hover:underline">
                  {inboxOpen ? 'Show fewer conversations' : `View all ${inboxThreads.length} conversations`}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-10">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between"><div className="flex items-center gap-2"><CreditCard className="text-blue-600" size={20} /><h2 className="text-lg font-bold text-gray-900">My Payment History</h2></div><Link href="/payment" className="text-sm font-bold text-blue-600 hover:underline">Upgrade Now</Link></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-600"><tr><th className="px-6 py-3 font-medium">Date</th><th className="px-6 py-3 font-medium">Package</th><th className="px-6 py-3 font-medium">Amount</th><th className="px-6 py-3 font-medium">Status</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-500">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{p.package_type}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">${p.amount}</td>
                    <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${p.status === 'approved' ? 'bg-green-100 text-green-700' : p.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.status === 'approved' && <CheckCircle2 size={12}/>}{p.status === 'rejected' && <XCircle size={12}/>}{p.status === 'pending' && <Clock size={12}/>}{p.status === 'pending' ? 'IN CHECKING' : p.status.toUpperCase()}</span></td>
                  </tr>
                ))}
                {payments.length === 0 && (<tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No payments made yet.</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-lg font-bold text-gray-900">My Documents</h2>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input type="text" placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-48" /></div>
              <div className="relative"><Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="pl-9 pr-8 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white cursor-pointer"><option value="All">All Types</option><option value="CV">CV</option><option value="Cover Letter">Cover Letter</option><option value="Experience Letter">Experience Letter</option></select></div>
              <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-1"><Calendar size={16} className="text-gray-400" /><input type="date" value={filterFromDate} onChange={(e) => setFilterFromDate(e.target.value)} className="text-sm outline-none bg-transparent" title="From Date" /><span className="text-gray-400">-</span><input type="date" value={filterToDate} onChange={(e) => setFilterToDate(e.target.value)} className="text-sm outline-none bg-transparent" title="To Date" /></div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-600"><tr><th className="px-6 py-3 font-medium">Date</th><th className="px-6 py-3 font-medium">Document Type</th><th className="px-6 py-3 font-medium">Name</th><th className="px-6 py-3 font-medium">Template</th><th className="px-6 py-3 font-medium">ATS</th><th className="px-6 py-3 font-medium">Company Visibility</th><th className="px-6 py-3 font-medium">Action</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-500">{new Date(doc.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{doc.document_type}</td>
                    <td className="px-6 py-4 text-gray-900 flex items-center gap-2">
                      {doc.full_name}
                      <button onClick={() => { setRenamingDoc(doc); setNewDocName(doc.full_name || ''); }} className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-1.5 rounded transition" title="Rename Document"><Edit2 size={14} /></button>
                    </td>
                    <td className="px-6 py-4 capitalize text-gray-600">{getTemplate(doc.template_name).name}</td>
                    <td className="px-6 py-4">{doc.document_type === 'CV' ? <AtsBadge tier={getTemplate(doc.template_name).ats} size="xs" /> : <span className="text-xs text-gray-400">—</span>}</td>
                    <td className="px-6 py-4">
                      {doc.document_type === 'CV' ? (
                        <button
                          onClick={() => toggleDocVisibility(doc)}
                          disabled={visibilitySaving === doc.id}
                          title={doc.is_public ? 'Visible to companies — click to hide' : 'Hidden from companies — click to show'}
                          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 ${doc.is_public ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                          {visibilitySaving === doc.id ? <Loader2 size={12} className="animate-spin" /> : doc.is_public ? <Eye size={12} /> : <EyeOff size={12} />}
                          {doc.is_public ? 'Public' : 'Private'}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <Link href={`/view/${doc.id}`} target="_blank" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-1.5 rounded-lg transition"><ExternalLink size={14} /> View</Link>
                      <button onClick={() => openShareModal(doc)} className={`inline-flex items-center gap-1 font-medium px-3 py-1.5 rounded-lg transition ${doc.is_shareable && doc.share_code ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`} title="Share Document"><Share2 size={14} /> Share</button>
                      <button onClick={() => { setEmailingDoc(doc); setEmailTo(''); }} className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 font-medium bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition" title="Email Document"><Mail size={14} /> Email</button>
                      <button onClick={() => handleDeleteDocument(doc.id, profile?.free_cv_count || 0)} className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-medium bg-red-50 px-3 py-1.5 rounded-lg transition" title="Delete Document"><Trash2 size={14} /> Delete</button>
                    </td>
                  </tr>
                ))}
                {filteredDocuments.length === 0 && (<tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No documents found matching your criteria.</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </main>
            {/* RENAME MODAL */}
      {renamingDoc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-gray-900">Rename Document</h3><button onClick={() => setRenamingDoc(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button></div>
            <form onSubmit={handleRenameSubmit}>
              <input type="text" value={newDocName} onChange={(e) => setNewDocName(e.target.value)} className="w-full px-4 py-2 border rounded-xl mb-4 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter new name" required />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setRenamingDoc(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold">Cancel</button>
                <button type="submit" disabled={isRenaming} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50">{isRenaming ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHARE MODAL (6-Digits) */}
      {sharingDoc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-gray-900">Share Document</h3><button onClick={() => setSharingDoc(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button></div>
            <p className="text-sm text-gray-600 mb-4">Generate a secure 6-character code to share this document.</p>
            <div className="flex gap-2 mb-4">
              <input type="text" maxLength={6} value={shareCode} onChange={(e) => setShareCode(e.target.value.toUpperCase())} className="flex-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest font-mono font-bold" placeholder="XXXXXX" />
              <button onClick={generateRandomCode} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-1 transition"><RefreshCw size={16} /> Auto</button>
            </div>
            <label className="flex items-center gap-2 mb-6 cursor-pointer">
              <input type="checkbox" checked={isShareable} onChange={(e) => { setIsShareable(e.target.checked); if (!e.target.checked) setShareCode(''); }} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
              <span className="text-sm font-medium text-gray-700">Enable sharing for this document</span>
            </label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setSharingDoc(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold">Cancel</button>
              <button onClick={handleSaveShareCode} disabled={isSavingShare} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50">{isSavingShare ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL MODAL */}
      {emailingDoc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-gray-900">Email Document</h3><button onClick={() => setEmailingDoc(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button></div>
            <p className="text-sm text-gray-600 mb-4">Send a link to view <strong>{emailingDoc.full_name}</strong>.</p>
            <form onSubmit={handleEmailDocument}>
              <input type="email" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} className="w-full px-4 py-2 border rounded-xl mb-4 outline-none focus:ring-2 focus:ring-purple-500" placeholder="recipient@example.com" required />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setEmailingDoc(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold">Cancel</button>
                <button type="submit" disabled={isSendingEmail} className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
                  {isSendingEmail ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {isSendingEmail ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}