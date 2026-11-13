import { useState, useEffect } from 'react';
import { UserCog, Plus, Trash2, Loader as Loader2, X, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { sendDiscordWebhook, DISCORD_COLORS } from '@/lib/discord';
import {
  RANK_LABELS,
  RANK_COLORS,
  type StaffSanction,
  type StaffRank,
} from '@/lib/types';
import { timeAgo } from '@/lib/utils';

export function StaffSanctionsPage() {
  const { profile, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sanctions, setSanctions] = useState<StaffSanction[]>([]);
  const [members, setMembers] = useState<{ id: string; roblox_name: string; rank: StaffRank }[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ staff_id: '', sanction_type: 'warning', reason: '', proof_url: '' });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [sanctionsRes, membersRes] = await Promise.all([
      supabase.from('staff_sanctions').select('*').order('created_at', { ascending: false }),
      supabase.from('staff_profiles').select('id, roblox_name, rank').order('roblox_name', { ascending: true }),
    ]);
    setSanctions((sanctionsRes.data as StaffSanction[]) || []);
    setMembers((membersRes.data as { id: string; roblox_name: string; rank: StaffRank }[]) || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const member = members.find((m) => m.id === form.staff_id);
    if (member) {
      await supabase.from('staff_sanctions').insert({
        staff_name: member.roblox_name,
        staff_rank: member.rank,
        sanction_type: form.sanction_type,
        reason: form.reason,
        proof_url: form.proof_url.trim() || null,
        issued_by: session?.user.id,
        issued_by_name: profile?.roblox_name || null,
      });
      await supabase.from('logs').insert({
        log_type: 'staff_sanction',
        roblox_name: member.roblox_name,
        staff_name: profile?.roblox_name || null,
        staff_rank: profile?.rank || null,
        details: `${form.sanction_type}: ${form.reason}`,
      });
      await sendDiscordWebhook(
        'Sanctiune Staff',
        `**${member.roblox_name}** a primit sanctiune de **${profile?.roblox_name}**`,
        [
          { name: 'Tip', value: form.sanction_type, inline: true },
          { name: 'Motiv', value: form.reason },
          ...(form.proof_url.trim() ? [{ name: 'Dovada', value: form.proof_url.trim() }] : []),
        ],
        DISCORD_COLORS.rose,
      );
    }
    setShowAdd(false);
    setForm({ staff_id: '', sanction_type: 'warning', reason: '', proof_url: '' });
    await loadAll();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Esti sigur ca vrei sa stergi aceasta sanctiune staff?')) return;
    await supabase.from('staff_sanctions').delete().eq('id', id);
    await loadAll();
  };

  const filtered = sanctions.filter(
    (s) =>
      s.staff_name.toLowerCase().includes(search.toLowerCase()) ||
      s.reason.toLowerCase().includes(search.toLowerCase())
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <UserCog className="w-7 h-7 text-rose-400" />
            Sanctiuni Staff
          </h2>
          <p className="text-slate-400 mt-1">Sanctiuni aplicate membrilor staff</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white px-4 py-2.5 rounded-xl font-medium transition shadow-lg shadow-sky-500/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Adauga Sanctiune
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cauta dupa nume sau motiv..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition"
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center text-slate-500 py-12">
            <UserCog className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nu exista sanctiuni staff inregistrate</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filtered.map((s) => (
              <div key={s.id} className="px-5 py-4 hover:bg-slate-800/30 transition group">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-medium">{s.staff_name}</p>
                      {s.staff_rank && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${RANK_COLORS[s.staff_rank as StaffRank]}`}>
                          {RANK_LABELS[s.staff_rank as StaffRank] || s.staff_rank}
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-rose-500/15 text-rose-400 border-rose-500/30">
                        {s.sanction_type}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mt-1">{s.reason}</p>
                    <p className="text-slate-600 text-xs mt-1">
                      {s.issued_by_name && `de ${s.issued_by_name} · `}
                      {timeAgo(s.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="text-slate-500 hover:text-rose-400 transition p-1.5 rounded-lg hover:bg-slate-800 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowAdd(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                <UserCog className="w-5 h-5 text-rose-400" />
                Sanctiune Staff
              </h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Membru Staff</label>
                <select
                  value={form.staff_id}
                  onChange={(e) => setForm({ ...form, staff_id: e.target.value })}
                  required
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition text-sm"
                >
                  <option value="">Selecteaza membru...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id} className="bg-slate-800">
                      {m.roblox_name} ({RANK_LABELS[m.rank]})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Tip Sanctiune</label>
                <select
                  value={form.sanction_type}
                  onChange={(e) => setForm({ ...form, sanction_type: e.target.value })}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition text-sm"
                >
                  <option value="warning" className="bg-slate-800">Avertisment</option>
                  <option value="suspension" className="bg-slate-800">Suspendare</option>
                  <option value="demotion" className="bg-slate-800">Retrogradare</option>
                  <option value="removal" className="bg-slate-800">Eliminare</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Motiv</label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  required
                  rows={3}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition text-sm resize-none"
                  placeholder="Motivul sanctiunii..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Dovada (link imagine/video) — optional</label>
                <input
                  type="text"
                  value={form.proof_url}
                  onChange={(e) => setForm({ ...form, proof_url: e.target.value })}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition text-sm"
                  placeholder="https://..."
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salveaza'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
