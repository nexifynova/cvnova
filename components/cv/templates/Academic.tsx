import { ContactStrip, Extras, type TemplateProps } from '../shared';

export default function Academic({ data: d }: TemplateProps) {
  return (
    <div className="font-serif p-10 text-gray-900">
      <div className="mb-6 border-b-2 border-gray-900 pb-4 avoid-break">
        <h1 className="text-4xl font-normal">{d.fullName}</h1>
        <p className="mt-1 text-sm uppercase tracking-[0.2em] text-gray-600">{d.jobTitle}</p>
        <ContactStrip data={d} className="mt-2 text-[11px] text-gray-600 flex flex-wrap" separator="·" />
        <Extras data={d} keys={['linkedin', 'instagram', 'indeed']} className="mt-1 flex flex-wrap gap-x-3 text-[10px] text-gray-600" withLabels={false} />
      </div>

      {d.education.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 border-b border-gray-300 pb-1 text-xs font-bold uppercase tracking-[0.2em]">Education</h2>
          {d.education.map((e, i) => (
            <div key={i} className="mb-2 avoid-break">
              <div className="flex justify-between"><h3 className="text-sm font-semibold">{e.degree}</h3><span className="text-xs text-gray-600">{e.year}</span></div>
              <p className="text-xs italic text-gray-600">{e.school}</p>
            </div>
          ))}
        </div>
      )}

      {d.skills.length > 0 && (
        <div className="mb-6 avoid-break">
          <h2 className="mb-2 border-b border-gray-300 pb-1 text-xs font-bold uppercase tracking-[0.2em]">Research Interests &amp; Expertise</h2>
          <p className="text-sm text-gray-700">{d.skills.join(' · ')}</p>
        </div>
      )}

      {d.certifications.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 border-b border-gray-300 pb-1 text-xs font-bold uppercase tracking-[0.2em]">Publications &amp; Grants</h2>
          <ol className="list-decimal space-y-1 pl-5 text-xs text-gray-700">
            {d.certifications.map((c, i) => <li key={i} className="avoid-break">{c.name}{c.year ? ` (${c.year})` : ''}</li>)}
          </ol>
        </div>
      )}

      {d.experience.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 border-b border-gray-300 pb-1 text-xs font-bold uppercase tracking-[0.2em]">Academic &amp; Professional Experience</h2>
          {d.experience.map((e, i) => (
            <div key={i} className="mb-3 avoid-break">
              <div className="flex justify-between"><h3 className="text-sm font-semibold">{e.role}</h3><span className="text-xs text-gray-600">{e.duration}</span></div>
              <p className="text-xs italic text-gray-600">{e.company}</p>
              <p className="mt-1 whitespace-pre-line text-xs text-gray-700">{e.desc}</p>
            </div>
          ))}
        </div>
      )}

      {d.summary && <div className="mb-6 avoid-break"><h2 className="mb-2 border-b border-gray-300 pb-1 text-xs font-bold uppercase tracking-[0.2em]">Profile</h2><p className="text-xs leading-relaxed text-gray-700">{d.summary}</p></div>}

      {d.languages.length > 0 && (
        <div className="mb-4 avoid-break"><h2 className="mb-2 border-b border-gray-300 pb-1 text-xs font-bold uppercase tracking-[0.2em]">Languages</h2><p className="text-xs text-gray-700">{d.languages.map((l) => l.language).join(' · ')}</p></div>
      )}

      <Extras data={d} keys={['cvnovaCode', 'maritalStatus', 'placeOfBirth', 'nationality']} className="mt-4 flex flex-wrap gap-x-4 border-t border-gray-300 pt-2 text-[10px] text-gray-600" />
    </div>
  );
}
