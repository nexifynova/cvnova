import { ContactStrip, Extras, lines, type TemplateProps } from '../shared';

export default function Modern({ data: d }: TemplateProps) {
  return (
    <div className="bg-white h-full text-gray-800 p-8">
      <div className="flex gap-6 mb-6 avoid-break">
        {d.photoUrl && <img src={d.photoUrl} alt="Profile" className="w-32 h-32 object-cover" />}
        {d.summary && <div className="flex-1 bg-gray-100 p-4"><p className="text-xs text-gray-700 leading-relaxed text-justify">{d.summary}</p></div>}
      </div>

      <div className="bg-gray-600 text-white p-3 mb-6 avoid-break">
        <h1 className="text-3xl font-bold uppercase tracking-wide">{d.fullName}</h1>
        <p className="text-sm text-gray-200 mt-0.5">{d.jobTitle}</p>
        <ContactStrip data={d} className="mt-1 text-[10px] text-gray-200" />
      </div>

      <div className="flex gap-6">
        <div className="w-1/3">
          <div className="mb-4 text-xs avoid-break">
            {d.phone && <p><strong>Phone:</strong><br />{d.phone}</p>}
            {d.email && <p className="mt-2"><strong>E-mail:</strong><br />{d.email}</p>}
            <Extras data={d} keys={['linkedin', 'instagram', 'indeed']} className="mt-2 space-y-0.5 text-[10px] break-all" withLabels={false} />
          </div>
          {d.skills.length > 0 && (
            <div className="mb-4 avoid-break">
              <h3 className="font-bold text-sm mb-2 border-b pb-1 uppercase">Skills</h3>
              <ul className="text-[10px] list-disc pl-4">{d.skills.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          )}
          {d.languages.length > 0 && (
            <div className="mb-4 avoid-break">
              <h3 className="font-bold text-sm mb-2 border-b pb-1 uppercase">Languages</h3>
              <ul className="text-[10px] list-disc pl-4">{d.languages.map((l, i) => <li key={i}>{l.language}{l.proficiency ? ` – ${l.proficiency}` : ''}</li>)}</ul>
            </div>
          )}
          <Extras data={d} keys={['cvnovaCode', 'maritalStatus', 'placeOfBirth', 'nationality']} className="space-y-1 text-[10px] text-gray-600" />
        </div>

        <div className="w-2/3">
          {d.experience.length > 0 && (
            <div className="mb-5">
              <h3 className="font-bold text-sm mb-3 border-b pb-1 uppercase">Experience</h3>
              {d.experience.map((e, i) => (
                <div key={i} className="mb-4 avoid-break">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-bold text-xs text-gray-900">{e.role}{e.company ? ` — ${e.company}` : ''}</h4>
                    <span className="text-[10px]">{e.duration}</span>
                  </div>
                  <ul className="text-[10px] text-gray-600 list-disc pl-4">{lines(e.desc).map((line, idx) => <li key={idx}>{line}</li>)}</ul>
                </div>
              ))}
            </div>
          )}

          {d.education.length > 0 && (
            <div className="mb-5">
              <h3 className="font-bold text-sm mb-3 border-b pb-1 uppercase">Education</h3>
              {d.education.map((e, i) => (
                <div key={i} className="mb-2 avoid-break">
                  <div className="flex justify-between items-baseline"><h4 className="font-bold text-xs text-gray-900">{e.degree}</h4><span className="text-[10px]">{e.year}</span></div>
                  <p className="text-[10px] text-gray-600">{e.school}</p>
                </div>
              ))}
            </div>
          )}

          {d.certifications.length > 0 && (
            <div className="mb-5">
              <h3 className="font-bold text-sm mb-3 border-b pb-1 uppercase">Certifications</h3>
              <ul className="text-[10px] text-gray-600 space-y-1">
                {d.certifications.map((c, i) => (
                  <li key={i} className="avoid-break"><span className="font-bold text-gray-900">{c.name}</span> {c.year && `(${c.year})`}{c.fileUrl && <a href={c.fileUrl} target="_blank" rel="noreferrer" className="text-blue-500 ml-2 underline print:hidden">View</a>}</li>
                ))}
              </ul>
            </div>
          )}

          {d.references.length > 0 && (
            <div>
              <h3 className="font-bold text-sm mb-3 border-b pb-1 uppercase">References</h3>
              <p className="text-[10px] italic text-gray-600 mb-2">Available on request</p>
              {d.references.map((r, i) => (
                <div key={i} className="mb-2 text-[10px] avoid-break">
                  <p className="font-bold text-gray-900">{r.name}</p>
                  <p className="text-gray-600">{r.role}{r.contact ? ` | ${r.contact}` : ''}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
