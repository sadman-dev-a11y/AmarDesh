import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'bd.amardesh.explorer', appName: 'AmarDesh', webDir: 'dist',
  android: { backgroundColor: '#f6f3e9' }, server: { androidScheme: 'https' },
  plugins: { SplashScreen: { launchAutoHide: false, launchShowDuration: 1500, backgroundColor: '#103f38', showSpinner: false }, StatusBar: { backgroundColor: '#f6f3e9', style: 'LIGHT' } }
};
export default config;
