import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { formatMl } from '@/utils/dateHelpers';

interface StreakCardProps {
  streak: number;
  remaining: number;
  goalReached: boolean;
}

export function StreakCard({ streak, remaining, goalReached }: StreakCardProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const cardBg = isDark ? colors.dark.backgroundSecondary : colors.backgroundSecondary;
  const textPrimary = isDark ? colors.dark.textPrimary : colors.textPrimary;
  const textSecondary = isDark ? colors.dark.textSecondary : colors.textSecondary;

  return (
    <View style={styles.row}>
      {/* Streak */}
      <View
        style={[styles.card, { backgroundColor: cardBg }]}
        accessibilityLabel={`Streak: ${streak} Tage`}
      >
        <Text style={[typography.sectionTitle, { color: textSecondary }]}>Streak</Text>
        <Text style={[typography.metricMedium, { color: textPrimary, marginTop: spacing.xs }]}>
          🔥 {streak} {streak === 1 ? 'Tag' : 'Tage'}
        </Text>
      </View>

      {/* Remaining */}
      <View
        style={[styles.card, { backgroundColor: cardBg }]}
        accessibilityLabel={goalReached ? 'Tagesziel erreicht' : `Noch ${formatMl(remaining)} bis zum Ziel`}
      >
        <Text style={[typography.sectionTitle, { color: textSecondary }]}>Heute noch</Text>
        <Text style={[typography.metricMedium, { color: textPrimary, marginTop: spacing.xs }]}>
          {goalReached ? '✅ Geschafft!' : formatMl(remaining)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  card: {
    flex: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
});
