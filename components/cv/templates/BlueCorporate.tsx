import { Extras, PersonalDetails, type TemplateProps } from '../shared';

export default function BlueCorporate({ data: d }: TemplateProps) {
  return (
    <div className="p-10">
      <div className="bg-blue-700 text-white p-6 rounded-t-xl mb-6 avoid-break">
        <h1 className="text-4xl font-bold">{d.fullName}</h1>
        <p className="text-blue-200 font-medium mt-1">{d.jobTitle}</p>
        <div className="flex flex-wrap gap-4 text-xs text-blue-200 mt-3">
          {d.email && <span>{d.email}</span>}{d.phone && <span>{d.phone}</span>}{d.address && <span>{d.address}</span>}
        </div>
        <Extras data={d} keys={['linkedin', 'instagram', 'indeed']} className="mt-1 flex flex-wrap gap-x-4 text-[10px] text-blue-200" withLabels={false} />
      </div>

      <div className="px-4">
        {d.summary && <div className="mb-5 avoid-break"><h2 className="text-sm font-bold text-blue-700 uppercase border-b-2 border-blue-700 pb-1 mb-2">Profile</h2><p className="text-gray-700 text-sm">{d.summary}</p></div>}

        {d.experience.length > 0 && (
          <div className="mb-5">
            <h2 className="text-sm font-bold text-blue-700 uppercase border-b-2 border-blue-700 pb-1 mb-2">Experience</h2>
            {d.experience.map((e, i) => (
              <div key={i} className="mb-3 avoid-break">
                <div className="flex justify-between"><h3 className="font-bold text-gray-900">{e.role}</h3><span className="text-xs text-gray-500">{e.duration}</span></div>
                <p className="text-xs text-blue-600 font-medium">{e.company}</p>
                <p className="text-xs text-gray-600 whitespace-pre-line">{e.desc}</p>
              </div>
            ))}
          </div>
        )}

        {d.education.length > 0 && (
          <div className="mb-5">
            <h2 className="text-sm font-bold text-blue-700 uppercase border-b-2 border-blue-700 pb-1 mb-2">Education</h2>
            {d.education.map((e, i) => (
              <div key={i} className="mb-2 avoid-break">
                <div className="flex justify-between"><h3 className="font-bold text-gray-900 text-sm">{e.degree}</h3><span className="text-xs text-gray-500">{e.year}</span></div>
                <p className="text-xs text-gray-600">{e.school}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4 avoid-break">
          <div><h2 className="text-sm font-bold text-blue-700 uppercase border-b-2 border-blue-700 pb-1 mb-2">Skills</h2><div className="flex flex-wrap gap-2">{d.skills.map((s, i) => <span key={i} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{s}</span>)}</div></div>
          <div><h2 className="text-sm font-bold text-blue-700 uppercase border-b-2 border-blue-700 pb-1 mb-2">Languages</h2><ul className="text-xs text-gray-700 list-disc pl-4">{d.languages.map((l, i) => <li key={i}>{l.language}</li>)}</ul></div>
        </div>

        <PersonalDetails
          data={d}
          className="mb-4 avoid-break"
          headingClassName="text-sm font-bold text-blue-700 uppercase border-b-2 border-blue-700 pb-1 mb-2"
          listClassName="grid grid-cols-3 gap-x-4 gap-y-1 text-xs text-gray-700"
          labelClassName="font-semibold text-gray-900"
        />

        <div className="grid grid-cols-2 gap-4 avoid-break">
          {d.certifications.length > 0 && <div><h2 className="text-sm font-bold text-blue-700 uppercase border-b-2 border-blue-700 pb-1 mb-2">Certifications</h2><ul className="text-xs text-gray-700 list-disc pl-4">{d.certifications.map((c, i) => <li key={i}>{c.name}</li>)}</ul></div>}
          {d.references.length > 0 && <div><h2 className="text-sm font-bold text-blue-700 uppercase border-b-2 border-blue-700 pb-1 mb-2">References</h2><ul className="text-xs text-gray-700 list-disc pl-4">{d.references.map((r, i) => <li key={i}>{r.name}</li>)}</ul></div>}
        </div>

        <Extras data={d} keys={['cvnovaCode']} className="mt-4 flex flex-wrap gap-x-4 border-t border-blue-200 pt-2 text-[10px] text-gray-600" />
      </div>
    </div>
  );
}
