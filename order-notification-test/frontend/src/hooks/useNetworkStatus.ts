import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { useConnectionStore } from '../stores/connectionStore';
import { logger } from '../utils/logger';

export const useNetworkStatus = () => {
  const isOnline = useConnectionStore((state) => state.isOnline);
  const setIsOnline = useConnectionStore((state) => state.setIsOnline);

  useEffect(() => {
    // Challenge 2 Scenario C: Browser Online / Offline listeners
    const handleOnline = () => {
      logger.info('NETWORK_ONLINE', 'Device connection restored');
      setIsOnline(true);
    };

    const handleOffline = () => {
      logger.warn('NETWORK_OFFLINE', 'Device connection lost (Offline/Airplane Mode)');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Challenge 2 Scenario D: Capacitor App State (Background / Foreground)
    let appStateListener: any = null;
    const setupAppState = async () => {
      try {
        appStateListener = await App.addListener('appStateChange', (state) => {
          logger.info(
            'APP_STATE_CHANGE',
            `Capacitor app state changed: isActive=${state.isActive}`
          );
        });
      } catch (e) {
        // Not running in Capacitor native runtime, ignore
      }
    };

    // Capacitor Push Notification Registration (if native)
    const setupPush = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
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
    };
  }, [setIsOnline]);

  return { isOnline };
};
