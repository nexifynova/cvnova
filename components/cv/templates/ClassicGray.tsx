import { Extras, lines, type TemplateProps } from '../shared';

export default function ClassicGray({ data: d }: TemplateProps) {
  return (
    <div className="bg-white h-full text-gray-800">
      <div className="flex h-full">
        <div className="w-[35%] bg-[#E5E7EB] p-6 flex flex-col avoid-break">
          {d.photoUrl ? (
            <img src={d.photoUrl} alt="Profile" className="w-32 h-32 object-cover rounded-full mx-auto mb-6 border-4 border-white shadow-sm" />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-300 mx-auto mb-6 border-4 border-white" />
          )}

          <div className="w-full mb-4">
            <h3 className="font-bold text-gray-900 border-b border-gray-400 pb-1 mb-2 uppercase text-sm">Contact</h3>
            <div className="text-[11px] space-y-1">
              {d.address && <p><strong>Address:</strong><br />{d.address}</p>}
              {d.phone && <p><strong>Phone:</strong><br />{d.phone}</p>}
              {d.email && <p><strong>Email:</strong><br />{d.email}</p>}
            </div>
            <Extras data={d} keys={['linkedin', 'instagram', 'indeed']} className="mt-2 space-y-0.5 text-[10px] break-all" withLabels={false} />
          </div>

          {d.skills.length > 0 && (
            <div className="w-full mb-4">
              <h3 className="font-bold text-gray-900 border-b border-gray-400 pb-1 mb-2 uppercase text-sm">Skills</h3>
              <ul className="text-[11px] list-disc pl-4 space-y-1">{d.skills.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          )}
          {d.languages.length > 0 && (
            <div className="w-full mb-4">
              <h3 className="font-bold text-gray-900 border-b border-gray-400 pb-1 mb-2 uppercase text-sm">Languages</h3>
              <ul className="text-[11px] list-disc pl-4 space-y-1">{d.languages.map((l, i) => <li key={i}>{l.language}{l.proficiency ? ` – ${l.proficiency}` : ''}</li>)}</ul>
            </div>
          )}
          {d.hobbies.length > 0 && (
            <div className="w-full mb-4">
              <h3 className="font-bold text-gray-900 border-b border-gray-400 pb-1 mb-2 uppercase text-sm">Interests</h3>
              <ul className="text-[11px] list-disc pl-4 space-y-1">{d.hobbies.map((h, i) => <li key={i}>{h}</li>)}</ul>
            </div>
          )}

          <Extras data={d} keys={['cvnovaCode', 'maritalStatus', 'placeOfBirth', 'nationality']} className="mt-auto space-y-1 text-[10px] text-gray-600" />
        </div>

        <div className="w-[65%] p-8 bg-white">
          <div className="mb-6 border-b-2 border-gray-200 pb-4 avoid-break">
            <h1 className="text-3xl font-bold text-gray-900 tracking-wide uppercase">{d.fullName}</h1>
            <h2 className="text-lg text-[#D97706] font-semibold mt-1">{d.jobTitle}</h2>
          </div>

          {d.summary && (
            <div className="mb-6 avoid-break">
              <h3 className="font-bold text-gray-800 text-sm mb-2 uppercase tracking-wider border-b border-gray-200 pb-1">Professional Summary</h3>
              <p className="text-[11px] text-gray-700 leading-relaxed text-justify">{d.summary}</p>
            </div>
          )}

          {d.experience.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-gray-800 text-sm mb-3 uppercase tracking-wider border-b border-gray-200 pb-1">Experience</h3>
              {d.experience.map((e, i) => (
                <div key={i} className="mb-4 avoid-break">
                  <div className="flex justify-between items-baseline mb-1"><h4 className="font-bold text-xs text-gray-900">{e.role}</h4><span className="text-[10px] text-gray-500">{e.duration}</span></div>
                  <p className="text-[11px] text-gray-800 italic mb-1">{e.company}</p>
                  <ul className="text-[10px] text-gray-600 list-disc pl-4 space-y-1 leading-relaxed">{lines(e.desc).map((line, idx) => <li key={idx}>{line}</li>)}</ul>
                </div>
              ))}
            </div>
          )}

          {d.education.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-gray-800 text-sm mb-3 uppercase tracking-wider border-b border-gray-200 pb-1">Education</h3>
              {d.education.map((e, i) => (
                <div key={i} className="mb-2 avoid-break">
                  <div className="flex justify-between items-baseline"><h4 className="font-bold text-xs text-gray-900">{e.degree}</h4><span className="text-[10px] text-gray-500">{e.year}</span></div>
                  <p className="text-[10px] text-gray-600">{e.school}</p>
                </div>
              ))}
            </div>
          )}

          {d.certifications.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-gray-800 text-sm mb-3 uppercase tracking-wider border-b border-gray-200 pb-1">Certifications</h3>
              {d.certifications.map((c, i) => (
                <div key={i} className="mb-2 text-[11px] flex justify-between items-center avoid-break">
                  <div><span className="font-bold text-gray-900">{c.name}</span> {c.year && `(${c.year})`}</div>
                  {c.fileUrl && <a href={c.fileUrl} target="_blank" rel="noreferrer" className="text-blue-500 text-[10px] underline print:hidden">View</a>}
                </div>
              ))}
            </div>
          )}

          {d.references.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-800 text-sm mb-3 uppercase tracking-wider border-b border-gray-200 pb-1">References</h3>
              <div className="text-[11px]">
                <p className="italic text-gray-600">Available on request</p>
                {d.references.map((r, i) => (
                  <div key={i} className="mt-2 avoid-break">
                    <p className="font-bold text-gray-900">{r.name}</p>
                    <p className="text-gray-600">{r.role}{r.contact ? ` | ${r.contact}` : ''}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
