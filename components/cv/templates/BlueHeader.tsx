import { Extras, lines, type TemplateProps } from '../shared';

export default function BlueHeader({ data: d }: TemplateProps) {
  return (
    <div className="bg-white h-full text-gray-800">
      <div className="bg-[#6CA0DC] text-white p-8 flex items-start justify-between gap-6 avoid-break">
        <div>
          <h1 className="text-4xl font-bold uppercase tracking-wider">{d.fullName}</h1>
          <h2 className="text-lg font-medium mt-1 opacity-90">{d.jobTitle}</h2>
          <Extras data={d} keys={['cvnovaCode', 'maritalStatus', 'placeOfBirth', 'nationality']} className="mt-2 flex flex-wrap gap-x-4 text-[10px] text-blue-50" />
        </div>
        <div className="text-xs text-right space-y-1">
          {d.address && <p>{d.address}</p>}
          {d.phone && <p>{d.phone}</p>}
          {d.email && <p>{d.email}</p>}
          <Extras data={d} keys={['linkedin', 'instagram', 'indeed']} className="space-y-0.5 text-[10px] break-all" withLabels={false} />
        </div>
      </div>

      <div className="p-8">
        {d.summary && (
          <div className="mb-6 avoid-break">
            <h3 className="font-bold text-gray-800 text-sm mb-2 border-b-2 border-gray-300 pb-1">Summary</h3>
            <p className="text-xs text-gray-600 leading-relaxed text-justify">{d.summary}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-6">
            {d.experience.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-800 text-sm mb-2 border-b-2 border-gray-300 pb-1">Experience</h3>
                {d.experience.map((e, i) => (
                  <div key={i} className="mb-4 avoid-break">
                    <div className="flex justify-between items-baseline mb-1"><h4 className="font-bold text-sm text-gray-900">{e.role}</h4><span className="text-[10px] font-semibold text-gray-600">{e.duration}</span></div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">{e.company}</p>
                    <ul className="text-[10px] text-gray-600 list-disc pl-4 space-y-1">{lines(e.desc).map((line, idx) => <li key={idx}>{line}</li>)}</ul>
                  </div>
                ))}
              </div>
            )}
            {d.education.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-800 text-sm mb-2 border-b-2 border-gray-300 pb-1">Education</h3>
                {d.education.map((e, i) => (
                  <div key={i} className="mb-2 avoid-break">
                    <div className="flex justify-between items-baseline"><h4 className="font-bold text-xs text-gray-900">{e.degree}</h4><span className="text-[10px] text-gray-500">{e.year}</span></div>
                    <p className="text-[10px] text-gray-600">{e.school}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="col-span-1 space-y-6">
            {d.skills.length > 0 && <div className="avoid-break"><h3 className="font-bold text-gray-800 text-sm mb-2 border-b-2 border-gray-300 pb-1">Skill Highlights</h3><ul className="text-[10px] text-gray-600 list-disc pl-4 space-y-1">{d.skills.map((s, i) => <li key={i}>{s}</li>)}</ul></div>}
            {d.languages.length > 0 && <div className="avoid-break"><h3 className="font-bold text-gray-800 text-sm mb-2 border-b-2 border-gray-300 pb-1">Languages</h3><ul className="text-[10px] text-gray-600 list-disc pl-4 space-y-1">{d.languages.map((l, i) => <li key={i}>{l.language}{l.proficiency ? ` – ${l.proficiency}` : ''}</li>)}</ul></div>}
            {d.certifications.length > 0 && (
              <div className="avoid-break">
                <h3 className="font-bold text-gray-800 text-sm mb-2 border-b-2 border-gray-300 pb-1">Certifications</h3>
                <ul className="text-[10px] text-gray-600 list-disc pl-4 space-y-1">
                  {d.certifications.map((c, i) => <li key={i} className="avoid-break"><span>{c.name} {c.year && `(${c.year})`}</span>{c.fileUrl && <a href={c.fileUrl} target="_blank" rel="noreferrer" className="block text-blue-500 text-[9px] underline print:hidden">View Certificate</a>}</li>)}
                </ul>
              </div>
            )}
            {d.references.length > 0 && <div className="avoid-break"><h3 className="font-bold text-gray-800 text-sm mb-2 border-b-2 border-gray-300 pb-1">References</h3><ul className="text-[10px] text-gray-600 list-disc pl-4 space-y-1">{d.references.map((r, i) => <li key={i}>{r.name}{r.contact ? ` – ${r.contact}` : ''}</li>)}</ul></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
