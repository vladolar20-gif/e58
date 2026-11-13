import { useState, useEffect } from 'react';
import { Users, Loader2, Search, ArrowUp, ArrowDown, UserMinus, UserCheck, History, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth, canManageRanks, canModifyRank } from '@/lib/auth';
import { sendDiscordWebhook, DISCORD_COLORS } from '@/lib/discord';
import {
  RANK_LABELS,
  RANK_COLORS,
  RANK_ORDER,
  RANK_LEVELS,
  type StaffProfile,
  type StaffRank,
  type RankHistoryEntry,
} from '@/lib/types';
import { formatDateTime } from '@/lib/utils';

export function MembersPage() {
  const { profile, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<StaffProfile[]>([]);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rankModal, setRankModal] = useState<{ member: StaffProfile; direction: 'up' | 'down' } | null>(null);
  const [rankReason, setRankReason] = useState('');
  const [rankError, setRankError] = useState('');
  const [historyModal, setHistoryModal] = useState<StaffProfile | null>(null);
  const [history, setHistory] = useState<RankHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const canManage = canManageRanks(profile);
  const myLevel = profile ? RANK_LEVELS[profile.rank] : 0;

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('staff_profiles')
      .select('*')
      .order('created_at', { ascending: true });
    setMembers((data as StaffProfile[]) || []);
    setLoading(false);
  };

  const openRankModal = (member: StaffProfile, direction: 'up' | 'down') => {
    if (member.id === profile?.id) return;
    if (!canModifyRank(profile, member.rank)) return;
    const currentIdx = RANK_ORDER.indexOf(member.rank);
    const newIdx = direction === 'up' ? currentIdx + 1 : currentIdx - 1;
    if (newIdx < 0 || newIdx >= RANK_ORDER.length) return;
    if (direction === 'up' && RANK_LEVELS[RANK_ORDER[newIdx]] >= myLevel) return;
    setRankReason('');
    setRankError('');
    setRankModal({ member, direction });
  };

  const confirmRankChange = async () => {
    if (!rankModal || !profile) return;
    const { member, direction } = rankModal;
    if (!rankReason.trim()) {
      setRankError('Motivul este obligatoriu pentru a salva aceasta actiune.');
      return;
    }
    const currentIdx = RANK_ORDER.indexOf(member.rank);
    const newIdx = direction === 'up' ? currentIdx + 1 : currentIdx - 1;
    const newRank = RANK_ORDER[newIdx];

    setActionLoading(member.id);
    setRankError('');

    await supabase.from('staff_profiles').update({ rank: newRank }).eq('id', member.id);
    await supabase.from('rank_history').insert({
      profile_id: member.id,
      old_rank: member.rank,
      new_rank: newRank,
      reason: rankReason.trim(),
      changed_by: session?.user.id || null,
      changed_by_name: profile.roblox_name || null,
    });
    await supabase.from('logs').insert({
      log_type: 'rank_change',
      roblox_name: member.roblox_name,
      staff_name: profile.roblox_name || null,
      staff_rank: profile.rank || null,
      details: `${direction === 'up' ? 'Promovare' : 'Retrogradare'} la ${RANK_LABELS[newRank]} — Motiv: ${rankReason.trim()}`,
    });

    await sendDiscordWebhook(
      direction === 'up' ? 'Promovare Staff' : 'Retrogradare Staff',
      `**${member.roblox_name}** a fost ${direction === 'up' ? 'promovat' : 'retrogradat'} de **${profile.roblox_name}**`,
      [
        { name: 'Grad vechi', value: RANK_LABELS[member.rank], inline: true },
        { name: 'Grad nou', value: RANK_LABELS[newRank], inline: true },
        { name: 'Motiv', value: rankReason.trim() },
      ],
      direction === 'up' ? DISCORD_COLORS.green : DISCORD_COLORS.orange,
    );

    setRankModal(null);
    setRankReason('');
    await loadMembers();
    setActionLoading(null);
  };

  const handleToggleActive = async (member: StaffProfile) => {
    if (member.id === profile?.id) return;
    if (!canModifyRank(profile, member.rank)) return;
    const action = member.is_active ? 'Da Afara din Staff' : 'Readmite in Staff';
    if (!confirm(`Sigur vrei sa dai ${action} pe ${member.roblox_name}?`)) return;
    setActionLoading(member.id);
    await supabase.from('staff_profiles').update({ is_active: !member.is_active }).eq('id', member.id);
    await supabase.from('logs').insert({
      log_type: member.is_active ? 'staff_removed' : 'staff_unbanned',
      roblox_name: member.roblox_name,
      staff_name: profile?.roblox_name || null,
      staff_rank: profile?.rank || null,
      details: member.is_active ? 'Eliminat din staff' : 'Readmis in staff',
    });
    await sendDiscordWebhook(
      member.is_active ? 'Eliminare din Staff' : 'Readmitere in Staff',
      `**${member.roblox_name}** — ${member.is_active ? 'eliminat' : 'readmis'} de **${profile?.roblox_name}**`,
      [],
      member.is_active ? DISCORD_COLORS.red : DISCORD_COLORS.green,
    );
    await loadMembers();
    setActionLoading(null);
  };

  const openHistory = async (member: StaffProfile) => {
    setHistoryModal(member);
    setHistoryLoading(true);
    const { data } = await supabase
      .from('rank_history')
      .select('*')
      .eq('profile_id', member.id)
      .order('created_at', { ascending: false });
    setHistory((data as RankHistoryEntry[]) || []);
    setHistoryLoading(false);
  };

  const filtered = members.filter(
    (m) =>
      m.roblox_name.toLowerCase().includes(search.toLowerCase()) ||
      RANK_LABELS[m.rank].toLowerCase().includes(search.toLowerCase())
  );

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
          <Users className="w-7 h-7 text-sky-400" />
          Membri Staff
        </h2>
        <p className="text-slate-400 mt-1">
          Lista membrilor staff E58 ROMÂNIA ROLEPLAY
          {!canManage && <span className="ml-2 text-slate-500">· Mod vizualizare</span>}
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cauta membru..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition"
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center text-slate-500 py-12">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nu exista membri</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filtered.map((m) => {
              const rankIdx = RANK_ORDER.indexOf(m.rank);
              const isSelf = m.id === profile?.id;
              const canModifyThis = canManage && !isSelf && canModifyRank(profile, m.rank);
              const canPromote = canModifyThis && rankIdx < RANK_ORDER.length - 1;
              const canDemote = canModifyThis && rankIdx > 0;
              return (
                <div key={m.id} className="px-5 py-4 flex items-center justify-between gap-3 hover:bg-slate-800/30 transition group">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                        m.is_active ? 'bg-gradient-to-br from-sky-500 to-blue-700' : 'bg-slate-700'
                      }`}
                    >
                      {(m.roblox_name || '?')[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {m.roblox_name || 'Fara nume'}
                        {isSelf && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
                            Tu
                          </span>
                        )}
                        {!m.is_active && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            Blocat
                          </span>
                        )}
                      </p>
                      <p className="text-slate-500 text-xs">Nivel {RANK_LEVELS[m.rank]}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full border ${RANK_COLORS[m.rank]}`}>
                      {RANK_LABELS[m.rank]}
                    </span>
                    <button
                      onClick={() => openHistory(m)}
                      className="text-slate-500 hover:text-sky-400 transition p-1.5 rounded-lg hover:bg-slate-800"
                      title="Istoric grad"
                    >
                      <History className="w-4 h-4" />
                    </button>
                    {canManage && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => openRankModal(m, 'up')}
                          disabled={!canPromote || actionLoading === m.id}
                          className="text-slate-500 hover:text-emerald-400 transition p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Promoveaza"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openRankModal(m, 'down')}
                          disabled={!canDemote || actionLoading === m.id}
                          className="text-slate-500 hover:text-orange-400 transition p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Retrogradare"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(m)}
                          disabled={actionLoading === m.id || !canModifyThis}
                          className={`transition p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed ${
                            m.is_active ? 'text-slate-500 hover:text-rose-400' : 'text-slate-500 hover:text-emerald-400'
                          }`}
                          title={m.is_active ? 'Da Afara din Staff' : 'Readmite in Staff'}
                        >
                          {m.is_active ? <UserMinus className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                    {actionLoading === m.id && (
                      <Loader2 className="w-4 h-4 text-sky-500 animate-spin" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rank change modal with required reason */}
      {rankModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setRankModal(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">
                {rankModal.direction === 'up' ? 'Promoveaza' : 'Retrogradeaza'} — {rankModal.member.roblox_name}
              </h3>
              <button onClick={() => setRankModal(null)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4 space-y-1">
              <p className="text-sm text-slate-400">
                Grad curent: <span className={RANK_COLORS[rankModal.member.rank].split(' ')[1]}>{RANK_LABELS[rankModal.member.rank]}</span>
              </p>
              <p className="text-sm text-slate-400">
                Grad nou:{' '}
                <span className={RANK_COLORS[RANK_ORDER[RANK_ORDER.indexOf(rankModal.member.rank) + (rankModal.direction === 'up' ? 1 : -1)]].split(' ')[1]}>
                  {RANK_LABELS[RANK_ORDER[RANK_ORDER.indexOf(rankModal.member.rank) + (rankModal.direction === 'up' ? 1 : -1)]]}
                </span>
              </p>
            </div>
            {rankError && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-rose-400 text-sm mb-3">
                {rankError}
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Motiv (obligatoriu)</label>
              <textarea
                value={rankReason}
                onChange={(e) => setRankReason(e.target.value)}
                rows={3}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition text-sm resize-none"
                placeholder="Explica motivul promovarii/retrogradarii..."
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={confirmRankChange}
                disabled={!rankReason.trim() || actionLoading === rankModal.member.id}
                className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading === rankModal.member.id ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirma'}
              </button>
              <button
                onClick={() => setRankModal(null)}
                className="text-slate-400 hover:text-slate-200 px-4 py-2.5 rounded-lg text-sm transition"
              >
                Anuleaza
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rank history modal */}
      {historyModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setHistoryModal(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">Istoric Grad — {historyModal.roblox_name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Toate modificarile de grad</p>
              </div>
              <button onClick={() => setHistoryModal(null)} className="text-slate-500 hover:text-slate-300 transition p-1 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-5">
              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <p className="text-center text-slate-500 py-8 text-sm">Nu exista inregistrari de modificari de grad.</p>
              ) : (
                <div className="space-y-3">
                  {history.map((h) => (
                    <div key={h.id} className="bg-slate-800/40 border border-slate-800 rounded-xl p-3">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${RANK_COLORS[h.old_rank]}`}>
                          {RANK_LABELS[h.old_rank]}
                        </span>
                        <span className="text-slate-500 text-xs">{'→'}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${RANK_COLORS[h.new_rank]}`}>
                          {RANK_LABELS[h.new_rank]}
                        </span>
                        <span className="text-xs text-slate-600 ml-auto">{formatDateTime(h.created_at)}</span>
                      </div>
                      <p className="text-sm text-slate-300">{h.reason}</p>
                      {h.changed_by_name && (
                        <p className="text-xs text-slate-500 mt-1">de {h.changed_by_name}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
