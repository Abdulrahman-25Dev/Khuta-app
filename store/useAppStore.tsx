import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import { colorScheme } from 'nativewind';

import {
  generateDailyTasks,
  getTaskDays,
  getTaskCoins,
  Task,
} from '../src/utils/taskGenerator';
import { getUserLevel } from '../src/utils/levelUtils';
import {
  handleDailyGoalReached,
  syncEveningReminder,
  cancelEveningReminder,
} from '../src/services/notificationService';
import {
  defaultThemeId,
  defaultBannerId,
} from '../src/data/storeCatalog';

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

  // رصيد العملات: قيمة تراكمية عالمية لا علاقة لها بالخطوات اليومية.
  // تُحفظ دائماً ولا تُصفَّر أبداً، حتى عند إعادة ضبط خطوات اليوم عند منتصف الليل.
  totalCoins: number;
  addCoins: (amount: number) => void;

  lastActiveDate: string;
  setLastActiveDate: (date: string) => void;

  // 2. حالة السجل ودوال التحديث
  history: DailyLog[];
  addOrUpdateDailyLog: (log: Omit<DailyLog, 'goalReached'>) => void;
  // إغلاق اليوم عند منتصف الليل: يثبّت سجل اليوم ويدفع التاريخ، دون أي مساس برصيد العملات
  finalizeDay: (log: Omit<DailyLog, 'goalReached'>) => void;

  // 3. المهام اليومية الديناميكية
  dailyTasks: Task[];
  tasksDate: string;
  // تجديد المهام عند تغيّر التاريخ أو مستوى المستخدم
  refreshDailyTasks: () => void;
  // إنهاء مهمة وإضافة مكافأة العملات إليها
  completeTask: (taskId: string) => void;

  // تفضيل التحكم بالتنبيهات (إشعار إنجاز الهدف + تذكير المساء)
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;

  // متجر المظهر: مظهر التطبيق الحالي وخلفية البروفايل النشطة + المكتبات المملوكة
  currentThemeId: string;
  currentProfileBannerId: string;
  ownedThemes: string[];
  ownedProfileBanners: string[];
  // تطبيق مظهر/خلفية مملوك (بدون خصم عملات)
  applyTheme: (id: string) => void;
  applyProfileBanner: (id: string) => void;
  // شراء مظهر/خلفية: خصم العملات وإضافتها للمكتبة، وتُعيد true عند نجاح العملية
  purchaseTheme: (id: string, price: number) => boolean;
  purchaseProfileBanner: (id: string, price: number) => boolean;
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
      // التهيئة من النسخة الاحتياطية السابقة (khuta_coins) لضمان عدم فقدان الرصيد المتراكم
      totalCoins: storage.getNumber('khuta_coins') ?? 0,
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
          const wasGoalMet =
            existingIndex >= 0
              ? state.history[existingIndex].goalReached
              : false;

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

          // Trigger 1: لحظة انتقال تقدم اليوم إلى 100% نُطلق إشعاراً عالياً فورياً
          // (مرة واحدة في اليوم) ونُلغي تذكير مساء نفس اليوم.
          if (!wasGoalMet && isGoalMet && newLog.date === getTodayKey()) {
            void handleDailyGoalReached({
              notificationsEnabled: state.notificationsEnabled,
              todayKey: newLog.date,
            });
          }

          return { history: updatedHistory };
        }),

      // إغلاق اليوم: تثبيت سجل اليوم ثم تقدم التاريخ. رصيد العملات (totalCoins)
      // يبقى كما هو ولا يُعدَّل نهائياً هنا.
      finalizeDay: (newLog) => {
        get().addOrUpdateDailyLog(newLog);
        set({ lastActiveDate: getTodayKey() });
        get().refreshDailyTasks();
        // Trigger 2: بعد انقلاب التاريخ نُبقي جدولة تذكير المساء متزامنة (اليوم غير مكتمل بعد)
        void syncEveningReminder({
          goalMetToday: false,
          notificationsEnabled: get().notificationsEnabled,
          todayKey: getTodayKey(),
        });
      },

      // المهام اليومية: تُولَّد من تاريخ اليوم ومستوى المستخدم، وتظل ثابتة طوال اليوم
      dailyTasks: generateDailyTasks(getUserLevel(0).level, getTodayKey()),
      tasksDate: getTodayKey(),
      refreshDailyTasks: () =>
        set((state) => {
          const today = getTodayKey();
          if (state.tasksDate === today) return {};
          const totalSteps = state.history.reduce(
            (sum, log) => sum + log.steps,
            0
          );
          return {
            dailyTasks: generateDailyTasks(
              getUserLevel(totalSteps).level,
              today
            ),
            tasksDate: today,
          };
        }),
      completeTask: (taskId) =>
        set((state) => {
          const task = state.dailyTasks.find((t) => t.id === taskId);
          if (!task || task.completed) return {};
          const previousCoins =
            storage.getNumber('khuta_coins') ?? state.totalCoins;
          const newCoins = previousCoins + task.coins;
          storage.set('khuta_coins', newCoins);
          return {
            totalCoins: state.totalCoins + task.coins,
            dailyTasks: state.dailyTasks.map((t) =>
              t.id === taskId ? { ...t, completed: true } : t
            ),
          };
        }),

      // تفعيل/تعطيل التنبيهات + مزامنة جدولة تذكير المساء فوراً
      notificationsEnabled: true,
      setNotificationsEnabled: (enabled) => {
        set({ notificationsEnabled: enabled });
        const state = get();
        if (enabled) {
          const todayLog = state.history.find(
            (log) => log.date === getTodayKey()
          );
          void syncEveningReminder({
            goalMetToday: todayLog?.goalReached ?? false,
            notificationsEnabled: true,
            todayKey: getTodayKey(),
          });
} else {
            void cancelEveningReminder();
          }
        },

      // ————— متجر المظهر —————
      // المظهر وخلفية البروفايل الافتراضيان (المجانيان) مطبّقان ومملوكان منذ البداية
      currentThemeId: defaultThemeId,
      currentProfileBannerId: defaultBannerId,
      ownedThemes: [defaultThemeId],
      ownedProfileBanners: [defaultBannerId],
      applyTheme: (id) => set({ currentThemeId: id }),
      applyProfileBanner: (id) => set({ currentProfileBannerId: id }),
      purchaseTheme: (id, price) => {
        const state = get();
        if (state.ownedThemes.includes(id) || state.totalCoins < price) {
          return false;
        }
        const newCoins = state.totalCoins - price;
        // مزامنة رصيد العملات مع مخزن MMKV القديم (khuta_coins) كما يفعل completeTask
        storage.set('khuta_coins', newCoins);
        set({
          totalCoins: newCoins,
          ownedThemes: [...state.ownedThemes, id],
        });
        return true;
      },
      purchaseProfileBanner: (id, price) => {
        const state = get();
        if (
          state.ownedProfileBanners.includes(id) ||
          state.totalCoins < price
        ) {
          return false;
        }
        const newCoins = state.totalCoins - price;
        storage.set('khuta_coins', newCoins);
        set({
          totalCoins: newCoins,
          ownedProfileBanners: [...state.ownedProfileBanners, id],
        });
        return true;
      },
    }),
    {
      name: 'khuta-app-storage',
      storage: createJSONStorage(() => zustandStorage),
      version: 4,
      onRehydrateStorage: () => (state) => {
        state?.refreshDailyTasks();
      },
      // التخفيف: نحفظ بيانات الحالة الضرورية فقط، ومنها رصيد العملات (totalCoins)
      // لضمان بقاء الرصيد المتراكم محفوظاً عبر إعادة فتح التطبيق وعبر الأيام.
      partialize: (state) => ({
        themeMode: state.themeMode,
        accentColor: state.accentColor,
        user: state.user,
        streakDays: state.streakDays,
        totalCoins: state.totalCoins,
        lastActiveDate: state.lastActiveDate,
        history: state.history,
        dailyTasks: state.dailyTasks,
        tasksDate: state.tasksDate,
        notificationsEnabled: state.notificationsEnabled,
        currentThemeId: state.currentThemeId,
        currentProfileBannerId: state.currentProfileBannerId,
        ownedThemes: state.ownedThemes,
        ownedProfileBanners: state.ownedProfileBanners,
      }),
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
          dailyTasks: generateDailyTasks(getUserLevel(0).level, getTodayKey()),
          tasksDate: getTodayKey(),
          notificationsEnabled: true,
          currentThemeId: defaultThemeId,
          currentProfileBannerId: defaultBannerId,
          ownedThemes: [defaultThemeId],
          ownedProfileBanners: [defaultBannerId],
        };
        // لا نطلب من fallback أن يغطي رصيد العملات: أي رصيد مخزّن مُسبقاً يُحفظ.
        return {
          ...fallback,
          ...persisted,
          // ضمان مطابقة الإطار الزمني والمكافآت للمهام المحفوظة مع القواعد الحالية
          dailyTasks: (persisted.dailyTasks ?? fallback.dailyTasks).map(
            (task) => ({
              ...task,
              days: getTaskDays(task.type, task.target),
              coins: getTaskCoins(task.type, task.target),
            })
          ),
        } as AppState;
      },
    }
  )
);
