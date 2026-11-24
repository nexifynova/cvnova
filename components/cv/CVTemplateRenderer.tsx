'use client';

import { ATS_META, getTemplate } from '@/lib/templates';
import { normalizeCV } from './shared';
import ClassicGray from './templates/ClassicGray';
import Modern from './templates/Modern';
import Classic from './templates/Classic';
import Minimal from './templates/Minimal';
import Simple from './templates/Simple';
import Compact from './templates/Compact';
import Professional from './templates/Professional';
import BlueHeader from './templates/BlueHeader';
import Tech from './templates/Tech';
import Timeline from './templates/Timeline';
import Creative from './templates/Creative';
import Executive from './templates/Executive';
import Elegant from './templates/Elegant';
import Corporate from './templates/Corporate';
import Bold from './templates/Bold';
import BlueCorporate from './templates/BlueCorporate';
import RedExecutive from './templates/RedExecutive';
import GreenProfessional from './templates/GreenProfessional';
import DarkMode from './templates/DarkMode';
import Nordic from './templates/Nordic';
import Gradient from './templates/Gradient';
import Academic from './templates/Academic';
import Consultant from './templates/Consultant';
import Startup from './templates/Startup';
import Europass from './templates/Europass';

const REGISTRY: Record<string, (p: { data: any }) => any> = {
  classicgray: ClassicGray,
  modern: Modern,
  classic: Classic,
  minimal: Minimal,
  simple: Simple,
  compact: Compact,
  professional: Professional,
  blueheader: BlueHeader,
  tech: Tech,
  timeline: Timeline,
  creative: Creative,
  executive: Executive,
  elegant: Elegant,
  corporate: Corporate,
  bold: Bold,
  bluecorporate: BlueCorporate,
  redexecutive: RedExecutive,
  greenprofessional: GreenProfessional,
  darkmode: DarkMode,
  nordic: Nordic,
  gradient: Gradient,
  academic: Academic,
  consultant: Consultant,
  startup: Startup,
  europass: Europass,
};

export default function CVTemplateRenderer({
  template,
  formData,
  showAtsBadge = true,
}: {
  template: string;
  formData: any;
  showAtsBadge?: boolean;
}) {
  const Component = REGISTRY[template] || REGISTRY.classicgray;
  const meta = getTemplate(template);
  const ats = ATS_META[meta.ats];

  return (
    <div className="relative">
      {showAtsBadge && (
        <div className={`absolute right-3 top-3 z-10 hidden items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold shadow-sm print:hidden md:inline-flex ${ats.className}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${ats.dot}`} /> {ats.short}
          <span className="font-medium opacity-70">· {meta.tier === 'premium' ? 'Premium' : 'Free'}</span>
        </div>
      )}
      <Component data={normalizeCV(formData)} />
    </div>
  );
}
