import { Client, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useConnectionStore } from '../stores/connectionStore';
import { useOrderStore, Order } from '../stores/orderStore';
import { logger } from '../utils/logger';
import { playOrderNotificationSound } from '../utils/sound';

import { getApiBaseUrl } from './api';

class WebSocketService {
  private client: Client | null = null;
  private orderSubscription: StompSubscription | null = null;
  private currentVendorId: string | null = null;

  public connect(vendorId: string) {
    if (this.client && this.client.active && this.currentVendorId === vendorId) {
      return;
    }

    this.disconnect();
    this.currentVendorId = vendorId;

    const apiBase = getApiBaseUrl();
    logger.info('WS_CONNECTING', `Initiating STOMP WebSocket connection to ${apiBase}/ws for vendor ${vendorId}`);

    this.client = new Client({
      // Provide SockJS fallback factory
      webSocketFactory: () => new SockJS(`${apiBase}/ws`),

      // Challenge 2 Scenario B: Automatic reconnection backoff of 3000ms
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      debug: (msg: string) => {
        logger.debug('WS_DEBUG', msg);
      },

      onConnect: () => {
        useConnectionStore.getState().setWsConnected(true);
        logger.info('WS_CONNECTED', `STOMP connection established. Subscribing to /topic/vendor/${vendorId}/orders`);

        // Subscribe to vendor-specific orders topic
        this.orderSubscription = this.client?.subscribe(
          `/topic/vendor/${vendorId}/orders`,
          (message) => {
            try {
              const order: Order = JSON.parse(message.body);
              logger.info('WS_ORDER_RECEIVED', `Received order ${order.id} [${order.status}] via WebSocket`, order);

              // Update store
              useOrderStore.getState().addOrder(order);

              // If it's a new pending order, trigger audio alert
              if (order.status === 'PENDING') {
                playOrderNotificationSound();
              }
            } catch (err: any) {
              logger.error('WS_PARSE_ERROR', `Failed to parse WebSocket message: ${err.message}`);
            }
          }
        ) || null;
      },

      onDisconnect: () => {
        useConnectionStore.getState().setWsConnected(false);
        logger.warn('WS_DISCONNECTED', 'STOMP disconnected');
      },

      onStompError: (frame) => {
        useConnectionStore.getState().setWsConnected(false);
        logger.error('WS_STOMP_ERROR', `STOMP Error: ${frame.headers['message']}`, frame.body);
      },

      onWebSocketClose: () => {
        useConnectionStore.getState().setWsConnected(false);
        logger.warn('WS_SOCKET_CLOSED', 'Underlying WebSocket connection closed. Will retry in 3000ms');
      },
    });

    this.client.activate();
  }

  public disconnect() {
    if (this.orderSubscription) {
      this.orderSubscription.unsubscribe();
      this.orderSubscription = null;
    }
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this.currentVendorId = null;
    useConnectionStore.getState().setWsConnected(false);
    logger.info('WS_CLEANUP', 'WebSocket deactivated and cleaned up');
  }
}

export const webSocketService = new WebSocketService();
