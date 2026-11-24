import { ContactStrip, Extras, lines, type TemplateProps } from '../shared';

export default function Professional({ data: d }: TemplateProps) {
  return (
    <div className="bg-white h-full text-gray-800 p-10 print-area">
      <div className="border-b-2 border-gray-900 pb-4 mb-6 avoid-break">
        <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">{d.fullName}</h1>
        <p className="text-lg text-blue-700 font-bold mt-1">{d.jobTitle}</p>
        <ContactStrip data={d} className="text-xs text-gray-600 mt-2 font-medium" />
        <Extras data={d} keys={['linkedin', 'instagram', 'indeed']} className="mt-1 flex flex-wrap gap-x-4 text-[10px] text-gray-600 font-medium" withLabels={false} />
      </div>

      {d.summary && (
        <div className="mb-6 avoid-break">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 border-b border-gray-300 pb-1">Professional Summary</h2>
          <p className="text-xs text-gray-700 leading-relaxed text-justify">{d.summary}</p>
        </div>
      )}

      {d.skills.length > 0 && (
        <div className="mb-6 avoid-break">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 border-b border-gray-300 pb-1">Core Competencies</h2>
          <div className="grid grid-cols-3 gap-x-4 gap-y-1">
            {d.skills.map((s, i) => <div key={i} className="flex items-center gap-2 text-xs text-gray-700"><span className="w-1 h-1 bg-gray-800 rounded-full" /> {s}</div>)}
          </div>
        </div>
      )}

      {d.experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-3 border-b border-gray-300 pb-1">Professional Experience</h2>
          {d.experience.map((e, i) => (
            <div key={i} className="mb-4 avoid-break">
              <div className="flex justify-between items-baseline mb-1"><h3 className="font-bold text-sm text-gray-900">{e.role}</h3><span className="text-xs text-gray-600 font-semibold">{e.duration}</span></div>
              <p className="text-xs text-blue-700 font-semibold mb-1">{e.company}</p>
              <ul className="text-xs text-gray-600 list-disc pl-4 space-y-1 leading-relaxed">{lines(e.desc).map((line, idx) => <li key={idx}>{line}</li>)}</ul>
            </div>
          ))}
        </div>
      )}

      {d.education.length > 0 && (
        <div className="mb-6 avoid-break">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-3 border-b border-gray-300 pb-1">Education</h2>
          <div className="grid grid-cols-1 gap-2">
            {d.education.map((e, i) => (
              <div key={i} className="flex justify-between items-baseline text-xs">
                <div><span className="font-bold text-gray-900">{e.degree}</span>, <span className="text-gray-600">{e.school}</span></div>
                <span className="text-gray-500 font-semibold">{e.year}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 avoid-break">
        {d.languages.length > 0 && <div><h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 border-b border-gray-300 pb-1">Languages</h2><p className="text-xs text-gray-700">{d.languages.map((l) => l.language).join(', ')}</p></div>}
        {d.hobbies.length > 0 && <div><h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 border-b border-gray-300 pb-1">Interests</h2><p className="text-xs text-gray-700">{d.hobbies.join(', ')}</p></div>}
      </div>

      <Extras data={d} keys={['cvnovaCode', 'maritalStatus', 'placeOfBirth', 'nationality']} className="mt-4 flex flex-wrap gap-x-4 border-t border-gray-300 pt-2 text-[10px] text-gray-600" />

      {d.references.length > 0 && (
        <div className="mt-6 avoid-break">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 border-b border-gray-300 pb-1">References</h2>
          <p className="text-xs italic text-gray-600">References available upon request.</p>
        </div>
      )}
    </div>
  );
}
