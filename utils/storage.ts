import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, subDays } from 'date-fns';

export interface WaterEntry {
  id: string;
  timestamp: number;
  amountMl: number;
}

export interface DayData {
  date: string; // 'YYYY-MM-DD'
  totalMl: number;
  entries: WaterEntry[];
}

export interface Settings {
  goalMl: number;
  reminderEnabled: boolean;
  reminderIntervalHours: number;
  doNotDisturbEnabled: boolean;
  doNotDisturbFrom: string;
  doNotDisturbTo: string;
  customCupSizeMl: number;
}

const KEYS = {
  DAY_PREFIX: 'water_day_',
  SETTINGS: 'water_settings',
  STREAK: 'water_streak',
} as const;

export const DEFAULT_SETTINGS: Settings = {
  goalMl: 2000,
  reminderEnabled: false,
  reminderIntervalHours: 2,
  doNotDisturbEnabled: false,
  doNotDisturbFrom: '22:00',
  doNotDisturbTo: '07:00',
  customCupSizeMl: 250,
};

export const EMPTY_DAY = (date: string): DayData => ({
  date,
  totalMl: 0,
  entries: [],
});

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function loadDayData(date: string): Promise<DayData> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.DAY_PREFIX + date);
    if (!raw) return EMPTY_DAY(date);
    return JSON.parse(raw) as DayData;
  } catch {
    return EMPTY_DAY(date);
  }
}

export async function saveDayData(data: DayData): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.DAY_PREFIX + data.date, JSON.stringify(data));
  } catch {
    // silently fail; data will be stale this session
  }
}

export async function addWaterEntry(date: string, amountMl: number): Promise<DayData> {
  const day = await loadDayData(date);
  const entry: WaterEntry = {
    id: generateId(),
    timestamp: Date.now(),
    amountMl,
  };
  const updated: DayData = {
    ...day,
    totalMl: day.totalMl + amountMl,
    entries: [...day.entries, entry],
  };
  await saveDayData(updated);
  return updated;
}

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch {
    // silently fail
  }
}

export async function loadStreak(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.STREAK);
    if (!raw) return 0;
    return parseInt(raw, 10) || 0;
  } catch {
    return 0;
  }
}

export async function saveStreak(streak: number): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.STREAK, String(streak));
  } catch {
    // silently fail
  }
}

export async function seedTestData(): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 8 days: 7 history + today (partial)
  const days: { offsetDays: number; entries: { hour: number; minute: number; ml: number }[] }[] = [
    {
      offsetDays: 7,
      entries: [
        { hour: 7, minute: 30, ml: 300 },
        { hour: 10, minute: 0, ml: 250 },
        { hour: 12, minute: 30, ml: 400 },
        { hour: 15, minute: 0, ml: 250 },
        { hour: 18, minute: 0, ml: 300 },
      ],
    }, // 1500 ml – kein Ziel
    {
      offsetDays: 6,
      entries: [
        { hour: 8, minute: 0, ml: 350 },
        { hour: 10, minute: 30, ml: 250 },
        { hour: 13, minute: 0, ml: 400 },
        { hour: 16, minute: 0, ml: 300 },
        { hour: 19, minute: 30, ml: 500 },
      ],
    }, // 1800 ml – kein Ziel
    {
      offsetDays: 5,
      entries: [
        { hour: 7, minute: 0, ml: 300 },
        { hour: 9, minute: 30, ml: 250 },
        { hour: 12, minute: 0, ml: 500 },
        { hour: 14, minute: 30, ml: 300 },
        { hour: 17, minute: 0, ml: 350 },
        { hour: 20, minute: 0, ml: 300 },
      ],
    }, // 2000 ml – Ziel erreicht ✓
    {
      offsetDays: 4,
      entries: [
        { hour: 7, minute: 30, ml: 400 },
        { hour: 10, minute: 0, ml: 300 },
        { hour: 12, minute: 30, ml: 500 },
        { hour: 15, minute: 30, ml: 250 },
        { hour: 18, minute: 0, ml: 350 },
        { hour: 21, minute: 0, ml: 300 },
      ],
    }, // 2100 ml – Ziel erreicht ✓
    {
      offsetDays: 3,
      entries: [
        { hour: 6, minute: 30, ml: 500 },
        { hour: 9, minute: 0, ml: 300 },
        { hour: 11, minute: 30, ml: 400 },
        { hour: 14, minute: 0, ml: 300 },
        { hour: 16, minute: 30, ml: 400 },
        { hour: 19, minute: 0, ml: 400 },
      ],
    }, // 2300 ml – Ziel erreicht ✓
    {
      offsetDays: 2,
      entries: [
        { hour: 7, minute: 0, ml: 300 },
        { hour: 9, minute: 30, ml: 250 },
        { hour: 12, minute: 0, ml: 500 },
        { hour: 15, minute: 0, ml: 300 },
        { hour: 17, minute: 30, ml: 400 },
        { hour: 20, minute: 30, ml: 300 },
      ],
    }, // 2050 ml – Ziel erreicht ✓
    {
      offsetDays: 1,
      entries: [
        { hour: 7, minute: 15, ml: 350 },
        { hour: 10, minute: 0, ml: 300 },
        { hour: 12, minute: 30, ml: 500 },
        { hour: 15, minute: 0, ml: 250 },
        { hour: 17, minute: 30, ml: 400 },
        { hour: 20, minute: 0, ml: 350 },
      ],
    }, // 2150 ml – Ziel erreicht ✓
    {
      offsetDays: 0,
      entries: [
        { hour: 7, minute: 30, ml: 300 },
        { hour: 10, minute: 0, ml: 300 },
        { hour: 12, minute: 0, ml: 300 },
      ],
    }, // 900 ml – heute (in Arbeit)
  ];

  for (const day of days) {
    const date = subDays(today, day.offsetDays);
    const dateStr = format(date, 'yyyy-MM-dd');

    let totalMl = 0;
    const entries: WaterEntry[] = day.entries.map(({ hour, minute, ml }, i) => {
      const ts = new Date(date);
      ts.setHours(hour, minute, 0, 0);
      totalMl += ml;
      return {
        id: `seed-${dateStr}-${i}`,
        timestamp: ts.getTime(),
        amountMl: ml,
      };
    });

    const dayData: DayData = { date: dateStr, totalMl, entries };
    await saveDayData(dayData);
  }

  // Streak von 5 setzen (die letzten 5 Tage Ziel erreicht)
  await saveStreak(5);
}

export async function resetAllData(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const waterKeys = keys.filter(
      (k) => k.startsWith(KEYS.DAY_PREFIX) || k === KEYS.SETTINGS || k === KEYS.STREAK
    );
    await AsyncStorage.multiRemove(waterKeys);
  } catch {
    // silently fail
  }
}
