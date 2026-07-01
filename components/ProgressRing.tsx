import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, useColorScheme, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '@/constants/theme';
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
  const primaryColor = isDark ? colors.dark.primary : colors.primary;
  const trackStroke = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackStroke}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={primaryColor}
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
        <Text className={`text-[28px] font-semibold${goalReached ? ' text-primary' : ' text-foreground'}`}>
          {formatMl(currentMl)}
        </Text>
        {goalReached ? (
          <Text className="text-xs text-primary mt-0.5">
            Ziel erreicht! 🎉
          </Text>
        ) : (
          <Text className="text-xs text-muted-foreground mt-0.5">
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
