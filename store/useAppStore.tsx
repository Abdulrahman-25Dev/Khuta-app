import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV();

const zustandStorage = {
  setItem: (name: string, value: string) => storage.set(name, value),
  getItem: (name: string) => storage.getString(name) ?? null,
  removeItem: (name: string) => storage.remove(name),
};

export type ThemeMode = 'dark' | 'light';
export type AccentColor = 'sunset' | 'forest' | 'ocean' | 'violet' | 'maroon';

// ريشة ألوان الهوية فقط (تم استبعاد bg/card/text لأنها انتقلت لـ Tailwind)
export const colorPalettes = {
  sunset: {
    name: 'الغروب (Sunset)',
    primary: '#D96B27',
    secondary: '#E68A45',
  },
  forest: {
    name: 'الغابة (Forest)',
    primary: '#6E8B3D',
    secondary: '#94A657',
  },
  ocean: {
    name: 'المحيط (Ocean)',
    primary: '#3B82F6',
    secondary: '#60A5FA',
  },
  violet: {
    name: 'البنفسجي (Violet Dusk)',
    primary: '#8B5CF6',
    secondary: '#A78BFA',
  },
  maroon: {
    name: 'العنابي (Maroon)',
    primary: '#9F2B37',
    secondary: '#BD4350',
  },
};

interface UserProfile {
  name: string;
  weight: number;
  height: number;
  dailyGoal: number;
  image?: string;
}

interface AppState {
  themeMode: ThemeMode;
  accentColor: AccentColor;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;

  user: UserProfile;
  updateUser: (newData: Partial<UserProfile>) => void;

  streakDays: number;
  totalCoins: number;
  addCoins: (amount: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      themeMode: 'dark',
      accentColor: 'sunset',

      toggleTheme: () =>
        set((state) => ({
          themeMode: state.themeMode === 'dark' ? 'light' : 'dark',
        })),
      setTheme: (mode) => set({ themeMode: mode }),
      setAccentColor: (color) => set({ accentColor: color }),

      user: {
        name: 'عبدالرحمن',
        weight: 70,
        height: 160,
        dailyGoal: 5000,
      },
      updateUser: (newData) =>
        set((state) => ({
          user: { ...state.user, ...newData },
        })),

      streakDays: 0,
      totalCoins: 0,
      addCoins: (amount) =>
        set((state) => ({
          totalCoins: state.totalCoins + amount,
        })),
    }),
    {
      name: 'khuta-app-storage',
      storage: createJSONStorage(() => zustandStorage),
      version: 1,
      migrate: (persistedState) => {
        const persisted = (persistedState ?? {}) as Partial<AppState>;
        const fallback = {
          themeMode: 'dark' as ThemeMode,
          accentColor: 'sunset' as AccentColor,
          user: {
            name: 'عبدالرحمن',
            weight: 70,
            height: 160,
            dailyGoal: 5000,
          },
          streakDays: 0,
          totalCoins: 0,
        };
        return { ...fallback, ...persisted } as AppState;
      },
    }
  )
);