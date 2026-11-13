import { useState, useEffect } from 'react';
import { Settings, Key, Plus, Trash2, Loader as Loader2, X, Check, Copy, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth, isManager } from '@/lib/auth';
import {
  RANK_LABELS,
  RANK_COLORS,
  ACTION_LABELS,
  RANK_ORDER,
  type PermissionSetting,
  type ApiKey,
  type StaffProfile,
  type StaffRank,
} from '@/lib/types';
import { formatDateTime, formatDate } from '@/lib/utils';

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', encoder);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function SettingsPage() {
  const { profile, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<PermissionSetting[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [members, setMembers] = useState<StaffProfile[]>([]);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [showAddKey, setShowAddKey] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [issuerId, setIssuerId] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [keyError, setKeyError] = useState('');
  const [copied, setCopied] = useState(false);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const isMgr = isManager(profile);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [settingsRes, keysRes, membersRes] = await Promise.all([
      supabase.from('permission_settings').select('*').order('action_key', { ascending: true }),
      supabase.from('api_keys').select('id, name, key_prefix, is_active, issuer_profile_id, created_at, last_used_at').order('created_at', { ascending: false }),
      supabase.from('staff_profiles').select('id, roblox_name, rank').order('roblox_name', { ascending: true }),
    ]);
    setSettings((settingsRes.data as PermissionSetting[]) || []);
    setApiKeys((keysRes.data as ApiKey[]) || []);
    setMembers((membersRes.data as StaffProfile[]) || []);
    setLoading(false);
  };

  const handleUpdateRank = async (actionKey: string, newRank: StaffRank) => {
    setSavingKey(actionKey);
    await supabase
      .from('permission_settings')
      .update({ required_rank: newRank, updated_by: session?.user.id, updated_at: new Date().toISOString() })
      .eq('action_key', actionKey);
    await loadAll();
    setSavingKey(null);
  };

  const handleCreateKey = async () => {
    setKeyError('');
    if (!keyName.trim()) {
      setKeyError('Introdu un nume pentru cheie.');
      return;
    }
    setCreatingKey(true);
    const rawKey = generateKey();
    const prefix = rawKey.slice(0, 8);
    const hash = await sha256(rawKey);
    const { error } = await supabase.from('api_keys').insert({
      name: keyName.trim(),
      key_prefix: prefix,
      key_hash: hash,
      issuer_profile_id: issuerId || null,
      created_by: session?.user.id,
    });
    if (error) {
      setKeyError('Nu am putut crea cheia. Incearca din nou.');
    } else {
      setSavedKey(rawKey);
      setKeyName('');
      setIssuerId('');
      setShowAddKey(false);
      await loadAll();
    }
    setCreatingKey(false);
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Esti sigur ca vrei sa stergi aceasta cheie API? Jocul nu o mai poate folosi.')) return;
    await supabase.from('api_keys').delete().eq('id', id);
    await loadAll();
  };

  const handleToggleKey = async (key: ApiKey) => {
    setTogglingKey(key.id);
    await supabase.from('api_keys').update({ is_active: !key.is_active }).eq('id', key.id);
    await loadAll();
    setTogglingKey(null);
  };

  const handleCopy = async () => {
    if (savedKey) {
      await navigator.clipboard.writeText(savedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  if (!isMgr) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
          <Lock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Setarile de permisiuni sunt disponibile pentru Manager Staff si gradele superioare (Consiliul Superior, Community Manager, Co-owner, Owner, Fondator Comunitate, Discord Developer).</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-7 h-7 text-sky-400" />
          Setari Permisiuni
        </h2>
        <p className="text-slate-400 mt-1">Configureaza ce grad minim este necesar pentru fiecare actiune din portal</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="divide-y divide-slate-800">
          {settings.map((s) => (
            <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4">
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{ACTION_LABELS[s.action_key] || s.action_key}</p>
                {s.updated_at && (
                  <p className="text-xs text-slate-600 mt-0.5">Modificat: {formatDateTime(s.updated_at)}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {savingKey === s.action_key && <Loader2 className="w-4 h-4 text-sky-500 animate-spin" />}
                <select
                  value={s.required_rank}
                  onChange={(e) => handleUpdateRank(s.action_key, e.target.value as StaffRank)}
                  disabled={savingKey === s.action_key}
                  className={`appearance-none bg-slate-800/60 border rounded-xl pl-3 pr-8 py-2 text-sm font-medium cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-sky-500/50 ${RANK_COLORS[s.required_rank]}`}
                >
                  {RANK_ORDER.map((r) => (
                    <option key={r} value={r} className="bg-slate-800 text-white">
                      {RANK_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Lock className="w-5 h-5 text-sky-400" />
          Cum functioneaza permisiunile
        </h3>
        <div className="space-y-2 text-sm text-slate-400">
          <p>Fiecare actiune din portal are un grad minim necesar. Membrii staff cu gradul selectat sau mai mare pot efectua actiunea respectiva.</p>
          <p>
            Ierarhia gradelor:{' '}
            {RANK_ORDER.map((r, i) => (
              <span key={r}>
                <span className={RANK_COLORS[r].split(' ')[1]}>{RANK_LABELS[r]}</span>
                {i < RANK_ORDER.length - 1 && ' < '}
              </span>
            ))}
          </p>
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-400" />
            <h3 className="text-white font-semibold">Chei API pentru Logare Sanctiuni</h3>
          </div>
          <button
            onClick={() => setShowAddKey(true)}
            className="bg-sky-500/15 border border-sky-500/30 text-sky-400 hover:bg-sky-500/25 px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Cheie noua
          </button>
        </div>

        {showAddKey && (
          <div className="px-5 py-4 border-b border-slate-800/50 bg-slate-800/20 space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nume cheie (ex: Server Roblox)</label>
              <input
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="Server Roblox"
                className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Atribuie sanctiunile unui membru staff (optional)</label>
              <select
                value={issuerId}
                onChange={(e) => setIssuerId(e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
              >
                <option value="">Fara atribuire fixa (foloseste issued_by_name din request)</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id} className="bg-slate-800">
                    {m.roblox_name} ({RANK_LABELS[m.rank]})
                  </option>
                ))}
              </select>
            </div>
            {keyError && <p className="text-rose-400 text-xs">{keyError}</p>}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreateKey}
                disabled={creatingKey}
                className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 disabled:opacity-50"
              >
                {creatingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Genereaza cheie
              </button>
              <button
                onClick={() => {
                  setShowAddKey(false);
                  setKeyError('');
                }}
                className="text-slate-400 hover:text-slate-200 px-3 py-2 rounded-lg text-sm transition"
              >
                Anuleaza
              </button>
            </div>
          </div>
        )}

        {savedKey && (
          <div className="px-5 py-4 border-b border-slate-800/50 bg-emerald-500/5">
            <p className="text-emerald-400 text-sm font-medium mb-2">
              Cheia a fost creata! Copiaz-o acum - nu o vei mai putea vedea din nou.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-emerald-300 font-mono break-all">
                {savedKey}
              </code>
              <button
                onClick={handleCopy}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-lg text-sm transition flex items-center gap-1.5 flex-shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiat' : 'Copiaza'}
              </button>
            </div>
            <button onClick={() => setSavedKey(null)} className="text-slate-400 hover:text-slate-200 text-xs mt-2">
              Inchide
            </button>
          </div>
        )}

        {apiKeys.length === 0 ? (
          <div className="text-center text-slate-500 py-10 text-sm">
            <Key className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Nu exista chei API. Creaza una pentru a permite jocului sa logheze sanctiuni.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {apiKeys.map((k) => {
              const issuer = members.find((m) => m.id === k.issuer_profile_id);
              return (
                <div key={k.id} className="px-5 py-4 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-medium truncate">{k.name}</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          k.is_active
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-700/40 text-slate-400 border-slate-700'
                        }`}
                      >
                        {k.is_active ? 'Activ' : 'Dezactivat'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Prefix: <span className="font-mono text-slate-400">{k.key_prefix}...</span>
                      {issuer && ` · Atribuit: ${issuer.roblox_name}`}
                      {k.last_used_at && ` · Ultima folosire: ${formatDate(k.last_used_at)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleToggleKey(k)}
                      disabled={togglingKey === k.id}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition disabled:opacity-50"
                    >
                      {togglingKey === k.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : k.is_active ? 'Dezactiveaza' : 'Activeaza'}
                    </button>
                    <button
                      onClick={() => handleDeleteKey(k.id)}
                      className="text-slate-500 hover:text-rose-400 transition p-1.5 rounded-lg hover:bg-slate-800"
                      title="Sterge cheia"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="px-5 py-4 border-t border-slate-800 bg-slate-800/20">
          <p className="text-xs text-slate-400 leading-relaxed">
            <span className="text-amber-400 font-medium">Cum se foloseste:</span> Trimite un POST catre endpoint-ul{' '}
            <code className="bg-slate-950 px-1.5 py-0.5 rounded text-slate-300">/functions/v1/log-sanction</code> cu header-ul{' '}
            <code className="bg-slate-950 px-1.5 py-0.5 rounded text-slate-300">X-Api-Key: &lt;cheia_ta&gt;</code> si un body JSON cu:{' '}
            <code className="bg-slate-950 px-1.5 py-0.5 rounded text-slate-300">roblox_name, roblox_id, sanction_type, reason, duration (optional), issued_by_name (optional)</code>.
            Tipurile permise: kick, temp_ban, permanent_ban, warning, mute, ban.
          </p>
        </div>
      </div>
    </div>
  );
}
