import { ExpoConfig } from 'expo/config';

export default (): ExpoConfig => ({
  name: 'Holy Editor',
  slug: 'holy-editor',
  scheme: 'holyeditor',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  android: {
    package: 'app.holy.editor',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'app.holy.editor',
  },
  extra: {
    // Use EXPO_PUBLIC_* envs at runtime
  },
  experiments: {
    typedRoutes: false,
  },
});

