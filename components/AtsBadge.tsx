import { ATS_META, type AtsTier } from '@/lib/templates';
import { BadgeCheck } from 'lucide-react';

export default function AtsBadge({
  tier,
  size = 'sm',
  withHint = false,
}: {
  tier: AtsTier;
  size?: 'xs' | 'sm' | 'md';
  withHint?: boolean;
}) {
  const meta = ATS_META[tier];
  const sizing =
    size === 'xs' ? 'text-[9px] px-1.5 py-0.5 gap-0.5' : size === 'md' ? 'text-sm px-3 py-1.5 gap-1.5' : 'text-[11px] px-2 py-1 gap-1';
  const icon = size === 'xs' ? 9 : size === 'md' ? 16 : 12;

  return (
    <span className="inline-flex flex-col">
      <span className={`inline-flex items-center rounded-full border font-bold whitespace-nowrap ${meta.className} ${sizing}`}>
        <BadgeCheck size={icon} /> {meta.short}
      </span>
      {withHint && <span className="mt-1 text-[11px] text-gray-500">{meta.hint}</span>}
    </span>
  );
}
