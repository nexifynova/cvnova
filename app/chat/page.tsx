'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, authedFetch } from '@/lib/supabase';
import { ArrowLeft, Building2, FileText, Loader2, MessageSquare, Paperclip, Search, Send, Users, X } from 'lucide-react';

type ChatProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  chat_id: string | null;
  job_field_id: string | null;
  is_online: boolean | null;
  last_seen_at: string | null;
};

type ChatCompany = {
  id: string;
  companyName: string;
  chatId: string;
  industry: string;
  country: string;
  jobFieldId: string | null;
};

type CompanyMessage = {
  id: string;
  company_id: string;
  candidate_user_id: string;
  sender: 'company' | 'candidate' | 'system';
  body: string;
  document_id?: string | null;
  document_name?: string | null;
  created_at: string;
};

type ChatMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  is_read: boolean;
  document_id?: string | null;
  document_name?: string | null;
  created_at: string;
};

// A saved document the candidate can send inside a chat instead of retyping.
type SavedDocument = {
  id: string;
  full_name: string | null;
  document_type: string | null;
  template_name: string | null;
  full_data: any;
  created_at: string;
};

// A user is treated as offline when the heartbeat is older than 2.5 minutes
// (browser crashes / network drops would otherwise leave is_online stuck on).
const ONLINE_WINDOW_MS = 2.5 * 60 * 1000;
const HEARTBEAT_MS = 45 * 1000;
const CLOCK_TICK_MS = 30 * 1000;

const isOnlineNow = (profile: ChatProfile | null | undefined, now: number | null) => {
  if (!profile?.is_online) return false;
  // Wait for the client clock so the first render matches the server markup.
  if (now === null || !profile.last_seen_at) return true;
  return now - new Date(profile.last_seen_at).getTime() < ONLINE_WINDOW_MS;
};

const sortProfiles = (list: ChatProfile[], now: number | null) =>
  [...list].sort((a, b) => {
    const aOnline = isOnlineNow(a, now) ? 0 : 1;
    const bOnline = isOnlineNow(b, now) ? 0 : 1;
    if (aOnline !== bOnline) return aOnline - bOnline;
    return (a.full_name || a.chat_id || '').localeCompare(b.full_name || b.chat_id || '');
  });

const mergeMessages = (base: ChatMessage[], extra: ChatMessage[]) => {
  const map = new Map<string, ChatMessage>();
  [...base, ...extra].forEach((message) => map.set(message.id, message));
  return Array.from(map.values()).sort((a, b) => a.created_at.localeCompare(b.created_at));
};

const getInitials = (profile: ChatProfile | null) => {
  const source = (profile?.full_name || profile?.chat_id || profile?.email || 'CV')
    .replace('@', ' ')
    .trim();
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  return initials || 'CV';
};

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// Document title shown in chat — never the UUID.
const documentLabel = (doc: SavedDocument) => {
  const type = String(doc?.document_type || 'CV');
  const title = String(doc?.full_data?.jobTitle || doc?.full_name || '').trim() || type;
  return type === 'CV' ? `${title} CV` : `${title} · ${type}`;
};

