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
      smallIcon: "ic_stat_logo_defesa_civil",
      iconColor: "#003366",
    },
  },
};

export default config;
