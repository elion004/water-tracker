import React, { useRef } from 'react';
import {
  Text,
  Animated,
  Pressable,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { colors, borderRadius, typography } from '@/constants/theme';

interface QuickAddButtonProps {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
}

export function QuickAddButton({ label, onPress, accessibilityLabel }: QuickAddButtonProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bgColor = isDark ? colors.dark.backgroundSecondary : colors.backgroundSecondary;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 120,
      friction: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 120,
      friction: 6,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1 }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: pressed ? colors.primaryBg : bgColor },
          pressed && styles.buttonPressed,
        ]}
      >
        <Text
          style={[
            typography.body,
            styles.label,
            { color: isDark ? colors.dark.textPrimary : colors.textPrimary },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  buttonPressed: {
    borderColor: colors.primary,
  },
  label: {
    fontWeight: '500',
  },
});
