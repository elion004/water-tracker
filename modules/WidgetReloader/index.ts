import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

const WidgetReloaderModule =
  Platform.OS === 'ios' ? requireOptionalNativeModule('WidgetReloader') : null;

export function reloadWidgetTimelines(): void {
  WidgetReloaderModule?.reloadAll();
}
