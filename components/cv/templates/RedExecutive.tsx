import { Extras, type TemplateProps } from '../shared';

export default function RedExecutive({ data: d }: TemplateProps) {
  return (
    <div className="border-t-[10px] border-red-700 pt-6 p-10">
      <div className="flex justify-between items-end border-b-2 border-red-700 pb-4 mb-6 avoid-break">
        <div><h1 className="text-4xl font-black text-gray-900">{d.fullName}</h1><p className="text-lg text-red-700 font-semibold mt-1">{d.jobTitle}</p></div>
        <div className="text-right text-xs text-gray-500 space-y-1">
          {d.email && <p>{d.email}</p>}{d.phone && <p>{d.phone}</p>}{d.address && <p>{d.address}</p>}
          <Extras data={d} keys={['linkedin', 'instagram', 'indeed']} className="space-y-0.5 text-[10px] break-all" withLabels={false} />
        </div>
      </div>

      {d.summary && <div className="mb-5 avoid-break"><h2 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-1 border-b-2 border-red-700 inline-block pb-1">Profile</h2><p className="text-gray-700 text-sm leading-relaxed mt-2">{d.summary}</p></div>}

      {d.experience.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-2 border-b-2 border-red-700 inline-block pb-1">Experience</h2>
          {d.experience.map((e, i) => (
            <div key={i} className="mb-3 avoid-break">
              <div className="flex justify-between"><h3 className="font-bold text-gray-900 text-sm">{e.role}</h3><span className="text-xs text-gray-600">{e.duration}</span></div>
              <p className="text-xs font-semibold text-red-700">{e.company}</p>
              <p className="text-xs text-gray-600 mt-1 whitespace-pre-line">{e.desc}</p>
            </div>
          ))}
        </div>
      )}

      {d.education.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-2 border-b-2 border-red-700 inline-block pb-1">Education</h2>
          {d.education.map((e, i) => (
            <div key={i} className="flex justify-between mb-2 avoid-break">
              <div><h3 className="font-bold text-gray-900 text-sm">{e.degree}</h3><p className="text-xs text-gray-600">{e.school}</p></div>
              <span className="text-xs text-gray-600">{e.year}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4 avoid-break">
        <div><h2 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-1 border-b-2 border-red-700 inline-block pb-1">Skills</h2><ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2">{d.skills.map((s, i) => <li key={i} className="text-sm text-gray-700">• {s}</li>)}</ul></div>
        <div><h2 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-1 border-b-2 border-red-700 inline-block pb-1">Languages</h2><ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2">{d.languages.map((l, i) => <li key={i} className="text-sm text-gray-700">• {l.language}</li>)}</ul></div>
      </div>

      <div className="grid grid-cols-2 gap-4 avoid-break">
        {d.certifications.length > 0 && <div><h2 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-1 border-b-2 border-red-700 inline-block pb-1">Certifications</h2><ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2">{d.certifications.map((c, i) => <li key={i} className="text-sm text-gray-700">• {c.name}</li>)}</ul></div>}
        {d.references.length > 0 && <div><h2 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-1 border-b-2 border-red-700 inline-block pb-1">References</h2><ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2">{d.references.map((r, i) => <li key={i} className="text-sm text-gray-700">• {r.name}</li>)}</ul></div>}
      </div>

      <Extras data={d} keys={['cvnovaCode', 'maritalStatus', 'placeOfBirth', 'nationality']} className="mt-4 flex flex-wrap gap-x-4 border-t border-red-200 pt-2 text-[10px] text-gray-600" />
    </div>
  );
}
