import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import { colorScheme } from 'nativewind';

const storage = createMMKV();

const zustandStorage = {
  setItem: (name: string, value: string) => storage.set(name, value),
  getItem: (name: string) => storage.getString(name) ?? null,
  removeItem: (name: string) => storage.remove(name),
};

export type ThemeMode = 'dark' | 'light';
export type AccentColor = 'sunset' | 'forest' | 'ocean' | 'violet' | 'maroon';

export const getTodayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

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

// 1. تعريف بنية السجل اليومي
export interface DailyLog {
  date: string; // صيغة YYYY-MM-DD
  steps: number;
  distance: number;
  calories: number;
  durationSeconds: number;
  goalReached: boolean;
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

  lastActiveDate: string;
  setLastActiveDate: (date: string) => void;

  // 2. حالة السجل ودوال التحديث
  history: DailyLog[];
  addOrUpdateDailyLog: (log: Omit<DailyLog, 'goalReached'>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      themeMode: 'dark',
      accentColor: 'sunset',

      toggleTheme: () => {
        const next = get().themeMode === 'dark' ? 'light' : 'dark';
        colorScheme.set(next);
        set({ themeMode: next });
      },
      setTheme: (mode) => {
        colorScheme.set(mode);
        set({ themeMode: mode });
      },
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

      lastActiveDate: getTodayKey(),
      setLastActiveDate: (date) => set({ lastActiveDate: date }),

      // 3. القيمة الافتراضية ودالة تحديث السجل
      history: [],
      addOrUpdateDailyLog: (newLog) =>
        set((state) => {
          const userGoal = state.user.dailyGoal;
          const isGoalMet = newLog.steps >= userGoal;
          const existingIndex = state.history.findIndex(
            (item) => item.date === newLog.date
          );

          let updatedHistory = [...state.history];

          if (existingIndex >= 0) {
            // تحديث سجّل اليوم الحالي
            updatedHistory[existingIndex] = {
              ...newLog,
              goalReached: isGoalMet,
            };
          } else {
            // إضافة سجل ليوم جديد
            updatedHistory.push({
              ...newLog,
              goalReached: isGoalMet,
            });
          }

          return { history: updatedHistory };
        }),
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
          lastActiveDate: getTodayKey(),
          history: [],
        };
        return { ...fallback, ...persisted } as AppState;
      },
    }
  )
);