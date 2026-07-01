import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, useColorScheme, Pressable } from 'react-native';
import { DayData } from '@/utils/storage';
import { formatShortWeekday, getTodayString } from '@/utils/dateHelpers';
import { colors, spacing } from '@/constants/theme';
import { formatMl } from '@/utils/dateHelpers';

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
  isSelected: boolean;
  index: number;
  onPress: () => void;
}

function Bar({ day, goalMl, isToday, isSelected, index, onPress }: BarProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const fillRatio = Math.min(day.totalMl / goalMl, 1);
  const targetHeight = Math.max(fillRatio * CHART_HEIGHT, MIN_BAR_HEIGHT);
  const heightAnim = useRef(new Animated.Value(0)).current;
  const labelOpacity = useRef(new Animated.Value(0)).current;
  const labelTranslate = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: targetHeight,
      duration: 400,
      delay: index * 50,
      useNativeDriver: false,
    }).start();
  }, [targetHeight, index, heightAnim]);

  useEffect(() => {
    if (isSelected) {
      Animated.parallel([
        Animated.timing(labelOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(labelTranslate, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(labelOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.timing(labelTranslate, { toValue: 6, duration: 120, useNativeDriver: true }),
      ]).start();
    }
  }, [isSelected, labelOpacity, labelTranslate]);

  const barColor = isDark
    ? isSelected ? '#6DE6B8' : isToday ? colors.dark.primary : 'rgba(79,200,158,0.35)'
    : isSelected ? colors.primaryDark : isToday ? colors.primary : colors.primaryLight;

  const tooltipBg = isDark ? colors.dark.primary : colors.primaryDark;
  const tooltipTextColor = isDark ? '#0A0A0A' : '#fff';
  const label = formatShortWeekday(day.date);

  return (
    <Pressable
      style={styles.barWrapper}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${formatMl(day.totalMl)}`}
    >
      <Animated.View
        style={[
          styles.tooltip,
          {
            opacity: labelOpacity,
            transform: [{ translateY: labelTranslate }],
            backgroundColor: tooltipBg,
          },
        ]}
        pointerEvents="none"
      >
        <Text style={[styles.tooltipText, { color: tooltipTextColor }]}>
          {formatMl(day.totalMl)}
        </Text>
      </Animated.View>

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
        className={
          isToday || isSelected
            ? 'text-[10px] font-semibold text-primary mt-1'
            : 'text-[10px] text-muted-foreground mt-1'
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function BarChart({ data, goalMl }: BarChartProps) {
  const today = getTodayString();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handlePress = (date: string) => {
    setSelectedDate((prev) => (prev === date ? null : date));
  };

  return (
    <View style={styles.root}>
      <View style={styles.yAxis}>
        <Text className="text-[10px] text-muted-foreground">
          {(goalMl / 1000).toFixed(1)}L
        </Text>
        <Text className="text-[10px] text-muted-foreground">0L</Text>
      </View>

      <View style={styles.barsArea}>
        {data.map((day, i) => (
          <Bar
            key={day.date}
            day={day}
            goalMl={goalMl}
            isToday={day.date === today}
            isSelected={selectedDate === day.date}
            index={i}
            onPress={() => handlePress(day.date)}
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
    height: CHART_HEIGHT + 32 + 28,
  },
  yAxis: {
    height: CHART_HEIGHT,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginRight: spacing.sm,
    marginTop: 28,
  },
  barsArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_HEIGHT + 32 + 28,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  tooltip: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginBottom: 4,
    minWidth: 36,
    alignItems: 'center',
  },
  tooltipText: {
    fontSize: 10,
    fontWeight: '600',
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
