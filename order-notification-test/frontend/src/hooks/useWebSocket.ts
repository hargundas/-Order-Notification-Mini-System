import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useConnectionStore } from '../stores/connectionStore';
import { webSocketService } from '../services/websocket';

export const useWebSocket = () => {
  const vendorId = useAuthStore((state) => state.vendorId);
  const token = useAuthStore((state) => state.token);
  const wsConnected = useConnectionStore((state) => state.wsConnected);

  useEffect(() => {
    if (vendorId && token) {
      webSocketService.connect(vendorId, token);
    } else if (!vendorId || !token) {
      webSocketService.disconnect();
    }
  }, [vendorId, token]);

  return { wsConnected };
};
