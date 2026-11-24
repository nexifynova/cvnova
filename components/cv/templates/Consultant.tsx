import { Extras, type TemplateProps } from '../shared';

export default function Consultant({ data: d }: TemplateProps) {
  return (
    <div className="h-full bg-white">
      <div className="bg-slate-800 px-10 py-8 text-white avoid-break">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{d.fullName}</h1>
            <p className="mt-1 text-sm text-teal-300 font-semibold uppercase tracking-wider">{d.jobTitle}</p>
          </div>
          <div className="text-right text-[11px] text-slate-300 space-y-0.5">
            {d.email && <p>{d.email}</p>}{d.phone && <p>{d.phone}</p>}{d.address && <p>{d.address}</p>}
          </div>
        </div>
        <Extras data={d} keys={['linkedin', 'instagram', 'indeed']} className="mt-3 flex flex-wrap gap-x-4 text-[10px] text-slate-300" withLabels={false} linkClassName="underline" />
      </div>

      <div className="grid grid-cols-12 gap-8 p-10">
        <div className="col-span-4 space-y-6">
          {d.summary && <div className="avoid-break"><h2 className="mb-2 border-b-2 border-teal-500 pb-1 text-xs font-bold uppercase tracking-widest text-slate-800">Profile</h2><p className="text-xs leading-relaxed text-gray-700">{d.summary}</p></div>}
          {d.skills.length > 0 && <div><h2 className="mb-2 border-b-2 border-teal-500 pb-1 text-xs font-bold uppercase tracking-widest text-slate-800">Core Skills</h2><ul className="space-y-1 text-xs text-gray-700">{d.skills.map((s, i) => <li key={i} className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />{s}</li>)}</ul></div>}
          {d.languages.length > 0 && <div><h2 className="mb-2 border-b-2 border-teal-500 pb-1 text-xs font-bold uppercase tracking-widest text-slate-800">Languages</h2><ul className="space-y-1 text-xs text-gray-700">{d.languages.map((l, i) => <li key={i}>{l.language}{l.proficiency ? ` — ${l.proficiency}` : ''}</li>)}</ul></div>}
          {d.certifications.length > 0 && <div><h2 className="mb-2 border-b-2 border-teal-500 pb-1 text-xs font-bold uppercase tracking-widest text-slate-800">Certifications</h2><ul className="space-y-1 text-xs text-gray-700">{d.certifications.map((c, i) => <li key={i}>{c.name}{c.year ? ` (${c.year})` : ''}</li>)}</ul></div>}
          <Extras data={d} keys={['cvnovaCode', 'maritalStatus', 'placeOfBirth', 'nationality']} className="space-y-1 text-[10px] text-gray-600" />
        </div>

        <div className="col-span-8 space-y-6">
          {d.experience.length > 0 && (
            <div>
              <h2 className="mb-3 border-b-2 border-slate-800 pb-1 text-xs font-bold uppercase tracking-widest text-slate-800">Selected Engagements</h2>
              {d.experience.map((e, i) => (
                <div key={i} className="mb-5 avoid-break">
                  <div className="flex items-baseline justify-between"><h3 className="text-sm font-bold text-slate-900">{e.role}</h3><span className="text-[10px] font-semibold text-gray-500">{e.duration}</span></div>
                  <p className="text-[11px] font-semibold text-teal-600">{e.company}</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-gray-700">{e.desc?.split('\n').filter(Boolean).map((line, idx) => <li key={idx}>{line}</li>)}</ul>
                </div>
              ))}
            </div>
          )}
          {d.education.length > 0 && (
            <div>
              <h2 className="mb-3 border-b-2 border-slate-800 pb-1 text-xs font-bold uppercase tracking-widest text-slate-800">Education</h2>
              {d.education.map((e, i) => <div key={i} className="mb-2 avoid-break"><div className="flex justify-between"><h3 className="text-sm font-semibold text-slate-900">{e.degree}</h3><span className="text-[10px] text-gray-500">{e.year}</span></div><p className="text-[11px] text-gray-600">{e.school}</p></div>)}
            </div>
          )}
          {d.references.length > 0 && <div><h2 className="mb-2 border-b-2 border-slate-800 pb-1 text-xs font-bold uppercase tracking-widest text-slate-800">References</h2><p className="text-xs text-gray-700">{d.references.map((r) => r.name).join(' · ')}</p></div>}
        </div>
      </div>
    </div>
  );
}
