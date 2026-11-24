import { ContactStrip, Extras, type TemplateProps } from '../shared';

export default function Bold({ data: d }: TemplateProps) {
  return (
    <div className="p-10">
      <div className="mb-6 avoid-break">
        <h1 className="text-5xl font-black text-gray-900 uppercase leading-none">{d.fullName}</h1>
        <p className="text-xl font-bold text-gray-500 mt-1">{d.jobTitle}</p>
      </div>
      <div className="bg-gray-100 p-4 mb-6 flex flex-wrap gap-4 text-xs font-semibold text-gray-600 avoid-break">
        <ContactStrip data={d} className="flex flex-wrap gap-4" separator="/" itemClassName="flex gap-1" />
        <Extras data={d} keys={['linkedin', 'instagram', 'indeed']} className="flex flex-wrap gap-3" withLabels={false} />
      </div>

      {d.summary && <div className="mb-6 avoid-break"><h2 className="text-xl font-black text-gray-900 uppercase mb-2">Profile</h2><p className="text-sm text-gray-700">{d.summary}</p></div>}

      {d.experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-black text-gray-900 uppercase mb-3">Experience</h2>
          {d.experience.map((e, i) => (
            <div key={i} className="mb-4 avoid-break">
              <h3 className="font-bold text-lg text-gray-900">{e.role}</h3>
              <p className="text-xs font-bold text-gray-500 uppercase">{e.company}{e.duration ? ` / ${e.duration}` : ''}</p>
              <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">{e.desc}</p>
            </div>
          ))}
        </div>
      )}

      {d.education.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-black text-gray-900 uppercase mb-3">Education</h2>
          {d.education.map((e, i) => (
            <div key={i} className="mb-3 avoid-break"><h3 className="font-bold text-lg text-gray-900">{e.degree}</h3><p className="text-sm text-gray-600">{e.school}{e.year ? ` / ${e.year}` : ''}</p></div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4 avoid-break">
        <div><h2 className="text-xl font-black text-gray-900 uppercase mb-2">Skills</h2><ul className="grid grid-cols-1 gap-2">{d.skills.map((s, i) => <li key={i} className="font-bold text-gray-800 text-sm border-l-4 border-gray-900 pl-2">{s}</li>)}</ul></div>
        <div><h2 className="text-xl font-black text-gray-900 uppercase mb-2">Languages</h2><ul className="grid grid-cols-1 gap-2">{d.languages.map((l, i) => <li key={i} className="font-bold text-gray-800 text-sm border-l-4 border-gray-500 pl-2">{l.language}</li>)}</ul></div>
      </div>

      <div className="grid grid-cols-2 gap-4 avoid-break">
        {d.certifications.length > 0 && <div><h2 className="text-xl font-black text-gray-900 uppercase mb-2">Certifications</h2><ul className="grid grid-cols-1 gap-2">{d.certifications.map((c, i) => <li key={i} className="font-bold text-gray-800 text-sm border-l-4 border-gray-900 pl-2">{c.name}</li>)}</ul></div>}
        {d.references.length > 0 && <div><h2 className="text-xl font-black text-gray-900 uppercase mb-2">References</h2><ul className="grid grid-cols-1 gap-2">{d.references.map((r, i) => <li key={i} className="font-bold text-gray-800 text-sm border-l-4 border-gray-500 pl-2">{r.name}</li>)}</ul></div>}
      </div>

      <Extras data={d} keys={['cvnovaCode', 'maritalStatus', 'placeOfBirth', 'nationality']} className="mt-4 flex flex-wrap gap-x-4 border-t-4 border-gray-900 pt-2 text-[10px] font-semibold text-gray-600" />
    </div>
  );
}
