import { ContactStrip, Extras, type TemplateProps } from '../shared';

export default function Classic({ data: d }: TemplateProps) {
  return (
    <div className="p-10">
      <div className="text-center border-b-2 border-gray-900 pb-4 mb-6 avoid-break">
        <h1 className="text-3xl font-serif font-bold text-gray-900 tracking-wide">{d.fullName}</h1>
        <p className="text-base text-gray-600 mt-1">{d.jobTitle}</p>
        <ContactStrip data={d} className="text-xs text-gray-500 mt-2 flex justify-center" separator="|" />
        <Extras data={d} keys={['linkedin', 'instagram', 'indeed']} className="mt-1 flex justify-center gap-3 text-[10px] text-gray-500" withLabels={false} />
      </div>

      {d.summary && (
        <div className="mb-5 avoid-break">
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1">Professional Summary</h2>
          <p className="text-gray-700 text-sm leading-relaxed">{d.summary}</p>
        </div>
      )}

      {d.experience.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2">Experience</h2>
          {d.experience.map((e, i) => (
            <div key={i} className="mb-3 avoid-break">
              <div className="flex justify-between"><h3 className="font-bold text-gray-900 text-sm">{e.company}</h3><span className="text-xs text-gray-600">{e.duration}</span></div>
              <p className="text-xs italic text-gray-700">{e.role}</p>
              <p className="text-xs text-gray-600 mt-1 whitespace-pre-line">{e.desc}</p>
            </div>
          ))}
        </div>
      )}

      {d.education.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2">Education</h2>
          {d.education.map((e, i) => (
            <div key={i} className="flex justify-between mb-2 avoid-break">
              <div><h3 className="font-bold text-gray-900 text-sm">{e.degree}</h3><p className="text-xs text-gray-600">{e.school}</p></div>
              <span className="text-xs text-gray-600">{e.year}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4 avoid-break">
        <div>
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1">Skills</h2>
          <ul className="flex flex-wrap gap-2">{d.skills.map((s, i) => <li key={i} className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded">{s}</li>)}</ul>
        </div>
        <div>
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1">Languages</h2>
          <ul className="text-sm text-gray-700 list-disc pl-4">{d.languages.map((l, i) => <li key={i}>{l.language}{l.proficiency ? ` – ${l.proficiency}` : ''}</li>)}</ul>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 avoid-break">
        {d.certifications.length > 0 && (
          <div><h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1">Certifications</h2>
            <ul className="text-sm text-gray-700 flex flex-col gap-1">{d.certifications.map((c, i) => <li key={i}>{c.name} {c.year && `(${c.year})`}</li>)}</ul></div>
        )}
        {d.references.length > 0 && (
          <div><h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1">References</h2>
            <ul className="text-sm text-gray-700">{d.references.map((r, i) => <li key={i}>{r.name}{r.contact ? ` – ${r.contact}` : ''}</li>)}</ul></div>
        )}
      </div>

      <Extras data={d} keys={['cvnovaCode', 'maritalStatus', 'placeOfBirth', 'nationality']} className="flex flex-wrap gap-x-4 gap-y-1 border-t pt-2 text-[10px] text-gray-600" />
    </div>
  );
}
