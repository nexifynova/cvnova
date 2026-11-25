'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, authedFetch } from '@/lib/supabase';
import { Building2, Loader2, LogOut, Search, Filter, X, Mail, MessageSquare, Send, ShieldCheck, Lock, Eye, Briefcase, Plus, Trash2, MapPin, FileText, RefreshCw, CheckCircle2, Paperclip, Clock, UserCheck } from 'lucide-react';
import AtsBadge from '@/components/AtsBadge';
import JobFieldsDropdown from '@/components/JobFieldsDropdown';
import CVTemplateRenderer from '@/components/cv/CVTemplateRenderer';
import ApplicationsSidebar from '@/components/company/ApplicationsSidebar';
import {
  CompanyPackageBanner,
  GracePeriodPopup,
  PackagePlansModal,
} from '@/components/company/CompanyPackageNotice';
import {
  CHAT_LOCKED_MESSAGE,
  JOB_POST_LOCKED_MESSAGE,
  type CompanyAccess,
  type CompanyPackage,
} from '@/lib/company-access';
import {
  APPLICATION_STATUS_META,
  normalizeApplicationStatus,
  type ApplicationStatus,
  type JobApplicationRow,
} from '@/lib/application-status';
import type { AtsTier } from '@/lib/templates';

type Candidate = {
  id: string;
  fullName: string;
  jobTitle: string;
  location: string;
  nationality: string;
  summary: string;
  skills: string[];
  experienceYears: number;
  template: string;
  templateName: string;
  ats: AtsTier;
  updatedAt: string;
  cvnovaCode: string;
  canContact: boolean;
  contact: { email?: string; phone?: string; linkedin?: string; instagram?: string; indeed?: string } | null;
  photoUrl: string;
};

