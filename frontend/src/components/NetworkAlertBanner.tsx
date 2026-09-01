import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, Settings } from 'lucide-react';
import { useConnectionStore } from '../stores/connectionStore';
import { ServerSettingsModal } from './ServerSettingsModal';

export const NetworkAlertBanner: React.FC = () => {
  const isOnline = useConnectionStore((state) => state.isOnline);
  const wsConnected = useConnectionStore((state) => state.wsConnected);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (isOnline && wsConnected) {
    return null;
  }

  return (
    <>
      <div className="w-full bg-gradient-to-r from-amber-600/90 via-rose-600/90 to-amber-600/90 text-white px-4 py-2 text-xs sm:text-sm font-medium shadow-lg animate-slide-down flex items-center justify-between z-40">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-2 sm:gap-3 w-full justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 animate-bounce" />
            <span>
              {!isOnline
                ? 'You are currently offline. Check your internet connection.'
                : 'Real-time WebSocket disconnected. Auto-reconnecting backoff active (3000ms)...'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1 bg-black/40 hover:bg-black/60 px-2.5 py-1 rounded-full text-[11px] transition-colors border border-white/20"
            >
              <Settings className="w-3 h-3 text-amber-300" />
              <span>Server Settings</span>
            </button>
            <div className="flex items-center gap-1.5 text-[11px] bg-black/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Auto Recovery</span>
            </div>
          </div>
        </div>
      </div>

      <ServerSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};

