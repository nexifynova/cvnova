/**
 * Recruiter ATS pipeline statuses for job_applications.
 *
 * The database column is plain `text` with a CHECK constraint, so every value
 * that reaches the UI goes through `normalizeApplicationStatus` first. Keeping
 * the labels and Tailwind classes in one place means the dashboard cards and
 * the sidebar boxes can never drift apart.
 */

export type ApplicationStatus = 'received' | 'interview' | 'pending' | 'trash';

export const APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  'received',
  'interview',
  'pending',
  'trash',
];

export type ApplicationStatusMeta = {
  /** Short label used on cards, pills and buttons. */
  label: string;
  /** Box heading in the recruiter sidebar. */
  sidebarTitle: string;
  /** One line explaining what the box holds. */
  hint: string;
  /** Pill used on cards and in the selected candidate box. */
  badge: string;
  /** Filled action button in its idle state. */
  action: string;
  /** Outlined action button in its idle state. */
  actionSoft: string;
  /** Card / box border colour. */
  box: string;
  /** Gradient used by the sidebar box header. */
  header: string;
  /** Count pill inside the sidebar header. */
  countPill: string;
  /** Small status dot. */
  dot: string;
};

export const APPLICATION_STATUS_META: Record<ApplicationStatus, ApplicationStatusMeta> = {
  received: {
    label: 'Received',
    sidebarTitle: 'Received',
    hint: 'New applications waiting for a first look.',
    badge: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
    action: 'bg-emerald-600 text-white hover:bg-emerald-700',
    actionSoft: 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    box: 'border-emerald-100',
    header: 'from-emerald-500 to-teal-600',
    countPill: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  interview: {
    label: 'Interview',
    sidebarTitle: 'Interviewed',
    hint: 'Shortlisted candidates you have called in.',
    badge: 'border border-indigo-200 bg-indigo-50 text-indigo-700',
    action: 'bg-indigo-600 text-white hover:bg-indigo-700',
    actionSoft: 'border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
    box: 'border-indigo-100',
    header: 'from-indigo-500 to-violet-600',
    countPill: 'bg-indigo-100 text-indigo-700',
    dot: 'bg-indigo-500',
  },
  pending: {
    label: 'Pending',
    sidebarTitle: 'Pending',
    hint: 'Kept on hold until you decide.',
    badge: 'border border-amber-200 bg-amber-50 text-amber-700',
    action: 'bg-amber-500 text-white hover:bg-amber-600',
    actionSoft: 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
    box: 'border-amber-100',
    header: 'from-amber-400 to-orange-500',
    countPill: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
  },
  trash: {
    label: 'Trash',
    sidebarTitle: 'Trash (Deleted)',
    hint: 'Deleted applications — restore any you still need.',
    badge: 'border border-red-200 bg-red-50 text-red-700',
    action: 'bg-red-600 text-white hover:bg-red-700',
    actionSoft: 'border border-red-200 bg-red-50 text-red-600 hover:bg-red-100',
    box: 'border-red-100',
    header: 'from-rose-500 to-red-600',
    countPill: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
  },
};

export function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return APPLICATION_STATUSES.includes(String(value ?? '').trim().toLowerCase() as ApplicationStatus);
}

/** Anything unknown (old rows, typos) falls back to 'received'. */
export function normalizeApplicationStatus(value: unknown): ApplicationStatus {
  const status = String(value ?? '').trim().toLowerCase();
  return isApplicationStatus(status) ? (status as ApplicationStatus) : 'received';
}

/** Shape returned by GET /api/company/applications. */
export type JobApplicationRow = {
  id: string;
  jobId: string | null;
  jobTitle: string;
  candidateUserId: string | null;
  candidateName: string;
  chatId: string;
  documentId: string | null;
  cvLabel: string;
  emailStatus: string;
  applyCount: number;
  receivedAt: string | null;
  createdAt: string;
  status: ApplicationStatus;
};
