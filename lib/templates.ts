// Central template registry.
// Every template surface (builder, /view, /admin/view, company portal) must
// read from this file so tiers, ATS grades and ids never drift apart.

export type TemplateTier = 'free' | 'premium';
export type AtsTier = 'blue' | 'green' | 'yellow';

export interface TemplateMeta {
  id: string;
  name: string;
  tier: TemplateTier;
  ats: AtsTier;
  category: string;
  description: string;
}

export const ATS_META: Record<AtsTier, { label: string; short: string; hint: string; className: string; dot: string }> = {
  blue: {
    label: 'Blue ATS',
    short: 'ATS Elite',
    hint: 'Single-column parsing, standard headings — passes 99% of ATS scanners.',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
    dot: 'bg-blue-600',
  },
  green: {
    label: 'Green ATS',
    short: 'ATS Pro',
    hint: 'Clean structure with light styling — strong ATS compatibility.',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-600',
  },
  yellow: {
    label: 'Yellow ATS',
    short: 'ATS Friendly',
    hint: 'Design-forward layout. Human readable, best sent as a PDF.',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
};

export const TEMPLATES: TemplateMeta[] = [
  { id: 'classicgray',      name: 'Classic Gray',        tier: 'free',    ats: 'green',  category: 'Classic',      description: 'Two-column grey sidebar with photo.' },
  { id: 'modern',           name: 'Modern',              tier: 'free',    ats: 'green',  category: 'Modern',       description: 'Bold name band and skills sidebar.' },
  { id: 'classic',          name: 'Classic',             tier: 'free',    ats: 'blue',   category: 'Classic',      description: 'Timeless serif layout, ATS first.' },
  { id: 'minimal',          name: 'Minimal',             tier: 'free',    ats: 'green',  category: 'Minimal',      description: 'Airy three-column minimal design.' },
  { id: 'simple',           name: 'Simple',              tier: 'free',    ats: 'blue',   category: 'Classic',      description: 'Plain headings, maximum parsability.' },
  { id: 'compact',          name: 'Compact',             tier: 'free',    ats: 'green',  category: 'Classic',      description: 'Fits a lot of history on one page.' },
  { id: 'professional',     name: 'Professional',        tier: 'free',    ats: 'blue',   category: 'ATS',          description: 'Recruiter-standard ATS resume.' },
  { id: 'blueheader',       name: 'Blue Header',         tier: 'free',    ats: 'green',  category: 'Corporate',    description: 'Coloured header with clean body.' },
  { id: 'tech',             name: 'Tech',                tier: 'free',    ats: 'green',  category: 'Developer',    description: 'Monospace developer-friendly resume.' },
  { id: 'timeline',         name: 'Timeline',            tier: 'free',    ats: 'yellow', category: 'Creative',     description: 'Vertical timeline with accent dots.' },
  { id: 'creative',         name: 'Creative',            tier: 'premium', ats: 'yellow', category: 'Creative',     description: 'Dark hero band for creative roles.' },
  { id: 'executive',        name: 'Executive',           tier: 'premium', ats: 'green',  category: 'Executive',    description: 'Leadership layout with strong rules.' },
  { id: 'elegant',          name: 'Elegant',             tier: 'premium', ats: 'yellow', category: 'Editorial',    description: 'Serif editorial spread, magazine feel.' },
  { id: 'corporate',        name: 'Corporate',           tier: 'premium', ats: 'blue',   category: 'Corporate',    description: 'Navy corporate header, ATS safe.' },
  { id: 'bold',             name: 'Bold',                tier: 'premium', ats: 'yellow', category: 'Impact',       description: 'Heavy typography for standout impact.' },
  { id: 'bluecorporate',    name: 'Blue Corporate',      tier: 'premium', ats: 'blue',   category: 'Corporate',    description: 'Deep blue banner and pill skills.' },
  { id: 'redexecutive',     name: 'Red Executive',       tier: 'premium', ats: 'green',  category: 'Executive',    description: 'Confident red accents for leaders.' },
  { id: 'greenprofessional',name: 'Green Professional',  tier: 'premium', ats: 'green',  category: 'Professional', description: 'Fresh green palette, balanced grid.' },
  { id: 'darkmode',         name: 'Dark Mode',           tier: 'premium', ats: 'yellow', category: 'Modern',       description: 'Dark canvas for digital-first profiles.' },
  { id: 'nordic',           name: 'Nordic',              tier: 'premium', ats: 'blue',   category: 'Scandinavian', description: 'Quiet Scandinavian typographic grid.' },
  { id: 'gradient',         name: 'Gradient',            tier: 'premium', ats: 'yellow', category: 'Modern',       description: 'Gradient accents for modern brands.' },
  { id: 'academic',         name: 'Academic',            tier: 'premium', ats: 'blue',   category: 'Academic',     description: 'Publication and research friendly.' },
  { id: 'consultant',       name: 'Consultant',          tier: 'premium', ats: 'green',  category: 'Consulting',   description: 'Outcome-led consulting layout.' },
  { id: 'startup',          name: 'Startup',             tier: 'premium', ats: 'yellow', category: 'Startup',      description: 'Informal, energetic startup resume.' },
  { id: 'europass',         name: 'Europass',            tier: 'premium', ats: 'blue',   category: 'EU Standard',  description: 'Europass-style structured CV.' },
];

export const TEMPLATE_IDS = TEMPLATES.map((t) => t.id);

export const FREE_TEMPLATE_IDS = TEMPLATES.filter((t) => t.tier === 'free').map((t) => t.id);

export const BLUE_ATS_TEMPLATE_IDS = TEMPLATES.filter((t) => t.ats === 'blue').map((t) => t.id);

export const getTemplate = (id?: string | null): TemplateMeta =>
  TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];

export const isPremiumTemplate = (id?: string | null) => getTemplate(id).tier === 'premium';

export const isBlueAtsTemplate = (id?: string | null) => getTemplate(id).ats === 'blue';

// CV fields introduced by the 2026 expansion. Kept here so forms and
// templates stay in sync.
export const EXTRA_CV_FIELDS = [
  { key: 'linkedin', label: 'LinkedIn Profile', placeholder: 'linkedin.com/in/your-name', type: 'url' },
  { key: 'instagram', label: 'Instagram', placeholder: 'instagram.com/your-handle', type: 'url' },
  { key: 'indeed', label: 'Indeed Profile', placeholder: 'indeed.com/r/your-name', type: 'url' },
  { key: 'cvnovaCode', label: 'CVNova Share Code', placeholder: 'ABC123', type: 'text' },
  { key: 'maritalStatus', label: 'Marital Status', placeholder: 'Single / Married', type: 'text' },
  { key: 'placeOfBirth', label: 'Place of Birth', placeholder: 'Lahore, Pakistan', type: 'text' },
  { key: 'nationality', label: 'Nationality', placeholder: 'Pakistani', type: 'text' },
] as const;

