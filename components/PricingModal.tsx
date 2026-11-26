'use client';

import Link from 'next/link';
import { X, Sparkles, ShieldCheck, Clock, ArrowRight } from 'lucide-react';

export type PricingReason = 'ats_limit' | 'template_locked' | 'trial_expired' | 'limit_reached' | 'upgrade';

const COPY: Record<PricingReason, { title: string; body: string; cta: string }> = {
  ats_limit: {
    title: 'Your 3 free Blue ATS uses are finished',
    body: 'Blue ATS templates are the strongest format for automated screening. Upgrade to keep using them without limits — or reactivate your account for just $2.',
    cta: 'Unlock unlimited Blue ATS',
  },
  template_locked: {
    title: 'This is a premium template',
    body: 'Premium templates add recruiter-grade layouts, colour systems and extras. Upgrade to use all 25 templates.',
    cta: 'Unlock all 25 templates',
  },
  trial_expired: {
    title: 'Your 2-month free trial has ended',
    body: 'Your documents are safe and stay downloadable. To keep creating and editing new CVs, choose a plan or reactivate for $2.',
    cta: 'Continue with a plan',
  },
  limit_reached: {
    title: 'Document limit reached',
    body: 'You have used all documents included in your current plan. Top up with extra CVs or upgrade for a bigger allowance.',
    cta: 'Get more documents',
  },
  upgrade: {
    title: 'Upgrade CVNova',
    body: 'Unlock premium templates, unlimited Blue ATS usage and company visibility.',
    cta: 'View plans',
  },
};

export default function PricingModal({
  open,
  reason = 'upgrade',
  onClose,
  atsUsed,
  atsLimit,
  reactivationPrice = 2,
}: {
  open: boolean;
  reason?: PricingReason;
  onClose: () => void;
  atsUsed?: number;
  atsLimit?: number;
  reactivationPrice?: number;
}) {
  if (!open) return null;
  const copy = COPY[reason] || COPY.upgrade;

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 px-7 py-6 text-white">
          <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full bg-white/15 p-1.5 hover:bg-white/25">
            <X size={18} />
          </button>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} /> CVNova Premium
          </div>
          <h2 className="text-2xl font-extrabold leading-tight">{copy.title}</h2>
          <p className="mt-2 text-sm text-blue-100">{copy.body}</p>
          {typeof atsUsed === 'number' && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-black/20 px-3 py-1.5 text-xs font-semibold">
              <Clock size={13} /> Blue ATS used: {atsUsed} / {atsLimit ?? 3}
            </p>
          )}
        </div>

        <div className="space-y-3 p-6">
          <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <ShieldCheck className="mt-0.5 text-blue-600" size={20} />
            <div>
              <p className="text-sm font-bold text-gray-900">Reactivate for ${reactivationPrice}</p>
              <p className="text-xs text-gray-600">One-time payment, no subscription. Unlocks creation again and resets your Blue ATS allowance.</p>
            </div>
          </div>

          <Link
            href="/payment?package=Reactivation"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg hover:from-blue-500 hover:to-purple-500"
          >
            {copy.cta} <ArrowRight size={16} />
          </Link>
          <Link
            href="/pricing"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            Compare all plans
          </Link>
          <p className="pt-1 text-center text-[11px] text-gray-400">Pay with Skrill, Payoneer, EasyPaisa, Binance or bank transfer.</p>
        </div>
      </div>
    </div>
  );
}
