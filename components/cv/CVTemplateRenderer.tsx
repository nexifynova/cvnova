'use client';

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
}: {
  template: string;
  formData: any;
}) {
  const Component = REGISTRY[template] || REGISTRY.classicgray;

  // NOTE: No ATS / "Premium · Free" watermark is rendered inside the CV.
  // The exported document (screen, print, PDF, Word) must stay 100% branded-free
  // so recruiters only see the candidate's content.
  return (
    <div className="relative">
      <Component data={normalizeCV(formData)} />
    </div>
  );
}
