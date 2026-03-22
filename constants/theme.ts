export const colors = {
  primary: '#1D9E75',
  primaryLight: '#9FE1CB',
  primaryBg: '#E1F5EE',
  primaryDark: '#0F6E56',

  background: '#FFFFFF',
  backgroundSecondary: '#F5F5F5',

  textPrimary: '#1A1A1A',
  textSecondary: '#888888',
  textTertiary: '#BBBBBB',

  border: 'rgba(0,0,0,0.12)',
  white: '#FFFFFF',

  dark: {
    background: '#121212',
    backgroundSecondary: '#1E1E1E',
    textPrimary: '#F0F0F0',
    textSecondary: '#999999',
    border: 'rgba(255,255,255,0.12)',
  },
};

export const typography = {
  screenTitle: { fontSize: 22, fontWeight: '600' as const },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  label: { fontSize: 12, fontWeight: '400' as const },
  small: { fontSize: 10, fontWeight: '400' as const },
  metricLarge: { fontSize: 28, fontWeight: '600' as const },
  metricMedium: { fontSize: 18, fontWeight: '500' as const },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 10,
  lg: 16,
  pill: 24,
  circle: 9999,
};
