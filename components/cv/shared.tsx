import type { ReactNode } from 'react';

export interface ExperienceItem { role?: string; company?: string; duration?: string; desc?: string }
export interface EducationItem { degree?: string; school?: string; year?: string }
export interface LanguageItem { language?: string; proficiency?: string }
export interface CertificationItem { name?: string; year?: string; fileUrl?: string }
export interface ReferenceItem { name?: string; role?: string; contact?: string }

export interface CVData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  jobTitle: string;
  summary: string;
  photoUrl: string;
  linkedin: string;
  instagram: string;
  indeed: string;
  cvnovaCode: string;
  maritalStatus: string;
  placeOfBirth: string;
  nationality: string;
  skills: string[];
  education: EducationItem[];
  experience: ExperienceItem[];
  languages: LanguageItem[];
  certifications: CertificationItem[];
  hobbies: string[];
  references: ReferenceItem[];
}

export const emptyCV: CVData = {
  fullName: '', email: '', phone: '', address: '', jobTitle: '', summary: '', photoUrl: '',
  linkedin: '', instagram: '', indeed: '', cvnovaCode: '', maritalStatus: '', placeOfBirth: '', nationality: '',
  skills: [''], education: [{ degree: '', school: '', year: '' }],
  experience: [{ role: '', company: '', duration: '', desc: '' }],
  languages: [{ language: '', proficiency: '' }],
  certifications: [{ name: '', year: '', fileUrl: '' }],
  hobbies: [''],
  references: [{ name: '', role: '', contact: '' }],
};

const asString = (value: unknown): string => (typeof value === 'string' ? value : value == null ? '' : String(value));

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

/** Normalises legacy `full_data` blobs so templates can render without guards. */
export function normalizeCV(raw: any): CVData {
  const data = raw || {};
  return {
    fullName: asString(data.fullName),
    email: asString(data.email),
    phone: asString(data.phone),
    address: asString(data.address),
    jobTitle: asString(data.jobTitle),
    summary: asString(data.summary),
    photoUrl: asString(data.photoUrl),
    linkedin: asString(data.linkedin),
    instagram: asString(data.instagram),
    indeed: asString(data.indeed),
    cvnovaCode: asString(data.cvnovaCode),
    maritalStatus: asString(data.maritalStatus),
    placeOfBirth: asString(data.placeOfBirth),
    nationality: asString(data.nationality),
    skills: asArray<string>(data.skills).map(asString).filter(Boolean),
    education: asArray<EducationItem>(data.education).filter((e) => asString(e?.degree) || asString(e?.school)),
    experience: asArray<ExperienceItem>(data.experience).filter((e) => asString(e?.role) || asString(e?.company)),
    languages: asArray<LanguageItem>(data.languages).filter((l) => asString(l?.language)),
    certifications: asArray<CertificationItem>(data.certifications).filter((c) => asString(c?.name)),
    hobbies: asArray<string>(data.hobbies).map(asString).filter(Boolean),
    references: asArray<ReferenceItem>(data.references).filter((r) => asString(r?.name)),
  };
}

export const lines = (value?: string): string[] =>
  asString(value).split('\n').map((line) => line.trim()).filter(Boolean);

export const joinList = (values: (string | undefined)[]): string =>
  values.map(asString).filter(Boolean).join(' • ');

const withProtocol = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^(https?:)?\/\//i.test(trimmed)) return trimmed.startsWith('//') ? `https:${trimmed}` : trimmed;
  return `https://${trimmed.replace(/^\/+/, '')}`;
};

const prettyUrl = (url: string): string =>
  url.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '');

export type ExtraKey =
  | 'linkedin' | 'instagram' | 'indeed' | 'cvnovaCode'
  | 'maritalStatus' | 'placeOfBirth' | 'nationality';

const EXTRA_LABELS: Record<ExtraKey, string> = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  indeed: 'Indeed',
  cvnovaCode: 'CVNova ID',
  maritalStatus: 'Marital status',
  placeOfBirth: 'Place of birth',
  nationality: 'Nationality',
};

const DEFAULT_EXTRAS: ExtraKey[] = [
  'linkedin', 'instagram', 'indeed', 'cvnovaCode', 'maritalStatus', 'placeOfBirth', 'nationality',
];


/**
 * Renders the 2026 profile extras (LinkedIn, Instagram, Indeed, CVNova ID,
 * marital status, place of birth, nationality). Every template embeds this so
 * the new fields appear everywhere without duplicating markup.
 */
export function Extras({
  data,
  keys = DEFAULT_EXTRAS,
  className = '',
  itemClassName = '',
  linkClassName = 'underline underline-offset-2',
  withLabels = true,
  separator,
}: {
  data: CVData;
  keys?: ExtraKey[];
  className?: string;
  itemClassName?: string;
  linkClassName?: string;
  withLabels?: boolean;
  separator?: string;
}) {
  const items = keys
    .map((key) => {
      const value = asString((data as any)[key]);
      if (!value) return null;
      const isLink = key === 'linkedin' || key === 'instagram' || key === 'indeed';
      return { key, value, isLink };
    })
    .filter(Boolean) as { key: ExtraKey; value: string; isLink: boolean }[];

  if (items.length === 0) return null;

  return (
    <div className={className}>
      {items.map((item, index) => (
        <span key={item.key} className={itemClassName}>
          {separator && index > 0 ? `${separator} ` : null}
          {withLabels ? `${EXTRA_LABELS[item.key]}: ` : null}
          {item.isLink ? (
            <a href={withProtocol(item.value)} target="_blank" rel="noopener noreferrer" className={`${linkClassName} print:no-underline`}>
              {prettyUrl(item.value)}
            </a>
          ) : (
            <span>{item.value}</span>
          )}
        </span>
      ))}
    </div>
  );
}

/** Compact contact strip used by the majority of templates. */
export function ContactStrip({
  data,
  className = '',
  itemClassName = '',
  separator = '•',
  keys = ['email', 'phone', 'address'],
}: {
  data: CVData;
  className?: string;
  itemClassName?: string;
  separator?: string;
  keys?: ('email' | 'phone' | 'address')[];
}) {
  const items = keys.map((key) => asString((data as any)[key])).filter(Boolean);
  if (items.length === 0) return null;
  return (
    <div className={className}>
      {items.map((item, index) => (
        <span key={index} className={itemClassName}>
          {index > 0 ? <span className="mx-1 opacity-60">{separator}</span> : null}
          {item}
        </span>
      ))}
    </div>
  );
}

/** Section heading with a stable class name for print/Word export. */
export function Heading({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h2 className={className}>{children}</h2>;
}

export function BulletList({ items, className = '', itemClassName = '' }: { items: string[]; className?: string; itemClassName?: string }) {
  if (!items.length) return null;
  return (
    <ul className={className}>
      {items.map((item, index) => (
        <li key={index} className={itemClassName}>{item}</li>
      ))}
    </ul>
  );
}

export type TemplateProps = { data: CVData };

export function Availability({ data }: { data: CVData }) {
  return (
    <Extras
      data={data}
      className="flex flex-wrap gap-x-3 gap-y-1"
      itemClassName="text-[10px] leading-tight"
      withLabels
    />
  );
}
