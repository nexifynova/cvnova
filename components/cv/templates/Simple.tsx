import { ContactStrip, Extras, type TemplateProps } from '../shared';

export default function Simple({ data: d }: TemplateProps) {
  return (
    <div className="text-gray-800 p-10">
      <div className="mb-6 avoid-break">
        <h1 className="text-3xl font-bold">{d.fullName}</h1>
        <p className="text-gray-600">{d.jobTitle}</p>
        <ContactStrip data={d} className="text-xs text-gray-500 mt-1" separator="|" />
        <Extras data={d} keys={['linkedin', 'instagram', 'indeed']} className="mt-1 flex flex-wrap gap-x-3 text-[10px] text-gray-500" withLabels={false} />
      </div>
      <hr className="mb-4 border-gray-300" />
      {d.summary && <div className="mb-4 avoid-break"><h2 className="font-bold text-gray-900 mb-1">Summary</h2><p className="text-sm text-gray-700">{d.summary}</p></div>}
      <hr className="mb-4 border-gray-300" />
      {d.experience.length > 0 && (
        <div className="mb-4">
          <h2 className="font-bold text-gray-900 mb-2">Experience</h2>
          {d.experience.map((e, i) => (
            <div key={i} className="mb-3 avoid-break">
              <div className="flex justify-between"><h3 className="font-semibold text-sm">{e.role}</h3><span className="text-xs text-gray-500">{e.duration}</span></div>
              <p className="text-xs text-gray-600 italic">{e.company}</p>
              <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">{e.desc}</p>
            </div>
          ))}
        </div>
      )}
      <hr className="mb-4 border-gray-300" />
      {d.education.length > 0 && (
        <div className="mb-4">
          <h2 className="font-bold text-gray-900 mb-2">Education</h2>
          {d.education.map((e, i) => (
            <div key={i} className="mb-2 avoid-break">
              <div className="flex justify-between"><h3 className="font-semibold text-sm">{e.degree}</h3><span className="text-xs text-gray-500">{e.year}</span></div>
              <p className="text-sm text-gray-600">{e.school}</p>
            </div>
          ))}
        </div>
      )}
      <hr className="mb-4 border-gray-300" />
      <div className="grid grid-cols-2 gap-4 mb-4 avoid-break">
        <div><h2 className="font-bold text-gray-900 mb-1">Skills</h2><p className="text-sm text-gray-700">{d.skills.join(' • ')}</p></div>
        <div><h2 className="font-bold text-gray-900 mb-1">Languages</h2><p className="text-sm text-gray-700">{d.languages.map((l) => l.language).join(' • ')}</p></div>
      </div>
      <hr className="mb-4 border-gray-300" />
      <div className="grid grid-cols-2 gap-4 avoid-break">
        <div><h2 className="font-bold text-gray-900 mb-1">Certifications</h2><p className="text-sm text-gray-700">{d.certifications.map((c) => c.name).join(' • ')}</p></div>
        <div><h2 className="font-bold text-gray-900 mb-1">References</h2><p className="text-sm text-gray-700">{d.references.map((r) => r.name).join(' • ')}</p></div>
      </div>
      <Extras data={d} keys={['cvnovaCode', 'maritalStatus', 'placeOfBirth', 'nationality']} className="mt-4 flex flex-wrap gap-x-4 border-t pt-2 text-[10px] text-gray-600" />
    </div>
  );
}
