import { useState, useEffect, useCallback } from 'react';
import {
  DayData,
  Settings,
  loadDayData,
  saveDayData,
  addWaterEntry,
  loadSettings,
  saveSettings,
  loadStreak,
  saveStreak,
  resetAllData as storageResetAll,
  seedTestData as storageSeedTestData,
  DEFAULT_SETTINGS,
  EMPTY_DAY,
} from '@/utils/storage';
import { getTodayString, getLastNDays, getDateString } from '@/utils/dateHelpers';
import { subDays } from 'date-fns';

export interface WaterDataHook {
  todayData: DayData;
  weekData: DayData[];
  settings: Settings;
  streak: number;
  addWater: (amountMl: number) => Promise<void>;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  resetAllData: () => Promise<void>;
  seedTestData: () => Promise<void>;
  reload: () => Promise<void>;
  isLoading: boolean;
}

function computeStreak(weekData: DayData[], goalMl: number): number {
  // Check up to 30 days back, ending today or yesterday
  const today = getTodayString();
  let streak = 0;
  let checkDate = new Date();

  // If today has no data, start checking from yesterday
  const todayDay = weekData.find((d) => d.date === today);
  if (!todayDay || todayDay.totalMl < goalMl) {
    checkDate = subDays(checkDate, 1);
  }

  for (let i = 0; i < 30; i++) {
    const dateStr = getDateString(checkDate);
    const day = weekData.find((d) => d.date === dateStr);
    if (day && day.totalMl >= goalMl) {
      streak++;
      checkDate = subDays(checkDate, 1);
    } else {
      break;
    }
  }
  return streak;
}

export function useWaterData(): WaterDataHook {
  const [todayData, setTodayData] = useState<DayData>(EMPTY_DAY(getTodayString()));
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [streak, setStreak] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [loadedSettings, loadedStreak] = await Promise.all([
        loadSettings(),
        loadStreak(),
      ]);

      const dates = getLastNDays(7);
      const dayDataArray = await Promise.all(dates.map((d) => loadDayData(d)));

      const today = getTodayString();
      const todayLoaded = dayDataArray.find((d) => d.date === today) ?? EMPTY_DAY(today);

      setSettings(loadedSettings);
      setWeekData(dayDataArray);
      setTodayData(todayLoaded);

      // Recompute streak from actual data
      const computedStreak = computeStreak(dayDataArray, loadedSettings.goalMl);
      setStreak(computedStreak);
      if (computedStreak !== loadedStreak) {
        await saveStreak(computedStreak);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const addWater = useCallback(
    async (amountMl: number) => {
      const today = getTodayString();
      const updated = await addWaterEntry(today, amountMl);

      setTodayData(updated);
      setWeekData((prev) => {
        const next = prev.map((d) => (d.date === today ? updated : d));
        // If today wasn't in weekData yet, add it
        if (!next.find((d) => d.date === today)) {
          return [...next, updated];
        }
        return next;
      });

      // Recompute streak
      setWeekData((prev) => {
        const computedStreak = computeStreak(prev, settings.goalMl);
        setStreak(computedStreak);
        saveStreak(computedStreak);
        return prev;
      });
    },
    [settings.goalMl]
  );

  const updateSettings = useCallback(async (newSettings: Partial<Settings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      saveSettings(updated);
      return updated;
    });
  }, []);

  const resetAllData = useCallback(async () => {
    await storageResetAll();
    const today = getTodayString();
    const empty = EMPTY_DAY(today);
    setTodayData(empty);
    setWeekData(getLastNDays(7).map((d) => EMPTY_DAY(d)));
    setSettings(DEFAULT_SETTINGS);
    setStreak(0);
  }, []);

  const seedTestData = useCallback(async () => {
    await storageSeedTestData();
    await loadAll();
  }, [loadAll]);

  return {
    todayData,
    weekData,
    settings,
    streak,
    addWater,
    updateSettings,
    resetAllData,
    seedTestData,
    reload: loadAll,
    isLoading,
  };
}
