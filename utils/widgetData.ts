import { Platform } from 'react-native';
import { reloadWidgetTimelines } from '@/modules/WidgetReloader';

const APP_GROUP = 'group.com.elionbajrami.watertracker';
const WIDGET_KEY = 'waterWidgetData';
const PENDING_KEY = 'waterWidgetPending';

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

export async function syncWidgetData(data: WidgetData): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    const SharedGroupPreferences = (
      await import('react-native-shared-group-preferences')
    ).default;
    await SharedGroupPreferences.setItem(WIDGET_KEY, JSON.stringify(data), APP_GROUP);
    reloadWidgetTimelines();
  } catch {
    // widget sync is best-effort, never block the user
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
