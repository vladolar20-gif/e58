import { useState, useEffect } from 'react';
import { KeyRound, Loader as Loader2, Search, Trash2, Mail, Gamepad2, MessageCircle, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth, canManageAccounts } from '@/lib/auth';
import { sendDiscordWebhook, DISCORD_COLORS } from '@/lib/discord';
import {
  RANK_LABELS,
  RANK_COLORS,
  RANK_LEVELS,
  type AccountInfo,
  type StaffRank,
} from '@/lib/types';
import { formatDate, formatDateTime } from '@/lib/utils';

export function AccountsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selected, setSelected] = useState<AccountInfo | null>(null);
  const [error, setError] = useState('');
  const canAccess = canManageAccounts(profile);

  useEffect(() => {
    if (canAccess) loadAccounts();
  }, [canAccess]);

  const loadAccounts = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_all_accounts');
    if (error) {
      setError('Nu am putut incarca conturile.');
    } else {
      setAccounts((data as AccountInfo[]) || []);
    }
    setLoading(false);
  };

  const handleDelete = async (account: AccountInfo) => {
    if (account.user_id === profile?.user_id) return;
    const targetLevel = RANK_LEVELS[account.rank as StaffRank] || 0;
    const myLevel = profile ? RANK_LEVELS[profile.rank] : 0;
    if (targetLevel >= myLevel) return;
    if (!confirm(`ATENTIE: Esti sigur ca vrei sa stergi DEFINITIV contul lui ${account.roblox_name}?\n\nAceasta actiune va sterge complet contul si toate datele asociate. Aceasta actiune NU poate fi anulata.`)) return;
    if (!confirm(`Confirmare finala: Sigur stergi contul ${account.roblox_name} (${account.email})?`)) return;
    setActionLoading(account.user_id);
    setError('');
    const { error: rpcError } = await supabase.rpc('delete_user_account', {
      target_user_uuid: account.user_id,
    });
    if (rpcError) {
      setError(rpcError.message || 'Nu am putut sterge contul.');
    } else {
      await supabase.from('logs').insert({
        log_type: 'account_deleted',
        roblox_name: account.roblox_name,
        staff_name: profile?.roblox_name || null,
        staff_rank: profile?.rank || null,
        details: `Cont sters definitiv: ${account.roblox_name} (${account.email})`,
      });
      await sendDiscordWebhook(
        'Stergere Cont',
        `**${profile?.roblox_name}** a sters contul lui **${account.roblox_name}**`,
        [
          { name: 'Email', value: account.email, inline: true },
          { name: 'Grad', value: RANK_LABELS[account.rank as StaffRank] || account.rank, inline: true },
        ],
        DISCORD_COLORS.red,
      );
      setSelected(null);
      await loadAccounts();
    }
    setActionLoading(null);
  };

  const filtered = accounts.filter(
    (a) =>
      a.roblox_name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      (a.discord_name || '').toLowerCase().includes(search.toLowerCase()) ||
      RANK_LABELS[a.rank as StaffRank]?.toLowerCase().includes(search.toLowerCase())
  );

  if (!canAccess) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <KeyRound className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400">Nu ai permisiunea sa accesezi aceasta pagina.</p>
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
          <KeyRound className="w-7 h-7 text-amber-400" />
          Gestionare Conturi
        </h2>
        <p className="text-slate-400 mt-1">Informatii conturi staff si stergere definitiva</p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-rose-400 text-sm">
          {error}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cauta dupa nume, email, Discord..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition"
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center text-slate-500 py-12">
            <KeyRound className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nu exista conturi</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filtered.map((a) => {
              const isSelf = a.user_id === profile?.user_id;
              const targetLevel = RANK_LEVELS[a.rank as StaffRank] || 0;
              const canDelete = !isSelf && targetLevel < (profile ? RANK_LEVELS[profile.rank] : 0);
              return (
                <div key={a.profile_id} className="px-5 py-4 flex items-center justify-between gap-3 hover:bg-slate-800/30 transition group">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                        a.is_active ? 'bg-gradient-to-br from-amber-500 to-orange-700' : 'bg-slate-700'
                      }`}
                    >
                      {(a.roblox_name || '?')[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {a.roblox_name || 'Fara nume'}
                        {isSelf && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
                            Tu
                          </span>
                        )}
                        {!a.is_active && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            Blocat
                          </span>
                        )}
                      </p>
                      <p className="text-slate-500 text-xs truncate">{a.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full border ${RANK_COLORS[a.rank as StaffRank] || 'bg-slate-500/15 text-slate-400 border-slate-500/30'}`}>
                      {RANK_LABELS[a.rank as StaffRank] || a.rank}
                    </span>
                    <button
                      onClick={() => setSelected(a)}
                      className="text-slate-500 hover:text-sky-400 transition p-1.5 rounded-lg hover:bg-slate-800"
                      title="Vezi detalii"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                    {!isSelf && (
                      <button
                        onClick={() => handleDelete(a)}
                        disabled={actionLoading === a.user_id || !canDelete}
                        className="text-slate-500 hover:text-rose-400 transition p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100"
                        title={canDelete ? 'Sterge cont definitiv' : 'Nu poti sterge un cont cu grad egal sau superior'}
                      >
                        {actionLoading === a.user_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Detalii Cont</h3>
              <button
                onClick={() => setSelected(null)}
                className="text-slate-500 hover:text-slate-300 transition p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Account identity */}
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${selected.is_active ? 'bg-gradient-to-br from-amber-500 to-orange-700' : 'bg-slate-700'}`}>
                  {(selected.roblox_name || '?')[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-medium">{selected.roblox_name || 'Fara nume'}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${RANK_COLORS[selected.rank as StaffRank] || 'bg-slate-500/15 text-slate-400 border-slate-500/30'}`}>
                    {RANK_LABELS[selected.rank as StaffRank] || selected.rank}
                  </span>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="text-sm text-white truncate">{selected.email}</p>
                </div>
              </div>

              {/* Roblox info */}
              <div className="border-t border-slate-800 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Gamepad2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-slate-300">Roblox</span>
                </div>
                <div className="space-y-2 pl-6">
                  <div>
                    <p className="text-xs text-slate-500">Username</p>
                    <p className="text-sm text-white">{selected.roblox_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">ID</p>
                    <p className="text-sm text-white">{selected.roblox_id || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Discord info */}
              <div className="border-t border-slate-800 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle className="w-4 h-4 text-sky-400" />
                  <span className="text-sm font-semibold text-slate-300">Discord</span>
                </div>
                <div className="space-y-2 pl-6">
                  <div>
                    <p className="text-xs text-slate-500">Username</p>
                    <p className="text-sm text-white">{selected.discord_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">ID</p>
                    <p className="text-sm text-white">{selected.discord_id || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Meta */}
              <div className="border-t border-slate-800 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Cont creat</span>
                  <span className="text-white">{formatDateTime(selected.created_at)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Status</span>
                  <span className={selected.is_active ? 'text-emerald-400' : 'text-rose-400'}>
                    {selected.is_active ? 'Activ' : 'Blocat'}
                  </span>
                </div>
              </div>

              {/* Delete action */}
              {selected.user_id !== profile?.user_id && (
                <button
                  onClick={() => handleDelete(selected)}
                  disabled={actionLoading === selected.user_id || (RANK_LEVELS[selected.rank as StaffRank] || 0) >= (profile ? RANK_LEVELS[profile.rank] : 0)}
                  className="w-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading === selected.user_id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      Sterge cont definitiv
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
