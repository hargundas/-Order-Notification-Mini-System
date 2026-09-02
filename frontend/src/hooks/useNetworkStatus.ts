import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { useConnectionStore } from '../stores/connectionStore';
import { useAuthStore } from '../stores/authStore';
import { webSocketService } from '../services/websocket';
import { logger } from '../utils/logger';

export const useNetworkStatus = () => {
  const isOnline = useConnectionStore((state) => state.isOnline);
  const setIsOnline = useConnectionStore((state) => state.setIsOnline);

  useEffect(() => {
    // Challenge 2 Scenario C: Browser Online / Offline listeners
    const handleOnline = () => {
      logger.info('NETWORK_ONLINE', 'Device connection restored');
      setIsOnline(true);
      const { vendorId, token } = useAuthStore.getState();
      if (vendorId && token) {
        webSocketService.connect(vendorId, token, true);
      }
    };

    const handleOffline = () => {
      logger.warn('NETWORK_OFFLINE', 'Device connection lost (Offline/Airplane Mode)');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Challenge 2 Scenario D: Capacitor App State (Background / Foreground)
    let appStateListener: any = null;
    const pushListeners: any[] = [];
    const setupAppState = async () => {
      try {
        appStateListener = await App.addListener('appStateChange', (state) => {
          logger.info(
            'APP_STATE_CHANGE',
            `Capacitor app state changed: isActive=${state.isActive}`
          );
          if (state.isActive) {
            const { vendorId, token } = useAuthStore.getState();
            if (vendorId && token) {
              webSocketService.connect(vendorId, token, true);
            }
          }
        });
      } catch (e) {
        // Not running in Capacitor native runtime, ignore
      }
    };

    // Capacitor Push Notification Registration (if native)
    const setupPush = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          pushListeners.push(
            await PushNotifications.addListener('registration', (registration) => {
              logger.info('FCM_TOKEN_RECEIVED', 'Native push token received', {
                token: `${registration.value.slice(0, 8)}...[REDACTED]`,
              });
            }),
            await PushNotifications.addListener('registrationError', (error) => {
              logger.error('FCM_REGISTRATION_ERROR', 'Native push registration failed', error);
            }),
            await PushNotifications.addListener('pushNotificationReceived', (notification) => {
              logger.info('FCM_NOTIFICATION_RECEIVED', 'Push notification received', {
                id: notification.id,
                title: notification.title,
              });
            }),
            await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
              logger.info('FCM_NOTIFICATION_TAPPED', 'Push notification opened', {
                actionId: action.actionId,
                notificationId: action.notification.id,
              });
            })
          );

          const permStatus = await PushNotifications.requestPermissions();
          if (permStatus.receive === 'granted') {
            await PushNotifications.register();
            logger.info('PUSH_REGISTERED', 'Capacitor push notifications registered');
          }
        } catch (e: any) {
          logger.warn('PUSH_INIT_WARN', `Push notification init: ${e.message}`);
        }
      }
    };

    setupAppState();
    setupPush();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (appStateListener && appStateListener.remove) {
        appStateListener.remove();
      }
      pushListeners.forEach((listener) => listener.remove?.());
    };
  }, [setIsOnline]);

  return { isOnline };
};
