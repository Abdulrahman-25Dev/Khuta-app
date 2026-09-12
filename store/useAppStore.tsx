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

// لوحات الألوان بمسميات متوافقة مع tailwind.config.js
export const colorPalettes = {
  sunset: {
    name: 'الغروب (Sunset)',
    primary: '#EA6113',
    secondary: '#FB8931',
    bg: '#0B0F19',
    card: '#1A1A2E',
    border: '#27293D',
    text: '#FFE3B3',
    subtext: '#8A8F9E',
  },
  forest: {
    name: 'الغابة (Forest)',
    primary: '#8AA33A',
    secondary: '#D9D06A',
    bg: '#121A0F',
    card: '#1C2817',
    border: '#2D3E25',
    text: '#FAEDBD',
    subtext: '#7C8A71',
  },
  ocean: {
    name: 'المحيط (Ocean)',
    primary: '#48CBE4',
    secondary: '#0277B6',
    bg: '#03045E',
    card: '#070A80',
    border: '#0E13AD',
    text: '#CBF0F8',
    subtext: '#6A8EAE',
  },
  violet: {
    name: 'البنفسجي (Violet Dusk)',
    primary: '#935073',
    secondary: '#F6DBC0',
    bg: '#1A0D1B',
    card: '#2B162D',
    border: '#502D55',
    text: '#F8F4E9',
    subtext: '#98819E',
  },
  maroon: {
    name: 'العنابي (Maroon)',
    primary: '#A41D2A',
    secondary: '#8F101D',
    bg: '#1A0507',
    card: '#2A070B',
    border: '#5C000A',
    text: '#FAD4D8',
    subtext: '#A67378',
  },
};

interface UserProfile {
  name: string;
  weight: number;
  height: number;
  dailyGoal: number;
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
    }
  )
);