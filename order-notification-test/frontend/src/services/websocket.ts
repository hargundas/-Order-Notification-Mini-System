import { Client, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useConnectionStore } from '../stores/connectionStore';
import { useOrderStore, Order } from '../stores/orderStore';
import { logger } from '../utils/logger';
import { playOrderNotificationSound } from '../utils/sound';
import { getApiBaseUrl, apiClient } from './api';
import { useAuthStore } from '../stores/authStore';
import { isJwtExpiring } from '../utils/jwt';

class WebSocketService {
  private client: Client | null = null;
  private orderSubscription: StompSubscription | null = null;
  private currentVendorId: string | null = null;
  private currentApiBase: string | null = null;
  private connectionGeneration = 0;

  public connect(vendorId: string, token: string, force = false) {
    const apiBase = getApiBaseUrl();
    const isSameConnection =
      this.client?.active &&
      this.currentVendorId === vendorId &&
      this.currentApiBase === apiBase;

    if (!force && isSameConnection) {
      return;
    }

    const generation = ++this.connectionGeneration;
    const previousClient = this.client;
    this.client = null;
    this.clearSubscription();
    this.currentVendorId = vendorId;
    this.currentApiBase = apiBase;
    useConnectionStore.getState().setWsConnected(false);
    logger.info('WS_CONNECTING', `Initiating STOMP WebSocket connection to ${apiBase}/ws for vendor ${vendorId}`);

    const activate = () => {
      if (generation !== this.connectionGeneration) return;

      const client = new Client({
        // Provide SockJS fallback factory
        webSocketFactory: () => new SockJS(`${apiBase}/ws`),
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },

        // A reconnect after a long outage may be using an expired token. Refresh
        // before every transport attempt and update the STOMP CONNECT headers.
        beforeConnect: async () => {
          const auth = useAuthStore.getState();
          if (auth.token && isJwtExpiring(auth.token)) {
            try {
              await auth.refreshToken();
            } catch {
              // Keep retrying; a network outage is expected during recovery.
            }
          }
          const latestToken = useAuthStore.getState().token;
          client.connectHeaders = latestToken
            ? { Authorization: `Bearer ${latestToken}` }
            : {};
        },

        // Challenge 2 Scenario B: Automatic reconnection backoff of 3000ms
        reconnectDelay: 3000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,

        debug: (msg: string) => {
          const safeMessage = msg.replace(
            /Authorization:Bearer\s+[^\s]+/gi,
            'Authorization:Bearer [REDACTED]'
          );
          logger.debug('WS_DEBUG', safeMessage);
        },

        onConnect: () => {
          if (generation !== this.connectionGeneration) return;
          useConnectionStore.getState().setWsConnected(true);
          logger.info('WS_CONNECTED', `STOMP connection established. Subscribing to /topic/vendor/${vendorId}/orders`);

          // Subscribe to vendor-specific orders topic
          this.orderSubscription = client.subscribe(
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
          );

          // Recover any orders created while this client was disconnected.
          void apiClient.get<Order[]>('/vendor/orders')
            .then((response) => {
              if (generation === this.connectionGeneration) {
                useOrderStore.getState().setOrders(response.data);
                logger.info('WS_RECOVERY_SYNC', `Recovered ${response.data.length} vendor orders after reconnect`);
              }
            })
            .catch((error: any) => {
              logger.warn('WS_RECOVERY_SYNC_FAILED', error.message || 'Failed to synchronize orders after reconnect');
            });
        },

        onDisconnect: () => {
          if (generation !== this.connectionGeneration) return;
          useConnectionStore.getState().setWsConnected(false);
          logger.warn('WS_DISCONNECTED', 'STOMP disconnected');
        },

        onStompError: (frame) => {
          if (generation !== this.connectionGeneration) return;
          useConnectionStore.getState().setWsConnected(false);
          logger.error('WS_STOMP_ERROR', `STOMP Error: ${frame.headers['message']}`, frame.body);
        },

        onWebSocketClose: () => {
          if (generation !== this.connectionGeneration) return;
          useConnectionStore.getState().setWsConnected(false);
          logger.warn('WS_SOCKET_CLOSED', 'Underlying WebSocket connection closed. Will retry in 3000ms');
        },
      });

      this.client = client;
      client.activate();
    };

    if (previousClient) {
      void previousClient.deactivate().finally(activate);
    } else {
      activate();
    }
  }

  public disconnect() {
    ++this.connectionGeneration;
    this.clearSubscription();
    const client = this.client;
    this.client = null;
    if (client) void client.deactivate();
    this.currentVendorId = null;
    this.currentApiBase = null;
    useConnectionStore.getState().setWsConnected(false);
    logger.info('WS_CLEANUP', 'WebSocket deactivated and cleaned up');
  }

  private clearSubscription() {
    if (!this.orderSubscription) return;
    try {
      this.orderSubscription.unsubscribe();
    } catch {
      // The transport may already be gone during failure recovery.
    }
    this.orderSubscription = null;
  }
}

export const webSocketService = new WebSocketService();
