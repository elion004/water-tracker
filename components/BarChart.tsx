import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, useColorScheme } from 'react-native';
import { DayData } from '@/utils/storage';
import { formatShortWeekday, getTodayString } from '@/utils/dateHelpers';
import { colors, typography, spacing } from '@/constants/theme';

interface BarChartProps {
  data: DayData[];
  goalMl: number;
}

const CHART_HEIGHT = 120;
const MIN_BAR_HEIGHT = 4;

interface BarProps {
  day: DayData;
  goalMl: number;
  isToday: boolean;
  index: number;
}

function Bar({ day, goalMl, isToday, index }: BarProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const fillRatio = Math.min(day.totalMl / goalMl, 1);
  const targetHeight = Math.max(fillRatio * CHART_HEIGHT, day.totalMl > 0 ? MIN_BAR_HEIGHT : MIN_BAR_HEIGHT);
  const heightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: targetHeight,
      duration: 400,
      delay: index * 50,
      useNativeDriver: false,
    }).start();
  }, [targetHeight, index, heightAnim]);

  const barColor = isToday ? colors.primary : colors.primaryLight;
  const labelColor = isToday ? colors.primary : isDark ? colors.dark.textSecondary : colors.textSecondary;
  const labelWeight = isToday ? '600' : '400';
  const label = formatShortWeekday(day.date);

  return (
    <View style={styles.barWrapper}>
      <View style={styles.barContainer}>
        <Animated.View
          style={[
            styles.bar,
            {
              height: heightAnim,
              backgroundColor: barColor,
              opacity: day.totalMl === 0 ? 0.35 : 1,
            },
          ]}
        />
      </View>
      <Text
        style={[
          typography.small,
          { color: labelColor, fontWeight: labelWeight, marginTop: spacing.xs },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export function BarChart({ data, goalMl }: BarChartProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const today = getTodayString();
  const labelColor = isDark ? colors.dark.textSecondary : colors.textSecondary;

  return (
    <View style={styles.root}>
      {/* Y-axis labels */}
      <View style={styles.yAxis}>
        <Text style={[typography.small, { color: labelColor }]}>
          {(goalMl / 1000).toFixed(1)}L
        </Text>
        <Text style={[typography.small, { color: labelColor }]}>0L</Text>
      </View>

      {/* Bars */}
      <View style={styles.barsArea}>
        {data.map((day, i) => (
          <Bar
            key={day.date}
            day={day}
            goalMl={goalMl}
            isToday={day.date === today}
            index={i}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_HEIGHT + 32,
  },
  yAxis: {
    height: CHART_HEIGHT,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginRight: spacing.sm,
    paddingBottom: 0,
  },
  barsArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_HEIGHT + 32,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barContainer: {
    width: '60%',
    height: CHART_HEIGHT,
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 4,
    width: '100%',
  },
});
