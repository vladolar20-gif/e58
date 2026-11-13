import { useState, useEffect } from 'react';
import { Scale, Plus, Trash2, Loader as Loader2, X, Search, Filter, Pencil, Check, X as XIcon, TriangleAlert as AlertTriangle, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth, isManager } from '@/lib/auth';
import {
  GUIDELINE_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  type SanctionGuideline,
} from '@/lib/types';
import { timeAgo, formatDateTime } from '@/lib/utils';

export function GuidelinesPage() {
  const { profile, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [guidelines, setGuidelines] = useState<SanctionGuideline[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SanctionGuideline | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', do_action: '', dont_action: '', category: 'general' });
  const canManage = isManager(profile);

  useEffect(() => {
    loadGuidelines();
  }, []);

  const loadGuidelines = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('sanction_guidelines')
      .select('*')
      .order('created_at', { ascending: false });
    setGuidelines((data as SanctionGuideline[]) || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    if (editing) {
      const { error } = await supabase
        .from('sanction_guidelines')
        .update({
          title: form.title,
          do_action: form.do_action,
          dont_action: form.dont_action,
          category: form.category,
          updated_by: session?.user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editing.id);
      if (error) setError('Nu am putut salva modificarile.');
    } else {
      const { error } = await supabase.from('sanction_guidelines').insert({
        title: form.title,
        do_action: form.do_action,
        dont_action: form.dont_action,
        category: form.category,
        created_by: session?.user.id,
      });
      if (error) setError('Nu am putut adauga ghidul.');
    }
    if (!error) {
      setShowForm(false);
      setEditing(null);
      setForm({ title: '', do_action: '', dont_action: '', category: 'general' });
      await loadGuidelines();
    }
    setSaving(false);
  };

  const handleEdit = (g: SanctionGuideline) => {
    setEditing(g);
    setForm({ title: g.title, do_action: g.do_action, dont_action: g.dont_action, category: g.category });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Esti sigur ca vrei sa stergi acest ghid?')) return;
    await supabase.from('sanction_guidelines').delete().eq('id', id);
    await loadGuidelines();
  };

  const filtered = guidelines.filter((g) => {
    const matchesSearch =
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.do_action.toLowerCase().includes(search.toLowerCase()) ||
      g.dont_action.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || g.category === category;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(guidelines.map((g) => g.category))];

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
            <Scale className="w-7 h-7 text-sky-400" />
            Ghid Sanctiuni
          </h2>
          <p className="text-slate-400 mt-1">Ce sanctiuni sa acorzi si ce sa eviti</p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setEditing(null);
              setForm({ title: '', do_action: '', dont_action: '', category: 'general' });
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white px-4 py-2.5 rounded-xl font-medium transition shadow-lg shadow-sky-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adauga Ghid
          </button>
        )}
      </div>

      {!canManage && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <p className="text-slate-400 text-sm">
            Doar Manager Staff poate adauga si edita ghiduri. Tu poti doar sa le vizualizezi.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cauta dupa titlu sau continut..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-8 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition appearance-none cursor-pointer"
          >
            <option value="all">Toate categoriile</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c] || c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {guidelines.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {GUIDELINE_CATEGORIES.filter((c) => guidelines.some((g) => g.category === c)).map((c) => {
            const count = guidelines.filter((g) => g.category === c).length;
            return (
              <button
                key={c}
                onClick={() => setCategory(category === c ? 'all' : c)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition ${
                  category === c ? CATEGORY_COLORS[c] : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {CATEGORY_LABELS[c]} ({count})
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <Scale className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">
              {guidelines.length === 0 ? 'Nu exista ghiduri adaugate inca' : 'Nu am gasit rezultate pentru cautarea ta'}
            </p>
          </div>
        ) : (
          filtered.map((g) => (
            <div key={g.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition group">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-base">{g.title}</h3>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full border mt-1.5 ${CATEGORY_COLORS[g.category] || CATEGORY_COLORS.altul}`}>
                    {CATEGORY_LABELS[g.category] || g.category}
                  </span>
                </div>
                {canManage && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                    <button
                      onClick={() => handleEdit(g)}
                      className="text-slate-500 hover:text-sky-400 transition p-1.5 rounded-lg hover:bg-slate-800"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(g.id)}
                      className="text-slate-500 hover:text-rose-400 transition p-1.5 rounded-lg hover:bg-slate-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-emerald-400" />
                    </div>
                    <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wide">Ce sa faci</span>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{g.do_action}</p>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center">
                      <XIcon className="w-3 h-3 text-rose-400" />
                    </div>
                    <span className="text-rose-400 text-xs font-semibold uppercase tracking-wide">Ce sa nu faci</span>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{g.dont_action}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
                <span className="text-xs text-slate-600">{timeAgo(g.created_at)}</span>
                {g.updated_by && g.updated_at !== g.created_at && (
                  <span className="text-xs text-slate-600">Editat: {formatDateTime(g.updated_at)}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                <Scale className="w-5 h-5 text-sky-400" />
                {editing ? 'Editare Ghid' : 'Ghid Nou Sanctiune'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-rose-400 text-sm mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Titlu</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition text-sm"
                  placeholder="Ex: Insulte in chat"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Categorie</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition text-sm"
                >
                  {GUIDELINE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-400 mb-1.5">Ce sanctiune sa acorzi</label>
                <textarea
                  value={form.do_action}
                  onChange={(e) => setForm({ ...form, do_action: e.target.value })}
                  required
                  rows={2}
                  className="w-full bg-slate-800/60 border border-emerald-500/20 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition text-sm resize-none"
                  placeholder="Ex: Warn pentru prima abatere, kick pentru a doua"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-rose-400 mb-1.5">Ce sa nu faci</label>
                <textarea
                  value={form.dont_action}
                  onChange={(e) => setForm({ ...form, dont_action: e.target.value })}
                  required
                  rows={2}
                  className="w-full bg-slate-800/60 border border-rose-500/20 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition text-sm resize-none"
                  placeholder="Ex: Nu da ban direct pentru prima abatere"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : editing ? 'Salveaza Modificarile' : 'Adauga Ghid'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
