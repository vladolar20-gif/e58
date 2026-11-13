import { useState, useEffect } from 'react';
import { TriangleAlert as AlertTriangle, Plus, Trash2, Loader as Loader2, X, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { sendDiscordWebhook, DISCORD_COLORS } from '@/lib/discord';
import type { Warning } from '@/lib/types';
import { timeAgo } from '@/lib/utils';

export function WarningsPage() {
  const { profile, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formState, setFormState] = useState({ roblox_name: '', roblox_id: '', reason: '' });

  useEffect(() => {
    loadWarnings();
  }, []);

  const loadWarnings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('warnings')
      .select('*')
      .order('created_at', { ascending: false });
    setWarnings((data as Warning[]) || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formState.roblox_name.trim() || !formState.reason.trim()) {
      setError('Numele jucatorului si motivul sunt obligatorii.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('warnings').insert({
      roblox_name: formState.roblox_name.trim(),
      roblox_id: formState.roblox_id.trim() || null,
      reason: formState.reason.trim(),
      issued_by: session?.user.id,
      issued_by_name: profile?.roblox_name || null,
    });
    if (error) {
      setError('Nu am putut adauga warn-ul. Incearca din nou.');
    } else {
      await supabase.from('logs').insert({
        log_type: 'warning',
        roblox_name: formState.roblox_name.trim(),
        staff_name: profile?.roblox_name || null,
        staff_rank: profile?.rank || null,
        details: `Avertisment: ${formState.reason.trim()}`,
      });
      await sendDiscordWebhook(
        'Avertisment Jucator',
        `**${formState.roblox_name.trim()}** a primit avertisment de **${profile?.roblox_name}**`,
        [{ name: 'Motiv', value: formState.reason.trim() }],
        DISCORD_COLORS.yellow,
      );
      setShowAdd(false);
      setFormState({ roblox_name: '', roblox_id: '', reason: '' });
      await loadWarnings();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Esti sigur ca vrei sa stergi acest warn?')) return;
    await supabase.from('warnings').delete().eq('id', id);
    await loadWarnings();
  };

  const filtered = warnings.filter(
    (w) =>
      w.roblox_name.toLowerCase().includes(search.toLowerCase()) ||
      w.reason.toLowerCase().includes(search.toLowerCase()) ||
      (w.issued_by_name || '').toLowerCase().includes(search.toLowerCase())
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
            <AlertTriangle className="w-7 h-7 text-amber-400" />
            Warn-uri
          </h2>
          <p className="text-slate-400 mt-1">Avertismente date jucatorilor</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white px-4 py-2.5 rounded-xl font-medium transition shadow-lg shadow-sky-500/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Adauga Warn
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
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{warnings.length === 0 ? 'Nu exista warn-uri inregistrate' : 'Nu am gasit rezultate pentru cautarea ta'}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filtered.map((w) => (
              <div key={w.id} className="px-5 py-4 hover:bg-slate-800/30 transition group">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">{w.roblox_name}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-amber-500/15 text-amber-400 border-amber-500/30">
                        Warn
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mt-1">{w.reason}</p>
                    <p className="text-slate-600 text-xs mt-1">
                      {w.issued_by_name && `de ${w.issued_by_name} · `}
                      {timeAgo(w.created_at)}
                    </p>
                  </div>
                  {w.issued_by === session?.user.id && (
                    <button
                      onClick={() => handleDelete(w.id)}
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
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Adauga Warn
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
                    value={formState.roblox_name}
                    onChange={(e) => setFormState({ ...formState, roblox_name: e.target.value })}
                    required
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition text-sm"
                    placeholder="NumeJucator"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">ID Roblox</label>
                  <input
                    type="text"
                    value={formState.roblox_id}
                    onChange={(e) => setFormState({ ...formState, roblox_id: e.target.value })}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition text-sm"
                    placeholder="12345678"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Motiv</label>
                <textarea
                  value={formState.reason}
                  onChange={(e) => setFormState({ ...formState, reason: e.target.value })}
                  required
                  rows={3}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition text-sm resize-none"
                  placeholder="Descrie motivul warn-ului..."
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salveaza Warn'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
