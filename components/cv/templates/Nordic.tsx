import { ContactStrip, Extras, PersonalDetails, type TemplateProps } from '../shared';

export default function Nordic({ data: d }: TemplateProps) {
  return (
    <div className="p-12 text-gray-800">
      <div className="mb-10 avoid-break">
        <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-3">{d.jobTitle || 'Curriculum Vitae'}</p>
        <h1 className="text-5xl font-light tracking-tight text-gray-900">{d.fullName}</h1>
        <div className="mt-4 h-px w-16 bg-gray-900" />
        <ContactStrip data={d} className="mt-4 text-[11px] text-gray-500 flex flex-wrap" separator="—" />
        <Extras data={d} keys={['linkedin', 'instagram', 'indeed']} className="mt-1 flex flex-wrap gap-x-4 text-[10px] text-gray-500" withLabels={false} />
      </div>

      {d.summary && <div className="mb-10 avoid-break"><h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-2">Profile</h2><p className="text-sm text-gray-700 leading-relaxed max-w-3xl">{d.summary}</p></div>}

      {d.experience.length > 0 && (
        <div className="mb-10">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">Experience</h2>
          {d.experience.map((e, i) => (
            <div key={i} className="mb-6 grid grid-cols-12 gap-6 avoid-break">
              <div className="col-span-3 text-[11px] text-gray-400 pt-0.5">{e.duration}</div>
              <div className="col-span-9">
                <h3 className="text-sm font-semibold text-gray-900">{e.role}</h3>
                <p className="text-[11px] text-gray-500 mb-1">{e.company}</p>
                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{e.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {d.education.length > 0 && (
        <div className="mb-10">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">Education</h2>
          {d.education.map((e, i) => (
            <div key={i} className="mb-3 grid grid-cols-12 gap-6 avoid-break">
              <div className="col-span-3 text-[11px] text-gray-400">{e.year}</div>
              <div className="col-span-9"><h3 className="text-sm font-semibold text-gray-900">{e.degree}</h3><p className="text-[11px] text-gray-500">{e.school}</p></div>
            </div>
          ))}
        </div>
      )}

      <PersonalDetails
        data={d}
        className="mb-10 avoid-break"
        headingClassName="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-3"
        listClassName="flex flex-wrap gap-x-8 gap-y-1 text-xs text-gray-700"
        labelClassName="font-semibold text-gray-900"
      />

      <div className="grid grid-cols-2 gap-10">
        <div>
          {d.skills.length > 0 && <><h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-3">Skills</h2><ul className="text-xs text-gray-700 space-y-1">{d.skills.map((s, i) => <li key={i} className="border-b border-gray-100 pb-1">{s}</li>)}</ul></>}
        </div>
        <div>
          {d.languages.length > 0 && <><h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-3">Languages</h2><ul className="text-xs text-gray-700 space-y-1">{d.languages.map((l, i) => <li key={i} className="border-b border-gray-100 pb-1">{l.language}{l.proficiency ? ` — ${l.proficiency}` : ''}</li>)}</ul></>}
          {d.certifications.length > 0 && <><h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-3 mt-6">Certifications</h2><ul className="text-xs text-gray-700 space-y-1">{d.certifications.map((c, i) => <li key={i} className="border-b border-gray-100 pb-1">{c.name}</li>)}</ul></>}
        </div>
      </div>

      <Extras data={d} keys={['cvnovaCode']} className="mt-8 flex flex-wrap gap-x-6 border-t border-gray-200 pt-3 text-[10px] uppercase tracking-wider text-gray-500" />
    </div>
  );
}
