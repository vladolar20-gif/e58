import { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Loader as Loader2, X, Pencil, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth, isManager } from '@/lib/auth';
import type { Regulation } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';

export function RegulationsPage() {
  const { profile, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Regulation | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });
  const canEdit = isManager(profile);

  useEffect(() => {
    loadRegulations();
  }, []);

  const loadRegulations = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('regulations')
      .select('*')
      .order('sort_order', { ascending: true });
    setRegulations((data as Regulation[]) || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (editing) {
      await supabase
        .from('regulations')
        .update({
          title: form.title,
          content: form.content,
          updated_by: session?.user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editing.id);
    } else {
      await supabase.from('regulations').insert({
        title: form.title,
        content: form.content,
        updated_by: session?.user.id,
      });
    }
    setShowForm(false);
    setEditing(null);
    setForm({ title: '', content: '' });
    await loadRegulations();
    setSaving(false);
  };

  const handleEdit = (r: Regulation) => {
    setEditing(r);
    setForm({ title: r.title, content: r.content });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Esti sigur ca vrei sa stergi aceasta regula?')) return;
    await supabase.from('regulations').delete().eq('id', id);
    await loadRegulations();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-sky-400" />
            Regulament
          </h2>
          <p className="text-slate-400 mt-1">Regulile comunitatii E58 ROMÂNIA ROLEPLAY</p>
        </div>
        {canEdit && (
          <button
            onClick={() => {
              setEditing(null);
              setForm({ title: '', content: '' });
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white px-4 py-2.5 rounded-xl font-medium transition shadow-lg shadow-sky-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adauga Regula
          </button>
        )}
      </div>

      {regulations.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Nu exista reguli adaugate inca</p>
        </div>
      ) : (
        <div className="space-y-4">
          {regulations.map((r, idx) => (
            <div
              key={r.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 group"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {idx + 1}
                  </span>
                  <h3 className="text-white font-semibold">{r.title}</h3>
                </div>
                {canEdit && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                    <button
                      onClick={() => handleEdit(r)}
                      className="text-slate-500 hover:text-sky-400 transition p-1.5 rounded-lg hover:bg-slate-800"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-slate-500 hover:text-rose-400 transition p-1.5 rounded-lg hover:bg-slate-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-slate-300 text-sm whitespace-pre-wrap ml-11">{r.content}</p>
              <p className="text-slate-600 text-xs mt-3 ml-11">
                Modificat: {formatDateTime(r.updated_at)}
              </p>
            </div>
          ))}
        </div>
      )}

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
                <BookOpen className="w-5 h-5 text-sky-400" />
                {editing ? 'Editare Regulament' : 'Adauga Regula'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Titlu</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition text-sm"
                  placeholder="ex: Regula 1 - Comportament"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Continut</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  required
                  rows={5}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition text-sm resize-none"
                  placeholder="Scrie regula aici..."
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4" />}
                {editing ? 'Salveaza' : 'Adauga'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
