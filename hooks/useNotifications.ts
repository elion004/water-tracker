import { useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';
import { Settings } from '@/utils/storage';

const NOTIFICATION_MESSAGES = [
  'Zeit zu trinken! Dein Körper dankt es dir. 💧',
  'Schon genug getrunken heute? Hol dir ein Glas Wasser! 🥤',
  'Trinkpause! Kurz Wasser trinken und weitermachen. 💙',
  'Hydration-Check! Wie viel hast du heute schon getrunken? 💦',
  'Dein Körper besteht zu 60% aus Wasser – füll ihn auf! 🌊',
  'Kleine Erinnerung: Ein Glas Wasser macht den Kopf klar. ✨',
  'Wasserzeit! Gönn dir eine kurze Pause und trink. 🚰',
  'Bleib hydratisiert und du bleibst fokussiert! 💪',
];

function randomMessage(): string {
  return NOTIFICATION_MESSAGES[Math.floor(Math.random() * NOTIFICATION_MESSAGES.length)];
}

function parseHourMinute(timeStr: string): { hour: number; minute: number } {
  const [h, m] = timeStr.split(':').map(Number);
  return { hour: h ?? 0, minute: m ?? 0 };
}

function isInDoNotDisturbRange(
  currentHour: number,
  from: { hour: number; minute: number },
  to: { hour: number; minute: number }
): boolean {
  const current = currentHour * 60;
  const fromMin = from.hour * 60 + from.minute;
  const toMin = to.hour * 60 + to.minute;

  if (fromMin > toMin) {
    // Wraps midnight: e.g. 22:00 – 07:00
    return current >= fromMin || current < toMin;
  }
  return current >= fromMin && current < toMin;
}

async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Berechtigung erforderlich',
      'Bitte aktiviere Benachrichtigungen in den Einstellungen deines Geräts, um Erinnerungen zu erhalten.',
      [{ text: 'OK' }]
    );
    return false;
  }
  return true;
}

async function cancelAllScheduled(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

async function scheduleReminders(settings: Settings): Promise<void> {
  await cancelAllScheduled();

  if (!settings.reminderEnabled) return;

  const granted = await requestPermissions();
  if (!granted) return;

  const intervalSeconds = settings.reminderIntervalHours * 3600;
  const dndFrom = parseHourMinute(settings.doNotDisturbFrom);
  const dndTo = parseHourMinute(settings.doNotDisturbTo);

  // Schedule the next 20 notifications
  let nextTime = Date.now() + intervalSeconds * 1000;
  let scheduled = 0;

  while (scheduled < 20) {
    const date = new Date(nextTime);
    const hour = date.getHours();

    const inDnd =
      settings.doNotDisturbEnabled && isInDoNotDisturbRange(hour, dndFrom, dndTo);

    if (!inDnd) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'WaterTrack 💧',
          body: randomMessage(),
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
        },
      });
      scheduled++;
    }

    nextTime += intervalSeconds * 1000;
  }
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications() {
  const enableReminders = useCallback(async (settings: Settings): Promise<boolean> => {
    const granted = await requestPermissions();
    if (!granted) return false;
    await scheduleReminders(settings);
    return true;
  }, []);

  const disableReminders = useCallback(async (): Promise<void> => {
    await cancelAllScheduled();
  }, []);

  const updateSchedule = useCallback(async (settings: Settings): Promise<void> => {
    if (settings.reminderEnabled) {
      await scheduleReminders(settings);
    } else {
      await cancelAllScheduled();
    }
  }, []);

  return { enableReminders, disableReminders, updateSchedule };
}
