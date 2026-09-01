import { create } from 'zustand';

export interface ConnectionStore {
  wsConnected: boolean;
  isOnline: boolean;
  setWsConnected: (connected: boolean) => void;
  setIsOnline: (online: boolean) => void;
}

export const useConnectionStore = create<ConnectionStore>((set) => ({
  wsConnected: false,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,

  setWsConnected: (connected: boolean) => {
    set({ wsConnected: connected });
  },

  setIsOnline: (online: boolean) => {
    set({ isOnline: online });
  },
}));
