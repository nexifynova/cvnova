import { Extras, PersonalDetails, type TemplateProps } from '../shared';

export default function Minimal({ data: d }: TemplateProps) {
  return (
    <div className="font-light p-10">
      <div className="mb-8 avoid-break">
        <h1 className="text-4xl text-gray-900 mb-1">{d.fullName}</h1>
        <p className="text-gray-500 uppercase tracking-widest text-sm">{d.jobTitle}</p>
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 text-xs text-gray-500 space-y-4">
          <div>
            <h3 className="font-bold text-gray-900 uppercase tracking-wider mb-1">Contact</h3>
            {d.email && <p>{d.email}</p>}
            {d.phone && <p>{d.phone}</p>}
            {d.address && <p>{d.address}</p>}
            <Extras data={d} keys={['linkedin', 'instagram', 'indeed']} className="mt-1 space-y-0.5 text-[10px] break-all" withLabels={false} />
          </div>
          {d.skills.length > 0 && <div><h3 className="font-bold text-gray-900 uppercase tracking-wider mb-1">Skills</h3><ul className="list-disc pl-4">{d.skills.map((s, i) => <li key={i}>{s}</li>)}</ul></div>}
          {d.languages.length > 0 && <div><h3 className="font-bold text-gray-900 uppercase tracking-wider mb-1">Languages</h3><ul className="list-disc pl-4">{d.languages.map((l, i) => <li key={i}>{l.language}{l.proficiency ? ` (${l.proficiency})` : ''}</li>)}</ul></div>}
          {d.certifications.length > 0 && <div><h3 className="font-bold text-gray-900 uppercase tracking-wider mb-1">Certifications</h3><ul className="list-disc pl-4">{d.certifications.map((c, i) => <li key={i}>{c.name}{c.year ? ` (${c.year})` : ''}</li>)}</ul></div>}
          {d.hobbies.length > 0 && <div><h3 className="font-bold text-gray-900 uppercase tracking-wider mb-1">Interests</h3><ul className="list-disc pl-4">{d.hobbies.map((h, i) => <li key={i}>{h}</li>)}</ul></div>}
          {/* Sidebar section: personal details */}
          <PersonalDetails
            data={d}
            className="avoid-break"
            headingClassName="font-bold text-gray-900 uppercase tracking-wider mb-1"
            listClassName="space-y-0.5"
            labelClassName="font-semibold text-gray-700"
          />
          <Extras data={d} keys={['cvnovaCode']} className="space-y-1 text-[10px]" />
        </div>

        <div className="col-span-2 space-y-6">
          {d.summary && <div className="avoid-break"><h3 className="font-bold text-gray-900 uppercase tracking-wider text-sm border-b pb-1 mb-2">Profile</h3><p className="text-sm text-gray-700 leading-relaxed">{d.summary}</p></div>}
          {d.experience.length > 0 && (
            <div><h3 className="font-bold text-gray-900 uppercase tracking-wider text-sm border-b pb-1 mb-2">Experience</h3>
              {d.experience.map((e, i) => (
                <div key={i} className="mb-4 avoid-break">
                  <h4 className="font-bold text-gray-800">{e.role}</h4>
                  <p className="text-xs text-gray-500 mb-1">{e.company}{e.duration ? ` | ${e.duration}` : ''}</p>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{e.desc}</p>
                </div>
              ))}
            </div>
          )}
          {d.education.length > 0 && (
            <div><h3 className="font-bold text-gray-900 uppercase tracking-wider text-sm border-b pb-1 mb-2">Education</h3>
              {d.education.map((e, i) => (
                <div key={i} className="mb-4 avoid-break"><h4 className="font-bold text-gray-800">{e.degree}</h4><p className="text-xs text-gray-500 mb-1">{e.school}{e.year ? ` | ${e.year}` : ''}</p></div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
