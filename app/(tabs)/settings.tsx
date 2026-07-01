import React, { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  Pressable,
  Alert,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWaterData } from '@/hooks/useWaterData';
import { useNotifications } from '@/hooks/useNotifications';
import { colors } from '@/constants/theme';
import { formatMl } from '@/utils/dateHelpers';
import { GlassView } from '@/components/ui/liquid-glass';

interface StepperProps {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  formatValue?: (v: number) => string;
}

function Stepper({ value, onDecrement, onIncrement, formatValue }: StepperProps) {
  return (
    <View className="flex-row items-center gap-2">
      <Pressable
        onPress={onDecrement}
        accessibilityLabel="Verringern"
        accessibilityRole="button"
      >
        <GlassView glassEffectStyle="regular" isInteractive className="w-8 h-8 rounded-full items-center justify-center">
          <Text className="text-primary text-lg font-semibold">−</Text>
        </GlassView>
      </Pressable>
      <Text className="text-foreground min-w-[60px] text-center text-sm">
        {formatValue ? formatValue(value) : String(value)}
      </Text>
      <Pressable
        onPress={onIncrement}
        accessibilityLabel="Erhöhen"
        accessibilityRole="button"
      >
        <GlassView glassEffectStyle="regular" isInteractive className="w-8 h-8 rounded-full items-center justify-center">
          <Text className="text-primary text-lg font-semibold">+</Text>
        </GlassView>
      </Pressable>
    </View>
  );
}

interface RowProps {
  label: string;
  subtitle?: string;
  right?: React.ReactNode;
  destructive?: boolean;
  onPress?: () => void;
}

function Row({ label, subtitle, right, destructive, onPress }: RowProps) {
  const inner = (
    <View style={styles.row}>
      <View className="flex-1">
        <Text className={`text-sm${destructive ? ' text-destructive' : ' text-foreground'}`}>
          {label}
        </Text>
        {subtitle ? (
          <Text className="text-xs text-muted-foreground mt-0.5">{subtitle}</Text>
        ) : null}
      </View>
      {right}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
        {inner}
      </Pressable>
    );
  }
  return inner;
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <View className="mb-6">
      <Text className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2 px-1">
        {title}
      </Text>
      <GlassView glassEffectStyle="regular" className="rounded-2xl overflow-hidden">
        {React.Children.map(children, (child, i) => (
          <>
            {child}
            {i < React.Children.count(children) - 1 && (
              <View className="h-px bg-border/50 ml-4" />
            )}
          </>
        ))}
      </GlassView>
    </View>
  );
}

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { settings, updateSettings, resetAllData, reload, isLoading } = useWaterData();

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const { enableReminders, disableReminders, updateSchedule } = useNotifications();

  const handleGoalChange = useCallback(
    (delta: number) => {
      const next = Math.max(500, Math.min(5000, settings.goalMl + delta));
      updateSettings({ goalMl: next });
    },
    [settings.goalMl, updateSettings]
  );

  const handleCupChange = useCallback(
    (delta: number) => {
      const next = Math.max(50, Math.min(1000, settings.customCupSizeMl + delta));
      updateSettings({ customCupSizeMl: next });
    },
    [settings.customCupSizeMl, updateSettings]
  );

  const handleIntervalChange = useCallback(
    (delta: number) => {
      const next = Math.max(0.5, Math.min(8, settings.reminderIntervalHours + delta));
      updateSettings({ reminderIntervalHours: next }).then(() =>
        updateSchedule({ ...settings, reminderIntervalHours: next })
      );
    },
    [settings, updateSettings, updateSchedule]
  );

  const handleReminderToggle = useCallback(
    async (value: boolean) => {
      if (value) {
        const granted = await enableReminders({ ...settings, reminderEnabled: true });
        if (granted) updateSettings({ reminderEnabled: true });
      } else {
        await disableReminders();
        updateSettings({ reminderEnabled: false });
      }
    },
    [settings, enableReminders, disableReminders, updateSettings]
  );

  const handleDndToggle = useCallback(
    (value: boolean) => {
      updateSettings({ doNotDisturbEnabled: value }).then(() =>
        updateSchedule({ ...settings, doNotDisturbEnabled: value })
      );
    },
    [settings, updateSettings, updateSchedule]
  );

  const handleReset = useCallback(() => {
    Alert.alert(
      'Alle Daten zurücksetzen?',
      'Deine gesamte Trinkhistorie und Einstellungen werden unwiderruflich gelöscht.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Zurücksetzen', style: 'destructive', onPress: async () => { await resetAllData(); } },
      ]
    );
  }, [resetAllData]);

  const formatInterval = (v: number) => (v < 1 ? '30 min' : `${v}h`);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={isDark ? colors.dark.primary : colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-foreground text-2xl font-semibold mb-6">Einstellungen</Text>

        <Section title="Tagesziel">
          <Row
            label="Tagesziel"
            subtitle="Empfohlen: 2.0L"
            right={
              <Stepper
                value={settings.goalMl}
                onDecrement={() => handleGoalChange(-250)}
                onIncrement={() => handleGoalChange(250)}
                formatValue={formatMl}
              />
            }
          />
        </Section>

        <Section title="Erinnerungen">
          <Row
            label="Erinnerungen"
            subtitle="Push-Benachrichtigungen"
            right={
              <Switch
                value={settings.reminderEnabled}
                onValueChange={handleReminderToggle}
                trackColor={{ false: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)', true: isDark ? colors.dark.primary : colors.primary }}
                thumbColor="#fff"
                accessibilityLabel="Erinnerungen aktivieren"
              />
            }
          />
          <Row
            label="Intervall"
            subtitle="Wie oft erinnern?"
            right={
              <Stepper
                value={settings.reminderIntervalHours}
                onDecrement={() => handleIntervalChange(-0.5)}
                onIncrement={() => handleIntervalChange(0.5)}
                formatValue={formatInterval}
              />
            }
          />
          <Row
            label="Nicht stören"
            subtitle={`${settings.doNotDisturbFrom} – ${settings.doNotDisturbTo}`}
            right={
              <Switch
                value={settings.doNotDisturbEnabled}
                onValueChange={handleDndToggle}
                trackColor={{ false: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)', true: isDark ? colors.dark.primary : colors.primary }}
                thumbColor="#fff"
                accessibilityLabel="Nicht stören aktivieren"
              />
            }
          />
        </Section>

        <Section title="Becher">
          <Row
            label="Standardgröße"
            subtitle="Schnellzugabe (mittlerer Button)"
            right={
              <Stepper
                value={settings.customCupSizeMl}
                onDecrement={() => handleCupChange(-50)}
                onIncrement={() => handleCupChange(50)}
                formatValue={formatMl}
              />
            }
          />
        </Section>

        <Section title="Daten">
          <Row label="Alle Daten zurücksetzen" destructive onPress={handleReset} />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
});