export default function ChatPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [myProfile, setMyProfile] = useState<ChatProfile | null>(null);
  const [profiles, setProfiles] = useState<ChatProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [clock, setClock] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldFilter, setFieldFilter] = useState<string | null>(null);
  const [fieldName, setFieldName] = useState<string | null>(null);
  // Legacy accounts have no job_field_id, so we also match them through the
  // job title stored on their saved CV.
  const [legacyFieldIds, setLegacyFieldIds] = useState<Set<string>>(() => new Set());
  const [legacyFieldEmails, setLegacyFieldEmails] = useState<Set<string>>(() => new Set());
  // Company side of the chat room: search a company chat ID to talk directly.
  const [companies, setCompanies] = useState<ChatCompany[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<ChatCompany | null>(null);
  const [companyMessages, setCompanyMessages] = useState<CompanyMessage[]>([]);
  const [companyMessagesLoading, setCompanyMessagesLoading] = useState(false);
  const [companyDraft, setCompanyDraft] = useState('');
  const [companySending, setCompanySending] = useState(false);
  // Saved documents + the paperclip picker used to share them in chat.
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const [docPickerOpen, setDocPickerOpen] = useState(false);
  const [sharingDocId, setSharingDocId] = useState<string | null>(null);

  const clockRef = useRef<number | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Presence clock — never call Date.now() during render (SSR safe).
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      clockRef.current = now;
      setClock(now);
    };
    tick();
    const interval = window.setInterval(tick, CLOCK_TICK_MS);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    selectedIdRef.current = selectedUser?.id ?? null;
  }, [selectedUser]);

  // Auth + initial data: own profile, every registered user, unread counts.
  useEffect(() => {
    let cancelled = false;
    let activeUserId: string | null = null;

    const boot = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      if (cancelled) return;

      activeUserId = user.id;
      setUserId(user.id);

      // Phase 2: /chat?field=<uuid> scopes the room to one job field.
      const requestedField = new URLSearchParams(window.location.search).get('field');
      if (requestedField) {
        setFieldFilter(requestedField);
        const { data: fieldRow } = await supabase
          .from('job_fields')
          .select('id, field_name')
          .eq('id', requestedField)
          .maybeSingle();
        if (cancelled) return;
        if (fieldRow) {
          const label = (fieldRow as { field_name: string }).field_name;
          setFieldName(label);

          // Legacy accounts were saved before job fields existed, so match them
          // through the job title on their latest CV. The CV rows are matched
          // server-side (service role) — generated_documents is not readable
          // with the anon key any more.
          try {
            const res = await authedFetch(`/api/chat/job-field-candidates?field=${encodeURIComponent(requestedField)}`);
            const data = await res.json();
            if (!cancelled && res.ok) {
              setLegacyFieldIds(new Set<string>(Array.isArray(data.userIds) ? data.userIds : []));
              setLegacyFieldEmails(new Set<string>(Array.isArray(data.emails) ? data.emails : []));
            }
          } catch {
            /* legacy title matching unavailable */
          }
          if (cancelled) return;
        }
      }

      // A company chat ID can be passed from the dashboard "Listed Companies"
      // box (/chat?company=@ChatID). The auto-open effect picks it up.
      const requestedCompany = new URLSearchParams(window.location.search).get('company');
      if (requestedCompany) {
        setSearchTerm(requestedCompany.startsWith('@') ? requestedCompany : `@${requestedCompany}`);
      }

      const { data: myData } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, chat_id, job_field_id, is_online, last_seen_at')
        .eq('id', user.id)
        .maybeSingle();

      if (cancelled) return;
      if (myData) setMyProfile(myData as ChatProfile);

      // Presence ON
      await supabase
        .from('user_profiles')
        .update({ is_online: true, last_seen_at: new Date().toISOString() })
        .eq('id', user.id);

      const [profilesResult, unreadResult] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('id, full_name, email, chat_id, job_field_id, is_online, last_seen_at')
          .neq('id', user.id),
        supabase
          .from('messages')
          .select('sender_id')
          .eq('receiver_id', user.id)
          .eq('is_read', false),
      ]);

      if (cancelled) return;

      if (profilesResult.error) setErrorMessage(profilesResult.error.message);
      if (profilesResult.data) {
        setProfiles(sortProfiles(profilesResult.data as ChatProfile[], clockRef.current));
      }

      if (unreadResult.data) {
        const counts: Record<string, number> = {};
        (unreadResult.data as { sender_id: string }[]).forEach((row) => {
          counts[row.sender_id] = (counts[row.sender_id] || 0) + 1;
        });
        setUnread(counts);
      }

      // Companies a candidate can message directly from the chat room.
      try {
        const res = await authedFetch('/api/chat/companies');
        const data = await res.json();
        if (!cancelled && res.ok && Array.isArray(data.companies)) setCompanies(data.companies);
      } catch {
        /* company chat not enabled */
      }

      // Saved documents for the paperclip (share) picker.
      if (user.email) {
        const { data: myDocs } = await supabase
          .from('generated_documents')
          .select('id, full_name, document_type, template_name, full_data, created_at')
          .eq('email', user.email)
          .order('created_at', { ascending: false })
          .limit(100);
        if (!cancelled && myDocs) setDocuments(myDocs as SavedDocument[]);
      }

      if (cancelled) return;
      setLoading(false);
    };

    void boot();

    // Mark the user offline when the tab closes or the route changes.
    const goOffline = () => {
      if (!activeUserId) return;
      void supabase
        .from('user_profiles')
        .update({ is_online: false, last_seen_at: new Date().toISOString() })
        .eq('id', activeUserId);
    };

    window.addEventListener('pagehide', goOffline);

    return () => {
      cancelled = true;
      window.removeEventListener('pagehide', goOffline);
      goOffline();
    };
  }, [router]);

  // Heartbeat: keep the online flag and last_seen_at fresh.
  useEffect(() => {
    if (!userId) return;
    const interval = window.setInterval(() => {
      void supabase
        .from('user_profiles')
        .update({ is_online: true, last_seen_at: new Date().toISOString() })
        .eq('id', userId);
    }, HEARTBEAT_MS);
    return () => window.clearInterval(interval);
  }, [userId]);

  // Realtime: new users and online/offline changes without a refresh.
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('chat-user-profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_profiles' },
        (payload) => {
          const row = payload.new as ChatProfile | undefined;
          if (!row?.id || row.id === userId) return;

          const nextProfile: ChatProfile = {
            id: row.id,
            full_name: row.full_name ?? null,
            email: row.email ?? null,
            chat_id: row.chat_id ?? null,
            job_field_id: row.job_field_id ?? null,
            is_online: row.is_online ?? false,
            last_seen_at: row.last_seen_at ?? null,
          };

          setProfiles((prev) => {
            const others = prev.filter((profile) => profile.id !== row.id);
            return sortProfiles([...others, nextProfile], clockRef.current);
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  const markConversationRead = useCallback(
    async (otherUserId: string) => {
      if (!userId) return;
      setUnread((prev) => ({ ...prev, [otherUserId]: 0 }));
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', userId)
        .eq('sender_id', otherUserId)
        .eq('is_read', false);
    },
    [userId]
  );

  // Realtime: incoming / outgoing messages without a page refresh.
  useEffect(() => {
    if (!userId) return;

    const handleInsert = (payload: { new: ChatMessage }) => {
      const message = payload.new;
      if (!message?.id) return;

      const isMine = message.sender_id === userId;
      const activeId = selectedIdRef.current;
      const belongsToActive =
        !!activeId &&
        (message.sender_id === activeId || message.receiver_id === activeId);

      if (belongsToActive) {
        setMessages((prev) =>
          prev.some((item) => item.id === message.id) ? prev : mergeMessages(prev, [message])
        );
        if (!isMine) void markConversationRead(message.sender_id);
      } else if (!isMine) {
        setUnread((prev) => ({
          ...prev,
          [message.sender_id]: (prev[message.sender_id] || 0) + 1,
        }));
      }
    };

    const channel = supabase
      .channel(`chat-messages-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${userId}` },
        handleInsert
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `sender_id=eq.${userId}` },
        handleInsert
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, markConversationRead]);

  // Load the full previous conversation for the selected user.
  const openConversation = useCallback(
    async (profile: ChatProfile) => {
      if (!userId) return;

      setSelectedUser(profile);
      setSelectedCompany(null);
      setCompanyMessages([]);
      setCompanyDraft('');
      setMessages([]);
      setMessagesLoading(true);
      setErrorMessage(null);
      setUnread((prev) => ({ ...prev, [profile.id]: 0 }));

      const conversationFilter =
        `and(sender_id.eq.${userId},receiver_id.eq.${profile.id}),` +
        `and(sender_id.eq.${profile.id},receiver_id.eq.${userId})`;

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(conversationFilter)
        .order('created_at', { ascending: true });

      if (error) {
        setErrorMessage(error.message);
        setMessagesLoading(false);
        return;
      }

      const loaded = (data as ChatMessage[]) ?? [];
      // Keep any message that arrived over realtime while the history loaded.
      setMessages((prev) =>
        mergeMessages(
          loaded,
          prev.filter(
            (message) =>
              message.sender_id === profile.id || message.receiver_id === profile.id
          )
        )
      );
      setMessagesLoading(false);

      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', userId)
        .eq('sender_id', profile.id)
        .eq('is_read', false);
    },
    [userId]
  );

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId || !selectedUser || sending) return;

    const text = draft.trim();
    if (!text) return;

    setSending(true);
    setDraft('');
    setErrorMessage(null);

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: userId,
        receiver_id: selectedUser.id,
        message_text: text,
      })
      .select('*')
      .single();

    if (error) {
      setDraft(text);
      setErrorMessage(`Message could not be sent: ${error.message}`);
    } else if (data) {
      const sent = data as ChatMessage;
      setMessages((prev) =>
        prev.some((item) => item.id === sent.id) ? prev : mergeMessages(prev, [sent])
      );
    }

    setSending(false);
  };

  const handleBackToList = () => {
    setSelectedUser(null);
    setSelectedCompany(null);
    setCompanyMessages([]);
    setCompanyDraft('');
    setSearchTerm('');
  };

  const loadCompanyMessages = useCallback(async (companyId: string) => {
    try {
      const res = await authedFetch(`/api/company/messages?companyId=${encodeURIComponent(companyId)}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.messages)) {
        setCompanyMessages(
          (data.messages as CompanyMessage[]).filter((message) => message.company_id === companyId),
        );
      }
    } catch {
      /* company thread unavailable */
    }
  }, []);

  const openCompanyConversation = useCallback(
    async (company: ChatCompany) => {
      setSelectedUser(null);
      setMessages([]);
      setSelectedCompany(company);
      setCompanyMessages([]);
      setCompanyDraft('');
      setCompanyMessagesLoading(true);
      setErrorMessage(null);
      await loadCompanyMessages(company.id);
      setCompanyMessagesLoading(false);
    },
    [loadCompanyMessages]
  );

  // Keep the company thread fresh: replies and new applications arrive through
  // the API, so a light poll keeps the conversation live.
  useEffect(() => {
    if (!selectedCompany) return;
    const interval = window.setInterval(() => {
      void loadCompanyMessages(selectedCompany.id);
    }, 8000);
    return () => window.clearInterval(interval);
  }, [selectedCompany, loadCompanyMessages]);

  // Typing a company chat ID (for example @Nexify6902939) opens that company.
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return;
    const normalized = term.startsWith('@') ? term : `@${term}`;
    const match = companies.find((company) => company.chatId.toLowerCase() === normalized);
    if (match && selectedCompany?.id !== match.id) void openCompanyConversation(match);
  }, [searchTerm, companies, selectedCompany, openCompanyConversation]);

  const handleSendToCompany = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCompany || companySending) return;

    const text = companyDraft.trim();
    if (!text) return;

    setCompanySending(true);
    setCompanyDraft('');
    setErrorMessage(null);
    try {
      const res = await authedFetch('/api/company/messages', {
        method: 'POST',
        body: JSON.stringify({ companyId: selectedCompany.id, body: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Message could not be sent');
      await loadCompanyMessages(selectedCompany.id);
    } catch (err: any) {
      setCompanyDraft(text);
      setErrorMessage(`Message could not be sent: ${err?.message || err}`);
    } finally {
      setCompanySending(false);
    }
  };

  // Sends one saved document into the open conversation. Only the document
  // name travels in the message body — the UUID stays in the reference column.
  const shareDocument = async (doc: SavedDocument) => {
    if (!userId || sharingDocId) return;

    const label = documentLabel(doc);
    setSharingDocId(doc.id);
    setErrorMessage(null);

    try {
      if (selectedCompany) {
        const res = await authedFetch('/api/company/messages', {
          method: 'POST',
          body: JSON.stringify({
            companyId: selectedCompany.id,
            documentId: doc.id,
            body: `Shared document: "${label}"`,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Document could not be shared');
        await loadCompanyMessages(selectedCompany.id);
      } else if (selectedUser) {
        const { data, error } = await supabase
          .from('messages')
          .insert({
            sender_id: userId,
            receiver_id: selectedUser.id,
            message_text: `Shared document: "${label}"`,
            document_id: doc.id,
            document_name: label,
          })
          .select('*')
          .single();
        if (error) throw error;
        if (data) {
          const sent = data as ChatMessage;
          setMessages((prev) =>
            prev.some((item) => item.id === sent.id) ? prev : mergeMessages(prev, [sent])
          );
        }
      } else {
        setDocPickerOpen(false);
        return;
      }

      setDocPickerOpen(false);
    } catch (err: any) {
      setErrorMessage(`Document could not be shared: ${err?.message || err}`);
    } finally {
      setSharingDocId(null);
    }
  };

  // Scroll to the bottom whenever a new message arrives.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages]);

  // Phase 2: when a field filter is active, show linked profiles plus legacy
  // accounts matched through their CV job title.
  const fieldProfiles = useMemo(() => {
    if (!fieldFilter) return profiles;
    return profiles.filter((profile) => {
      if (profile.job_field_id === fieldFilter) return true;
      if (legacyFieldIds.has(profile.id)) return true;
      const email = String(profile.email || '').trim().toLowerCase();
      return !!email && legacyFieldEmails.has(email);
    });
  }, [profiles, fieldFilter, legacyFieldIds, legacyFieldEmails]);

  const sortedProfiles = useMemo(() => sortProfiles(fieldProfiles, clock), [fieldProfiles, clock]);

  const visibleProfiles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return sortedProfiles;
    return sortedProfiles.filter(
      (profile) =>
        (profile.full_name || '').toLowerCase().includes(term) ||
        (profile.chat_id || '').toLowerCase().includes(term) ||
        (profile.email || '').toLowerCase().includes(term)
    );
  }, [sortedProfiles, searchTerm]);

  const visibleCompanies = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return companies;
    return companies.filter(
      (company) =>
        company.companyName.toLowerCase().includes(term) ||
        company.chatId.toLowerCase().includes(term) ||
        (company.industry || '').toLowerCase().includes(term)
    );
  }, [companies, searchTerm]);

  const onlineCount = useMemo(
    () => fieldProfiles.filter((profile) => isOnlineNow(profile, clock)).length,
    [fieldProfiles, clock]
  );

  const totalUnread = useMemo(
    () => Object.values(unread).reduce((sum, count) => sum + count, 0),
    [unread]
  );

  const activeProfile = useMemo(
    () => (selectedUser ? profiles.find((profile) => profile.id === selectedUser.id) ?? selectedUser : null),
    [profiles, selectedUser]
  );

  const activeIsOnline = isOnlineNow(activeProfile, clock);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-semibold">Loading chat room…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 font-sans">
      <nav className="sticky top-0 z-20 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 text-lg font-extrabold text-gray-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 text-sm text-white">
              C
            </span>
            CVNova
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 font-mono text-xs font-bold text-blue-700 sm:flex">
              <MessageSquare size={13} />
              {myProfile?.chat_id || 'Chat ID pending'}
            </span>
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-gray-800 sm:text-sm"
            >
              <ArrowLeft size={15} /> Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 py-5 sm:px-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Chat Room</h1>
            {fieldName ? (
              <p className="text-sm font-semibold text-indigo-600">
                Field: {fieldName} — showing professionals in this field only.
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Real-time messages — no page refresh needed.
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              {onlineCount} online
            </span>
            {totalUnread > 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-bold text-white">
                {totalUnread} unread
              </span>
            )}
            {fieldFilter && (
              <Link
                href="/chat"
                className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
              >
                {fieldName || 'Field'} <span aria-hidden="true">×</span>
              </Link>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
            {errorMessage}
          </div>
        )}

        <div className="flex h-[72vh] min-h-[520px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {/* LEFT: registered users + online dots */}
          <aside
            className={`${selectedUser || selectedCompany ? 'hidden md:flex' : 'flex'} w-full flex-col border-r border-gray-100 md:w-80 md:min-w-[20rem]`}
          >
            <div className="border-b border-gray-100 p-3">
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-500">
                  <Users size={13} /> Registered Users
                </p>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                  {visibleProfiles.length}
                </span>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by name, email or company chat ID"
                  className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm text-gray-800 outline-none transition focus:border-blue-500"
                />
              </div>
            </div>

            {visibleCompanies.length > 0 && (
              <div className="border-b border-gray-100 px-3 py-2">
                <p className="mb-1 flex items-center gap-1.5 px-1 text-[11px] font-bold uppercase tracking-wide text-gray-500">
                  <Building2 size={13} /> Companies
                </p>
                <div className="max-h-40 space-y-1 overflow-y-auto">
                  {visibleCompanies.map((company) => {
                    const isActive = selectedCompany?.id === company.id;
                    return (
                      <button
                        key={company.id}
                        type="button"
                        onClick={() => void openCompanyConversation(company)}
                        className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-gray-50 ${
                          isActive ? 'bg-purple-50 ring-1 ring-purple-200' : ''
                        }`}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white">
                          <Building2 size={16} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-gray-900">
                            {company.companyName}
                          </span>
                          <span className="mt-0.5 block truncate font-mono text-[11px] text-gray-500">
                            {company.chatId}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {visibleProfiles.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-10 text-center">
                  <Users className="h-8 w-8 text-gray-300" />
                  <p className="text-sm font-semibold text-gray-600">
                    {profiles.length === 0
                      ? 'No other users have registered yet'
                      : 'No users match your search'}
                  </p>
                  <p className="text-xs text-gray-400">
                    New sign-ups appear here in real time.
                  </p>
                </div>
              ) : (
                visibleProfiles.map((profile) => {
                  const online = isOnlineNow(profile, clock);
                  const unreadCount = unread[profile.id] || 0;
                  const isActive = activeProfile?.id === profile.id;

                  return (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => void openConversation(profile)}
                      className={`flex w-full items-center gap-3 border-b border-gray-50 px-3 py-3 text-left transition hover:bg-gray-50 ${
                        isActive ? 'bg-blue-50/80' : ''
                      }`}
                    >
                      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 text-sm font-bold text-white">
                        {getInitials(profile)}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                            online ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          title={online ? 'Online' : 'Offline'}
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-bold text-gray-900">
                            {profile.full_name || 'CVNova User'}
                          </span>
                          {unreadCount > 0 && (
                            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                              {unreadCount}
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block truncate font-mono text-[11px] text-gray-500">
                          {profile.chat_id || 'Chat ID pending'}
                        </span>
                        <span
                          className={`mt-0.5 block text-[10px] font-bold ${
                            online ? 'text-green-600' : 'text-red-500'
                          }`}
                        >
                          {online ? 'Online' : 'Offline'}
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* RIGHT: active conversation */}
          <section
            className={`${selectedUser || selectedCompany ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col bg-white`}
          >
            {activeProfile ? (
              <>
                <header className="flex items-center gap-3 border-b border-gray-100 px-3 py-3 sm:px-4">
                  <button
                    type="button"
                    onClick={handleBackToList}
                    className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 md:hidden"
                    aria-label="Back to user list"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 text-sm font-bold text-white">
                    {getInitials(activeProfile)}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                        activeIsOnline ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900">
                      {activeProfile.full_name || 'CVNova User'}
                    </p>
                    <p className="truncate font-mono text-[11px] text-gray-500">
                      {activeProfile.chat_id || 'Chat ID pending'}
                    </p>
                  </div>
                  <span
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      activeIsOnline
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-600'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        activeIsOnline ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                    {activeIsOnline ? 'Online' : 'Offline'}
                  </span>
                </header>

                <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50/70 p-4">
                  {messagesLoading ? (
                    <div className="flex h-full items-center justify-center gap-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading conversation…
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <MessageSquare size={22} />
                      </div>
                      <p className="text-sm font-bold text-gray-700">No messages yet</p>
                      <p className="max-w-xs text-xs text-gray-500">
                        Send the first message — {activeProfile.chat_id || 'this user'} receives it
                        instantly.
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const mine = message.sender_id === userId;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-sm sm:max-w-[70%] ${
                              mine
                                ? 'rounded-br-md bg-blue-600 text-white'
                                : 'rounded-bl-md border border-gray-200 bg-white text-gray-800'
                            }`}
                          >
                            <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">
                              {message.message_text}
                            </p>
                            {message.document_id && (
                              <a
                                href={`/view/${message.document_id}`}
                                target="_blank"
                                rel="noreferrer"
                                className={`mt-1.5 flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold ${
                                  mine
                                    ? 'bg-white/20 text-white hover:bg-white/30'
                                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                }`}
                              >
                                <Paperclip size={12} /> {message.document_name || 'Shared document'}
                              </a>
                            )}
                            <p
                              className={`mt-1 text-[10px] ${
                                mine ? 'text-right text-blue-100' : 'text-gray-400'
                              }`}
                            >
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                <form
                  onSubmit={handleSend}
                  className="border-t border-gray-100 bg-white p-3"
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDocPickerOpen(true)}
                      disabled={documents.length === 0}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
                      aria-label="Share a saved document"
                      title={documents.length === 0 ? 'No saved documents yet' : 'Share a saved document'}
                    >
                      <Paperclip size={18} />
                    </button>
                    <input
                      type="text"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder={`Message ${activeProfile.full_name || 'user'}...`}
                      maxLength={2000}
                      autoComplete="off"
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!draft.trim() || sending}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                      aria-label="Send message"
                    >
                      {sending ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                    </button>
                  </div>
                  <p className="mt-1.5 px-1 text-[10px] text-gray-400">
                    Your message appears in the recipient&apos;s chat window instantly.
                  </p>
                </form>
              </>
            ) : selectedCompany ? (
              <div className="flex h-full flex-col">
                <header className="flex items-center gap-3 border-b border-gray-100 px-3 py-3 sm:px-4">
                  <button
                    type="button"
                    onClick={handleBackToList}
                    className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 md:hidden"
                    aria-label="Back to list"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white">
                    <Building2 size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900">{selectedCompany.companyName}</p>
                    <p className="truncate font-mono text-[11px] text-gray-500">{selectedCompany.chatId}</p>
                  </div>
                  <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-purple-700">
                    Company
                  </span>
                </header>

                <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50/70 p-4">
                  {companyMessagesLoading ? (
                    <div className="flex h-full items-center justify-center gap-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading conversation…
                    </div>
                  ) : companyMessages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                        <Building2 size={22} />
                      </div>
                      <p className="text-sm font-bold text-gray-700">No messages yet</p>
                      <p className="max-w-xs text-xs text-gray-500">
                        Send the first message — {selectedCompany.companyName} replies from their
                        company dashboard.
                      </p>
                    </div>
                  ) : (
                    companyMessages.map((message) => {
                      const mine = message.sender === 'candidate';
                      return (
                        <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-sm sm:max-w-[70%] ${
                              mine
                                ? 'rounded-br-md bg-blue-600 text-white'
                                : 'rounded-bl-md border border-gray-200 bg-white text-gray-800'
                            }`}
                          >
                            <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{message.body}</p>
                            {message.document_id && (
                              <a
                                href={`/view/${message.document_id}`}
                                target="_blank"
                                rel="noreferrer"
                                className={`mt-1.5 flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold ${
                                  mine
                                    ? 'bg-white/20 text-white hover:bg-white/30'
                                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                }`}
                              >
                                <Paperclip size={12} /> {message.document_name || 'Shared document'}
                              </a>
                            )}
                            <p
                              className={`mt-1 text-[10px] ${
                                mine ? 'text-right text-blue-100' : 'text-gray-400'
                              }`}
                            >
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={handleSendToCompany} className="border-t border-gray-100 bg-white p-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDocPickerOpen(true)}
                      disabled={documents.length === 0}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
                      aria-label="Share a saved document"
                      title={documents.length === 0 ? 'No saved documents yet' : 'Share a saved document'}
                    >
                      <Paperclip size={18} />
                    </button>
                    <input
                      type="text"
                      value={companyDraft}
                      onChange={(event) => setCompanyDraft(event.target.value)}
                      placeholder={`Message ${selectedCompany.companyName}...`}
                      maxLength={2000}
                      autoComplete="off"
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-purple-500"
                    />
                    <button
                      type="submit"
                      disabled={!companyDraft.trim() || companySending}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                      aria-label="Send message to company"
                    >
                      {companySending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                  </div>
                  <p className="mt-1.5 px-1 text-[10px] text-gray-400">
                    The company receives this in their company chat and dashboard.
                  </p>
                </form>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 bg-gray-50/50 px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <MessageSquare size={26} />
                </div>
                <div>
                  <p className="text-base font-bold text-gray-800">
                    Select a user to start chatting
                  </p>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
                    Every registered user is listed in the left sidebar. Search a company chat ID
                    (for example @Nexify6902939) to message a recruiter directly.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {docPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-3">
              <div>
                <p className="text-sm font-bold text-gray-900">Share a document</p>
                <p className="text-[11px] text-gray-500">
                  Pick a saved document — the chat shows its name, not its ID.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDocPickerOpen(false)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                aria-label="Close document picker"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-3">
              {documents.length === 0 ? (
                <p className="p-4 text-center text-xs text-gray-500">
                  No saved documents yet. Create a CV first, then share it here.
                </p>
              ) : (
                documents.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => void shareDocument(doc)}
                    disabled={sharingDocId !== null}
                    className="mb-1.5 flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 text-left transition hover:bg-white disabled:opacity-60"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <FileText size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-gray-900">
                        {documentLabel(doc)}
                      </span>
                      <span className="block text-[10px] text-gray-500">
                        {doc.document_type || 'CV'} · {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </span>
                    {sharingDocId === doc.id ? (
                      <Loader2 size={14} className="animate-spin text-blue-600" />
                    ) : (
                      <Paperclip size={14} className="text-gray-400" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
