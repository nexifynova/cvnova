import { ContactStrip, Extras, type TemplateProps } from '../shared';

export default function Compact({ data: d }: TemplateProps) {
  return (
    <div className="text-sm p-10">
      <div className="mb-4 border-b pb-2 avoid-break">
        <h1 className="text-2xl font-bold text-gray-900">{d.fullName}</h1>
        <p className="text-gray-600">{d.jobTitle}</p>
        <ContactStrip data={d} className="text-xs text-gray-500" separator="|" />
        <Extras data={d} keys={['linkedin', 'instagram', 'indeed']} className="mt-0.5 flex flex-wrap gap-x-3 text-[10px] text-gray-500" withLabels={false} />
      </div>
      {d.summary && <div className="mb-3 avoid-break"><p className="text-gray-700">{d.summary}</p></div>}
      {d.experience.length > 0 && (
        <div className="mb-3">
          <h2 className="font-bold text-gray-900 uppercase text-xs mb-1">Experience</h2>
          {d.experience.map((e, i) => (
            <div key={i} className="mb-2 avoid-break">
              <span className="font-bold text-gray-800">{e.role}</span>, {e.company} <span className="text-gray-500">({e.duration})</span>
              <p className="text-gray-600 whitespace-pre-line">{e.desc}</p>
            </div>
          ))}
        </div>
      )}
      {d.education.length > 0 && (
        <div className="mb-3">
          <h2 className="font-bold text-gray-900 uppercase text-xs mb-1">Education</h2>
          {d.education.map((e, i) => (
            <div key={i} className="mb-1 avoid-break"><span className="font-bold text-gray-800">{e.degree}</span>, {e.school} <span className="text-gray-500">({e.year})</span></div>
          ))}
        </div>
      )}
      <div className="mb-3 avoid-break"><h2 className="font-bold text-gray-900 uppercase text-xs mb-1">Skills</h2><p className="text-gray-700">{d.skills.join(', ')}</p></div>
      <div className="mb-3 avoid-break"><h2 className="font-bold text-gray-900 uppercase text-xs mb-1">Languages</h2><p className="text-gray-700">{d.languages.map((l) => l.language).join(', ')}</p></div>
      <div className="grid grid-cols-2 gap-4 avoid-break">
        <div><h2 className="font-bold text-gray-900 uppercase text-xs mb-1">Certifications</h2><p className="text-gray-700">{d.certifications.map((c) => c.name).join(', ')}</p></div>
        <div><h2 className="font-bold text-gray-900 uppercase text-xs mb-1">References</h2><p className="text-gray-700">{d.references.map((r) => r.name).join(', ')}</p></div>
      </div>
      <Extras data={d} keys={['cvnovaCode', 'maritalStatus', 'placeOfBirth', 'nationality']} className="mt-3 flex flex-wrap gap-x-4 border-t pt-2 text-[10px] text-gray-600" />
    </div>
  );
}