export default function CompanyDashboard() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [companyName, setCompanyName] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [ats, setAts] = useState('');
  const [fieldId, setFieldId] = useState('');
  const [notice, setNotice] = useState('');

  const [cvDoc, setCvDoc] = useState<any>(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [chat, setChat] = useState<any[]>([]);
  const [chatDraft, setChatDraft] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sendingMail, setSendingMail] = useState(false);
  const [mailStatus, setMailStatus] = useState('');

  // Phase 2 — jobs board + company-side chat
  const [featureFlags, setFeatureFlags] = useState<{ show_jobs_on_dashboard?: boolean; enable_company_chat?: boolean }>({});
  const [companyChatId, setCompanyChatId] = useState('');
  const [recruitingFieldId, setRecruitingFieldId] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [jobForm, setJobForm] = useState({ title: '', location: '', description: '' });
  const [savingJob, setSavingJob] = useState(false);
  const [deletingJob, setDeletingJob] = useState<string | null>(null);
  const [chatCandidates, setChatCandidates] = useState<any[]>([]);
  const [chatFieldName, setChatFieldName] = useState('');
  const [chatCandidatesLoading, setChatCandidatesLoading] = useState(false);
  const [activeCandidate, setActiveCandidate] = useState<any>(null);
  const [dmMessages, setDmMessages] = useState<any[]>([]);
  const [dmDraft, setDmDraft] = useState('');
  const [dmSending, setDmSending] = useState(false);
  const [applications, setApplications] = useState<JobApplicationRow[]>([]);
  const [receivingId, setReceivingId] = useState<string | null>(null);
  // Phase 1 — recruiter ATS: which card is mirrored in the sidebar and which
  // row is mid-flight to the status endpoint.
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);

  // Phase 2 — package / free trial / grace period. The whole gate is derived
  // from the server snapshot, so the UI and the API routes always agree.
  const [plan, setPlan] = useState<CompanyAccess | null>(null);
  const [planPackages, setPlanPackages] = useState<CompanyPackage[]>([]);
  const [plansOpen, setPlansOpen] = useState(false);
  const [gracePopupOpen, setGracePopupOpen] = useState(false);
  const [gracePopupSeen, setGracePopupSeen] = useState(false);

  useEffect(() => {
    const guard = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const role = String(user?.user_metadata?.role || '').toLowerCase();
      if (!user || role !== 'company') {
        router.replace('/company');
        return;
      }
      setCompanyName(String(user.user_metadata?.company_name || 'Company'));
      setChecking(false);
      loadCandidates('');
      loadFeatureFlags();
      loadJobs();
      loadChatCandidates();
      loadApplications();
      loadPlan();
    };
    guard();
  }, [router]);

  const loadFeatureFlags = async () => {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('show_jobs_on_dashboard, enable_company_chat')
        .eq('id', 1)
        .maybeSingle();
      if (data) setFeatureFlags(data);
    } catch {
      /* fall back to the enabled defaults */
    }
  };

  const loadJobs = async () => {
    try {
      const res = await authedFetch('/api/company/jobs');
      const data = await res.json();
      if (!res.ok) return;
      setJobs(Array.isArray(data.jobs) ? data.jobs : []);
      if (data.company?.chatId) setCompanyChatId(data.company.chatId);
      if (data.company?.jobFieldId) setRecruitingFieldId(data.company.jobFieldId);
    } catch {
      /* jobs API unavailable */
    }
  };

  const loadChatCandidates = async () => {
    setChatCandidatesLoading(true);
    try {
      const res = await authedFetch('/api/company/chat/candidates');
      const data = await res.json();
      if (res.ok) {
        setChatCandidates(Array.isArray(data.candidates) ? data.candidates : []);
        setChatFieldName(data.fieldName || '');
        if (data.companyChatId) setCompanyChatId(data.companyChatId);
      }
    } catch {
      /* chat API unavailable */
    } finally {
      setChatCandidatesLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      const res = await authedFetch('/api/company/applications');
      const data = await res.json();
      if (res.ok && Array.isArray(data.applications)) {
        setApplications(
          (data.applications as JobApplicationRow[]).map((application) => ({
            ...application,
            status: normalizeApplicationStatus(application.status),
          })),
        );
      }
    } catch {
      /* applications API unavailable */
    }
  };

  // Phase 2: package snapshot for the banner, grace popup and plan list. Kept
  // apart from the CV list so a slow access call never blocks the talent pool.
  const loadPlan = async () => {
    try {
      const res = await authedFetch('/api/company/access');
      const data = await res.json();
      if (!res.ok) return;
      if (data.access) setPlan(data.access as CompanyAccess);
      setPlanPackages(Array.isArray(data.packages) ? (data.packages as CompanyPackage[]) : []);
    } catch {
      /* access API unavailable — keep the current view */
    }
  };

  // Confirms the CV reached the company. The candidate gets an automatic chat
  // message so they know their application was seen.
  const markReceived = async (application: any) => {
    if (!application?.id || receivingId) return;
    setReceivingId(application.id);
    try {
      const res = await authedFetch('/api/company/applications', {
        method: 'POST',
        body: JSON.stringify({ id: application.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not mark this application as received');

      const receivedAt = data.receivedAt || new Date().toISOString();
      setApplications((prev) =>
        prev.map((item) => (item.id === application.id ? { ...item, receivedAt } : item)),
      );

      // If this candidate's thread is already open, refresh it so the
      // automatic "document received" message appears immediately.
      if (activeCandidate?.id && activeCandidate.id === application.candidateUserId) {
        await openCandidateChat(activeCandidate, { silent: true });
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setReceivingId(null);
    }
  };

  /**
   * Sorts an application into the Interviewed / Pending / Trash boxes.
   * `received` is also the restore target, so this one function handles both
   * "Delete" (trash) and "Restore" from the sidebar.
   */
  const updateApplicationStatus = async (application: JobApplicationRow, status: ApplicationStatus) => {
    if (!application?.id || statusBusyId) return;
    setStatusBusyId(application.id);
    try {
      const res = await authedFetch('/api/company/applications', {
        method: 'PATCH',
        body: JSON.stringify({ id: application.id, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error === 'invalid_status'
            ? 'That status is not supported.'
            : data.error === 'application_not_found'
              ? 'This application no longer exists.'
              : data.error || 'Could not move this application',
        );
      }

      const nextStatus = normalizeApplicationStatus(data.status || status);
      setApplications((prev) =>
        prev.map((item) => (item.id === application.id ? { ...item, status: nextStatus } : item)),
      );
      setSelectedApplicationId(application.id);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setStatusBusyId(null);
    }
  };

  const openApplicationCv = (application: JobApplicationRow) => {
    setSelectedApplicationId(application.id);
    if (application.documentId) void openCandidate(application.documentId);
  };

  const openApplicationChat = (application: JobApplicationRow) => {
    setSelectedApplicationId(application.id);
    void openCandidateChat({
      id: application.candidateUserId,
      fullName: application.candidateName,
      chatId: application.chatId,
      appliedFor: application.jobTitle,
    });
  };

  const createJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobForm.title.trim() || savingJob) return;
    setSavingJob(true);
    try {
      const res = await authedFetch('/api/company/jobs', {
        method: 'POST',
        body: JSON.stringify(jobForm),
      });
      const data = await res.json();
      if (!res.ok) {
        // A locked package must read the server's wording, not a generic error.
        if (data.error === 'package_expired') throw new Error(data.message || JOB_POST_LOCKED_MESSAGE);
        throw new Error(data.error === 'job_title_required' ? 'Enter a job title.' : (data.error || 'Could not post the job'));
      }
      setJobForm({ title: '', location: '', description: '' });
      setJobModalOpen(false);
      await loadJobs();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingJob(false);
    }
  };

  const deleteJob = async (id: string) => {
    if (!confirm('Delete this job post? Candidates will no longer see it.')) return;
    setDeletingJob(id);
    try {
      const res = await authedFetch(`/api/company/jobs?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not delete the job');
      await loadJobs();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingJob(null);
    }
  };

  const openCandidateChat = async (candidate: any, options: { silent?: boolean } = {}) => {
    // Phase 2: expired packages keep read-only access — the thread still loads,
    // but starting a conversation is blocked with the purchase message.
    if (plan && !plan.canChat && !options.silent) {
      alert(CHAT_LOCKED_MESSAGE);
    }
    // While the grace window is open chat works; warn once per visit that it is
    // about to close (the popup only exists when the admin kept grace enabled).
    if (plan?.status === 'grace' && !options.silent && !gracePopupSeen) {
      setGracePopupSeen(true);
      setGracePopupOpen(true);
    }
    setActiveCandidate(candidate);
    setDmMessages([]);
    setDmDraft('');
    try {
      const res = await authedFetch(`/api/company/messages?candidateId=${candidate.id}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.messages)) setDmMessages(data.messages);
    } catch {
      /* thread unavailable */
    }
  };

  const sendDirectMessage = async () => {
    const body = dmDraft.trim();
    if (!body || !activeCandidate?.id || dmSending) return;
    // Phase 2: sending needs a live package or an open grace window.
    if (plan && !plan.canChat) {
      alert(CHAT_LOCKED_MESSAGE);
      return;
    }
    setDmSending(true);
    try {
      const res = await authedFetch('/api/company/messages', {
        method: 'POST',
        body: JSON.stringify({ candidateUserId: activeCandidate.id, body }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'package_expired') throw new Error(data.message || CHAT_LOCKED_MESSAGE);
        throw new Error(data.error === 'contact_consent_required' ? 'This candidate has not allowed company contact.' : (data.error || 'Message failed'));
      }
      setDmDraft('');
      await openCandidateChat(activeCandidate);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDmSending(false);
    }
  };

  const loadCandidates = async (search: string, atsFilter = ats, fieldFilter = fieldId) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (atsFilter) params.set('ats', atsFilter);
      if (fieldFilter) params.set('field', fieldFilter);
      const res = await authedFetch(`/api/company/cvs?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error === 'company_profile_missing' ? 'Company profile missing — sign out and register again.' : (data.error || 'Could not load candidates'));
      setCandidates(Array.isArray(data.candidates) ? data.candidates : []);
      setNotice(data.notice || '');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openCandidate = async (candidateId: string) => {
    setCvLoading(true);
    setMailStatus('');
    setSubject('');
    setMessage('');
    setChatDraft('');
    try {
      const res = await authedFetch(`/api/company/cv?id=${candidateId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error === 'consent_not_granted' ? 'This candidate has withdrawn sharing consent.' : (data.error || 'Could not open CV'));
      setCvDoc(data);
      await loadChat(data.candidate?.id);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCvLoading(false);
    }
  };

  const loadChat = async (candidateUserId: string) => {
    if (!candidateUserId) { setChat([]); return; }
    try {
      const res = await authedFetch(`/api/company/messages?candidateId=${candidateUserId}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.messages)) setChat(data.messages);
      else setChat([]);
    } catch {
      setChat([]);
    }
  };

  const sendChat = async () => {
    const body = chatDraft.trim();
    const candidateUserId = cvDoc?.candidate?.id;
    if (!body || !candidateUserId) return;
    // Phase 2: same package gate as the direct-message box.
    if (plan && !plan.canChat) {
      alert(CHAT_LOCKED_MESSAGE);
      return;
    }
    setSendingChat(true);
    try {
      const res = await authedFetch('/api/company/messages', {
        method: 'POST',
        body: JSON.stringify({ candidateUserId, documentId: cvDoc?.document?.id, body }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'package_expired') throw new Error(data.message || CHAT_LOCKED_MESSAGE);
        throw new Error(data.error === 'contact_consent_required' ? 'This candidate has not allowed company contact.' : (data.error || 'Message failed'));
      }
      setChatDraft('');
      await loadChat(candidateUserId);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSendingChat(false);
    }
  };

  const sendContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cvDoc?.document?.id) return;
    setSendingMail(true);
    setMailStatus('');
    try {
      const res = await authedFetch('/api/company/contact', {
        method: 'POST',
        body: JSON.stringify({ documentId: cvDoc.document.id, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error === 'contact_consent_required' ? 'This candidate has not allowed company contact.' : (data.error || 'Could not send message'));
      }
      setMailStatus(`Sent to ${data.sentTo || 'the candidate'} · ${data.emailStatus}`);
      setMessage('');
      await loadChat(cvDoc?.candidate?.id);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSendingMail(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace('/company');
  };

  // Trashed applications live only inside the sidebar's Trash box.
  const visibleApplications = applications.filter(
    (application) => normalizeApplicationStatus(application.status) !== 'trash',
  );

  if (checking) {
    return <div className="min-h-screen bg-[#0B1120] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={48} /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 p-2"><Building2 className="text-white" size={18} /></div>
            <div>
              <p className="text-sm font-extrabold text-gray-900">{companyName}</p>
              <p className="text-[11px] text-gray-500">Company portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="hidden text-xs font-bold text-gray-600 hover:text-blue-600 sm:block">Candidate site</Link>
            <button onClick={logout} className="flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700"><LogOut size={16} /> Sign out</button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-[1500px] px-4 pt-6">
        <CompanyPackageBanner access={plan} onViewPlans={() => setPlansOpen(true)} />
      </div>

      <div className="mx-auto flex max-w-[1500px] flex-col gap-6 px-4 pb-8 pt-4 lg:flex-row lg:items-start">
        <ApplicationsSidebar
          applications={applications}
          selectedId={selectedApplicationId}
          busyId={statusBusyId}
          cvLoading={cvLoading}
          onSelect={(application) => setSelectedApplicationId(application.id)}
          onStatusChange={updateApplicationStatus}
          onViewCv={openApplicationCv}
          onChat={openApplicationChat}
        />

        <main className="min-w-0 flex-1">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Talent pool</h1>
            <p className="mt-1 text-sm text-gray-500">{candidates.length} opted-in CV{candidates.length === 1 ? '' : 's'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <form onSubmit={(e) => { e.preventDefault(); loadCandidates(query); }} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, skill, title..." className="w-56 rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </form>
            <JobFieldsDropdown
              variant="light"
              size="sm"
              label=""
              allOptionLabel="All fields"
              value={fieldId}
              onSelect={(field) => {
                const next = field?.id ?? '';
                setFieldId(next);
                loadCandidates(query, ats, next);
              }}
            />
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={ats}
                onChange={(e) => { setAts(e.target.value); loadCandidates(query, e.target.value); }}
                className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-8 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All ATS grades</option>
                <option value="blue">Blue ATS</option>
                <option value="green">Green ATS</option>
                <option value="yellow">Yellow ATS</option>
              </select>
            </div>
            <button onClick={() => loadCandidates(query)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">Search</button>
          </div>
        </div>

        <div className="mb-6 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-[11px] text-blue-800">
          <ShieldCheck className="mt-0.5 shrink-0" size={14} />
          <p>{notice || 'Only candidates who turned on "Show my CV to companies" are listed. Contact details stay hidden unless the candidate separately allowed company contact.'}</p>
        </div>

        <div className="mb-6 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="text-emerald-600" size={19} />
              <h2 className="text-lg font-bold text-gray-900">Applications</h2>
            </div>
            <span className="text-xs font-semibold text-gray-500">
              {visibleApplications.length} in the inbox · {applications.length} total
            </span>
          </div>

          <p className="mb-3 text-[11px] text-gray-500">
            Click a card to mirror it in the sidebar, or sort it straight into Interviewed, Pending or Trash.
          </p>

          {applications.length === 0 ? (
            <p className="text-sm text-gray-500">
              No applications yet. Candidates can send a CV from the jobs listed on their dashboard.
            </p>
          ) : visibleApplications.length === 0 ? (
            <p className="text-sm text-gray-500">
              Every application is in the sidebar. Deleted ones stay in the Trash box until you restore them.
            </p>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {visibleApplications.map((application) => (
                <div
                  key={application.id}
                  onClick={() => setSelectedApplicationId(application.id)}
                  className={`cursor-pointer rounded-xl border bg-gray-50 p-3 transition ${
                    selectedApplicationId === application.id
                      ? 'border-blue-300 ring-2 ring-blue-100'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-gray-900">{application.candidateName}</p>
                      <p className="text-[11px] text-gray-600">
                        {application.jobTitle} · {application.cvLabel}
                        {application.applyCount > 1 ? ` · applied ${application.applyCount}×` : ''}
                      </p>
                      <p className="font-mono text-[10px] text-gray-500">
                        {application.chatId || 'Chat ID pending'}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                      {application.status !== 'received' && (
                        <span
                          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${APPLICATION_STATUS_META[application.status].badge}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${APPLICATION_STATUS_META[application.status].dot}`} />
                          {APPLICATION_STATUS_META[application.status].label}
                        </span>
                      )}
                      {application.receivedAt && (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          <CheckCircle2 size={11} /> Received
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openApplicationCv(application)}
                      disabled={!application.documentId || cvLoading}
                      className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                    >
                      <FileText size={12} /> View CV
                    </button>
                    <button
                      onClick={() => markReceived(application)}
                      disabled={receivingId === application.id || !!application.receivedAt}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      {receivingId === application.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={12} />
                      )}
                      {application.receivedAt ? 'Received' : 'Mark as Received'}
                    </button>
                    <button
                      onClick={() => openApplicationChat(application)}
                      className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-purple-700"
                    >
                      <MessageSquare size={12} /> Chat
                    </button>
                    <button
                      onClick={() => updateApplicationStatus(application, 'interview')}
                      disabled={statusBusyId === application.id}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition disabled:opacity-50 ${
                        application.status === 'interview'
                          ? `${APPLICATION_STATUS_META.interview.action} ring-2 ring-indigo-200`
                          : APPLICATION_STATUS_META.interview.actionSoft
                      }`}
                    >
                      {statusBusyId === application.id ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={12} />} Interview
                    </button>
                    <button
                      onClick={() => updateApplicationStatus(application, 'pending')}
                      disabled={statusBusyId === application.id}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition disabled:opacity-50 ${
                        application.status === 'pending'
                          ? `${APPLICATION_STATUS_META.pending.action} ring-2 ring-amber-200`
                          : APPLICATION_STATUS_META.pending.actionSoft
                      }`}
                    >
                      {statusBusyId === application.id ? <Loader2 size={12} className="animate-spin" /> : <Clock size={12} />} Pending
                    </button>
                    <button
                      onClick={() => updateApplicationStatus(application, 'trash')}
                      disabled={statusBusyId === application.id}
                      title="Move to trash"
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition disabled:opacity-50 ${APPLICATION_STATUS_META.trash.actionSoft}`}
                    >
                      {statusBusyId === application.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {featureFlags.show_jobs_on_dashboard !== false && (
          <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="text-blue-600" size={19} />
                <h2 className="text-lg font-bold text-gray-900">Your job posts</h2>
              </div>
              <button
                onClick={() => {
                  // Phase 2: job posting is closed once the package (and the
                  // grace window) has expired — read-only access remains.
                  if (plan && !plan.canPostJobs) {
                    alert(JOB_POST_LOCKED_MESSAGE);
                    return;
                  }
                  setJobModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"
              >
                <Plus size={14} /> Post a Job
              </button>
            </div>

            {jobs.length === 0 ? (
              <p className="text-sm text-gray-500">No jobs posted yet. Publish a role and it appears on candidate dashboards instantly.</p>
            ) : (
              <div className="space-y-2">
                {jobs.map((job: any) => (
                  <div key={job.id} className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-gray-900">{job.title}</p>
                      <p className="flex flex-wrap items-center gap-x-2 text-[11px] text-gray-500">
                        <span>{new Date(job.created_at).toLocaleDateString()}</span>
                        {job.location && <span className="flex items-center gap-1"><MapPin size={10} /> {job.location}</span>}
                      </p>
                      {job.description && <p className="mt-1 line-clamp-2 text-xs text-gray-600">{job.description}</p>}
                    </div>
                    <button
                      onClick={() => deleteJob(job.id)}
                      disabled={deletingJob === job.id}
                      className="shrink-0 rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                      aria-label="Delete job"
                    >
                      {deletingJob === job.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {featureFlags.enable_company_chat !== false && (
          <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="text-purple-600" size={19} />
                <h2 className="text-lg font-bold text-gray-900">Company chat</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full border border-purple-100 bg-purple-50 px-3 py-1 font-mono text-xs font-bold text-purple-700">
                  <MessageSquare size={12} /> {companyChatId || 'Chat ID pending'}
                </span>
                <button
                  onClick={() => {
                    void loadChatCandidates();
                    void loadApplications();
                  }}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-bold text-gray-600 hover:bg-gray-50"
                >
                  <RefreshCw size={12} /> Refresh
                </button>
              </div>
            </div>

            <p className="mb-3 text-[11px] text-gray-500">
              {chatFieldName
                ? `Applicants plus candidates in ${chatFieldName}. Messaging unlocks when a candidate allows company contact — applicants can always be messaged.`
                : 'Applicants are listed here. Set a recruiting field on your company account to add field-matched candidates.'}
            </p>

            {plan && !plan.canChat && (
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-800">
                <span className="flex items-center gap-1.5"><Lock size={12} /> {plan.chatMessage}</span>
                <button
                  type="button"
                  onClick={() => setPlansOpen(true)}
                  className="rounded-lg bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-red-700"
                >
                  View plans
                </button>
              </div>
            )}

            {plan?.status === 'grace' && (
              <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-900">
                {plan.graceMessage}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-2 lg:col-span-1">
                <div className="max-h-72 space-y-1 overflow-y-auto">
                  {chatCandidatesLoading && (
                    <div className="flex justify-center py-6"><Loader2 className="animate-spin text-blue-600" size={20} /></div>
                  )}
                  {!chatCandidatesLoading && chatCandidates.length === 0 && (
                    <p className="p-3 text-[11px] text-gray-500">No contactable candidates in this field yet.</p>
                  )}
                  {chatCandidates.map((candidate: any) => (
                    <button
                      key={candidate.id}
                      onClick={() => openCandidateChat(candidate)}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition hover:bg-white ${activeCandidate?.id === candidate.id ? 'bg-white ring-1 ring-purple-200' : ''}`}
                    >
                      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 text-[11px] font-bold text-white">
                        {(candidate.fullName || 'C').slice(0, 2).toUpperCase()}
                        <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${candidate.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-bold text-gray-900">{candidate.fullName}</span>
                        <span className="block truncate font-mono text-[10px] text-gray-500">{candidate.chatId || 'Chat ID pending'}</span>
                        {candidate.appliedFor ? (
                          <span className="block truncate text-[10px] font-bold text-emerald-600">
                            Applied · {candidate.appliedFor}
                          </span>
                        ) : candidate.canChat ? (
                          <span className="block truncate text-[10px] font-semibold text-purple-600">Field match</span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Lock size={9} /> Contact locked
                          </span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col rounded-xl border border-gray-100 p-3 lg:col-span-2">
                {activeCandidate ? (
                  <>
                    <div className="mb-2 flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-gray-900">{activeCandidate.fullName}</p>
                        {activeCandidate.appliedFor && (
                          <p className="truncate text-[10px] font-bold text-emerald-600">
                            Applied · {activeCandidate.appliedFor}
                          </p>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-gray-500">{activeCandidate.chatId || 'Chat ID pending'}</span>
                    </div>
                    <div className="mb-2 max-h-56 flex-1 space-y-1.5 overflow-y-auto rounded-lg bg-gray-50 p-2">
                      {dmMessages.length === 0 && <p className="p-2 text-[11px] text-gray-400">No messages yet.</p>}
                      {dmMessages.map((m: any) => (
                        <div key={m.id} className={`text-[11px] ${m.sender === 'company' ? 'text-right' : ''}`}>
                          <span className={`inline-block rounded-lg px-2 py-1 ${m.sender === 'company' ? 'bg-purple-100 text-purple-800' : 'border border-gray-200 bg-white text-gray-700'}`}>{m.body}</span>
                          {m.document_id && (
                            <button
                              type="button"
                              onClick={() => openCandidate(m.document_id)}
                              className={`mt-0.5 flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline ${m.sender === 'company' ? 'justify-end' : ''}`}
                            >
                              <Paperclip size={10} /> {m.document_name || 'Shared document'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={dmDraft}
                        onChange={(e) => setDmDraft(e.target.value)}
                        placeholder={
                          plan && !plan.canChat
                            ? CHAT_LOCKED_MESSAGE
                            : activeCandidate.canChat === false
                              ? 'This candidate has not allowed company contact yet.'
                              : `Message ${activeCandidate.fullName}...`
                        }
                        disabled={activeCandidate.canChat === false || (plan ? !plan.canChat : false)}
                        className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-400"
                      />
                      <button
                        onClick={sendDirectMessage}
                        disabled={dmSending || !dmDraft.trim() || activeCandidate.canChat === false || (plan ? !plan.canChat : false)}
                        className="flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-2 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-50"
                      >
                        {dmSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full min-h-40 flex-col items-center justify-center gap-1 text-center">
                    <MessageSquare className="text-gray-300" size={26} />
                    <p className="text-xs font-semibold text-gray-600">Select a candidate to start chatting</p>
                    <p className="max-w-xs text-[11px] text-gray-500">Only candidates who allowed company contact appear on the left.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {loading && <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>}
        {!loading && candidates.length === 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
            <Eye className="mx-auto mb-3 text-gray-300" size={40} />
            <p className="font-bold text-gray-800">No opted-in CVs match these filters</p>
            <p className="mt-1 text-sm text-gray-500">Candidates appear here as soon as they enable sharing.</p>
          </div>
        )}


        {!loading && candidates.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {candidates.map((c) => (
              <div key={c.id} className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {c.photoUrl ? (
                      <img src={c.photoUrl} alt={c.fullName} className="h-12 w-12 rounded-full border object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-600">{c.fullName.slice(0, 1)}</div>
                    )}
                    <div>
                      <p className="font-bold leading-tight text-gray-900">{c.fullName}</p>
                      <p className="text-xs text-gray-500">{c.jobTitle || 'Candidate'}</p>
                    </div>
                  </div>
                  <AtsBadge tier={c.ats} size="xs" />
                </div>

                <p className="mb-3 line-clamp-3 text-xs leading-relaxed text-gray-600">{c.summary || 'No summary provided.'}</p>

                <div className="mb-3 flex flex-wrap gap-1">
                  {c.skills.slice(0, 5).map((s) => <span key={s} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700">{s}</span>)}
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
                  {c.location && <span>{c.location}</span>}
                  {c.nationality && <span>· {c.nationality}</span>}
                  <span>· {c.experienceYears} role{c.experienceYears === 1 ? '' : 's'}</span>
                  {c.canContact ? (
                    <span className="flex items-center gap-1 font-bold text-emerald-600"><Mail size={11} /> contactable</span>
                  ) : (
                    <span className="flex items-center gap-1 font-semibold text-gray-400"><Lock size={11} /> view only</span>
                  )}
                </div>

                <div className="mt-auto flex gap-2">
                  <button onClick={() => openCandidate(c.id)} className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700">Open CV</button>
                </div>
              </div>
            ))}
          </div>
        )}
        </main>
      </div>


      {jobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Post a job</h3>
              <button onClick={() => setJobModalOpen(false)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-200"><X size={20} /></button>
            </div>
            <form onSubmit={createJob} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Job title *</label>
                <input value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} required maxLength={120} placeholder="Senior Accountant" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Location</label>
                <input value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} maxLength={160} placeholder="London, UK or Remote" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600">Description</label>
                <textarea value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} rows={5} maxLength={4000} placeholder="Responsibilities, requirements and how to apply..." className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setJobModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100">Cancel</button>
                <button type="submit" disabled={savingJob || !jobForm.title.trim()} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                  {savingJob ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Post job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cvDoc && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4">
          <div className="my-6 w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-5 py-3">
              <div className="flex items-center gap-2">
                <p className="font-bold text-gray-900">{cvDoc.candidate?.name || 'Candidate'}</p>
                <AtsBadge tier={cvDoc.document?.ats} size="xs" />
                {cvLoading && <Loader2 size={14} className="animate-spin text-blue-600" />}
              </div>
              <button onClick={() => setCvDoc(null)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-200"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3">
              <div className="max-h-[78vh] overflow-y-auto bg-gray-100 p-4 lg:col-span-2">
                <div className="mx-auto max-w-[210mm] bg-white shadow">
                  <CVTemplateRenderer template={cvDoc.document?.template} formData={cvDoc.document?.fullData || {}} />
                </div>
              </div>

              <div className="max-h-[78vh] space-y-5 overflow-y-auto border-t border-gray-200 p-5 lg:border-l lg:border-t-0">
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-900">
                    {cvDoc.document?.canContact ? <Mail size={16} className="text-emerald-600" /> : <Lock size={16} className="text-gray-400" />}
                    Contact details
                  </h3>
                  {cvDoc.document?.canContact && cvDoc.document?.contact ? (
                    <div className="space-y-1 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs text-gray-700">
                      {cvDoc.document.contact.email && <p><strong>Email:</strong> {cvDoc.document.contact.email}</p>}
                      {cvDoc.document.contact.phone && <p><strong>Phone:</strong> {cvDoc.document.contact.phone}</p>}
                      {cvDoc.document.contact.linkedin && <p><strong>LinkedIn:</strong> {cvDoc.document.contact.linkedin}</p>}
                      {cvDoc.document.contact.instagram && <p><strong>Instagram:</strong> {cvDoc.document.contact.instagram}</p>}
                      {cvDoc.document.contact.indeed && <p><strong>Indeed:</strong> {cvDoc.document.contact.indeed}</p>}
                    </div>
                  ) : (
                    <p className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-[11px] text-gray-500">
                      This candidate allowed CV viewing but not company contact. Details stay hidden until they opt in.
                    </p>
                  )}
                </div>


                <form onSubmit={sendContact} className="space-y-2">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900"><Mail size={16} className="text-blue-600" /> Email outreach</h3>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={`Opportunity at ${companyName}`}
                    disabled={!cvDoc.document?.canContact}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    required
                    disabled={!cvDoc.document?.canContact}
                    placeholder="Write a short, specific message about the role..."
                    className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                  {mailStatus && <p className="text-[11px] font-semibold text-emerald-600">{mailStatus}</p>}
                  <button
                    type="submit"
                    disabled={!cvDoc.document?.canContact || sendingMail || !message.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {sendingMail ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send via CVNova
                  </button>
                  {!cvDoc.document?.canContact && <p className="text-[10px] text-gray-400">Outreach unlocks only after the candidate allows company contact.</p>}
                </form>

                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-900"><MessageSquare size={16} className="text-purple-600" /> In-app chat</h3>
                  <div className="mb-2 max-h-48 space-y-1.5 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-2">
                    {chat.length === 0 && <p className="p-2 text-[11px] text-gray-400">No messages yet.</p>}
                    {chat.map((m: any) => (
                      <div key={m.id} className={`text-[11px] ${m.sender === 'company' ? 'text-right' : ''}`}>
                        <span className={`inline-block rounded-lg px-2 py-1 ${m.sender === 'company' ? 'bg-purple-100 text-purple-800' : 'border border-gray-200 bg-white text-gray-700'}`}>{m.body}</span>
                        {m.document_id && (
                          <button
                            type="button"
                            onClick={() => openCandidate(m.document_id)}
                            className={`mt-0.5 flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline ${m.sender === 'company' ? 'justify-end' : ''}`}
                          >
                            <Paperclip size={10} /> {m.document_name || 'Shared document'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={chatDraft}
                      onChange={(e) => setChatDraft(e.target.value)}
                      placeholder={plan && !plan.canChat ? CHAT_LOCKED_MESSAGE : 'Write a message...'}
                      disabled={plan ? !plan.canChat : false}
                      className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-400"
                    />
                    <button
                      onClick={sendChat}
                      disabled={sendingChat || !chatDraft.trim() || !cvDoc.document?.canContact || (plan ? !plan.canChat : false)}
                      className="rounded-lg bg-purple-600 px-3 py-2 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-50"
                    >
                      {sendingChat ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    </button>
                  </div>
                </div>

                <p className="border-t border-gray-100 pt-3 text-[10px] leading-relaxed text-gray-400">
                  Consent is re-checked on every request. If the candidate withdraws consent, this CV and thread close immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {gracePopupOpen && plan?.status === 'grace' && (
        <GracePeriodPopup
          access={plan}
          onClose={() => setGracePopupOpen(false)}
          onViewPlans={() => {
            setGracePopupOpen(false);
            setPlansOpen(true);
          }}
        />
      )}

      {plansOpen && (
        <PackagePlansModal
          access={plan}
          packages={planPackages}
          onClose={() => setPlansOpen(false)}
        />
      )}
    </div>
  );
}

