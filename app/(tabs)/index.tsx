import React, { useState, useRef, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Animated,
  Alert,
  TextInput,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWaterData } from '@/hooks/useWaterData';
import { ProgressRing } from '@/components/ProgressRing';
import { QuickAddButton } from '@/components/QuickAddButton';
import { StreakCard } from '@/components/StreakCard';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { formatDisplayDate, getGreeting, getTodayString } from '@/utils/dateHelpers';

export default function HomeScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { todayData, settings, streak, addWater, reload, isLoading } = useWaterData();

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(20)).current;
  const [toastText, setToastText] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bgColor = isDark ? colors.dark.background : colors.background;
  const textPrimary = isDark ? colors.dark.textPrimary : colors.textPrimary;
  const textSecondary = isDark ? colors.dark.textSecondary : colors.textSecondary;

  const showToast = useCallback(
    (text: string) => {
      setToastText(text);
      if (toastTimer.current) clearTimeout(toastTimer.current);

      Animated.parallel([
        Animated.timing(toastOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(toastTranslateY, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();

      toastTimer.current = setTimeout(() => {
        Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(
          () => {
            toastTranslateY.setValue(20);
          }
        );
      }, 1800);
    },
    [toastOpacity, toastTranslateY]
  );

  const handleAdd = useCallback(
    async (ml: number) => {
      await addWater(ml);
      showToast(`+${ml}ml hinzugefügt!`);
    },
    [addWater, showToast]
  );

  const handleCustomAdd = useCallback(() => {
    const ml = parseInt(customAmount, 10);
    if (!ml || ml <= 0 || ml > 5000) {
      Alert.alert('Ungültige Menge', 'Bitte gib eine Menge zwischen 1 und 5000 ml ein.');
      return;
    }
    setCustomModalVisible(false);
    setCustomAmount('');
    handleAdd(ml);
  }, [customAmount, handleAdd]);

  const goalReached = todayData.totalMl >= settings.goalMl;
  const remaining = Math.max(settings.goalMl - todayData.totalMl, 0);
  const today = getTodayString();

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
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { backgroundColor: bgColor }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[typography.screenTitle, { color: textPrimary }]}>{getGreeting()}</Text>
          <Text style={[typography.body, { color: textSecondary, marginTop: spacing.xs }]}>
            {formatDisplayDate(today)}
          </Text>
        </View>

        {/* Progress Ring */}
        <View style={styles.ringContainer}>
          <ProgressRing currentMl={todayData.totalMl} goalMl={settings.goalMl} />
        </View>

        {/* Quick Add Buttons */}
        <View style={styles.quickButtonsRow}>
          <QuickAddButton
            label="+150ml"
            onPress={() => handleAdd(150)}
            accessibilityLabel="150 ml hinzufügen"
          />
          <QuickAddButton
            label={`+${settings.customCupSizeMl}ml`}
            onPress={() => handleAdd(settings.customCupSizeMl)}
            accessibilityLabel={`${settings.customCupSizeMl} ml hinzufügen`}
          />
          <QuickAddButton
            label="+500ml"
            onPress={() => handleAdd(500)}
            accessibilityLabel="500 ml hinzufügen"
          />
        </View>

        {/* Custom amount */}
        <Pressable
          onPress={() => setCustomModalVisible(true)}
          accessibilityLabel="Eigene Menge hinzufügen"
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.customButton,
            {
              backgroundColor: pressed ? colors.primaryBg : 'transparent',
              borderColor: pressed ? colors.primary : isDark ? colors.dark.border : colors.border,
            },
          ]}
        >
          <Text style={[typography.body, { color: colors.primary }]}>+ Eigene Menge</Text>
        </Pressable>

        {/* Streak & Info Cards */}
        <View style={styles.section}>
          <StreakCard streak={streak} remaining={remaining} goalReached={goalReached} />
        </View>
      </ScrollView>

      {/* Toast */}
      <Animated.View
        style={[
          styles.toast,
          {
            opacity: toastOpacity,
            transform: [{ translateY: toastTranslateY }],
            pointerEvents: 'none',
          },
        ]}
      >
        <Text style={[typography.body, { color: colors.primaryBg, fontWeight: '500' }]}>
          {toastText}
        </Text>
      </Animated.View>

      {/* Custom Amount Modal */}
      <Modal
        visible={customModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setCustomModalVisible(false)}
          accessibilityLabel="Modal schliessen"
        >
          <Pressable
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? colors.dark.backgroundSecondary : colors.background },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[typography.screenTitle, { color: textPrimary, marginBottom: spacing.lg }]}>
              Menge eingeben
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: textPrimary,
                  borderColor: isDark ? colors.dark.border : colors.border,
                  backgroundColor: isDark ? colors.dark.background : colors.backgroundSecondary,
                },
              ]}
              placeholder="Menge in ml"
              placeholderTextColor={textSecondary}
              keyboardType="numeric"
              value={customAmount}
              onChangeText={setCustomAmount}
              autoFocus
              accessibilityLabel="Menge in Millilitern"
            />
            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => {
                  setCustomModalVisible(false);
                  setCustomAmount('');
                }}
                style={[
                  styles.modalBtn,
                  { borderColor: isDark ? colors.dark.border : colors.border },
                ]}
                accessibilityLabel="Abbrechen"
                accessibilityRole="button"
              >
                <Text style={[typography.body, { color: textSecondary }]}>Abbrechen</Text>
              </Pressable>
              <Pressable
                onPress={handleCustomAdd}
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                accessibilityLabel="Menge hinzufügen"
                accessibilityRole="button"
              >
                <Text style={[typography.body, { color: colors.white, fontWeight: '600' }]}>
                  Hinzufügen
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  header: {
    marginBottom: spacing.xl,
  },
  ringContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  quickButtonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  customButton: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  toast: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  modalBtnPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
