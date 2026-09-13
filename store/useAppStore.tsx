import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV();

const zustandStorage = {
  setItem: (name: string, value: string) => storage.set(name, value),
  getItem: (name: string) => storage.getString(name) ?? null,
  // MMKV v3+ يوفّر remove() (delete كان API قديم في v2)
  removeItem: (name: string) => storage.remove(name),
};

export type ThemeMode = 'dark' | 'light';
export type AccentColor = 'sunset' | 'forest' | 'ocean' | 'violet' | 'maroon';

export const colorPalettes = {
  sunset: {
    name: 'الغروب (Sunset)',
    primary: '#D96B27',
    secondary: '#E68A45',
    bg: '#0F121C',
    card: '#161B26',
    border: '#232A3B',
    text: '#F0E6DF',
    subtext: '#7A8499',
    light: {
      bg: '#FBF3EC',
      card: '#FFFFFF',
      border: '#F0DFD0',
      text: '#3E2A1B',
      subtext: '#8B7665',
    },
  },
  forest: {
    name: 'الغابة (Forest)',
    primary: '#6E8B3D',
    secondary: '#94A657',
    bg: '#0E140E',
    card: '#151E16',
    border: '#222E23',
    text: '#E2E8E2',
    subtext: '#738375',
    light: {
      bg: '#F3F7EC',
      card: '#FFFFFF',
      border: '#DCE7CD',
      text: '#2C3B1C',
      subtext: '#64715A',
    },
  },
  ocean: {
    name: 'المحيط (Ocean)',
    primary: '#3B82F6',
    secondary: '#60A5FA',
    bg: '#0D1117',
    card: '#161B22',
    border: '#21262D',
    text: '#F0F6FC',
    subtext: '#8B949E',
    light: {
      bg: '#F0F5FB',
      card: '#FFFFFF',
      border: '#D4E2F0',
      text: '#1F2E3D',
      subtext: '#5D7285',
    },
  },
  violet: {
    name: 'البنفسجي (Violet Dusk)',
    primary: '#8B5CF6',
    secondary: '#A78BFA',
    bg: '#120F1D',
    card: '#1A162B',
    border: '#292342',
    text: '#EDE9FE',
    subtext: '#7E789B',
    light: {
      bg: '#F5F2FB',
      card: '#FFFFFF',
      border: '#E1D8F0',
      text: '#2E2446',
      subtext: '#6F6590',
    },
  },
  maroon: {
    name: 'العنابي (Maroon)',
    primary: '#9F2B37',
    secondary: '#BD4350',
    bg: '#140D0F',
    card: '#1E1416',
    border: '#332125',
    text: '#F5E6E8',
    subtext: '#8F787B',
    light: {
      bg: '#FBF2F3',
      card: '#FFFFFF',
      border: '#F0D8DB',
      text: '#3B2226',
      subtext: '#7E666B',
    },
  },
};

interface UserProfile {
  name: string;
  weight: number;
  height: number;
  dailyGoal: number;
  image?: string; // رابط الصورة أو مسارها
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
      migrate: (persistedState, version) => {
        const persisted = (persistedState ?? {}) as Partial<AppState>;
        const fallback = {
          themeMode: 'dark' as ThemeMode,
          accentColor: 'violet' as AccentColor,
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