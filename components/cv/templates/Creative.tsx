import { Extras, PersonalDetails, lines, type TemplateProps } from '../shared';

export default function Creative({ data: d }: TemplateProps) {
  return (
    <div className="flex flex-col h-full p-10">
      <div className="bg-gray-900 text-white p-6 rounded-t-xl mb-6 avoid-break">
        <h1 className="text-4xl font-bold">{d.fullName}</h1>
        <p className="text-blue-300 font-medium mt-1">{d.jobTitle}</p>
        <Extras data={d} keys={['linkedin', 'instagram', 'indeed']} className="mt-2 flex flex-wrap gap-x-4 text-[10px] text-blue-200" withLabels={false} />
      </div>
      <div className="flex gap-6 px-2">
        <div className="w-1/3">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-2 text-blue-600">Contact</h2>
          <div className="text-xs text-gray-700 space-y-1 mb-6">
            {d.email && <p>{d.email}</p>}{d.phone && <p>{d.phone}</p>}{d.address && <p>{d.address}</p>}
          </div>
          {d.skills.length > 0 && <><h2 className="text-sm font-bold uppercase tracking-widest mb-2 text-blue-600">Skills</h2><ul className="text-xs text-gray-700 space-y-1 mb-6">{d.skills.map((s, i) => <li key={i}>• {s}</li>)}</ul></>}
          {d.languages.length > 0 && <><h2 className="text-sm font-bold uppercase tracking-widest mb-2 text-blue-600">Languages</h2><ul className="text-xs text-gray-700 space-y-1 mb-6">{d.languages.map((l, i) => <li key={i}>• {l.language}{l.proficiency ? ` – ${l.proficiency}` : ''}</li>)}</ul></>}
          {d.education.length > 0 && <><h2 className="text-sm font-bold uppercase tracking-widest mb-2 text-blue-600">Education</h2>{d.education.map((e, i) => <div key={i} className="mb-3 text-xs avoid-break"><p className="font-bold text-gray-900">{e.degree}</p><p>{e.school}</p><p className="text-gray-500">{e.year}</p></div>)}</>}
          <Extras data={d} keys={['cvnovaCode']} className="space-y-1 text-[10px] text-gray-600" />
        </div>
        <div className="w-2/3">
          {d.summary && <><h2 className="text-sm font-bold uppercase tracking-widest mb-2 text-blue-600">Profile</h2><p className="text-sm text-gray-700 leading-relaxed mb-6 avoid-break">{d.summary}</p></>}
          {d.experience.length > 0 && (
            <>
              <h2 className="text-sm font-bold uppercase tracking-widest mb-2 text-blue-600">Experience</h2>
              {d.experience.map((e, i) => (
                <div key={i} className="mb-4 avoid-break">
                  <h3 className="font-bold text-gray-900 text-sm">{e.role}</h3>
                  <p className="text-xs text-blue-600 font-semibold mb-1">{e.company}{e.duration ? ` | ${e.duration}` : ''}</p>
                  <ul className="text-xs text-gray-700 leading-relaxed list-disc pl-4 space-y-0.5">{lines(e.desc).map((line, idx) => <li key={idx}>{line}</li>)}</ul>
                </div>
              ))}
            </>
          )}
          {d.certifications.length > 0 && <div className="mt-6 avoid-break"><h2 className="text-sm font-bold uppercase tracking-widest mb-2 text-blue-600">Certifications</h2><ul className="text-xs text-gray-700 space-y-1">{d.certifications.map((c, i) => <li key={i}>• {c.name}{c.year ? ` (${c.year})` : ''}</li>)}</ul></div>}
          <PersonalDetails
            data={d}
            className="mt-6 avoid-break"
            headingClassName="text-sm font-bold uppercase tracking-widest mb-2 text-blue-600"
            listClassName="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700"
            labelClassName="font-semibold text-gray-900"
          />
          {d.references.length > 0 && <div className="mt-6 avoid-break"><h2 className="text-sm font-bold uppercase tracking-widest mb-2 text-blue-600">References</h2><ul className="text-xs text-gray-700 space-y-1">{d.references.map((r, i) => <li key={i}>• {r.name}{r.contact ? ` | ${r.contact}` : ''}</li>)}</ul></div>}
        </div>
      </div>
    </div>
  );
}
