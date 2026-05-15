import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.defesacivil.corupa',
  appName: 'Defesa Civil Corupa',
  webDir: 'dist',
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    LocalNotifications: {
      smallIcon: "ic_stat_name",
      iconColor: "#FF6B00",
    },
  },
};

export default config;
