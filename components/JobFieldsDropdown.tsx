'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export type JobField = { id: string; field_name: string };

type JobFieldsDropdownProps = {
  /** "dark" = landing page (navy bg), "light" = dashboard / in-app */
  variant?: 'light' | 'dark';
  label?: string;
  className?: string;
};

// Reusable field dropdown: landing + dashboard par same component.
// Select karne par us field ke logo ke saath /chat khulta hai.
export default function JobFieldsDropdown({
  variant = 'light',
  label = 'Select your field',
  className = '',
}: JobFieldsDropdownProps) {
  const router = useRouter();
  const [fields, setFields] = useState<JobField[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data, error } = await supabase
        .from('job_fields')
        .select('id, field_name')
        .order('field_name', { ascending: true });

      if (cancelled) return;
      if (error) {
        setErrorMessage(error.message);
      } else {
        setFields((data as JobField[]) ?? []);
      }
      setLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const isDark = variant === 'dark';

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value) router.push(`/chat?field=${value}`);
  };

  return (
    <div className={`w-full max-w-sm ${className}`}>
      <label
        htmlFor="job-field-select"
        className={`mb-2 block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-blue-300' : 'text-indigo-600'}`}
      >
        {label}
      </label>
      <div className="relative">
        <select
          id="job-field-select"
          defaultValue=""
          onChange={handleChange}
          disabled={loading || fields.length === 0}
          className={`w-full appearance-none rounded-xl border px-4 py-3 pr-10 text-sm font-semibold outline-none transition disabled:cursor-not-allowed disabled:opacity-70 ${
            isDark
              ? 'border-white/15 bg-white/10 text-white focus:border-blue-400'
              : 'border-indigo-200 bg-white text-gray-800 focus:border-indigo-500'
          }`}
        >
          <option value="" disabled className={isDark ? 'text-gray-900' : 'text-gray-500'}>
            {loading
              ? 'Loading fields…'
              : fields.length === 0
                ? 'No fields yet — save a CV to create one'
                : 'Choose a field'}
          </option>
          {fields.map((field) => (
            <option key={field.id} value={field.id} className="text-gray-900">
              {field.field_name}
            </option>
          ))}
        </select>
        {loading ? (
          <Loader2
            size={16}
            className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 animate-spin ${isDark ? 'text-blue-300' : 'text-indigo-500'}`}
          />
        ) : (
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs ${isDark ? 'text-blue-300' : 'text-indigo-500'}`}
          >
            ▼
          </span>
        )}
      </div>
      {errorMessage && (
        <p className={`mt-2 text-xs ${isDark ? 'text-red-300' : 'text-red-600'}`}>
          Fields load nahi hui: {errorMessage}
        </p>
      )}
    </div>
  );
}
