import { useState, useEffect, useMemo } from 'react';
import { Clock, Loader2, Play, Square, Trash2, RotateCcw, ChevronRight, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth, canViewAllShifts } from '@/lib/auth';
import { sendDiscordWebhook, DISCORD_COLORS } from '@/lib/discord';
import { RANK_LABELS, RANK_COLORS, type Shift, type StaffProfile } from '@/lib/types';
import { formatDateTime, formatTime, getShiftDuration, formatDate } from '@/lib/utils';

interface MemberShiftSummary {
  profile: StaffProfile;
  totalMinutes: number;
  shiftCount: number;
  activeShift: Shift | null;
}

function durationMinutes(clockIn: string, clockOut: string | null): number {
  const start = new Date(clockIn).getTime();
  const end = clockOut ? new Date(clockOut).getTime() : Date.now();
  return Math.max(0, Math.round((end - start) / 60000));
}

function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function ShiftsPage() {
  const { profile, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clocking, setClocking] = useState(false);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [myShifts, setMyShifts] = useState<Shift[]>([]);
  const [allSummaries, setAllSummaries] = useState<MemberShiftSummary[]>([]);
  const [viewAll, setViewAll] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberShiftSummary | null>(null);
  const [memberShifts, setMemberShifts] = useState<Shift[]>([]);
  const [memberShiftsLoading, setMemberShiftsLoading] = useState(false);
  const [resetModal, setResetModal] = useState<'single' | 'global' | null>(null);
  const [resetTarget, setResetTarget] = useState<StaffProfile | null>(null);
  const [resetting, setResetting] = useState(false);
  const canSeeAll = canViewAllShifts(profile);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: myData } = await supabase
      .from('shifts')
      .select('*')
      .eq('user_id', session?.user.id)
      .order('clock_in', { ascending: false });
    setMyShifts((myData as Shift[]) || []);
    const active = (myData as Shift[])?.find((s) => !s.clock_out) || null;
    setActiveShift(active);

    if (canSeeAll) {
      await loadAllSummaries();
    }
    setLoading(false);
  };

  const loadAllSummaries = async () => {
    const [{ data: allShiftsData }, { data: profilesData }] = await Promise.all([
      supabase.from('shifts').select('*').order('clock_in', { ascending: false }),
      supabase.from('staff_profiles').select('*'),
    ]);
    const profiles = (profilesData as StaffProfile[]) || [];
    const shifts = (allShiftsData as Shift[]) || [];
    const profileMap: Record<string, StaffProfile> = {};
    profiles.forEach((p) => { profileMap[p.user_id] = p; });

    const summaries: MemberShiftSummary[] = profiles.map((p) => {
      const memberShifts = shifts.filter((s) => s.user_id === p.user_id);
      const total = memberShifts.reduce((acc, s) => acc + durationMinutes(s.clock_in, s.clock_out), 0);
      const active = memberShifts.find((s) => !s.clock_out) || null;
      return { profile: p, totalMinutes: total, shiftCount: memberShifts.length, activeShift: active };
    });
    summaries.sort((a, b) => b.totalMinutes - a.totalMinutes);
    setAllSummaries(summaries);
  };

  const handleClockIn = async () => {
    setClocking(true);
    await supabase.from('shifts').insert({ user_id: session?.user.id, clock_in: new Date().toISOString() });
    await supabase.from('logs').insert({
      log_type: 'clock_in',
      roblox_name: profile?.roblox_name || null,
      staff_name: profile?.roblox_name || null,
      staff_rank: profile?.rank || null,
      details: 'A inceput tura (clock-in)',
    });
    await sendDiscordWebhook(
      'Start Tura',
      `**${profile?.roblox_name}** a inceput tura`,
      [
        { name: 'Grad', value: RANK_LABELS[profile?.rank || 'helper'], inline: true },
        { name: 'Ora', value: formatDateTime(new Date().toISOString()), inline: true },
      ],
      DISCORD_COLORS.green,
    );
    await loadData();
    setClocking(false);
  };

  const handleClockOut = async () => {
    if (!activeShift) return;
    setClocking(true);
    await supabase.from('shifts').update({ clock_out: new Date().toISOString() }).eq('id', activeShift.id);
    await supabase.from('logs').insert({
      log_type: 'clock_out',
      roblox_name: profile?.roblox_name || null,
      staff_name: profile?.roblox_name || null,
      staff_rank: profile?.rank || null,
      details: `A terminat tura — Durata: ${getShiftDuration(activeShift.clock_in, new Date().toISOString())}`,
    });
    await loadData();
    setClocking(false);
  };

  const handleCancelShift = async (id: string) => {
    if (!confirm('Esti sigur ca vrei sa anulezi aceasta tura?')) return;
    await supabase.from('shifts').delete().eq('id', id);
    await loadData();
  };

  const openMemberDetail = async (summary: MemberShiftSummary) => {
    setSelectedMember(summary);
    setMemberShiftsLoading(true);
    const { data } = await supabase
      .from('shifts')
      .select('*')
      .eq('user_id', summary.profile.user_id)
      .order('clock_in', { ascending: false });
    setMemberShifts((data as Shift[]) || []);
    setMemberShiftsLoading(false);
  };

  const handleResetMemberShifts = async () => {
    if (!resetTarget) return;
    setResetting(true);
    await supabase.from('shifts').delete().eq('user_id', resetTarget.user_id);
    await supabase.from('logs').insert({
      log_type: 'shift_delete',
      roblox_name: resetTarget.roblox_name,
      staff_name: profile?.roblox_name || null,
      staff_rank: profile?.rank || null,
      details: `Pontaj sters pentru ${resetTarget.roblox_name}`,
    });
    await sendDiscordWebhook(
      'Stergere Pontaj Individual',
      `**${profile?.roblox_name}** a sters pontajele lui **${resetTarget.roblox_name}**`,
      [],
      DISCORD_COLORS.orange,
    );
    setResetModal(null);
    setResetTarget(null);
    setResetting(false);
    await loadData();
    if (selectedMember?.profile.user_id === resetTarget.user_id) setSelectedMember(null);
  };

  const handleResetAllShifts = async () => {
    setResetting(true);
    await supabase.from('shifts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('logs').insert({
      log_type: 'shift_reset',
      roblox_name: null,
      staff_name: profile?.roblox_name || null,
      staff_rank: profile?.rank || null,
      details: 'Resetare globala a tuturor pontajelor',
    });
    await sendDiscordWebhook(
      'Resetare Globala Pontaje',
      `**${profile?.roblox_name}** a resetat toate pontajele`,
      [],
      DISCORD_COLORS.red,
    );
    setResetModal(null);
    setResetting(false);
    await loadData();
  };

  const myTotalMinutes = useMemo(() => myShifts.reduce((acc, s) => acc + durationMinutes(s.clock_in, s.clock_out), 0), [myShifts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="w-7 h-7 text-sky-400" />
            Ture
          </h2>
          <p className="text-slate-400 mt-1">
            {activeShift ? `In tura de ${getShiftDuration(activeShift.clock_in, null)}` : 'Clock-in pentru a incepe tura'}
            <span className="ml-2 text-slate-500">· Total: {formatMinutes(myTotalMinutes)}</span>
          </p>
        </div>
        {activeShift ? (
          <button
            onClick={handleClockOut}
            disabled={clocking}
            className="bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 px-5 py-2.5 rounded-xl font-semibold transition flex items-center gap-2 disabled:opacity-50 text-sm"
          >
            {clocking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
            Clock-out
          </button>
        ) : (
          <button
            onClick={handleClockIn}
            disabled={clocking}
            className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 px-5 py-2.5 rounded-xl font-semibold transition flex items-center gap-2 disabled:opacity-50 text-sm"
          >
            {clocking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Clock-in
          </button>
        )}
      </div>

      {canSeeAll && (
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setViewAll(!viewAll)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              viewAll
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
            }`}
          >
            {viewAll ? 'Toate turele' : 'Turele mele'}
          </button>
          {viewAll && (
            <button
              onClick={() => setResetModal('global')}
              className="bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reseteaza toate pontajele
            </button>
          )}
        </div>
      )}

      {/* All members summary view — sorted by total minutes desc */}
      {viewAll && canSeeAll ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {allSummaries.length === 0 ? (
            <div className="text-center text-slate-500 py-12">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nu exista membri</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {allSummaries.map((s, idx) => (
                <div
                  key={s.profile.id}
                  className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-800/30 transition group cursor-pointer"
                  onClick={() => openMemberDetail(s)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-xs text-slate-600 w-5 text-right">{idx + 1}</span>
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                        s.profile.is_active ? 'bg-gradient-to-br from-sky-500 to-blue-700' : 'bg-slate-700'
                      }`}
                    >
                      {(s.profile.roblox_name || '?')[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate flex items-center gap-1.5">
                        {s.profile.roblox_name || 'Fara nume'}
                        {s.activeShift && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Pe tura
                          </span>
                        )}
                      </p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full border ${RANK_COLORS[s.profile.rank]}`}>
                        {RANK_LABELS[s.profile.rank]}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm text-white font-mono font-medium">{formatMinutes(s.totalMinutes)}</p>
                      <p className="text-xs text-slate-500">{s.shiftCount} ture</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition" />
                    <button
                      onClick={(e) => { e.stopPropagation(); setResetTarget(s.profile); setResetModal('single'); }}
                      className="text-slate-500 hover:text-rose-400 transition p-1.5 rounded-lg hover:bg-slate-800 opacity-0 group-hover:opacity-100"
                      title="Reseteaza pontaj"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* My shifts — compact table */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {myShifts.length === 0 ? (
            <div className="text-center text-slate-500 py-12">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nu exista ture inregistrate</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {myShifts.map((s) => {
                const isActive = !s.clock_out;
                return (
                  <div key={s.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-medium flex items-center gap-2">
                        {formatDate(s.clock_in)}
                        {isActive && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Pe tura
                          </span>
                        )}
                      </p>
                      <p className="text-slate-500 text-xs">
                        {formatTime(s.clock_in)} - {s.clock_out ? formatTime(s.clock_out) : 'acum'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm text-slate-400 font-mono">{getShiftDuration(s.clock_in, s.clock_out)}</span>
                      {isActive && (
                        <button
                          onClick={() => handleCancelShift(s.id)}
                          className="text-slate-500 hover:text-rose-400 transition p-1.5 rounded-lg hover:bg-slate-800"
                          title="Anuleaza tura"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Member detail modal — compact */}
      {selectedMember && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMember(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm ${selectedMember.profile.is_active ? 'bg-gradient-to-br from-sky-500 to-blue-700' : 'bg-slate-700'}`}>
                  {(selectedMember.profile.roblox_name || '?')[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="text-white font-semibold">{selectedMember.profile.roblox_name}</h3>
                  <p className="text-xs text-slate-500">
                    {RANK_LABELS[selectedMember.profile.rank]} · {formatMinutes(selectedMember.totalMinutes)} · {selectedMember.shiftCount} ture
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedMember(null)} className="text-slate-500 hover:text-slate-300 transition p-1 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="text-sm text-slate-400">Total timp: <span className="text-white font-mono font-medium">{formatMinutes(selectedMember.totalMinutes)}</span></span>
              <button
                onClick={() => { setResetTarget(selectedMember.profile); setResetModal('single'); }}
                className="bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reseteaza ture
              </button>
            </div>
            <div className="overflow-y-auto">
              {memberShiftsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
                </div>
              ) : memberShifts.length === 0 ? (
                <p className="text-center text-slate-500 py-8 text-sm">Nu exista ture.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs text-slate-500">
                      <th className="text-left px-4 py-2 font-medium">Inceput</th>
                      <th className="text-left px-4 py-2 font-medium">Sfarsit</th>
                      <th className="text-right px-4 py-2 font-medium">Durata</th>
                      <th className="text-center px-4 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberShifts.map((s) => (
                      <tr key={s.id} className="border-b border-slate-800/50 last:border-0">
                        <td className="px-4 py-2 text-slate-300">{formatDateTime(s.clock_in)}</td>
                        <td className="px-4 py-2 text-slate-300">{s.clock_out ? formatDateTime(s.clock_out) : '—'}</td>
                        <td className="px-4 py-2 text-right text-slate-400 font-mono">{getShiftDuration(s.clock_in, s.clock_out)}</td>
                        <td className="px-4 py-2 text-center">
                          {s.clock_out ? (
                            <span className="text-xs text-slate-500">Incheiata</span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Activa</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reset confirmation modal */}
      {resetModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !resetting && setResetModal(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-rose-400" />
              </div>
              <h3 className="text-white font-semibold">
                {resetModal === 'global' ? 'Resetare globala' : 'Resetare pontaj'}
              </h3>
            </div>
            <p className="text-sm text-slate-400 mb-5">
              {resetModal === 'global'
                ? 'Esti sigur ca vrei sa stergi toate pontajele tuturor membrilor? Aceasta actiune nu poate fi anulata.'
                : `Esti sigur ca vrei sa stergi toate pontajele lui ${resetTarget?.roblox_name}? Aceasta actiune nu poate fi anulata.`}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={resetModal === 'global' ? handleResetAllShifts : handleResetMemberShifts}
                disabled={resetting}
                className="flex-1 bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
              >
                {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                Confirma
              </button>
              <button
                onClick={() => setResetModal(null)}
                disabled={resetting}
                className="text-slate-400 hover:text-slate-200 px-4 py-2.5 rounded-lg text-sm transition"
              >
                Anuleaza
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
