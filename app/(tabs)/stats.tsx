import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useWaterData } from '@/hooks/useWaterData';
import { BarChart } from '@/components/BarChart';
import { colors } from '@/constants/theme';
import { formatMl, formatShortDate } from '@/utils/dateHelpers';
import { DayData } from '@/utils/storage';
import { GlassView, GlassContainer } from '@/components/ui/liquid-glass';

type TabType = '7days' | 'month';

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <GlassView glassEffectStyle="regular" className="flex-1 rounded-2xl p-4">
      <Text className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{label}</Text>
      <Text className="text-foreground text-lg font-semibold mt-1">{value}</Text>
    </GlassView>
  );
}

export default function StatsScreen() {
  const { weekData, settings, streak, reload, isLoading } = useWaterData();
  const [activeTab, setActiveTab] = useState<TabType>('7days');

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const displayData = weekData;

  const stats = useMemo(() => {
    if (!displayData.length) {
      return { avg: 0, goalsReached: 0, total: displayData.length, bestDay: null as DayData | null };
    }
    const daysWithData = displayData.filter((d) => d.totalMl > 0);
    const avg = daysWithData.length
      ? Math.round(daysWithData.reduce((sum, d) => sum + d.totalMl, 0) / daysWithData.length)
      : 0;
    const goalsReached = displayData.filter((d) => d.totalMl >= settings.goalMl).length;
    const bestDay = displayData.reduce<DayData | null>((best, d) => {
      if (!best || d.totalMl > best.totalMl) return d;
      return best;
    }, null);
    return { avg, goalsReached, total: displayData.length, bestDay };
  }, [displayData, settings.goalMl]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-foreground text-2xl font-semibold mb-6">Verlauf</Text>

        {/* Tab Switcher */}
        <GlassContainer spacing={2} className="rounded-full self-start mb-6">
          <View className="flex-row p-1">
            {(['7days', 'month'] as TabType[]).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                accessibilityRole="tab"
                accessibilityLabel={tab === '7days' ? '7 Tage' : 'Monat'}
              >
                <GlassView
                  glassEffectStyle={activeTab === tab ? 'regular' : 'clear'}
                  isInteractive
                  className={`rounded-full px-5 py-2${activeTab === tab ? ' bg-primary/20' : ''}`}
                >
                  <Text className={`text-sm font-medium${activeTab === tab ? ' text-primary' : ' text-muted-foreground'}`}>
                    {tab === '7days' ? '7 Tage' : 'Monat'}
                  </Text>
                </GlassView>
              </Pressable>
            ))}
          </View>
        </GlassContainer>

        {/* Chart */}
        <View className="mb-6">
          <BarChart data={displayData} goalMl={settings.goalMl} />
        </View>

        {/* Stats Grid */}
        <View className="gap-3 mb-6">
          <View className="flex-row gap-3">
            <StatCard label="Ø pro Tag" value={formatMl(stats.avg)} />
            <StatCard label="Ziel erreicht" value={`${stats.goalsReached} / ${stats.total} Tage`} />
          </View>
          <View className="flex-row gap-3">
            <StatCard
              label="Bester Tag"
              value={
                stats.bestDay && stats.bestDay.totalMl > 0
                  ? `${formatShortDate(stats.bestDay.date)}: ${formatMl(stats.bestDay.totalMl)}`
                  : 'Noch keine Daten'
              }
            />
            <StatCard label="Streak" value={`${streak} ${streak === 1 ? 'Tag' : 'Tage'}`} />
          </View>
        </View>

        {/* Achievement */}
        {streak > 0 && (
          <GlassView
            glassEffectStyle="regular"
            className="rounded-2xl p-4 flex-row items-center justify-between bg-primary/10"
          >
            <Text className="text-foreground font-medium flex-1 mr-3">
              {streak === 1 ? 'Erster Tag! Der erste Schritt zählt.' : `${streak}-Tage Streak! Weiter so.`}
            </Text>
            <Text style={{ fontSize: 28 }}>
              {streak >= 7 ? '🏆' : streak >= 3 ? '🥈' : '🥉'}
            </Text>
          </GlassView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
