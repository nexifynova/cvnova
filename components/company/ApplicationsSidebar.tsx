'use client';

import type { ComponentType } from 'react';
import {
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  MessageSquare,
  RotateCcw,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  APPLICATION_STATUS_META,
  normalizeApplicationStatus,
  type ApplicationStatus,
  type JobApplicationRow,
} from '@/lib/application-status';

type IconComponent = ComponentType<{ size?: number | string; className?: string }>;

type Props = {
  applications: JobApplicationRow[];
  selectedId: string | null;
  /** Application id currently waiting for the status API. */
  busyId: string | null;
  cvLoading?: boolean;
  onSelect: (application: JobApplicationRow) => void;
  onStatusChange: (application: JobApplicationRow, status: ApplicationStatus) => void;
  onViewCv: (application: JobApplicationRow) => void;
  onChat: (application: JobApplicationRow) => void;
};

/** Sidebar boxes, top to bottom. `received` stays in the main list. */
const PIPELINE: Array<{ status: ApplicationStatus; icon: IconComponent }> = [
  { status: 'interview', icon: UserCheck },
  { status: 'pending', icon: Clock },
  { status: 'trash', icon: Trash2 },
];

function Detail({ icon: Icon, label, value, mono }: { icon: IconComponent; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={12} className="mt-0.5 shrink-0 text-gray-400" />
      <div className="min-w-0">
        <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</dt>
        <dd className={`truncate text-[11px] font-semibold text-gray-700 ${mono ? 'font-mono' : ''}`}>{value}</dd>
      </div>
    </div>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Recruiter ATS sidebar: Interviewed / Pending / Trash boxes plus the
 * "Selected candidate" card that mirrors whichever record the company clicked.
 * Every box is driven by `status` on job_applications.
 */
export default function ApplicationsSidebar({
  applications,
  selectedId,
  busyId,
  cvLoading = false,
  onSelect,
  onStatusChange,
  onViewCv,
  onChat,
}: Props) {
  const selected = applications.find((application) => application.id === selectedId) || null;
  const selectedStatus = selected ? normalizeApplicationStatus(selected.status) : null;
  const selectedMeta = selectedStatus ? APPLICATION_STATUS_META[selectedStatus] : null;

  const actionClass = (target: ApplicationStatus) =>
    selectedStatus === target
      ? `${APPLICATION_STATUS_META[target].action} ring-2 ring-gray-300 ring-offset-1`
      : APPLICATION_STATUS_META[target].actionSoft;

  return (
    <aside className="w-full shrink-0 space-y-4 lg:sticky lg:top-24 lg:w-[330px]">
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 p-2">
            <Users size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-gray-900">Recruiter pipeline</p>
            <p className="text-[11px] text-gray-500">
              {applications.length} application{applications.length === 1 ? '' : 's'} tracked
            </p>
          </div>
        </div>
      </div>

      {PIPELINE.map(({ status, icon: Icon }) => {
        const meta = APPLICATION_STATUS_META[status];
        const items = applications.filter((application) => normalizeApplicationStatus(application.status) === status);

        return (
          <section key={status} className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${meta.box}`}>
            <header className={`flex items-center justify-between gap-2 bg-gradient-to-r px-4 py-3 ${meta.header}`}>
              <span className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-white">
                <Icon size={14} /> {meta.sidebarTitle}
              </span>
              <span className="rounded-full bg-white/25 px-2 py-0.5 text-[11px] font-bold text-white">{items.length}</span>
            </header>

            <p className="px-4 pt-2.5 text-[10px] leading-relaxed text-gray-500">{meta.hint}</p>

            {items.length === 0 ? (
              <p className="px-4 py-4 text-[11px] italic text-gray-400">Nothing here yet.</p>
            ) : (
              <ul className="max-h-52 space-y-1 overflow-y-auto p-2">
                {items.map((application) => {
                  const isSelected = application.id === selectedId;
                  return (
                    <li key={application.id} className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onSelect(application)}
                        className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2.5 py-2 text-left transition ${
                          isSelected ? 'bg-gray-100 ring-1 ring-gray-300' : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ${meta.countPill}`}>
                          {(application.candidateName || 'C').slice(0, 2).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-bold text-gray-900">{application.candidateName}</span>
                          <span className="block truncate text-[10px] text-gray-500">{application.jobTitle}</span>
                        </span>
                      </button>
                      {status === 'trash' && (
                        <button
                          type="button"
                          onClick={() => onStatusChange(application, 'received')}
                          disabled={busyId === application.id}
                          aria-label={`Restore ${application.candidateName}`}
                          title="Restore to received"
                          className="shrink-0 rounded-lg p-1.5 text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-40"
                        >
                          {busyId === application.id ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <header className="flex items-center justify-between gap-2 bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3">
          <span className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-white">
            <UserCheck size={14} /> Selected candidate
          </span>
          {selectedMeta && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">{selectedMeta.label}</span>
          )}
        </header>

        {selected && selectedMeta ? (
          <div className="space-y-3 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 text-sm font-extrabold text-white">
                {(selected.candidateName || 'C').slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-gray-900">{selected.candidateName}</p>
                <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${selectedMeta.badge}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${selectedMeta.dot}`} /> {selectedMeta.label}
                </span>
              </div>
            </div>

            <dl className="space-y-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
              <Detail icon={Briefcase} label="Applied for" value={selected.jobTitle || 'Role'} />
              <Detail icon={FileText} label="CV" value={selected.cvLabel || 'CV'} />
              <Detail icon={MessageSquare} label="Chat ID" value={selected.chatId || 'Chat ID pending'} mono />
              <Detail
                icon={CheckCircle2}
                label="Received"
                value={selected.receivedAt ? formatDate(selected.receivedAt) : 'Not confirmed yet'}
              />
              <Detail icon={CalendarClock} label="Applied on" value={formatDate(selected.createdAt) || '—'} />
              {selected.applyCount > 1 && (
                <Detail icon={RotateCcw} label="Times applied" value={`${selected.applyCount}×`} />
              )}
            </dl>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onViewCv(selected)}
                disabled={!selected.documentId || cvLoading}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-2 py-2 text-[11px] font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <FileText size={12} /> View CV
              </button>
              <button
                type="button"
                onClick={() => onChat(selected)}
                disabled={!selected.candidateUserId}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-purple-600 px-2 py-2 text-[11px] font-bold text-white hover:bg-purple-700 disabled:opacity-50"
              >
                <MessageSquare size={12} /> Chat
              </button>
              <button
                type="button"
                onClick={() => onStatusChange(selected, 'interview')}
                disabled={busyId === selected.id}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-bold transition disabled:opacity-50 ${actionClass('interview')}`}
              >
                {busyId === selected.id ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={12} />} Interview
              </button>
              <button
                type="button"
                onClick={() => onStatusChange(selected, 'pending')}
                disabled={busyId === selected.id}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-bold transition disabled:opacity-50 ${actionClass('pending')}`}
              >
                {busyId === selected.id ? <Loader2 size={12} className="animate-spin" /> : <Clock size={12} />} Pending
              </button>
            </div>

            {selectedStatus === 'trash' ? (
              <button
                type="button"
                onClick={() => onStatusChange(selected, 'received')}
                disabled={busyId === selected.id}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-2 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
              >
                <RotateCcw size={12} /> Restore from trash
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onStatusChange(selected, 'trash')}
                disabled={busyId === selected.id}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2 py-2 text-[11px] font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
              >
                <Trash2 size={12} /> Delete (move to trash)
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 px-4 py-8 text-center">
            <Users className="text-gray-300" size={24} />
            <p className="text-xs font-semibold text-gray-600">No candidate selected</p>
            <p className="text-[11px] text-gray-500">Click a candidate card to see every detail here.</p>
          </div>
        )}
      </section>
    </aside>
  );
}

