import { useState, useEffect } from 'react';
import { Megaphone, Plus, Trash2, Loader2, X, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth, isSupervisorOrAbove } from '@/lib/auth';
import { sendDiscordWebhook, DISCORD_COLORS } from '@/lib/discord';
import type { Announcement } from '@/lib/types';
import { formatDateTime, timeAgo } from '@/lib/utils';

export function AnnouncementsPage() {
  const { profile, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });
  const canManage = isSupervisorOrAbove(profile);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    setAnnouncements((data as Announcement[]) || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('announcements').insert({
      title: form.title,
      content: form.content,
      created_by: session?.user.id,
      created_by_name: profile?.roblox_name || null,
    });
    await supabase.from('logs').insert({
      log_type: 'announcement',
      roblox_name: null,
      staff_name: profile?.roblox_name || null,
      staff_rank: profile?.rank || null,
      details: `Anunt nou: ${form.title}`,
    });
    await sendDiscordWebhook(
      'Anunt Nou Staff',
      `**${profile?.roblox_name}** a postat un anunt`,
      [
        { name: 'Titlu', value: form.title },
        { name: 'Continut', value: form.content.slice(0, 1024) },
      ],
      DISCORD_COLORS.sky,
    );
    setShowAdd(false);
    setForm({ title: '', content: '' });
    await loadAnnouncements();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Esti sigur ca vrei sa stergi acest anunt?')) return;
    await supabase.from('announcements').delete().eq('id', id);
    await loadAnnouncements();
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
            <Megaphone className="w-7 h-7 text-sky-400" />
            Anunturi
          </h2>
          <p className="text-slate-400 mt-1">Anunturi pentru echipa staff</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowAdd(true)}
            className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white px-4 py-2.5 rounded-xl font-medium transition shadow-lg shadow-sky-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Anunt Nou
          </button>
        )}
      </div>

      {announcements.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <Megaphone className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Nu exista anunturi</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <div key={a.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 group">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-lg">{a.title}</h3>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {a.created_by_name && `de ${a.created_by_name} · `}
                    {formatDateTime(a.created_at)}
                  </p>
                </div>
                {canManage && (
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="text-slate-500 hover:text-rose-400 transition p-1.5 rounded-lg hover:bg-slate-800 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-slate-300 text-sm whitespace-pre-wrap mt-2">{a.content}</p>
            </div>
          ))}
        </div>
      )}

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
                <Megaphone className="w-5 h-5 text-sky-400" />
                Anunt Nou
              </h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-500 text-xs mb-4">
              Acest anunt va fi trimis pe email tuturor membrilor staff activi
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Titlu</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition text-sm"
                  placeholder="Titlu anunt"
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
                  placeholder="Scrie anuntul aici..."
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                Trimite Anunt
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
