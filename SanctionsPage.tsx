import { useState, useEffect } from 'react';
import { Gavel, Plus, Trash2, Loader2, X, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { sendDiscordWebhook, DISCORD_COLORS } from '@/lib/discord';
import {
  SANCTION_LABELS,
  SANCTION_COLORS,
  type Sanction,
  type SanctionType,
} from '@/lib/types';
import { formatDateTime, timeAgo } from '@/lib/utils';

const SANCTION_TYPES: SanctionType[] = ['kick', 'temp_ban', 'permanent_ban', 'warning', 'mute', 'ban'];

export function SanctionsPage() {
  const { profile, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sanctions, setSanctions] = useState<Sanction[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    roblox_name: '',
    roblox_id: '',
    sanction_type: 'kick' as SanctionType,
    reason: '',
    duration: '',
    proof_url: '',
  });

  useEffect(() => {
    loadSanctions();
  }, []);

  const loadSanctions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('sanctions')
      .select('*')
      .order('created_at', { ascending: false });
    setSanctions((data as Sanction[]) || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.roblox_name.trim() || !form.reason.trim()) {
      setError('Numele jucatorului si motivul sunt obligatorii.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('sanctions').insert({
      roblox_name: form.roblox_name.trim(),
      roblox_id: form.roblox_id.trim() || null,
      sanction_type: form.sanction_type,
      reason: form.reason.trim(),
      duration: form.sanction_type === 'temp_ban' || form.sanction_type === 'mute' ? form.duration.trim() || null : null,
      proof_url: form.proof_url.trim() || null,
      issued_by: session?.user.id,
      issued_by_name: profile?.roblox_name || null,
    });
    if (error) {
      setError('Nu am putut adauga sanctiunea. Incearca din nou.');
    } else {
      await supabase.from('logs').insert({
        log_type: 'sanction',
        roblox_name: form.roblox_name.trim(),
        staff_name: profile?.roblox_name || null,
        staff_rank: profile?.rank || null,
        details: `${SANCTION_LABELS[form.sanction_type]}: ${form.reason.trim()}${form.duration ? ` (${form.duration})` : ''}`,
      });
      await sendDiscordWebhook(
        'Sanctiune Jucator',
        `**${form.roblox_name.trim()}** a primit sanctiune de **${profile?.roblox_name}**`,
        [
          { name: 'Tip', value: SANCTION_LABELS[form.sanction_type], inline: true },
          { name: 'Motiv', value: form.reason.trim() },
          ...(form.duration ? [{ name: 'Durata', value: form.duration, inline: true }] : []),
          ...(form.proof_url.trim() ? [{ name: 'Dovada', value: form.proof_url.trim() }] : []),
        ],
        DISCORD_COLORS.red,
      );
      setShowAdd(false);
      setForm({ roblox_name: '', roblox_id: '', sanction_type: 'kick', reason: '', duration: '', proof_url: '' });
      await loadSanctions();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Esti sigur ca vrei sa stergi aceasta sanctiune?')) return;
    await supabase.from('sanctions').delete().eq('id', id);
    await loadSanctions();
  };

  const filtered = sanctions.filter(
    (s) =>
      s.roblox_name.toLowerCase().includes(search.toLowerCase()) ||
      s.reason.toLowerCase().includes(search.toLowerCase()) ||
      (s.issued_by_name || '').toLowerCase().includes(search.toLowerCase())
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
            <Gavel className="w-7 h-7 text-orange-400" />
            Sanctiuni
          </h2>
          <p className="text-slate-400 mt-1">Sanctiuni aplicate jucatorilor</p>
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
          placeholder="Cauta dupa nume, motiv sau cine a aplicat..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition"
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center text-slate-500 py-12">
            <Gavel className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{sanctions.length === 0 ? 'Nu exista sanctiuni inregistrate' : 'Nu am gasit rezultate pentru cautarea ta'}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filtered.map((s) => (
              <div key={s.id} className="px-5 py-4 hover:bg-slate-800/30 transition group">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-medium">{s.roblox_name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${SANCTION_COLORS[s.sanction_type]}`}>
                        {SANCTION_LABELS[s.sanction_type]}
                      </span>
                      {s.duration && (
                        <span className="text-xs text-slate-400">Durata: {s.duration}</span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm mt-1">{s.reason}</p>
                    <p className="text-slate-600 text-xs mt-1">
                      {s.issued_by_name && `de ${s.issued_by_name} · `}
                      {timeAgo(s.created_at)}
                    </p>
                  </div>
                  {s.issued_by === session?.user.id && (
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-slate-500 hover:text-rose-400 transition p-1.5 rounded-lg hover:bg-slate-800 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
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
                <Gavel className="w-5 h-5 text-orange-400" />
                Adauga Sanctiune
              </h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-rose-400 text-sm mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Nume Roblox</label>
                  <input
                    type="text"
                    value={form.roblox_name}
                    onChange={(e) => setForm({ ...form, roblox_name: e.target.value })}
                    required
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition text-sm"
                    placeholder="NumeJucator"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">ID Roblox</label>
                  <input
                    type="text"
                    value={form.roblox_id}
                    onChange={(e) => setForm({ ...form, roblox_id: e.target.value })}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition text-sm"
                    placeholder="12345678"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Tip Sanctiune</label>
                <select
                  value={form.sanction_type}
                  onChange={(e) => setForm({ ...form, sanction_type: e.target.value as SanctionType })}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition text-sm"
                >
                  {SANCTION_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-slate-800">
                      {SANCTION_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              {(form.sanction_type === 'temp_ban' || form.sanction_type === 'mute') && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Durata</label>
                  <input
                    type="text"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition text-sm"
                    placeholder="ex: 7 zile, 24 ore"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Motiv</label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  required
                  rows={3}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition text-sm resize-none"
                  placeholder="Descrie motivul sanctiunii..."
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
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salveaza Sanctiune'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
