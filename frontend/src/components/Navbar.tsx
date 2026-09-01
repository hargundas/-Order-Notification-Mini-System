import React, { useState } from 'react';
import { 
  Activity, 
  LogOut, 
  PlusCircle, 
  Terminal, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  Store 
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { ConnectionBadge } from './ConnectionBadge';
import { playOrderNotificationSound } from '../utils/sound';

interface NavbarProps {
  onOpenSimulator: () => void;
  onOpenLogs: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSimulator, onOpenLogs }) => {
  const vendorId = useAuthStore((state) => state.vendorId);
  const logout = useAuthStore((state) => state.logout);
  const refreshToken = useAuthStore((state) => state.refreshToken);

  const [isRefreshingToken, setIsRefreshingToken] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleManualTokenRefresh = async () => {
    try {
      setIsRefreshingToken(true);
      await refreshToken();
    } catch (err: any) {
      alert('Token refresh failed: ' + err.message);
    } finally {
      setIsRefreshingToken(false);
    }
  };

  const handleTestChime = () => {
    playOrderNotificationSound();
  };

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-slate-800/80 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Vendor Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white">
                TestOrderSystem
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-950 text-blue-400 border border-blue-800">
                v1.0
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Store className="w-3 h-3 text-blue-400" />
              <span>Vendor:</span>
              <span className="font-mono font-bold text-slate-200">{vendorId}</span>
            </div>
          </div>
        </div>

        {/* Center: Live Connection Badges */}
        <div className="hidden md:flex items-center gap-2">
          <ConnectionBadge />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Sound Test */}
          <button
            onClick={handleTestChime}
            className="btn btn-ghost text-xs p-2 text-slate-400 hover:text-slate-200"
            title="Test notification sound chime"
          >
            <Volume2 className="w-4 h-4 text-slate-400" />
          </button>

          {/* Manual Token Refresh Button for Testing Challenge 2A */}
          <button
            onClick={handleManualTokenRefresh}
            disabled={isRefreshingToken}
            className="btn btn-ghost text-xs py-1.5 px-2.5 text-slate-300 hover:text-white flex items-center gap-1.5 border border-slate-800"
            title="Force refresh 2-minute JWT token (POST /auth/refresh)"
          >
            <RotateCw className={`w-3.5 h-3.5 text-blue-400 ${isRefreshingToken ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh JWT</span>
          </button>

          {/* Client Telemetry Logs Toggle */}
          <button
            onClick={onOpenLogs}
            className="btn btn-ghost text-xs py-1.5 px-2.5 text-slate-300 hover:text-white flex items-center gap-1.5 border border-slate-800"
            title="View Real-Time Telemetry & Client Logs"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Logs</span>
          </button>

          {/* Order Simulator Trigger */}
          <button
            onClick={onOpenSimulator}
            className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-md"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Simulate Order</span>
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="btn btn-ghost text-xs p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Connection Status Bar */}
      <div className="md:hidden px-4 py-1 bg-slate-950/80 border-t border-slate-900 flex justify-center">
        <ConnectionBadge />
      </div>
    </header>
  );
};
