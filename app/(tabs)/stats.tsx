import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWaterData } from '@/hooks/useWaterData';
import { BarChart } from '@/components/BarChart';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { formatMl, formatShortDate, getTodayString } from '@/utils/dateHelpers';
import { DayData } from '@/utils/storage';

type TabType = '7days' | 'month';

function StatCard({
  label,
  value,
  isDark,
}: {
  label: string;
  value: string;
  isDark: boolean;
}) {
  const cardBg = isDark ? colors.dark.backgroundSecondary : colors.backgroundSecondary;
  const textPrimary = isDark ? colors.dark.textPrimary : colors.textPrimary;
  const textSecondary = isDark ? colors.dark.textSecondary : colors.textSecondary;

  return (
    <View style={[styles.statCard, { backgroundColor: cardBg }]}>
      <Text style={[typography.sectionTitle, { color: textSecondary }]}>{label}</Text>
      <Text style={[typography.metricMedium, { color: textPrimary, marginTop: spacing.xs }]}>
        {value}
      </Text>
    </View>
  );
}

export default function StatsScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { weekData, settings, streak, isLoading } = useWaterData();
  const [activeTab, setActiveTab] = useState<TabType>('7days');

  const bgColor = isDark ? colors.dark.background : colors.background;
  const textPrimary = isDark ? colors.dark.textPrimary : colors.textPrimary;
  const textSecondary = isDark ? colors.dark.textSecondary : colors.textSecondary;

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
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { backgroundColor: bgColor }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={[typography.screenTitle, { color: textPrimary, marginBottom: spacing.xl }]}>
          Verlauf
        </Text>

        {/* Tab switcher */}
        <View
          style={[
            styles.tabRow,
            { borderColor: isDark ? colors.dark.border : colors.border },
          ]}
        >
          {(['7days', 'month'] as TabType[]).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              accessibilityRole="tab"
              accessibilityLabel={tab === '7days' ? '7 Tage' : 'Monat'}
              style={[
                styles.tab,
                activeTab === tab && styles.tabActive,
              ]}
            >
              <Text
                style={[
                  typography.body,
                  {
                    color: activeTab === tab ? colors.white : textSecondary,
                    fontWeight: activeTab === tab ? '600' : '400',
                  },
                ]}
              >
                {tab === '7days' ? '7 Tage' : 'Monat'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Chart */}
        <View style={styles.chartContainer}>
          <BarChart data={displayData} goalMl={settings.goalMl} />
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <StatCard
            label="Ø pro Tag"
            value={formatMl(stats.avg)}
            isDark={isDark}
          />
          <StatCard
            label="Ziel erreicht"
            value={`${stats.goalsReached} / ${stats.total} Tage`}
            isDark={isDark}
          />
          <StatCard
            label="Bester Tag"
            value={
              stats.bestDay && stats.bestDay.totalMl > 0
                ? `${formatShortDate(stats.bestDay.date)}: ${formatMl(stats.bestDay.totalMl)}`
                : 'Noch keine Daten'
            }
            isDark={isDark}
          />
          <StatCard
            label="Aktueller Streak"
            value={`${streak} ${streak === 1 ? 'Tag' : 'Tage'}`}
            isDark={isDark}
          />
        </View>

        {/* Achievement badge */}
        {streak > 0 && (
          <View
            style={[
              styles.achievementCard,
              { backgroundColor: colors.primaryBg },
            ]}
            accessibilityLabel={`Streak: ${streak} Tage`}
          >
            <Text style={[typography.metricMedium, { color: colors.primaryDark }]}>
              {streak === 1 ? 'Erster Tag! Der erste Schritt zaehlt.' : `${streak}-Tage Streak! Weiter so.`}
            </Text>
            <Text style={styles.badge}>
              {streak >= 7 ? '🏆' : streak >= 3 ? '🥈' : '🥉'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 100,
  },
  tabRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: borderRadius.pill,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    alignSelf: 'flex-start',
  },
  tab: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  chartContainer: {
    marginBottom: spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: '47%',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  achievementCard: {
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    fontSize: 28,
  },
});
