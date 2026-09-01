import React, { useState } from 'react';
import { Server, Check, RotateCcw, X, Globe, ShieldAlert } from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl } from '../services/api';
import { webSocketService } from '../services/websocket';
import { useAuthStore } from '../stores/authStore';

interface ServerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ServerSettingsModal: React.FC<ServerSettingsModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState<string>(getApiBaseUrl());
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const vendorId = useAuthStore((state) => state.vendorId);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim().replace(/\/+$/, '');
    setApiBaseUrl(cleanUrl);
    setIsSaved(true);

    // Reconnect websocket if logged in
    if (vendorId) {
      webSocketService.connect(vendorId);
    }

    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    const defaultUrl = 'http://localhost:8080';
    setUrl(defaultUrl);
    setApiBaseUrl(defaultUrl);
    if (vendorId) {
      webSocketService.connect(vendorId);
    }
  };

  const isHttpsHost = typeof window !== 'undefined' && window.location.protocol === 'https:';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-slate-700 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white">
            <Server className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-sm">Backend Server Connection</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isHttpsHost && url.startsWith('http://') && (
          <div className="p-3 rounded-2xl bg-amber-950/50 border border-amber-800/80 text-amber-300 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Browser Mixed Content Notice</span>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              When accessing this site over HTTPS, connecting to an HTTP localhost backend requires allowing &ldquo;Insecure Content&rdquo; in your browser site settings or running the frontend locally at <span className="font-mono bg-amber-900/60 px-1 py-0.5 rounded">http://localhost:5173</span>.
            </p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Spring Boot API &amp; WebSocket Base URL
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="http://localhost:8080"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs font-mono focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Default: <code className="text-slate-400">http://localhost:8080</code>
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-ghost text-xs py-2 px-3 flex items-center gap-1.5 text-slate-400"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>

            <button
              type="submit"
              className="btn btn-primary text-xs py-2 px-5 flex items-center gap-2"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Saved &amp; Connected!</span>
                </>
              ) : (
                <span>Save &amp; Reconnect</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
