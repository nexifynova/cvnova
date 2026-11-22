'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Banknote, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Download, Loader2, Receipt, Search, Users, X } from 'lucide-react';
import Link from 'next/link';

type Payment = {
  id: string;
  user_id: string;
  user_email: string;
  package_type: string;
  amount: number | string;
  status: string;
  created_at: string;
  approved_at?: string | null;
  transaction_id?: string | null;
  payment_method?: string | null;
};

type ClientRow = {
  email: string;
  total: number;
  count: number;
  lastDate: string;
  packages: string[];
};

const pad = (n: number) => String(n).padStart(2, '0');
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

// Revenue us din count hoti hai jab payment APPROVE hui (agar approved_at na ho to created_at)
const revenueDate = (p: Payment): Date => new Date(p.approved_at || p.created_at);

const money = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;

export default function AdminRevenue() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'calendar' | 'client'>('calendar');
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRevenue();
  }, []);

  const fetchRevenue = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching revenue:', error);
      alert('Database Error: ' + error.message);
    } else if (data) {
      setPayments(data as Payment[]);
    }
    setLoading(false);
  };

  // ---------- Day wise totals (calendar ke liye) ----------
  const byDay = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    payments.forEach((p) => {
      const key = dayKey(revenueDate(p));
      const current = map.get(key) || { total: 0, count: 0 };
      map.set(key, { total: current.total + Number(p.amount || 0), count: current.count + 1 });
    });
    return map;
  }, [payments]);

  // ---------- Month wise totals (long-term record) ----------
  const byMonth = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    payments.forEach((p) => {
      const key = monthKey(revenueDate(p));
      const current = map.get(key) || { total: 0, count: 0 };
      map.set(key, { total: current.total + Number(p.amount || 0), count: current.count + 1 });
    });
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, value]) => ({
        key,
        label: new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        }),
        ...value,
      }));
  }, [payments]);

  // ---------- Client wise totals ----------
  const byClient = useMemo<ClientRow[]>(() => {
    const map = new Map<string, ClientRow>();
    payments.forEach((p) => {
      const email = p.user_email || 'Unknown';
      const row = map.get(email) || { email, total: 0, count: 0, lastDate: '', packages: [] };
      row.total += Number(p.amount || 0);
      row.count += 1;
      const date = revenueDate(p).toISOString();
      if (!row.lastDate || new Date(date) > new Date(row.lastDate)) row.lastDate = date;
      if (!row.packages.includes(p.package_type)) row.packages.push(p.package_type);
      map.set(email, row);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [payments]);

  const totals = useMemo(() => {
    const now = new Date();
    const shownMonthKey = monthKey(cursor);
    let total = 0;
    let thisMonth = 0;
    let shownMonth = 0;
    payments.forEach((p) => {
      const amount = Number(p.amount || 0);
      const key = monthKey(revenueDate(p));
      total += amount;
      if (key === monthKey(now)) thisMonth += amount;
      if (key === shownMonthKey) shownMonth += amount;
    });
    return { total, thisMonth, shownMonth, count: payments.length, clients: byClient.length };
  }, [payments, byClient, cursor]);

  // ---------- Filtered list (table + CSV export) ----------
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return payments.filter((p) => {
      if (selectedDay && dayKey(revenueDate(p)) !== selectedDay) return false;
      if (selectedClient && p.user_email !== selectedClient) return false;
      if (q) {
        const haystack = `${p.user_email} ${p.package_type} ${p.transaction_id || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [payments, selectedDay, selectedClient, searchTerm]);

  const filteredTotal = useMemo(
    () => filtered.reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [filtered]
  );

  // ---------- Calendar grid ----------
  const calendarCells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ key: string | null; day: number | null; total: number; count: number }> = [];

    for (let i = 0; i < firstWeekday; i++) cells.push({ key: null, day: null, total: 0, count: 0 });
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${pad(month + 1)}-${pad(d)}`;
      const row = byDay.get(key);
      cells.push({ key, day: d, total: row?.total || 0, count: row?.count || 0 });
    }
    return cells;
  }, [cursor, byDay]);

  const monthLabel = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const shiftMonth = (delta: number) => {
    setSelectedDay(null);
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));
  };

  const clearFilters = () => {
    setSelectedDay(null);
    setSelectedClient(null);
    setSearchTerm('');
  };

  const exportCSV = () => {
    const header = ['Payment Date', 'Approved At', 'Client Email', 'Package', 'Amount', 'Transaction ID', 'Method'];
    const rows = filtered.map((p) => [
      dayKey(revenueDate(p)),
      p.approved_at || '',
      p.user_email,
      p.package_type,
      String(Number(p.amount || 0)),
      p.transaction_id || '',
      p.payment_method || '',
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `revenue-received-${dayKey(new Date())}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-100 transition"><ArrowLeft size={20} /></Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Revenue Received</h1>
              <p className="text-sm text-gray-500 mt-1">Sirf <strong>approved</strong> payments ki company income — calendar wise aur client wise record</p>
            </div>
          </div>
          <button onClick={exportCSV} className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition shadow-sm">
            <Download size={16} /> Export CSV ({filtered.length})
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between"><p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Revenue</p><Banknote size={18} className="text-emerald-600" /></div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{money(totals.total)}</p>
            <p className="text-xs text-gray-500 mt-1">All time received</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between"><p className="text-xs font-bold text-gray-500 uppercase tracking-wide">This Month</p><CalendarDays size={18} className="text-blue-600" /></div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{money(totals.thisMonth)}</p>
            <p className="text-xs text-gray-500 mt-1">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between"><p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Payments</p><Receipt size={18} className="text-purple-600" /></div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{totals.count}</p>
            <p className="text-xs text-gray-500 mt-1">Approved transactions</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between"><p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Paying Clients</p><Users size={18} className="text-orange-600" /></div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{totals.clients}</p>
            <p className="text-xs text-gray-500 mt-1">Unique customers</p>
          </div>
        </div>

        {/* View switcher + active filters */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button onClick={() => setView('calendar')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${view === 'calendar' ? 'bg-gray-900 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}>
            <CalendarDays size={16} /> Calendar Wise
          </button>
          <button onClick={() => setView('client')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${view === 'client' ? 'bg-gray-900 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}>
            <Users size={16} /> Client Wise
          </button>
          {(selectedDay || selectedClient || searchTerm) && (
            <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition">
              <X size={14} /> Clear filters
            </button>
          )}
          {selectedDay && (
            <span className="text-xs font-bold text-gray-600 bg-white border border-gray-200 px-3 py-2 rounded-xl">
              {new Date(`${selectedDay}T00:00:00`).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
          {selectedClient && (
            <span className="text-xs font-bold text-gray-600 bg-white border border-gray-200 px-3 py-2 rounded-xl">Client: {selectedClient}</span>
          )}
        </div>

        {/* CALENDAR WISE */}
        {view === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <button onClick={() => shiftMonth(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition" title="Previous month"><ChevronLeft size={18} /></button>
                <div className="text-center">
                  <p className="font-bold text-gray-900">{monthLabel}</p>
                  <p className="text-xs text-gray-500">Received: <strong className="text-emerald-600">{money(totals.shownMonth)}</strong></p>
                </div>
                <button onClick={() => shiftMonth(1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition" title="Next month"><ChevronRight size={18} /></button>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <div key={d} className="text-center text-[11px] font-bold text-gray-400 uppercase py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarCells.map((cell, index) => {
                    if (!cell.key || !cell.day) return <div key={`empty-${index}`} className="min-h-[62px]" />;
                    const isSelected = selectedDay === cell.key;
                    const isToday = cell.key === dayKey(new Date());
                    return (
                      <button
                        key={cell.key}
                        onClick={() => setSelectedDay(isSelected ? null : cell.key)}
                        className={`min-h-[62px] rounded-lg border p-1.5 text-left transition ${isSelected ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200' : cell.total > 0 ? 'border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50' : 'border-gray-100 bg-white hover:bg-gray-50'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isToday ? 'bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center' : 'text-gray-500'}`}>{cell.day}</span>
                          {cell.count > 0 && <span className="text-[10px] text-gray-400">{cell.count}x</span>}
                        </div>
                        {cell.total > 0 && <p className="text-[11px] font-bold text-emerald-700 mt-1 leading-tight">{money(cell.total)}</p>}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-gray-400 mt-3">Kisi bhi din par click karein — neeche us din ki received payments show ho jayengi.</p>
              </div>
            </div>

            {/* Month wise breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">Month Wise Record</h2>
                <p className="text-xs text-gray-500">Har mahine ki total company income</p>
              </div>
              <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-50">
                {byMonth.length === 0 && <p className="px-5 py-8 text-center text-sm text-gray-400">Abhi koi approved revenue nahi hai.</p>}
                {byMonth.map((row) => (
                  <button
                    key={row.key}
                    onClick={() => {
                      const year = Number(row.key.slice(0, 4));
                      const month = Number(row.key.slice(5, 7));
                      setCursor(new Date(year, month - 1, 1));
                      setSelectedDay(null);
                      setView('calendar');
                    }}
                    className={`w-full flex items-center justify-between px-5 py-3 text-left transition ${monthKey(cursor) === row.key ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{row.label}</p>
                      <p className="text-[11px] text-gray-500">{row.count} payment{row.count > 1 ? 's' : ''}</p>
                    </div>
                    <p className="text-sm font-bold text-emerald-700">{money(row.total)}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CLIENT WISE */}
        {view === 'client' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900">Client Wise Revenue</h2>
                <p className="text-xs text-gray-500">Har client se received total income (highest first)</p>
              </div>
              <Users size={18} className="text-gray-400" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-6 py-3 font-medium">Client Email</th>
                    <th className="px-6 py-3 font-medium">Packages</th>
                    <th className="px-6 py-3 font-medium">Payments</th>
                    <th className="px-6 py-3 font-medium">Last Received</th>
                    <th className="px-6 py-3 font-medium text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {byClient.map((client) => (
                    <tr
                      key={client.email}
                      onClick={() => { setSelectedClient(client.email); setSearchTerm(''); }}
                      className={`cursor-pointer transition ${selectedClient === client.email ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-6 py-3 font-medium text-gray-900">{client.email}</td>
                      <td className="px-6 py-3 text-xs text-blue-600 font-semibold">{client.packages.join(', ')}</td>
                      <td className="px-6 py-3 text-gray-600">{client.count}</td>
                      <td className="px-6 py-3 text-gray-500 whitespace-nowrap">{new Date(client.lastDate).toLocaleDateString()}</td>
                      <td className="px-6 py-3 font-bold text-emerald-700 text-right whitespace-nowrap">{money(client.total)}</td>
                    </tr>
                  ))}
                  {byClient.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">Abhi koi approved payment nahi hai.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TRANSACTIONS */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-gray-900">Received Payments</h2>
              <p className="text-xs text-gray-500">
                {filtered.length} transaction{filtered.length === 1 ? '' : 's'} · Total <strong className="text-emerald-700">{money(filteredTotal)}</strong>
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search email, package or transaction ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-80 pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-6 py-3 font-medium">Received Date</th>
                  <th className="px-6 py-3 font-medium">Client</th>
                  <th className="px-6 py-3 font-medium">Package</th>
                  <th className="px-6 py-3 font-medium">Method</th>
                  <th className="px-6 py-3 font-medium">Transaction ID</th>
                  <th className="px-6 py-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-500 whitespace-nowrap">{revenueDate(p).toLocaleDateString()}</td>
                    <td className="px-6 py-3 font-medium text-gray-900">{p.user_email}</td>
                    <td className="px-6 py-3 text-blue-600 font-semibold whitespace-nowrap">{p.package_type}</td>
                    <td className="px-6 py-3 text-gray-600 whitespace-nowrap">{p.payment_method || '—'}</td>
                    <td className="px-6 py-3 text-xs text-gray-500 font-mono">{p.transaction_id || '—'}</td>
                    <td className="px-6 py-3 font-bold text-emerald-700 text-right whitespace-nowrap">{money(Number(p.amount || 0))}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      <CheckCircle2 size={28} className="mx-auto mb-2 text-gray-300" />
                      Koi payment is filter ke mutabiq nahi mili.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-4">
          Note: Revenue sirf un payments ki count hoti hai jin ka status <strong>Approved</strong> hai. Agar kisi payment ko
          Disapprove ya In Checking kiya jaye to wo revenue se khud hat jati hai.
        </p>
      </div>
    </div>
  );
}
