import { Extras, type TemplateProps } from '../shared';

export default function Startup({ data: d }: TemplateProps) {
  return (
    <div className="h-full bg-white p-8 text-gray-800">
      <div className="mb-6 flex items-start justify-between gap-4 avoid-break">
        <div>
          {d.photoUrl && <img src={d.photoUrl} alt="Profile" className="mb-3 h-20 w-20 rounded-2xl object-cover ring-4 ring-orange-100" />}
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{d.fullName}</h1>
          <p className="mt-0.5 inline-block rounded-full bg-orange-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-orange-700">{d.jobTitle}</p>
        </div>
        <div className="max-w-[45%] space-y-1 text-right text-[10px] text-gray-500">
          {d.email && <p>{d.email}</p>}{d.phone && <p>{d.phone}</p>}{d.address && <p>{d.address}</p>}
          <Extras data={d} keys={['linkedin', 'instagram', 'indeed']} className="space-y-0.5 break-all" withLabels={false} />
        </div>
      </div>

      {d.summary && <div className="mb-6 rounded-2xl bg-orange-50 p-4 avoid-break"><p className="text-xs leading-relaxed text-gray-700">{d.summary}</p></div>}

      {d.experience.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-orange-600">What I&apos;ve built</h2>
          {d.experience.map((e, i) => (
            <div key={i} className="mb-4 border-l-4 border-orange-200 pl-4 avoid-break">
              <div className="flex justify-between"><h3 className="text-sm font-bold text-gray-900">{e.role}</h3><span className="text-[10px] font-semibold text-gray-400">{e.duration}</span></div>
              <p className="text-[11px] font-semibold text-orange-600">{e.company}</p>
              <p className="mt-1 whitespace-pre-line text-xs text-gray-600">{e.desc}</p>
            </div>
          ))}
        </div>
      )}

      {d.education.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-orange-600">Education</h2>
          <div className="grid grid-cols-2 gap-3">
            {d.education.map((e, i) => <div key={i} className="rounded-xl border border-gray-100 p-3 avoid-break"><h3 className="text-xs font-bold text-gray-900">{e.degree}</h3><p className="text-[10px] text-gray-500">{e.school}{e.year ? ` · ${e.year}` : ''}</p></div>)}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 avoid-break">
        <div>
          {d.skills.length > 0 && <><h2 className="mb-2 text-xs font-extrabold uppercase tracking-widest text-orange-600">Stack &amp; Skills</h2><div className="flex flex-wrap gap-1.5">{d.skills.map((s, i) => <span key={i} className="rounded-lg bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-700">{s}</span>)}</div></>}
        </div>
        <div>
          {d.languages.length > 0 && <><h2 className="mb-2 text-xs font-extrabold uppercase tracking-widest text-orange-600">Languages</h2><p className="text-[11px] text-gray-600">{d.languages.map((l) => l.language).join(' · ')}</p></>}
          {d.certifications.length > 0 && <><h2 className="mb-2 mt-4 text-xs font-extrabold uppercase tracking-widest text-orange-600">Certifications</h2><p className="text-[11px] text-gray-600">{d.certifications.map((c) => c.name).join(' · ')}</p></>}
        </div>
      </div>

      <Extras data={d} keys={['cvnovaCode', 'maritalStatus', 'placeOfBirth', 'nationality']} className="mt-5 flex flex-wrap gap-x-4 border-t border-orange-100 pt-2 text-[10px] text-gray-500" />
    </div>
  );
}
