import { ContactStrip, Extras, PersonalDetails, type TemplateProps } from '../shared';

const Dot = () => <div className="absolute w-4 h-4 bg-blue-600 rounded-full -left-[9px] top-1" />;

export default function Timeline({ data: d }: TemplateProps) {
  return (
    <div className="p-10">
      <div className="text-center mb-8 avoid-break">
        <h1 className="text-3xl font-bold text-gray-900">{d.fullName}</h1>
        <p className="text-gray-500">{d.jobTitle}</p>
        <ContactStrip data={d} className="text-xs text-gray-400 mt-2 flex justify-center" />
        <Extras data={d} keys={['linkedin', 'instagram', 'indeed']} className="mt-1 flex justify-center gap-3 text-[10px] text-gray-400" withLabels={false} />
      </div>

      {d.summary && (
        <div className="relative border-l-2 border-blue-200 ml-3 pl-6 mb-8 avoid-break">
          <Dot /><h2 className="text-sm font-bold text-blue-600 uppercase mb-2">Summary</h2><p className="text-sm text-gray-700">{d.summary}</p>
        </div>
      )}

      {d.experience.length > 0 && (
        <div className="relative border-l-2 border-blue-200 ml-3 pl-6 mb-8">
          <Dot /><h2 className="text-sm font-bold text-blue-600 uppercase mb-3">Experience</h2>
          {d.experience.map((e, i) => (
            <div key={i} className="mb-4 avoid-break">
              <h3 className="font-bold text-gray-900">{e.role}</h3>
              <p className="text-xs text-gray-500 mb-1">{e.company}{e.duration ? ` | ${e.duration}` : ''}</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">{e.desc}</p>
            </div>
          ))}
        </div>
      )}

      {d.education.length > 0 && (
        <div className="relative border-l-2 border-blue-200 ml-3 pl-6 mb-8">
          <Dot /><h2 className="text-sm font-bold text-blue-600 uppercase mb-3">Education</h2>
          {d.education.map((e, i) => (
            <div key={i} className="mb-3 avoid-break"><h3 className="font-bold text-gray-900">{e.degree}</h3><p className="text-sm text-gray-600">{e.school}{e.year ? ` | ${e.year}` : ''}</p></div>
          ))}
        </div>
      )}

      {d.skills.length > 0 && (
        <div className="relative border-l-2 border-blue-200 ml-3 pl-6 mb-8 avoid-break">
          <Dot /><h2 className="text-sm font-bold text-blue-600 uppercase mb-2">Skills</h2>
          <div className="flex flex-wrap gap-2">{d.skills.map((s, i) => <span key={i} className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">{s}</span>)}</div>
        </div>
      )}

      {d.languages.length > 0 && (
        <div className="relative border-l-2 border-blue-200 ml-3 pl-6 mb-8 avoid-break">
          <Dot /><h2 className="text-sm font-bold text-blue-600 uppercase mb-2">Languages</h2>
          <div className="flex flex-wrap gap-2">{d.languages.map((l, i) => <span key={i} className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">{l.language}{l.proficiency ? ` (${l.proficiency})` : ''}</span>)}</div>
        </div>
      )}

      <div className="relative border-l-2 border-blue-200 ml-3 pl-6 avoid-break">
        <Dot /><h2 className="text-sm font-bold text-blue-600 uppercase mb-2">Personal Details</h2>
        <PersonalDetails
          data={d}
          heading={null}
          listClassName="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-600"
          labelClassName="font-semibold text-gray-800"
        />
        <Extras data={d} keys={['cvnovaCode']} className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-500" />
      </div>
    </div>
  );
}
