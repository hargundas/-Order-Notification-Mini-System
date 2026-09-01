import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useConnectionStore } from '../stores/connectionStore';

export const NetworkAlertBanner: React.FC = () => {
  const isOnline = useConnectionStore((state) => state.isOnline);
  const wsConnected = useConnectionStore((state) => state.wsConnected);

  if (isOnline && wsConnected) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-r from-amber-600/90 via-rose-600/90 to-amber-600/90 text-white px-4 py-2 text-sm font-medium shadow-lg animate-slide-down flex items-center justify-between z-40">
      <div className="max-w-6xl mx-auto flex items-center gap-3 w-full justify-between">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-bounce" />
          <span>
            {!isOnline
              ? 'You are currently offline. Check your internet connection or disable airplane mode.'
              : 'Real-time WebSocket disconnected. Auto-reconnecting backoff active (3000ms)...'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs bg-black/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Auto Recovery</span>
        </div>
      </div>
    </div>
  );
};
