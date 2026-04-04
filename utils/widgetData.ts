import { Platform } from 'react-native';

const APP_GROUP = 'group.com.elionbajrami.watertracker';
const WIDGET_KEY = 'waterWidgetData';

export interface WidgetData {
  totalMl: number;
  goalMl: number;
  streak: number;
  lastUpdated: string; // ISO string
}

export async function syncWidgetData(data: WidgetData): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    const SharedGroupPreferences = (
      await import('react-native-shared-group-preferences')
    ).default;
    await SharedGroupPreferences.setItem(WIDGET_KEY, JSON.stringify(data), APP_GROUP);
  } catch {
    // widget sync is best-effort, never block the user
  }
}
