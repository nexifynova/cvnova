'use client';

import { useEffect, useState } from 'react';
import {
  BadgeDollarSign,
  CalendarClock,
  CheckCircle2,
  Crown,
  Info,
  Loader2,
  Save,
  Timer,
  TimerOff,
} from 'lucide-react';
import {
  DEFAULT_ACCESS_SETTINGS,
  type CompanyAccessSettings,
  type CompanyPackage,
} from '@/lib/company-access';

/**
 * Admin -> Company Pricing & Settings.
 *
 * Edits the plan catalogue (price, duration, visibility) and the free-trial /
 * grace-period rules. Every write goes through /api/admin/company-packages,
 * which runs with the service role behind the admin_session cookie.
 */

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized: 'Your admin session expired — sign in again.',
  invalid_trial_days: 'Trial days must be between 1 and 365.',
  invalid_grace_hours: 'Grace hours must be between 0 and 720.',
  invalid_package_price: 'Enter a price of 0 or more.',
  invalid_package_duration: 'Duration must be between 1 and 3650 days.',
  invalid_package_name: 'Each plan needs a name.',
  no_changes: 'Nothing to save yet.',
};

const money = (value: number) => `$${(Math.round(Number(value || 0) * 100) / 100).toFixed(2)}`;

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  );
}

export default function CompanyPricingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [settings, setSettings] = useState<CompanyAccessSettings>({ ...DEFAULT_ACCESS_SETTINGS });
  const [packages, setPackages] = useState<CompanyPackage[]>([]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/company-packages', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(ERROR_MESSAGES[data.error] || data.error || 'Could not load pricing');
      if (data.settings) setSettings(data.settings as CompanyAccessSettings);
      setPackages(Array.isArray(data.packages) ? (data.packages as CompanyPackage[]) : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const updatePackage = (code: string, patch: Partial<CompanyPackage>) => {
    setPackages((prev) => prev.map((item) => (item.code === code ? { ...item, ...patch } : item)));
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch('/api/admin/company-packages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings,
          packages: packages.map((item) => ({
            code: item.code,
            name: item.name,
            priceUsd: item.priceUsd,
            durationDays: item.durationDays,
            isActive: item.isActive,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(ERROR_MESSAGES[data.error] || data.error || 'Could not save pricing');
      if (data.settings) setSettings(data.settings as CompanyAccessSettings);
      setPackages(Array.isArray(data.packages) ? (data.packages as CompanyPackage[]) : packages);
      setNotice('Pricing saved. New prices and timings apply immediately.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <BadgeDollarSign className="text-blue-600" size={24} /> Company Pricing &amp; Settings
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Plans companies can buy, plus the free trial and grace period that control chat and job posting.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving || loading}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save changes
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <CheckCircle2 size={16} /> {notice}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center rounded-2xl border border-gray-100 bg-white py-20">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
              <Timer size={18} className="text-blue-600" /> Trial &amp; grace period
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                  <CalendarClock size={13} /> Free trial (days)
                </span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={settings.trialDays}
                  onChange={(e) => setSettings({ ...settings, trialDays: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="mt-1 block text-[11px] text-gray-400">
                  Applied to every new company at registration.
                </span>
              </label>

              <label className="block">
                <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                  <TimerOff size={13} /> Grace period (hours)
                </span>
                <input
                  type="number"
                  min={0}
                  max={720}
                  value={settings.graceHours}
                  onChange={(e) => setSettings({ ...settings, graceHours: Number(e.target.value) })}
                  disabled={!settings.graceEnabled}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                />
                <span className="mt-1 block text-[11px] text-gray-400">
                  Chat stays open this long after the plan expires; job posting stops immediately.
                </span>
              </label>
            </div>

            <div className="mt-5 flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div>
                <p className="text-sm font-bold text-gray-900">Grace period enabled</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  When off, chat and job posting close the moment a plan expires and no grace popup is shown.
                </p>
              </div>
              <Toggle
                checked={settings.graceEnabled}
                onChange={(next) => setSettings({ ...settings, graceEnabled: next })}
                label="Grace period enabled"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-gray-900">
              <Crown size={18} className="text-blue-600" /> Package catalogue
            </h2>
            <p className="mb-4 text-xs text-gray-500">
              These plans appear in the company dashboard&apos;s &quot;View plans&quot; list. Hidden plans disappear from that
              list but stay on record.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    <th className="pb-2 pr-3">Plan</th>
                    <th className="pb-2 pr-3">Price (USD)</th>
                    <th className="pb-2 pr-3">Duration (days)</th>
                    <th className="pb-2 pr-3">Per month</th>
                    <th className="pb-2 pr-3">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((item) => (
                    <tr key={item.code} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 pr-3">
                        <input
                          value={item.name}
                          onChange={(e) => updatePackage(item.code, { name: e.target.value })}
                          maxLength={60}
                          className="w-40 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="mt-1 font-mono text-[10px] text-gray-400">
                          {item.code}
                          {item.isTrial ? ' · trial' : ''}
                        </p>
                      </td>
                      <td className="py-3 pr-3">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.priceUsd}
                          onChange={(e) =>
                            updatePackage(item.code, { priceUsd: e.target.value === '' ? 0 : Number(e.target.value) })
                          }
                          className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 pr-3">
                        <input
                          type="number"
                          min={1}
                          max={3650}
                          value={item.durationDays}
                          onChange={(e) =>
                            updatePackage(item.code, {
                              durationDays: e.target.value === '' ? 0 : Math.round(Number(e.target.value)),
                            })
                          }
                          className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 pr-3 text-xs font-semibold text-gray-700">
                        {money(item.priceUsd / Math.max(1, item.durationDays / 30))}
                      </td>
                      <td className="py-3 pr-3">
                        <Toggle
                          checked={item.isActive}
                          onChange={(next) => updatePackage(item.code, { isActive: next })}
                          label={`${item.name} active`}
                        />
                      </td>
                    </tr>
                  ))}
                  {packages.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-sm text-gray-500">
                        No plans found — apply the Phase 2 migration first.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-relaxed text-blue-900">
              <Info size={16} className="mt-0.5 shrink-0" />
              <p>
                Changing the grace period re-dates every company&apos;s grace end immediately. Trial days apply to companies
                registered afterwards. Expired companies keep read-only access to the talent pool and their chat history;
                only new chats and job posts are blocked.
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
