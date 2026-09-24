import { createContext, useContext, type ReactNode } from 'react';
import { useShallow } from 'zustand/react/shallow';

import {
  useAppStore,
  resolveActiveTheme,
  type ActiveTheme,
  type ResolvedTheme,
} from '../../store/useAppStore';

export interface AppThemeState {
  isDark: boolean;
  isDarkMode: boolean;
  mode: 'dark' | 'light';
  // المظهر النشط الموحّد (اسم / لون / نوع المصدر) المشتق من activeTheme
  theme: ResolvedTheme;
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

// حالة موحّدة ذرّية: وضع العرض + المظهر النشط + لوحة الألوان الكاملة تُشتق من نفس
// قراءة المتجر وتُمرَّر للأطفال في نفس إطار الرندر، فلا يتأخر لون عن الآخر أثناء
// التبديل بين الفاتح والداكن أو بين مظاهر المتجر والألوان الافتراضية.
const selectThemeState = (s: {
  themeMode: 'dark' | 'light';
  activeTheme: ActiveTheme;
}): AppThemeState => {
  const isDark = s.themeMode === 'dark';
  const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;
  const theme = resolveActiveTheme(s.activeTheme);
  return {
    isDark,
    isDarkMode: isDark,
    mode: s.themeMode,
    theme,
    bg: palette.bg,
    card: palette.card,
    border: palette.border,
    text: palette.text,
    subText: palette.subText,
    accent: theme.accent,
  };
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  // useShallow يضمن عودة كائن جديد فقط عند تغيّر أحد الألوان فعلياً
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