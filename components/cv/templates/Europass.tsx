import { Extras, type TemplateProps } from '../shared';

export default function Europass({ data: d }: TemplateProps) {
  return (
    <div className="h-full bg-white p-10 text-gray-800">
      <div className="mb-5 border-b-4 border-[#003399] pb-3 avoid-break">
        <h1 className="text-3xl font-bold text-[#003399]">{d.fullName}</h1>
        <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">{d.jobTitle}</p>
      </div>

      <div className="mb-6 avoid-break">
        <h2 className="mb-2 bg-[#003399] px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white">Personal information</h2>
        <table className="w-full text-[11px]">
          <tbody>
            {d.address && <tr><td className="w-40 py-0.5 align-top text-gray-500">Address</td><td className="py-0.5">{d.address}</td></tr>}
            {d.phone && <tr><td className="py-0.5 align-top text-gray-500">Telephone</td><td className="py-0.5">{d.phone}</td></tr>}
            {d.email && <tr><td className="py-0.5 align-top text-gray-500">Email</td><td className="py-0.5">{d.email}</td></tr>}
            {d.nationality && <tr><td className="py-0.5 align-top text-gray-500">Nationality</td><td className="py-0.5">{d.nationality}</td></tr>}
            {d.placeOfBirth && <tr><td className="py-0.5 align-top text-gray-500">Place of birth</td><td className="py-0.5">{d.placeOfBirth}</td></tr>}
            {d.maritalStatus && <tr><td className="py-0.5 align-top text-gray-500">Marital status</td><td className="py-0.5">{d.maritalStatus}</td></tr>}
            {d.cvnovaCode && <tr><td className="py-0.5 align-top text-gray-500">Digital CV ID</td><td className="py-0.5">{d.cvnovaCode}</td></tr>}
          </tbody>
        </table>
        <Extras data={d} keys={['linkedin', 'instagram', 'indeed']} className="mt-1 flex flex-wrap gap-x-4 text-[10px] text-[#003399]" withLabels={false} />
      </div>

      {d.summary && (
        <div className="mb-5 avoid-break">
          <h2 className="mb-2 bg-[#003399] px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white">Personal statement</h2>
          <p className="text-[11px] leading-relaxed text-gray-700">{d.summary}</p>
        </div>
      )}

      {d.experience.length > 0 && (
        <div className="mb-5">
          <h2 className="mb-2 bg-[#003399] px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white">Work experience</h2>
          {d.experience.map((e, i) => (
            <div key={i} className="mb-3 avoid-break">
              <div className="flex justify-between text-[11px] font-semibold text-[#003399]"><span>{e.duration}</span><span className="text-gray-500">{e.company}</span></div>
              <p className="text-xs font-bold text-gray-900">{e.role}</p>
              <p className="whitespace-pre-line text-[11px] text-gray-700">{e.desc}</p>
            </div>
          ))}
        </div>
      )}

      {d.education.length > 0 && (
        <div className="mb-5">
          <h2 className="mb-2 bg-[#003399] px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white">Education and training</h2>
          {d.education.map((e, i) => (
            <div key={i} className="mb-2 flex justify-between text-[11px] avoid-break"><div><span className="font-bold text-gray-900">{e.degree}</span> — <span className="text-gray-600">{e.school}</span></div><span className="text-gray-500">{e.year}</span></div>
          ))}
        </div>
      )}

      {d.languages.length > 0 && (
        <div className="mb-5 avoid-break">
          <h2 className="mb-2 bg-[#003399] px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white">Language skills</h2>
          <table className="w-full text-[11px]">
            <tbody>{d.languages.map((l, i) => <tr key={i}><td className="w-40 py-0.5 font-semibold">{l.language}</td><td className="py-0.5 text-gray-600">{l.proficiency || '—'}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {d.skills.length > 0 && (
        <div className="mb-5 avoid-break">
          <h2 className="mb-2 bg-[#003399] px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white">Digital &amp; professional skills</h2>
          <p className="text-[11px] text-gray-700">{d.skills.join(' · ')}</p>
        </div>
      )}

      {d.certifications.length > 0 && (
        <div className="avoid-break">
          <h2 className="mb-2 bg-[#003399] px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white">Additional information</h2>
          <ul className="list-disc pl-4 text-[11px] text-gray-700">{d.certifications.map((c, i) => <li key={i}>{c.name}{c.year ? ` (${c.year})` : ''}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
