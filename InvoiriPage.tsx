import { useState, useEffect } from 'react';
import { CalendarOff, Loader2, Plus, X, Check, XCircle, Clock as ClockIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth, isSupervisorOrAbove } from '@/lib/auth';
import type { Invoire } from '@/lib/types';
import { formatDate, formatDateTime } from '@/lib/utils';

export function InvoiriPage() {
  const { profile, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invoiri, setInvoiri] = useState<Invoire[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ reason: '', start_date: '', end_date: '' });
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [managerNote, setManagerNote] = useState('');
  const canReview = isSupervisorOrAbove(profile);

  useEffect(() => {
    loadInvoiri();
  }, []);

  const loadInvoiri = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('invoiri')
      .select('*')
      .order('created_at', { ascending: false });
    setInvoiri((data as Invoire[]) || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('invoiri').insert({
      user_id: session?.user.id,
      staff_name: profile?.roblox_name || '',
      reason: form.reason,
      start_date: form.start_date,
      end_date: form.end_date,
    });
    setShowAdd(false);
    setForm({ reason: '', start_date: '', end_date: '' });
    await loadInvoiri();
    setSaving(false);
  };

  const handleReview = async (inv: Invoire, status: 'approved' | 'rejected') => {
    setReviewing(inv.id);
    await supabase
      .from('invoiri')
      .update({
        status,
        manager_note: managerNote || null,
        reviewed_by: session?.user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', inv.id);
    setManagerNote('');
    await loadInvoiri();
    setReviewing(null);
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Esti sigur ca vrei sa anulezi aceasta cerere?')) return;
    await supabase.from('invoiri').delete().eq('id', id);
    await loadInvoiri();
  };

  const statusConfig = {
    pending: { label: 'In Asteptare', icon: ClockIcon, color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    approved: { label: 'Aprobata', icon: Check, color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    rejected: { label: 'Respinsa', icon: XCircle, color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  const myRequests = invoiri.filter((i) => i.user_id === session?.user.id);
  const pendingCount = invoiri.filter((i) => i.status === 'pending').length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarOff className="w-7 h-7 text-emerald-400" />
            Cereri Invoire
          </h2>
          <p className="text-slate-400 mt-1">
            {canReview
              ? `${pendingCount} cereri de invoire in asteptare care necesita revizuire.`
              : 'Cereri tale de invoire'}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white px-4 py-2.5 rounded-xl font-medium transition shadow-lg shadow-sky-500/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Cerere Invoire
        </button>
      </div>

      {canReview && pendingCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3">
          <ClockIcon className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <p className="text-amber-400 text-sm">
            {pendingCount} cereri de invoire in asteptare care necesita revizuire.
          </p>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {invoiri.length === 0 ? (
          <div className="text-center text-slate-500 py-12">
            <CalendarOff className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nu exista cereri de invoire</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {invoiri.map((inv) => {
              const sc = statusConfig[inv.status];
              const StatusIcon = sc.icon;
              const isOwn = inv.user_id === session?.user.id;
              return (
                <div key={inv.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-medium">{inv.staff_name || 'Necunoscut'}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${sc.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm mt-1">{inv.reason}</p>
                      <p className="text-slate-500 text-xs mt-1">
                        {formatDate(inv.start_date)} - {formatDate(inv.end_date)}
                      </p>
                      {inv.manager_note && (
                        <p className="text-slate-400 text-xs mt-2 bg-slate-800/50 rounded-lg px-3 py-2">
                          Notita manager: {inv.manager_note}
                        </p>
                      )}
                      {inv.reviewed_at && (
                        <p className="text-slate-600 text-xs mt-1">Revizuit: {formatDateTime(inv.reviewed_at)}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {inv.status === 'pending' && canReview && (
                        <>
                          <button
                            onClick={() => handleReview(inv, 'approved')}
                            disabled={reviewing === inv.id}
                            className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1 disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                            Aproba
                          </button>
                          <button
                            onClick={() => handleReview(inv, 'rejected')}
                            disabled={reviewing === inv.id}
                            className="bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1 disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            Respinge
                          </button>
                        </>
                      )}
                      {inv.status === 'pending' && isOwn && !canReview && (
                        <button
                          onClick={() => handleCancel(inv.id)}
                          className="text-slate-500 hover:text-rose-400 transition p-1.5 rounded-lg hover:bg-slate-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      {reviewing === inv.id && <Loader2 className="w-4 h-4 text-sky-500 animate-spin" />}
                    </div>
                  </div>
                  {inv.status === 'pending' && canReview && (
                    <input
                      type="text"
                      value={managerNote}
                      onChange={(e) => setManagerNote(e.target.value)}
                      placeholder="Notita manager (optional)..."
                      className="w-full mt-3 bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition text-xs"
                    />
                  )}
                </div>
              );
            })}
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
                <CalendarOff className="w-5 h-5 text-emerald-400" />
                Cerere Invoire
              </h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Motiv</label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  required
                  rows={3}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition text-sm resize-none"
                  placeholder="Motivul invoirii..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Data Inceput</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    required
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Data Sfarsit</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    required
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition text-sm"
                  />
                </div>
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
