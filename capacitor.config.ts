import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.omercelik.erasmusatolyesi',
  appName: 'Erasmus+ Proje Atölyesi',
  webDir: 'dist',
  server: {
    url: 'https://omer.tail922240.ts.net',
    allowNavigation: ['omer.tail922240.ts.net']
  }
};

export default config;
