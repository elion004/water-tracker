const withWidgetKitFramework = (config) => {
  const { withXcodeProject } = require('@expo/config-plugins');
  return withXcodeProject(config, (config) => {
    config.modResults.addFramework('WidgetKit.framework');
    return config;
  });
};

const withWidgetBridge = (config) => {
  const { withDangerousMod, withXcodeProject } = require('@expo/config-plugins');
  const path = require('path');
  const fs = require('fs');

  const SWIFT = `import Foundation
import WidgetKit

@objc(WaterTrackerWidgetBridge)
class WaterTrackerWidgetBridge: NSObject {
  private let appGroup = "group.com.elionbajrami.watertracker"
  private let widgetKey = "waterWidgetData"

  @objc
  func updateWidget(_ jsonData: String) {
    let defaults = UserDefaults(suiteName: appGroup)
    defaults?.set(jsonData, forKey: widgetKey)
    defaults?.synchronize()
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
    }
  }

  @objc
  static func requiresMainQueueSetup() -> Bool { return false }
}
`;

  const OBJC = `#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WaterTrackerWidgetBridge, NSObject)
RCT_EXTERN_METHOD(updateWidget:(NSString *)jsonData)
@end
`;

  // Step 1: Write the files into the iOS project directory
  config = withDangerousMod(config, [
    'ios',
    (config) => {
      const iosDir = config.modRequest.platformProjectRoot;
      const appName = config.modRequest.projectName;
      const dir = path.join(iosDir, appName);
      fs.writeFileSync(path.join(dir, 'WidgetBridge.swift'), SWIFT);
      fs.writeFileSync(path.join(dir, 'WidgetBridge.m'), OBJC);
      return config;
    },
  ]);

  // Step 2: Add both files to the Xcode project main target
  config = withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    const appName = config.modRequest.projectName;

    // Find main app target UUID
    const nativeTargets = xcodeProject.pbxNativeTargetSection();
    let mainTargetUUID;
    for (const uuid of Object.keys(nativeTargets)) {
      if (uuid.endsWith('_comment')) continue;
      if (nativeTargets[uuid].productType === '"com.apple.product-type.application"') {
        mainTargetUUID = uuid;
        break;
      }
    }

    // Find the group UUID whose path matches the app name
    const groups = xcodeProject.hash.project.objects['PBXGroup'] || {};
    let mainGroupUUID;
    for (const uuid of Object.keys(groups)) {
      if (uuid.endsWith('_comment')) continue;
      const g = groups[uuid];
      if (g.path === `"${appName}"` || g.path === appName) {
        mainGroupUUID = uuid;
        break;
      }
    }

    if (mainTargetUUID && mainGroupUUID) {
      xcodeProject.addSourceFile(`${appName}/WidgetBridge.swift`, { target: mainTargetUUID }, mainGroupUUID);
      xcodeProject.addSourceFile(`${appName}/WidgetBridge.m`, { target: mainTargetUUID }, mainGroupUUID);
    }

    return config;
  });

  return config;
};

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
      withWidgetKitFramework,
      withWidgetBridge,
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
