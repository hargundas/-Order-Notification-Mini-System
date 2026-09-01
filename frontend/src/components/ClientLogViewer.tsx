import React, { useState, useEffect } from 'react';
import { 
  X, 
  Terminal, 
  Trash2, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Bug, 
  Download 
} from 'lucide-react';
import { LogEntry, addLogListener, getLogHistory } from '../utils/logger';

interface ClientLogViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClientLogViewer: React.FC<ClientLogViewerProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');

  useEffect(() => {
    setLogs(getLogHistory());
    const unsubscribe = addLogListener((entry) => {
      setLogs((prev) => [entry, ...prev]);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    const matchesLevel = filterLevel === 'ALL' || log.level === filterLevel;
    const query = searchFilter.toLowerCase();
    const matchesQuery =
      !query ||
      log.event.toLowerCase().includes(query) ||
      log.message.toLowerCase().includes(query) ||
      JSON.stringify(log.details || {}).toLowerCase().includes(query);
    return matchesLevel && matchesQuery;
  });

  const clearLogs = () => {
    setLogs([]);
  };

  const exportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `client-logs-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getLevelBadge = (level: LogEntry['level']) => {
    switch (level) {
      case 'ERROR':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/80 text-rose-400 border border-rose-800">
            ERR
          </span>
        );
      case 'WARN':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/80 text-amber-400 border border-amber-800">
            WRN
          </span>
        );
      case 'DEBUG':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950/80 text-purple-400 border border-purple-800">
            DBG
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950/80 text-blue-400 border border-blue-800">
            INF
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex justify-end transition-opacity duration-300">
      <div className="w-full max-w-2xl bg-slate-950 border-l border-slate-800 h-full shadow-2xl flex flex-col justify-between font-mono animate-slide-left">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-800/60">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Client Telemetry &amp; Recovery Stream</span>
                <span className="px-1.5 py-0.2 bg-slate-800 text-[10px] text-slate-400 rounded">
                  {logs.length} events
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Streamed to server via POST /client-logs</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportLogs}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md"
              title="Export JSON"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={clearLogs}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md"
              title="Clear logs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-3 bg-slate-900/60 border-b border-slate-800/80 flex items-center gap-3">
          <div className="flex items-center gap-1">
            {['ALL', 'INFO', 'WARN', 'ERROR'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-2 py-1 text-[11px] rounded transition-colors ${
                  filterLevel === lvl
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <div className="flex-1">
            <input
              type="text"
              placeholder="Filter by event or keyword..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full px-2.5 py-1 text-[11px] bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Log Stream Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 text-xs bg-black/40">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((entry) => (
              <div
                key={entry.id}
                className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-1"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-500 pb-1 border-b border-slate-800/60">
                  <div className="flex items-center gap-2">
                    {getLevelBadge(entry.level)}
                    <span className="font-bold text-slate-300">{entry.event}</span>
                  </div>
                  <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                </div>

                <div className="text-slate-200 text-xs break-all pt-0.5 font-mono">
                  {entry.message}
                </div>

                {entry.details && Object.keys(entry.details).length > 0 && (
                  <pre className="p-1.5 rounded bg-slate-950 text-[10px] text-slate-400 overflow-x-auto border border-slate-900">
                    {JSON.stringify(entry.details, null, 2)}
                  </pre>
                )}
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-16">
              <Terminal className="w-8 h-8 mb-2 opacity-40" />
              <span>No telemetry logs captured yet</span>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-2.5 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Logger Live Interceptor</span>
          </div>
          <span className="text-[10px] text-slate-500">Auto-synced with backend /client-logs</span>
        </div>
      </div>
    </div>
  );
};
