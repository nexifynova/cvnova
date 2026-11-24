import { ContactStrip, Extras, PersonalDetails, type TemplateProps } from '../shared';

export default function GreenProfessional({ data: d }: TemplateProps) {
  return (
    <div className="p-10">
      <div className="text-center mb-6 bg-green-50 p-6 rounded-xl border border-green-200 avoid-break">
        <h1 className="text-4xl font-bold text-green-900">{d.fullName}</h1>
        <p className="text-base text-green-700 font-semibold mt-1">{d.jobTitle}</p>
        <ContactStrip data={d} className="text-xs text-gray-600 mt-3 flex justify-center" separator="|" />
        <Extras data={d} keys={['linkedin', 'instagram', 'indeed']} className="mt-1 flex justify-center gap-3 text-[10px] text-gray-600" withLabels={false} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          {d.experience.length > 0 && (
            <>
              <h2 className="text-sm font-bold text-green-800 uppercase border-b border-green-300 pb-1 mb-2">Experience</h2>
              {d.experience.map((e, i) => (
                <div key={i} className="mb-3 avoid-break">
                  <h3 className="font-bold text-gray-900 text-sm">{e.role}</h3>
                  <p className="text-xs text-green-700 font-semibold">{e.company}{e.duration ? ` | ${e.duration}` : ''}</p>
                  <p className="text-xs text-gray-600 mt-1 whitespace-pre-line">{e.desc}</p>
                </div>
              ))}
            </>
          )}
          {d.education.length > 0 && (
            <>
              <h2 className="text-sm font-bold text-green-800 uppercase border-b border-green-300 pb-1 mb-2 mt-4">Education</h2>
              {d.education.map((e, i) => (
                <div key={i} className="mb-2 avoid-break"><h3 className="font-bold text-gray-900 text-sm">{e.degree}</h3><p className="text-xs text-gray-600">{e.school}{e.year ? ` | ${e.year}` : ''}</p></div>
              ))}
            </>
          )}
        </div>

        <div>
          <PersonalDetails
            data={d}
            className="avoid-break"
            headingClassName="text-sm font-bold text-green-800 uppercase border-b border-green-300 pb-1 mb-2"
            listClassName="space-y-1 text-xs text-gray-700 mb-4"
            labelClassName="font-semibold text-green-800"
          />
          {d.summary && <><h2 className="text-sm font-bold text-green-800 uppercase border-b border-green-300 pb-1 mb-2">Summary</h2><p className="text-xs text-gray-700 leading-relaxed mb-4 avoid-break">{d.summary}</p></>}
          {d.skills.length > 0 && <><h2 className="text-sm font-bold text-green-800 uppercase border-b border-green-300 pb-1 mb-2">Skills</h2><ul className="text-xs text-gray-700 space-y-1 mb-4">{d.skills.map((s, i) => <li key={i} className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-green-600 rounded-full" />{s}</li>)}</ul></>}
          {d.languages.length > 0 && <><h2 className="text-sm font-bold text-green-800 uppercase border-b border-green-300 pb-1 mb-2">Languages</h2><ul className="text-xs text-gray-700 space-y-1 mb-4">{d.languages.map((l, i) => <li key={i}>{l.language}{l.proficiency ? ` – ${l.proficiency}` : ''}</li>)}</ul></>}
          {d.certifications.length > 0 && <><h2 className="text-sm font-bold text-green-800 uppercase border-b border-green-300 pb-1 mb-2">Certifications</h2><ul className="text-xs text-gray-700 space-y-1 mb-4">{d.certifications.map((c, i) => <li key={i}>{c.name}</li>)}</ul></>}
          {d.references.length > 0 && <><h2 className="text-sm font-bold text-green-800 uppercase border-b border-green-300 pb-1 mb-2">References</h2><ul className="text-xs text-gray-700 space-y-1">{d.references.map((r, i) => <li key={i}>{r.name}</li>)}</ul></>}
        </div>
      </div>

      <Extras data={d} keys={['cvnovaCode']} className="mt-4 flex flex-wrap gap-x-4 border-t border-green-200 pt-2 text-[10px] text-gray-600" />
    </div>
  );
}
