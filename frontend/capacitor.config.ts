import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.test.ordernotification',
  appName: 'OrderNotification',
  webDir: 'dist',
  server: {
    cleartext: true,
    androidScheme: 'http',
    // Uncomment for local live-reload testing on emulator / device:
    // url: 'http://10.0.2.2:5173'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    App: {},
  },
};

export default config;
