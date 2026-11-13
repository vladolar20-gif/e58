import { useState, useEffect } from 'react';
import { Clock, Gavel, TriangleAlert as AlertTriangle, Megaphone, TrendingUp, CalendarOff, Loader as Loader2, Play, Square } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import {
  RANK_COLORS,
  RANK_LABELS,
  SANCTION_LABELS,
  SANCTION_COLORS,
  type Sanction,
  type Warning,
  type Announcement,
  type Invoire,
  type Shift,
} from '@/lib/types';
import { formatDateTime, timeAgo, getShiftDuration } from '@/lib/utils';

export function DashboardPage() {
  const { profile, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [recentSanctions, setRecentSanctions] = useState<Sanction[]>([]);
  const [recentWarnings, setRecentWarnings] = useState<Warning[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);
  const [pendingInvoiri, setPendingInvoiri] = useState<Invoire[]>([]);
  const [totalShifts, setTotalShifts] = useState(0);
  const [clocking, setClocking] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [shiftsRes, sanctionsRes, warningsRes, annRes, invRes] = await Promise.all([
      supabase.from('shifts').select('*').eq('user_id', session?.user.id).order('clock_in', { ascending: false }),
      supabase.from('sanctions').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('warnings').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(3),
      supabase.from('invoiri').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
    ]);

    if (shiftsRes.data) {
      setTotalShifts(shiftsRes.data.length);
      const active = shiftsRes.data.find((s) => !s.clock_out);
      setActiveShift(active || null);
    }
    setRecentSanctions((sanctionsRes.data as Sanction[]) || []);
    setRecentWarnings((warningsRes.data as Warning[]) || []);
    setRecentAnnouncements((annRes.data as Announcement[]) || []);
    setPendingInvoiri((invRes.data as Invoire[]) || []);
    setLoading(false);
  };

  const handleClockIn = async () => {
    setClocking(true);
    await supabase.from('shifts').insert({ user_id: session?.user.id, clock_in: new Date().toISOString() });
    await loadAll();
    setClocking(false);
  };

  const handleClockOut = async () => {
    if (!activeShift) return;
    setClocking(true);
    await supabase.from('shifts').update({ clock_out: new Date().toISOString() }).eq('id', activeShift.id);
    await loadAll();
    setClocking(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  const stats = [
    {
      label: 'Ture Totale',
      value: totalShifts,
      icon: Clock,
      color: 'from-sky-500 to-blue-700',
      iconBg: 'bg-sky-500/15 text-sky-400',
    },
    {
      label: 'Sanctiuni Recente',
      value: recentSanctions.length,
      icon: Gavel,
      color: 'from-orange-500 to-red-700',
      iconBg: 'bg-orange-500/15 text-orange-400',
    },
    {
      label: 'Warn-uri Recente',
      value: recentWarnings.length,
      icon: AlertTriangle,
      color: 'from-amber-500 to-yellow-700',
      iconBg: 'bg-amber-500/15 text-amber-400',
    },
    {
      label: 'Cereri Invoire',
      value: pendingInvoiri.length,
      icon: CalendarOff,
      color: 'from-emerald-500 to-green-700',
      iconBg: 'bg-emerald-500/15 text-emerald-400',
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white">
          Bun venit, {profile?.roblox_name || 'membru staff'}!
        </h2>
        <p className="text-slate-400 mt-1">Panoul tau de control E58 ROMÂNIA ROLEPLAY</p>
      </div>

      {/* Clock-in card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                activeShift ? 'bg-emerald-500/15' : 'bg-slate-700/40'
              }`}
            >
              {activeShift ? (
                <Clock className="w-7 h-7 text-emerald-400" />
              ) : (
                <Clock className="w-7 h-7 text-slate-400" />
              )}
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">
                {activeShift ? 'Esti in tura' : 'Nu esti in tura'}
              </h3>
              <p className="text-slate-400 text-sm">
                {activeShift
                  ? `Inceput la ${formatDateTime(activeShift.clock_in)} · ${getShiftDuration(activeShift.clock_in, activeShift.clock_out)}`
                  : 'Apasa clock-in pentru a incepe o tura'}
              </p>
            </div>
          </div>
          {activeShift ? (
            <button
              onClick={handleClockOut}
              disabled={clocking}
              className="bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2 disabled:opacity-50"
            >
              {clocking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Square className="w-5 h-5" />}
              Clock-out
            </button>
          ) : (
            <button
              onClick={handleClockIn}
              disabled={clocking}
              className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2 disabled:opacity-50"
            >
              {clocking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
              Clock-in
            </button>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-slate-400 text-sm mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent sanctions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Gavel className="w-5 h-5 text-orange-400" />
            Sanctiuni Recente
          </h3>
          {recentSanctions.length === 0 ? (
            <p className="text-slate-500 text-sm py-6 text-center">Nu exista sanctiuni inregistrate</p>
          ) : (
            <div className="space-y-2">
              {recentSanctions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 py-2 border-b border-slate-800 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-medium truncate">{s.roblox_name}</p>
                    <p className="text-slate-500 text-xs truncate">{s.reason}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${
                      SANCTION_COLORS[s.sanction_type]
                    }`}
                  >
                    {SANCTION_LABELS[s.sanction_type]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent warnings */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Warn-uri Recente
          </h3>
          {recentWarnings.length === 0 ? (
            <p className="text-slate-500 text-sm py-6 text-center">Nu exista warn-uri inregistrate</p>
          ) : (
            <div className="space-y-2">
              {recentWarnings.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between gap-3 py-2 border-b border-slate-800 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-medium truncate">{w.roblox_name}</p>
                    <p className="text-slate-500 text-xs truncate">{w.reason}</p>
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap">{timeAgo(w.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Announcements */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-sky-400" />
          Anunturi Recente
        </h3>
        {recentAnnouncements.length === 0 ? (
          <p className="text-slate-500 text-sm py-6 text-center">Nu exista anunturi</p>
        ) : (
          <div className="space-y-3">
            {recentAnnouncements.map((a) => (
              <div key={a.id} className="py-2 border-b border-slate-800 last:border-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-white text-sm font-medium">{a.title}</p>
                  <span className="text-xs text-slate-500 whitespace-nowrap">{timeAgo(a.created_at)}</span>
                </div>
                <p className="text-slate-400 text-sm line-clamp-2">{a.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile info */}
      {profile && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-sky-400" />
            Contul tau
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-500 text-xs mb-1">Grad</p>
              <span className={`inline-block text-sm px-3 py-1 rounded-full border ${RANK_COLORS[profile.rank]}`}>
                {RANK_LABELS[profile.rank]}
              </span>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-1">Status</p>
              <span
                className={`inline-block text-sm px-3 py-1 rounded-full border ${
                  profile.is_active
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }`}
              >
                {profile.is_active ? 'Activ' : 'Inactiv'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
