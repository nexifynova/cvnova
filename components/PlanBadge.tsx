'use client';

import { Crown, ShieldCheck, Clock, Lock, RefreshCw } from 'lucide-react';
import { getPlanBadgeInfo, type PlanTone } from '@/lib/account-status';

// Package badge: Basic (free/trial) vs Premium (paid/reactivated), plus the
// transient trial / locked states. Shared by the dashboard, builder and admin
// so the account model reads the same everywhere.
const TONES: Record<
  PlanTone,
  { wrap: string; icon: string; Icon: typeof Crown }
> = {
  premium: {
    wrap: 'bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 text-amber-950 border-amber-300 shadow-amber-200/70',
    icon: 'text-amber-800',
    Icon: Crown,
  },
  reactivated: {
    wrap: 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border-emerald-200 shadow-emerald-100',
    icon: 'text-emerald-600',
    Icon: RefreshCw,
  },
  trial: {
    wrap: 'bg-gradient-to-r from-blue-50 to-sky-50 text-blue-800 border-blue-200 shadow-blue-100',
    icon: 'text-blue-600',
    Icon: Clock,
  },
  locked: {
    wrap: 'bg-gradient-to-r from-red-50 to-rose-50 text-red-800 border-red-200 shadow-red-100',
    icon: 'text-red-600',
    Icon: Lock,
  },
  basic: {
    wrap: 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 border-slate-200 shadow-slate-100',
    icon: 'text-slate-500',
    Icon: ShieldCheck,
  },
};

export default function PlanBadge({
  profile,
  plan,
  size = 'md',
  hideSubtitle = false,
  className = '',
}: {
  profile?: any;
  plan?: any;
  size?: 'sm' | 'md' | 'lg';
  hideSubtitle?: boolean;
  className?: string;
}) {
  const info = getPlanBadgeInfo(profile, plan);
  const tone = TONES[info.tone] || TONES.basic;
  const { Icon } = tone;

  const sizeCls =
    size === 'lg'
      ? 'text-base px-4 py-2 gap-2'
      : size === 'sm'
        ? 'text-[11px] px-2.5 py-1 gap-1'
        : 'text-sm px-3 py-1.5 gap-1.5';
  const iconSize = size === 'lg' ? 18 : size === 'sm' ? 12 : 15;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span
        className={`inline-flex w-fit items-center rounded-full border font-bold shadow-sm ${tone.wrap} ${sizeCls}`}
      >
        <Icon size={iconSize} className={tone.icon} />
        {info.name}
      </span>
      {!hideSubtitle && info.subtitle && (
        <span className="text-xs text-gray-500">{info.subtitle}</span>
      )}
    </div>
  );
}
