module.exports = {
  expo: {
    name: 'WaterTrack',
    slug: 'water-tracker',
    version: '1.1.0',
    orientation: 'portrait',
    icon: './assets/images/watertrack-app-icon.png',
    scheme: 'watertracker',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.elionbajrami.watertracker',
      appleTeamId: process.env.APPLE_TEAM_ID,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
      entitlements: {
        'com.apple.security.application-groups': [
          'group.com.elionbajrami.watertracker',
        ],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/watertrack-app-icon.png',
        backgroundColor: '#1D9E75',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'com.elionbajrami.watertracker',
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#FFFFFF',
          dark: {
            backgroundColor: '#0F6E56',
          },
        },
      ],
      'expo-notifications',
      '@bacons/apple-targets',
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: '6230fec6-df6a-451b-a33b-321a6d8ab13e',
      },
    },
  },
};
