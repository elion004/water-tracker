import React, { useState, useRef, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View,
  Text,
  ScrollView,
  useColorScheme,
  Animated,
  Alert,
  TextInput,
  Modal,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWaterData } from '@/hooks/useWaterData';
import { ProgressRing } from '@/components/ProgressRing';
import { StreakCard } from '@/components/StreakCard';
import { colors } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { formatDisplayDate, getGreeting, getTodayString } from '@/utils/dateHelpers';
import { GlassView, GlassContainer } from '@/components/ui/liquid-glass';

export default function HomeScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { todayData, settings, streak, addWater, removeWater, reload, isLoading } = useWaterData();

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(20)).current;
  const [toastText, setToastText] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEntryRef = useRef<{ id: string; date: string } | null>(null);

  const hideToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(
      () => { toastTranslateY.setValue(20); }
    );
  }, [toastOpacity, toastTranslateY]);

  const showToast = useCallback((text: string) => {
    setToastText(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    Animated.parallel([
      Animated.timing(toastOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(toastTranslateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
    toastTimer.current = setTimeout(() => {
      hideToast();
      lastEntryRef.current = null;
    }, 2500);
  }, [toastOpacity, toastTranslateY, hideToast]);

  const handleUndo = useCallback(async () => {
    const last = lastEntryRef.current;
    if (!last) return;
    lastEntryRef.current = null;
    hideToast();
    await removeWater(last.date, last.id);
  }, [hideToast, removeWater]);

  const handleAdd = useCallback(async (ml: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const entry = await addWater(ml);
    lastEntryRef.current = { id: entry.id, date: getTodayString() };
    showToast(`+${ml}ml hinzugefügt!`);
  }, [addWater, showToast]);

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
  const quickAmounts = [150, settings.customCupSizeMl, 500];

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-foreground text-2xl font-semibold">{getGreeting()}</Text>
          <Text className="text-muted-foreground text-sm mt-1">{formatDisplayDate(today)}</Text>
        </View>

        {/* Progress Ring */}
        <View className="items-center mb-8">
          <ProgressRing currentMl={todayData.totalMl} goalMl={settings.goalMl} />
        </View>

        {/* Quick Add Buttons */}
        <GlassContainer spacing={4} className="rounded-3xl mb-3">
          <View className="flex-row gap-2 p-2">
            {quickAmounts.map((ml) => (
              <Pressable
                key={ml}
                className="flex-1"
                onPress={() => handleAdd(ml)}
                accessibilityLabel={`${ml} ml hinzufügen`}
                accessibilityRole="button"
              >
                <GlassView
                  glassEffectStyle="regular"
                  isInteractive
                  className="rounded-2xl py-5 items-center"
                >
                  <Text className="text-foreground font-semibold text-sm">+{ml}ml</Text>
                </GlassView>
              </Pressable>
            ))}
          </View>
        </GlassContainer>

        {/* Custom Amount */}
        <Pressable
          onPress={() => setCustomModalVisible(true)}
          className="mb-6"
          accessibilityLabel="Eigene Menge hinzufügen"
          accessibilityRole="button"
        >
          <GlassView glassEffectStyle="clear" isInteractive className="rounded-2xl py-4 items-center">
            <Text className="text-primary font-medium">+ Eigene Menge</Text>
          </GlassView>
        </Pressable>

        {/* Streak Cards */}
        <StreakCard streak={streak} remaining={remaining} goalReached={goalReached} />
      </ScrollView>

      {/* Toast */}
      <Animated.View
        style={[
          styles.toast,
          { opacity: toastOpacity, transform: [{ translateY: toastTranslateY }] },
        ]}
        pointerEvents="box-none"
      >
        <GlassView glassEffectStyle="regular" className="rounded-full px-6 py-3 flex-row items-center gap-4">
          <Text className="text-foreground font-medium">{toastText}</Text>
          <Pressable onPress={handleUndo} hitSlop={8}>
            <Text className="text-primary font-bold text-sm">Rückgängig</Text>
          </Pressable>
        </GlassView>
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
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.modalWrapper}>
            <GlassView glassEffectStyle="regular" className="rounded-3xl p-6 w-full">
              <Text className="text-foreground text-xl font-semibold mb-4">Menge eingeben</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: isDark ? '#F0F0F0' : '#1A1A1A',
                    borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  },
                ]}
                placeholder="Menge in ml"
                placeholderTextColor={isDark ? '#666' : '#999'}
                keyboardType="numeric"
                value={customAmount}
                onChangeText={setCustomAmount}
                autoFocus
                accessibilityLabel="Menge in Millilitern"
              />
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => { setCustomModalVisible(false); setCustomAmount(''); }}
                  className="flex-1"
                  accessibilityLabel="Abbrechen"
                  accessibilityRole="button"
                >
                  <GlassView glassEffectStyle="clear" isInteractive className="rounded-2xl py-3 items-center">
                    <Text className="text-muted-foreground font-medium">Abbrechen</Text>
                  </GlassView>
                </Pressable>
                <Pressable
                  onPress={handleCustomAdd}
                  className="flex-1"
                  accessibilityLabel="Menge hinzufügen"
                  accessibilityRole="button"
                >
                  <GlassView glassEffectStyle="regular" isInteractive className="rounded-2xl py-3 items-center bg-primary/20">
                    <Text className="text-primary font-semibold">Hinzufügen</Text>
                  </GlassView>
                </Pressable>
              </View>
            </GlassView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 100,
  },
  toast: {
    position: 'absolute',
    bottom: 88,
    alignSelf: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalWrapper: {
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
});
