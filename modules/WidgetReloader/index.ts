import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

const WidgetReloaderModule =
  Platform.OS === 'ios' ? requireNativeModule('WidgetReloader') : null;

export function reloadWidgetTimelines(): void {
  WidgetReloaderModule?.reloadAll();
}
