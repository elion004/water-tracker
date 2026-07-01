import React from 'react';
import { View, Text } from 'react-native';
import { formatMl } from '@/utils/dateHelpers';
import { GlassView } from '@/components/ui/liquid-glass';

interface StreakCardProps {
  streak: number;
  remaining: number;
  goalReached: boolean;
}

export function StreakCard({ streak, remaining, goalReached }: StreakCardProps) {
  return (
    <View className="flex-row gap-3">
      <GlassView
        glassEffectStyle="regular"
        className="flex-1 rounded-2xl p-4"
        accessibilityLabel={`Streak: ${streak} Tage`}
      >
        <Text className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Streak</Text>
        <Text className="text-foreground text-lg font-semibold mt-1">
          🔥 {streak} {streak === 1 ? 'Tag' : 'Tage'}
        </Text>
      </GlassView>

      <GlassView
        glassEffectStyle="regular"
        className="flex-1 rounded-2xl p-4"
        accessibilityLabel={goalReached ? 'Tagesziel erreicht' : `Noch ${formatMl(remaining)} bis zum Ziel`}
      >
        <Text className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Heute noch</Text>
        <Text className="text-foreground text-lg font-semibold mt-1">
          {goalReached ? '✅ Geschafft!' : formatMl(remaining)}
        </Text>
      </GlassView>
    </View>
  );
}
