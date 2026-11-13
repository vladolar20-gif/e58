import { useState, useEffect } from 'react';
import { User, Save, Check, Palette, Volume2, Info, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { RANK_LABELS, RANK_COLORS } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export function AccountPage() {
  const { profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    roblox_name: '',
    roblox_id: '',
    discord_name: '',
    discord_id: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [accentColor, setAccentColor] = useState('sky');

  useEffect(() => {
    if (profile) {
      setForm({
        roblox_name: profile.roblox_name || '',
        roblox_id: profile.roblox_id || '',
        discord_name: profile.discord_name || '',
        discord_id: profile.discord_id || '',
      });
    }
    const sound = localStorage.getItem('soundEnabled');
    if (sound !== null) setSoundEnabled(sound === 'true');
    const color = localStorage.getItem('accentColor');
    if (color) setAccentColor(color);
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    const { error } = await supabase
      .from('staff_profiles')
      .update({
        roblox_name: form.roblox_name,
        roblox_id: form.roblox_id,
        discord_name: form.discord_name,
        discord_id: form.discord_id,
      })
      .eq('id', profile?.id);
    if (error) {
      setError('Nu am putut salva modificarile. Incearca din nou.');
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      refreshProfile();
    }
    setSaving(false);
  };

  const handleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem('soundEnabled', String(enabled));
  };

  const handleColor = (color: string) => {
    setAccentColor(color);
    localStorage.setItem('accentColor', color);
  };

  const colors = [
    { key: 'sky', label: 'Albastru', color: 'bg-sky-500' },
    { key: 'emerald', label: 'Verde', color: 'bg-emerald-500' },
    { key: 'amber', label: 'Galben', color: 'bg-amber-500' },
    { key: 'rose', label: 'Rosu', color: 'bg-rose-500' },
    { key: 'orange', label: 'Portocaliu', color: 'bg-orange-500' },
    { key: 'teal', label: 'Turcoaz', color: 'bg-teal-500' },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center shadow-lg shadow-sky-500/20">
          <User className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Setari Cont</h2>
          <p className="text-slate-400 mt-0.5">Modifica profilul si preferintele tale</p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-rose-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <User className="w-5 h-5 text-sky-400" />
          <h3 className="text-white font-semibold">Informatii Roblox</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Nume Roblox</label>
            <input
              type="text"
              value={form.roblox_name}
              onChange={(e) => setForm({ ...form, roblox_name: e.target.value })}
              required
              className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition text-sm"
              placeholder="NumeRoblox"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">ID Roblox</label>
            <input
              type="text"
              value={form.roblox_id}
              onChange={(e) => setForm({ ...form, roblox_id: e.target.value })}
              required
              className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition text-sm"
              placeholder="12345678"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2 pt-2">
          <h3 className="text-white font-semibold">Informatii Discord</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Nume Discord</label>
            <input
              type="text"
              value={form.discord_name}
              onChange={(e) => setForm({ ...form, discord_name: e.target.value })}
              className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition text-sm"
              placeholder="username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">ID Discord</label>
            <input
              type="text"
              value={form.discord_id}
              onChange={(e) => setForm({ ...form, discord_id: e.target.value })}
              className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition text-sm"
              placeholder="123456789012345678"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {saved && (
            <span className="flex items-center gap-1.5 text-emerald-400 text-sm">
              <Check className="w-4 h-4" />
              Modificarile au fost salvate
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="ml-auto bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl transition flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-sky-500/20"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salveaza Modificarile
          </button>
        </div>
      </form>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Palette className="w-5 h-5 text-sky-400" />
          <h3 className="text-white font-semibold">Aspect Site</h3>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Culoare Accent</label>
          <div className="flex flex-wrap gap-3">
            {colors.map((c) => (
              <button
                key={c.key}
                onClick={() => handleColor(c.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition ${
                  accentColor === c.key ? 'border-white/20 bg-slate-800' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-full ${c.color}`} />
                <span className="text-sm text-slate-300">{c.label}</span>
                {accentColor === c.key && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Volume2 className="w-5 h-5 text-sky-400" />
          <h3 className="text-white font-semibold">Notificari Sunet</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-medium">Sunet la cereri noi de invoire</p>
            <p className="text-slate-500 text-xs mt-0.5">Reda un sunet cand cineva trimite o cerere de invoire</p>
          </div>
          <button
            onClick={() => handleSound(!soundEnabled)}
            className={`relative w-12 h-6 rounded-full transition ${soundEnabled ? 'bg-sky-500' : 'bg-slate-700'}`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-sky-400" />
          <h3 className="text-white font-semibold">Informatii Cont</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-slate-500 text-xs mb-1">Grad</p>
            {profile?.rank && (
              <span className={`inline-block text-sm px-3 py-1 rounded-full border ${RANK_COLORS[profile.rank]}`}>
                {RANK_LABELS[profile.rank]}
              </span>
            )}
          </div>
          <div>
            <p className="text-slate-500 text-xs mb-1">Data Inregistrarii</p>
            <p className="text-white text-sm">{profile ? formatDate(profile.created_at) : '-'}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs mb-1">Status</p>
            <span
              className={`inline-block text-sm px-3 py-1 rounded-full border ${
                profile?.is_active
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
              }`}
            >
              {profile?.is_active ? 'Activ' : 'Inactiv'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
