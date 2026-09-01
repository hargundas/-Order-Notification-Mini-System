import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  Layers, 
  Zap, 
  Activity 
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export const LoginView: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login(email, password);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Invalid vendor credentials'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-xl shadow-blue-500/20 text-white mb-2">
            <Activity className="w-7 h-7 animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Vendor Order Portal
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Real-time STOMP WebSocket notification feed with Onion Architecture &amp; JJWT resilience
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <span className="text-xs font-semibold text-slate-300">Sign in to Vendor Terminal</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800">
              JWT 2-MIN EXPIRY
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Vendor Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/80 border border-slate-700/70 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/80 border border-slate-700/70 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary py-3 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>AUTHENTICATE &amp; CONNECT</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Architectural Highlights Pill */}
        <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500">
          <div className="p-2 rounded-xl bg-slate-900/40 border border-slate-900 flex flex-col items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Strict Onion</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/40 border border-slate-900 flex flex-col items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Domain Events</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/40 border border-slate-900 flex flex-col items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Silent 401 Replay</span>
          </div>
        </div>
      </div>
    </div>
  );
};
