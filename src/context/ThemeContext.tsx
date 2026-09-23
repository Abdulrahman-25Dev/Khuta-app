import { createContext, useContext, type ReactNode } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useAppStore } from '../../store/useAppStore';
import { appThemes } from '../data/storeCatalog';

export interface AppThemeState {
  isDark: boolean;
  mode: 'dark' | 'light';
  bg: string;
  card: string;
  border: string;
  text: string;
  subText: string;
  accent: string;
}

const DARK_PALETTE = {
  bg: '#0F172A',
  card: '#1E293B',
  border: '#334155',
  text: '#F0F6FC',
  subText: '#8B949E',
};

const LIGHT_PALETTE = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  subText: '#64748B',
};

const ThemeContext = createContext<AppThemeState | null>(null);

// حالة موحّدة ذرّية: وضع العرض + لوحة الألوان الكاملة تُشتق من نفس القراءة
// للمتجر وتُمرَّر للأطفال في نفس اطار الرندر فلا يتأخر لون عن الآخر.
const selectThemeState = (s: {
  themeMode: 'dark' | 'light';
  currentThemeId: string;
}): AppThemeState => {
  const isDark = s.themeMode === 'dark';
  const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;
  const theme = appThemes.find((t) => t.id === s.currentThemeId) ?? appThemes[0];
  return {
    isDark,
    mode: s.themeMode,
    bg: palette.bg,
    card: palette.card,
    border: palette.border,
    text: palette.text,
    subText: palette.subText,
    accent: theme.accent,
  };
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useAppStore(useShallow(selectThemeState));
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): AppThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}