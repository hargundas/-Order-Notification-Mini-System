import React from 'react';
import { Wifi, WifiOff, Radio, RefreshCw } from 'lucide-react';
import { useConnectionStore } from '../stores/connectionStore';

export const ConnectionBadge: React.FC = () => {
  const wsConnected = useConnectionStore((state) => state.wsConnected);
  const isOnline = useConnectionStore((state) => state.isOnline);

  return (
    <div className="flex items-center gap-2 text-xs font-medium">
      {/* Network Status Pill */}
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-300 ${
          isOnline
            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50 shadow-sm'
            : 'bg-rose-950/60 text-rose-300 border-rose-700 animate-pulse'
        }`}
        title={isOnline ? 'Internet connection active' : 'Network offline'}
      >
        {isOnline ? (
          <>
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>Online</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3.5 h-3.5 text-rose-400" />
            <span>Offline</span>
          </>
        )}
      </div>

      {/* WebSocket Status Pill */}
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-300 ${
          wsConnected
            ? 'bg-blue-950/40 text-blue-400 border-blue-800/50 shadow-sm'
            : 'bg-amber-950/50 text-amber-300 border-amber-700/80 animate-pulse'
        }`}
        title={
          wsConnected
            ? 'Live WebSocket STOMP feed connected'
            : 'WebSocket disconnected. Auto-reconnecting in 3000ms...'
        }
      >
        {wsConnected ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <Radio className="w-3.5 h-3.5 text-blue-400" />
            <span>Live WS</span>
          </>
        ) : (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>Reconnecting (3s)...</span>
          </>
        )}
      </div>
    </div>
  );
};
