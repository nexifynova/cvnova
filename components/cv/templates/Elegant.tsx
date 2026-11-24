import { ContactStrip, Extras, PersonalDetails, type TemplateProps } from '../shared';

export default function Elegant({ data: d }: TemplateProps) {
  return (
    <div className="font-serif p-10">
      <div className="text-center mb-8 border-b border-gray-300 pb-6 avoid-break">
        <h1 className="text-4xl font-normal text-gray-800 tracking-wider mb-2">{d.fullName}</h1>
        <p className="text-sm text-gray-500 uppercase tracking-[0.3em]">{d.jobTitle}</p>
        <ContactStrip data={d} className="text-xs text-gray-500 mt-4 flex justify-center" />
        <Extras data={d} keys={['linkedin', 'instagram', 'indeed']} className="mt-1 flex justify-center gap-3 text-[10px] text-gray-500" withLabels={false} />
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-8 space-y-6">
          {d.experience.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3 pb-1 border-b border-gray-200">Experience</h2>
              {d.experience.map((e, i) => (
                <div key={i} className="mb-4 avoid-break">
                  <h3 className="font-bold text-gray-900 text-sm">{e.role}</h3>
                  <p className="text-xs italic text-gray-600 mb-1">{e.company}{e.duration ? ` | ${e.duration}` : ''}</p>
                  <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{e.desc}</p>
                </div>
              ))}
            </div>
          )}
          {d.education.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3 pb-1 border-b border-gray-200">Education</h2>
              {d.education.map((e, i) => (
                <div key={i} className="mb-3 avoid-break"><h3 className="font-bold text-gray-900 text-sm">{e.degree}</h3><p className="text-xs text-gray-600">{e.school}{e.year ? ` | ${e.year}` : ''}</p></div>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-4 space-y-6">
          {d.summary && <div className="avoid-break"><h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3 pb-1 border-b border-gray-200">Profile</h2><p className="text-xs text-gray-700 leading-relaxed">{d.summary}</p></div>}
          {d.skills.length > 0 && <div><h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3 pb-1 border-b border-gray-200">Skills</h2><ul className="text-xs text-gray-700 space-y-1">{d.skills.map((s, i) => <li key={i}>{s}</li>)}</ul></div>}
          {d.languages.length > 0 && <div><h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3 pb-1 border-b border-gray-200">Languages</h2><ul className="text-xs text-gray-700 space-y-1">{d.languages.map((l, i) => <li key={i}>{l.language}</li>)}</ul></div>}
          {d.certifications.length > 0 && <div><h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3 pb-1 border-b border-gray-200">Certifications</h2><ul className="text-xs text-gray-700 space-y-1">{d.certifications.map((c, i) => <li key={i}>{c.name}</li>)}</ul></div>}
          <PersonalDetails
            data={d}
            className="avoid-break"
            headingClassName="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3 pb-1 border-b border-gray-200"
            listClassName="space-y-1 text-xs text-gray-700"
            labelClassName="font-semibold text-gray-900"
          />
          {d.references.length > 0 && <div><h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3 pb-1 border-b border-gray-200">References</h2><ul className="text-xs text-gray-700 space-y-1">{d.references.map((r, i) => <li key={i}>{r.name}</li>)}</ul></div>}
          <Extras data={d} keys={['cvnovaCode']} className="space-y-1 text-[10px] text-gray-600" />
        </div>
      </div>
    </div>
  );
}
