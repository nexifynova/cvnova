import { Extras, PersonalDetails, type TemplateProps } from '../shared';

export default function Gradient({ data: d }: TemplateProps) {
  return (
    <div className="h-full bg-white text-gray-800">
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-500 p-8 text-white avoid-break">
        <h1 className="text-4xl font-extrabold tracking-tight">{d.fullName}</h1>
        <p className="mt-1 text-sm font-medium text-purple-100">{d.jobTitle}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-purple-100">
          {d.email && <span className="rounded-full bg-white/15 px-2.5 py-1">{d.email}</span>}
          {d.phone && <span className="rounded-full bg-white/15 px-2.5 py-1">{d.phone}</span>}
          {d.address && <span className="rounded-full bg-white/15 px-2.5 py-1">{d.address}</span>}
        </div>
        <Extras data={d} keys={['linkedin', 'instagram', 'indeed']} className="mt-2 flex flex-wrap gap-x-4 text-[10px] text-purple-100" withLabels={false} linkClassName="underline" />
      </div>

      <div className="p-8">
        {d.summary && <div className="mb-6 avoid-break"><h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-indigo-600">Profile</h2><p className="text-sm leading-relaxed text-gray-700">{d.summary}</p></div>}

        {d.experience.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-indigo-600">Experience</h2>
            {d.experience.map((e, i) => (
              <div key={i} className="mb-4 border-l-2 border-purple-100 pl-4 avoid-break">
                <div className="flex justify-between"><h3 className="text-sm font-bold text-gray-900">{e.role}</h3><span className="text-[10px] font-semibold text-gray-500">{e.duration}</span></div>
                <p className="text-[11px] font-medium text-purple-600">{e.company}</p>
                <p className="mt-1 whitespace-pre-line text-xs text-gray-600">{e.desc}</p>
              </div>
            ))}
          </div>
        )}

        {d.education.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-indigo-600">Education</h2>
            {d.education.map((e, i) => (
              <div key={i} className="mb-2 avoid-break"><div className="flex justify-between"><h3 className="text-sm font-bold text-gray-900">{e.degree}</h3><span className="text-[10px] text-gray-500">{e.year}</span></div><p className="text-[11px] text-gray-600">{e.school}</p></div>
            ))}
          </div>
        )}

        <PersonalDetails
          data={d}
          className="mb-6 avoid-break"
          headingClassName="mb-2 text-xs font-bold uppercase tracking-widest text-indigo-600"
          listClassName="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-700"
          labelClassName="font-semibold text-gray-900"
        />

        <div className="grid grid-cols-2 gap-6 avoid-break">
          <div>
            {d.skills.length > 0 && <><h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-indigo-600">Skills</h2><div className="flex flex-wrap gap-1.5">{d.skills.map((s, i) => <span key={i} className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-medium text-indigo-700">{s}</span>)}</div></>}
          </div>
          <div>
            {d.languages.length > 0 && <><h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-indigo-600">Languages</h2><ul className="list-disc pl-4 text-xs text-gray-700">{d.languages.map((l, i) => <li key={i}>{l.language}</li>)}</ul></>}
            {d.certifications.length > 0 && <><h2 className="mb-2 mt-4 text-xs font-bold uppercase tracking-widest text-indigo-600">Certifications</h2><ul className="list-disc pl-4 text-xs text-gray-700">{d.certifications.map((c, i) => <li key={i}>{c.name}</li>)}</ul></>}
          </div>
        </div>

        <Extras data={d} keys={['cvnovaCode']} className="mt-6 flex flex-wrap gap-x-4 border-t border-purple-100 pt-2 text-[10px] text-gray-600" />
      </div>
    </div>
  );
}
