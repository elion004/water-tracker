import { Platform, NativeModules } from 'react-native';

const APP_GROUP = 'group.com.elionbajrami.watertracker';
const PENDING_KEY = 'waterWidgetPending';

const { WaterTrackerWidgetBridge } = NativeModules;

export interface WidgetData {
  totalMl: number;
  goalMl: number;
  streak: number;
  lastUpdated: string; // ISO string
  date: string; // 'YYYY-MM-DD' — used by the widget to detect day change
}

export interface PendingAddition {
  amountMl: number;
  timestamp: string; // ISO string
}

// Writes data to App Group UserDefaults AND triggers immediate widget reload
export function syncWidgetData(data: WidgetData): void {
  if (Platform.OS !== 'ios') return;
  try {
    WaterTrackerWidgetBridge?.updateWidget(JSON.stringify(data));
  } catch {
    // best-effort
  }
}

export async function loadWidgetPending(): Promise<PendingAddition[]> {
  if (Platform.OS !== 'ios') return [];
  try {
    const SharedGroupPreferences = (
      await import('react-native-shared-group-preferences')
    ).default;
    const json = await SharedGroupPreferences.getItem(PENDING_KEY, APP_GROUP);
    if (!json) return [];
    return JSON.parse(json) as PendingAddition[];
  } catch {
    return [];
  }
}

export async function clearWidgetPending(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    const SharedGroupPreferences = (
      await import('react-native-shared-group-preferences')
    ).default;
    await SharedGroupPreferences.setItem(PENDING_KEY, JSON.stringify([]), APP_GROUP);
  } catch {
    // best-effort
  }
}
