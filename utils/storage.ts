import AsyncStorage from '@react-native-async-storage/async-storage';

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
