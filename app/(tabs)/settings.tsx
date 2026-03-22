import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Switch,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWaterData } from '@/hooks/useWaterData';
import { useNotifications } from '@/hooks/useNotifications';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { formatMl } from '@/utils/dateHelpers';

interface StepperProps {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  formatValue?: (v: number) => string;
  isDark: boolean;
}

function Stepper({ value, onDecrement, onIncrement, formatValue, isDark }: StepperProps) {
  const textPrimary = isDark ? colors.dark.textPrimary : colors.textPrimary;
  const borderCol = isDark ? colors.dark.border : colors.border;

  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={onDecrement}
        style={[styles.stepperBtn, { borderColor: borderCol }]}
        accessibilityLabel="Verringern"
        accessibilityRole="button"
      >
        <Text style={[typography.metricMedium, { color: colors.primary }]}>−</Text>
      </Pressable>
      <Text style={[typography.body, { color: textPrimary, minWidth: 60, textAlign: 'center' }]}>
        {formatValue ? formatValue(value) : String(value)}
      </Text>
      <Pressable
        onPress={onIncrement}
        style={[styles.stepperBtn, { borderColor: borderCol }]}
        accessibilityLabel="Erhoehen"
        accessibilityRole="button"
      >
        <Text style={[typography.metricMedium, { color: colors.primary }]}>+</Text>
      </Pressable>
    </View>
  );
}

interface RowProps {
  label: string;
  subtitle?: string;
  right?: React.ReactNode;
  isDark: boolean;
  destructive?: boolean;
  onPress?: () => void;
}

function Row({ label, subtitle, right, isDark, destructive, onPress }: RowProps) {
  const textPrimary = isDark ? colors.dark.textPrimary : colors.textPrimary;
  const textSecondary = isDark ? colors.dark.textSecondary : colors.textSecondary;

  const inner = (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={[typography.body, { color: destructive ? '#E53935' : textPrimary }]}>
          {label}
        </Text>
        {subtitle ? (
          <Text style={[typography.label, { color: textSecondary, marginTop: 2 }]}>{subtitle}</Text>
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
  isDark: boolean;
}

function Section({ title, children, isDark }: SectionProps) {
  const textSecondary = isDark ? colors.dark.textSecondary : colors.textSecondary;
  const cardBg = isDark ? colors.dark.backgroundSecondary : colors.backgroundSecondary;
  const borderCol = isDark ? colors.dark.border : colors.border;

  return (
    <View style={styles.section}>
      <Text style={[typography.sectionTitle, { color: textSecondary, marginBottom: spacing.sm }]}>
        {title}
      </Text>
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        {React.Children.map(children, (child, i) => (
          <>
            {child}
            {i < React.Children.count(children) - 1 && (
              <View style={[styles.divider, { backgroundColor: borderCol }]} />
            )}
          </>
        ))}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { settings, updateSettings, resetAllData, isLoading } = useWaterData();
  const { enableReminders, disableReminders, updateSchedule } = useNotifications();

  const bgColor = isDark ? colors.dark.background : colors.background;
  const textPrimary = isDark ? colors.dark.textPrimary : colors.textPrimary;

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
        if (granted) {
          updateSettings({ reminderEnabled: true });
        }
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
      'Alle Daten zuruecksetzen?',
      'Deine gesamte Trinkhistorie und Einstellungen werden unwiderruflich geloescht.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Zuruecksetzen',
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
          },
        },
      ]
    );
  }, [resetAllData]);

  const formatInterval = (v: number) => {
    if (v < 1) return '30 min';
    return `${v}h`;
  };

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
        <Text style={[typography.screenTitle, { color: textPrimary, marginBottom: spacing.xl }]}>
          Einstellungen
        </Text>

        {/* Tagesziel */}
        <Section title="Tagesziel" isDark={isDark}>
          <Row
            label="Tagesziel"
            subtitle="Empfohlen: 2.0L"
            isDark={isDark}
            right={
              <Stepper
                value={settings.goalMl}
                onDecrement={() => handleGoalChange(-250)}
                onIncrement={() => handleGoalChange(250)}
                formatValue={formatMl}
                isDark={isDark}
              />
            }
          />
        </Section>

        {/* Erinnerungen */}
        <Section title="Erinnerungen" isDark={isDark}>
          <Row
            label="Erinnerungen"
            subtitle="Push-Benachrichtigungen"
            isDark={isDark}
            right={
              <Switch
                value={settings.reminderEnabled}
                onValueChange={handleReminderToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
                accessibilityLabel="Erinnerungen aktivieren"
              />
            }
          />
          <Row
            label="Intervall"
            subtitle="Wie oft erinnern?"
            isDark={isDark}
            right={
              <Stepper
                value={settings.reminderIntervalHours}
                onDecrement={() => handleIntervalChange(-0.5)}
                onIncrement={() => handleIntervalChange(0.5)}
                formatValue={formatInterval}
                isDark={isDark}
              />
            }
          />
          <Row
            label="Nicht stoeren"
            subtitle={`${settings.doNotDisturbFrom} – ${settings.doNotDisturbTo}`}
            isDark={isDark}
            right={
              <Switch
                value={settings.doNotDisturbEnabled}
                onValueChange={handleDndToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
                accessibilityLabel="Nicht stoeren aktivieren"
              />
            }
          />
        </Section>

        {/* Becher */}
        <Section title="Becher" isDark={isDark}>
          <Row
            label="Standardgroesse"
            subtitle="Schnellzugabe (mittlerer Button)"
            isDark={isDark}
            right={
              <Stepper
                value={settings.customCupSizeMl}
                onDecrement={() => handleCupChange(-50)}
                onIncrement={() => handleCupChange(50)}
                formatValue={formatMl}
                isDark={isDark}
              />
            }
          />
        </Section>

        {/* Daten */}
        <Section title="Daten" isDark={isDark}>
          <Row
            label="Alle Daten zuruecksetzen"
            isDark={isDark}
            destructive
            onPress={handleReset}
          />
        </Section>
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
  section: {
    marginBottom: spacing.xl,
  },
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.lg,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.circle,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
