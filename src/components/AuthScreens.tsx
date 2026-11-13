import { useState } from 'react';
import { Shield, Mail, Lock, Eye, EyeOff, Loader as Loader2, Gamepad2, MessageCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export function LoginScreen({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) setError(error);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 shadow-lg shadow-sky-500/20 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">STAFF E58 ROMÂNIA ROLEPLAY</h1>
          <p className="text-slate-400 mt-1">Portal Staff</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-1">Autentificare</h2>
          <p className="text-slate-400 text-sm mb-6">Intra in contul tau de staff</p>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-rose-400 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition"
                  placeholder="email@exemplu.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Parola</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-11 pr-11 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-sky-500/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Intra in cont'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-slate-400 text-sm">
              Nu ai cont?{' '}
              <button
                onClick={onSwitchToRegister}
                className="text-sky-400 hover:text-sky-300 font-medium transition"
              >
                Inregistreaza-te
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RegisterScreen({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [robloxName, setRobloxName] = useState('');
  const [robloxId, setRobloxId] = useState('');
  const [discordName, setDiscordName] = useState('');
  const [discordId, setDiscordId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Parolele nu coincid.');
      return;
    }
    if (password.length < 6) {
      setError('Parola trebuie sa aiba cel putin 6 caractere.');
      return;
    }
    if (!robloxName.trim() || !robloxId.trim() || !discordName.trim() || !discordId.trim()) {
      setError('Toate campurile Roblox si Discord sunt obligatorii.');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, {
      roblox_name: robloxName.trim(),
      roblox_id: robloxId.trim(),
      discord_name: discordName.trim(),
      discord_id: discordId.trim(),
    });
    if (error) {
      setError(error);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 mb-4">
              <Shield className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Cont creat!</h2>
            <p className="text-slate-400 mb-6">
              Contul a fost creat cu succes cu gradul de Trial Helper. Informatiile tale
              Roblox si Discord au fost salvate. Poti sa te autentifici acum.
            </p>
            <button
              onClick={onSwitchToLogin}
              className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold py-2.5 rounded-xl transition shadow-lg shadow-sky-500/20"
            >
              Mergi la autentificare
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 shadow-lg shadow-sky-500/20 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">STAFF E58 ROMÂNIA ROLEPLAY</h1>
          <p className="text-slate-400 mt-1">Portal Staff</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-1">Inregistrare</h2>
          <p className="text-slate-400 text-sm mb-6">Creeaza un cont nou de staff</p>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-rose-400 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition"
                  placeholder="email@exemplu.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Parola</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-11 pr-11 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Confirma parola noua
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3">
                <Gamepad2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-slate-300">Informatii Roblox</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Username Roblox</label>
                  <input
                    type="text"
                    value={robloxName}
                    onChange={(e) => setRobloxName(e.target.value)}
                    required
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition"
                    placeholder="Numele din Roblox"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">ID Roblox</label>
                  <input
                    type="text"
                    value={robloxId}
                    onChange={(e) => setRobloxId(e.target.value)}
                    required
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition"
                    placeholder="ID-ul din Roblox"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="w-4 h-4 text-sky-400" />
                <span className="text-sm font-semibold text-slate-300">Informatii Discord</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Username Discord</label>
                  <input
                    type="text"
                    value={discordName}
                    onChange={(e) => setDiscordName(e.target.value)}
                    required
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition"
                    placeholder="Numele de Discord"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">ID Discord</label>
                  <input
                    type="text"
                    value={discordId}
                    onChange={(e) => setDiscordId(e.target.value)}
                    required
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition"
                    placeholder="ID-ul de Discord"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-sky-500/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Creeaza cont'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-slate-400 text-sm">
              Ai deja cont?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-sky-400 hover:text-sky-300 font-medium transition"
              >
                Autentificare
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
