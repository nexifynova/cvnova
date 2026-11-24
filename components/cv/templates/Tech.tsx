import { Extras, PersonalDetails, lines, type TemplateProps } from '../shared';

export default function Tech({ data: d }: TemplateProps) {
  return (
    <div className="font-mono text-sm p-10">
      <div className="mb-6 avoid-break">
        <h1 className="text-3xl font-bold text-gray-900">{d.fullName}</h1>
        <p className="text-blue-600">{d.jobTitle}</p>
        <p className="text-xs text-gray-500 mt-2">[{d.email}] [{d.phone}] [{d.address}]</p>
        <Extras data={d} keys={['linkedin', 'instagram', 'indeed']} className="mt-1 flex flex-wrap gap-x-3 text-[10px] text-gray-500" withLabels={false} />
      </div>

      {d.summary && <div className="mb-4 avoid-break"><span className="text-blue-600 font-bold">## Summary</span><p className="text-gray-700 mt-1">{d.summary}</p></div>}

      {d.experience.length > 0 && (
        <div className="mb-4">
          <span className="text-blue-600 font-bold">## Experience</span>
          {d.experience.map((e, i) => (
            <div key={i} className="mt-2 avoid-break">
              <p className="font-bold text-gray-900">{e.role} @ {e.company} ({e.duration})</p>
              <ul className="text-gray-600 list-disc pl-4">{lines(e.desc).map((line, idx) => <li key={idx}>{line}</li>)}</ul>
            </div>
          ))}
        </div>
      )}

      {d.education.length > 0 && (
        <div className="mb-4">
          <span className="text-blue-600 font-bold">## Education</span>
          {d.education.map((e, i) => <div key={i} className="mt-2 avoid-break"><p className="font-bold text-gray-900">{e.degree}</p><p className="text-gray-600">{e.school} ({e.year})</p></div>)}
        </div>
      )}

      <div className="mb-4 avoid-break"><span className="text-blue-600 font-bold">## Skills</span><p className="text-gray-700 mt-1">{d.skills.join(', ')}</p></div>
      <div className="mb-4 avoid-break"><span className="text-blue-600 font-bold">## Languages</span><p className="text-gray-700 mt-1">{d.languages.map((l) => l.language).join(', ')}</p></div>

      {d.certifications.length > 0 && (
        <div className="mb-4"><span className="text-blue-600 font-bold">## Certifications</span><ul className="text-gray-700 mt-1 list-disc pl-4">{d.certifications.map((c, i) => <li key={i} className="avoid-break">{c.name}{c.year ? ` (${c.year})` : ''}</li>)}</ul></div>
      )}

      <PersonalDetails
        data={d}
        className="mb-4 avoid-break"
        heading="## Personal Details"
        headingClassName="text-blue-600 font-bold"
        listClassName="text-gray-700 mt-1 flex flex-wrap gap-x-4"
        labelClassName="font-bold"
      />

      {d.references.length > 0 && (
        <div><span className="text-blue-600 font-bold">## References</span><ul className="text-gray-700 mt-1 list-disc pl-4">{d.references.map((r, i) => <li key={i} className="avoid-break">{r.name}{r.contact ? ` - ${r.contact}` : ''}</li>)}</ul></div>
      )}

      <Extras data={d} keys={['cvnovaCode']} className="mt-4 flex flex-wrap gap-x-4 border-t border-gray-300 pt-2 text-[10px] text-gray-500" />
    </div>
  );
}
