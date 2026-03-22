import { Tabs } from 'expo-router';
import React from 'react';
import { useColorScheme, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

export default function TabLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const activeColor = colors.primary;
  const inactiveColor = isDark ? colors.dark.textSecondary : colors.textSecondary;
  const bgColor = isDark ? colors.dark.background : colors.background;
  const borderColor = isDark ? colors.dark.border : colors.border;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor: bgColor,
          borderTopColor: borderColor,
          borderTopWidth: 0.5,
          elevation: Platform.OS === 'android' ? 4 : 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Heute',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'water' : 'water-outline'} size={24} color={color} />
          ),
          tabBarAccessibilityLabel: 'Heute',
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Verlauf',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'bar-chart' : 'bar-chart-outline'} size={24} color={color} />
          ),
          tabBarAccessibilityLabel: 'Verlauf',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Einstellungen',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={24} color={color} />
          ),
          tabBarAccessibilityLabel: 'Einstellungen',
        }}
      />
    </Tabs>
  );
}
