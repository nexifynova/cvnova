'use client';

import { useEffect, useId, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export type JobField = { id: string; field_name: string };

type JobFieldsDropdownProps = {
  /** "dark" = landing page (navy bg), "light" = dashboard / in-app */
  variant?: 'light' | 'dark';
  /** "md" = landing/dashboard, "sm" = compact toolbar (company talent pool) */
  size?: 'md' | 'sm';
  /** Khali string pass karo to label hide ho jata hai (toolbar usage) */
  label?: string;
  className?: string;
  /** Controlled value (field id) — parent state se select control hota hai */
  value?: string;
  /**
   * Agar diya jaye to select /chat par navigate nahi karta, sirf callback chalta hai.
   * Company talent pool isay filter ke tor par use karta hai.
   */
  onSelect?: (field: JobField | null) => void;
  /** Filter mode: pehla "sab" option (e.g. "All fields"). Diya jaye to selectable hota hai. */
  allOptionLabel?: string;
};

// Reusable field dropdown: landing, dashboard aur company talent pool par same component.
// Default behaviour: select karne par us field ke logon ke saath /chat khulta hai.
// `onSelect` dene par navigation nahi hoti — parent apna filter chalata hai.
export default function JobFieldsDropdown({
  variant = 'light',
  size = 'md',
  label = 'Select your field',
  className = '',
  value,
  onSelect,
  allOptionLabel,
}: JobFieldsDropdownProps) {
  const router = useRouter();
  const selectId = `job-field-select-${useId().replace(/:/g, '')}`;
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
  const isFilter = allOptionLabel !== undefined || onSelect !== undefined;
  const isDisabled = loading || (fields.length === 0 && !isFilter);

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value;
    const selected = next ? fields.find((field) => field.id === next) ?? null : null;
    if (onSelect) {
      onSelect(selected);
      return;
    }
    if (next) router.push(`/chat?field=${next}`);
  };

  return (
    <div className={`${size === 'sm' ? 'w-full sm:w-44' : 'w-full max-w-sm'} ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className={`mb-2 block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-blue-300' : 'text-indigo-600'}`}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          {...(value === undefined ? { defaultValue: '' } : { value })}
          onChange={handleChange}
          disabled={isDisabled}
          aria-label={label ? undefined : allOptionLabel || 'Select a field'}
          className={`w-full appearance-none rounded-xl border font-semibold outline-none transition disabled:cursor-not-allowed disabled:opacity-70 ${
            size === 'sm' ? 'px-3 py-2 pr-8 text-xs' : 'px-4 py-3 pr-10 text-sm'
          } ${
            isDark
              ? 'border-white/15 bg-white/10 text-white focus:border-blue-400'
              : 'border-indigo-200 bg-white text-gray-800 focus:border-indigo-500'
          }`}
        >
          {allOptionLabel !== undefined ? (
            <option value="" className="text-gray-900">
              {allOptionLabel}
            </option>
          ) : (
            <option value="" disabled className={isDark ? 'text-gray-900' : 'text-gray-500'}>
              {loading
                ? 'Loading fields…'
                : fields.length === 0
                  ? 'No fields yet — save a CV to create one'
                  : 'Choose a field'}
            </option>
          )}
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
