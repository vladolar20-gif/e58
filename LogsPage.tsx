import { useState, useEffect } from 'react';
import { ScrollText, Loader2, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth, canViewLogs } from '@/lib/auth';
import { RANK_LABELS, type LogEntry } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';

const LOG_TYPE_LABELS: Record<string, string> = {
  sanction: 'Sanctiune',
  warning: 'Avertisment',
  rank_change: 'Schimbare Grad',
  staff_sanction: 'Sanctiune Staff',
  staff_removed: 'Staff Eliminat',
  staff_unbanned: 'Staff Reactivat',
  toggle_staff_active: 'Status Staff',
  announcement: 'Anunt',
  regulation: 'Regulament',
  invoire: 'Invoire',
  clock_in: 'Start Tura',
  clock_out: 'Sfarsit Tura',
  shift_delete: 'Stergere Pontaj',
  shift_reset: 'Resetare Pontaje',
  account_deleted: 'Cont Sters',
  account_created: 'Cont Creat',
  account_edited: 'Cont Editat',
};

export function LogsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState('all');
  const canAccess = canViewLogs(profile);

  useEffect(() => {
    if (canAccess) loadLogs();
  }, [canAccess]);

  const loadLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    setLogs((data as LogEntry[]) || []);
    setLoading(false);
  };

  const logTypes = [...new Set(logs.map((l) => l.log_type))];
  const filtered = filter === 'all' ? logs : logs.filter((l) => l.log_type === filter);

  if (!canAccess) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
          <ScrollText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Jurnalul este disponibil pentru Supervisor (Nivel 7) si gradele superioare.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <ScrollText className="w-7 h-7 text-sky-400" />
          Jurnal
        </h2>
        <p className="text-slate-400 mt-1">Log Sanctiuni si actiuni staff</p>
      </div>

      {logTypes.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 appearance-none cursor-pointer"
            >
              <option value="all">Toate tipurile</option>
              {logTypes.map((t) => (
                <option key={t} value={t} className="bg-slate-800">
                  {LOG_TYPE_LABELS[t] || t}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center text-slate-500 py-12">
            <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nu exista inregistrari in log</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filtered.map((l) => (
              <div key={l.id} className="px-5 py-4">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full border bg-sky-500/15 text-sky-400 border-sky-500/30">
                      {LOG_TYPE_LABELS[l.log_type] || l.log_type}
                    </span>
                    {l.roblox_name && (
                      <span className="text-white text-sm font-medium">{l.roblox_name}</span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    {formatDateTime(l.created_at)}
                  </span>
                </div>
                {(l.staff_name || l.staff_rank) && (
                  <p className="text-slate-400 text-xs mt-0.5">
                    {l.staff_name && `Staff: ${l.staff_name}`}
                    {l.staff_name && l.staff_rank && ' · '}
                    {l.staff_rank && `Grad: ${l.staff_rank}`}
                  </p>
                )}
                {l.details && <p className="text-slate-400 text-sm mt-1">{l.details}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
