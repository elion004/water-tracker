import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, useColorScheme, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, typography } from '@/constants/theme';
import { formatMl } from '@/utils/dateHelpers';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  currentMl: number;
  goalMl: number;
  size?: number;
  strokeWidth?: number;
}

const SIZE = 200;
const STROKE_WIDTH = 14;

export function ProgressRing({
  currentMl,
  goalMl,
  size = SIZE,
  strokeWidth = STROKE_WIDTH,
}: ProgressRingProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressRef = useRef(0);

  const progress = Math.min(currentMl / goalMl, 1);

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progress,
      useNativeDriver: false,
      tension: 60,
      friction: 8,
    }).start();
    progressRef.current = progress;
  }, [progress, progressAnim]);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const goalReached = currentMl >= goalMl;
  const textColor = isDark ? colors.dark.textPrimary : colors.textPrimary;
  const secondaryColor = isDark ? colors.dark.textSecondary : colors.textSecondary;
  const trackColor = isDark ? colors.dark.border : colors.border;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      <View style={[styles.labelContainer, { width: size, height: size }]}>
        <Text style={[typography.metricLarge, { color: goalReached ? colors.primary : textColor }]}>
          {formatMl(currentMl)}
        </Text>
        {goalReached ? (
          <Text style={[typography.label, { color: colors.primary, marginTop: 2 }]}>
            Ziel erreicht! 🎉
          </Text>
        ) : (
          <Text style={[typography.label, { color: secondaryColor, marginTop: 2 }]}>
            von {formatMl(goalMl)}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  labelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
