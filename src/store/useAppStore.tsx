import {
  generateDailyTasks,
  getTaskDays,
  getTaskCoins,
  type Task,
} from '../utils/taskGenerator';
import { refreshTasksForToday, shiftDate } from '../utils/taskLifecycle';
import { getUserLevel } from '../utils/levelUtils';
import {
  handleDailyGoalReached,
  syncEveningReminder,
  cancelEveningReminder,
} from '../services/notificationService';
import {
  appThemes,
  defaultThemeId,
  defaultBannerId,
  defaultRingStyleId,
  ringStyles,
  type AppTheme,
  type RingStyle,
} from '../data/storeCatalog';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import { colorScheme } from 'nativewind';

const zustandStorage = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    storage.set(name, value);
  },
  removeItem: (name: string) => {
    storage.remove(name);
  },
};

const storage = createMMKV();

const getStoredCoins = () => storage.getNumber('khuta_coins') ?? 0;
const setStoredCoins = (amount: number) => storage.set('khuta_coins', amount);

export const getTodayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

type ThemeMode = 'light' | 'dark';

export type AccentColor = 'orange' | 'blue' | 'green' | 'purple' | 'pink';

export type ActiveTheme =
  { kind: 'profile'; color: AccentColor } | { kind: 'store'; themeId: string };

export interface UserProfile {
  name: string;
  weight: number;
  height: number;
  dailyGoal: number;
  image?: string | null;
}

export interface DailyLog {
  date: string;
  steps: number;
  distance: number;
  calories: number;
  durationSeconds: number;
  goalReached: boolean;
}

interface AppState {
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;

  user: UserProfile;
  updateUser: (newData: Partial<UserProfile>) => void;

  streakDays: number;

  // رصيد العملات: قيمة تراكمية عالمية لا علاقة لها بالخطوات اليومية.
  // تُحفظ دائماً ولا تُصفَّر أبداً، حتى عند إعادة ضبط خطوات اليوم عند منتصف الليل.
  totalCoins: number;
  addCoins: (amount: number) => void;

  lastActiveDate: string;
  lastResetDate: string;
  setLastActiveDate: (date: string) => void;
  resetDailyQuestProgress: () => void;

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
  updateTaskProgress: (
    taskId: string,
    newProgress: number,
    todayKey: string,
    todayValue: number
  ) => void;

  // تفضيل التحكم بالتنبيهات (إشعار إنجاز الهدف + تذكير المساء)
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;

  // متجر المظهر: المظهر الموحّد النشط + خلفية البروفايل النشطة + نمط العداد النشط + المكتبات المملوكة
  activeTheme: ActiveTheme;
  currentProfileBannerId: string;
  activeRingStyle: string;
  ownedThemes: string[];
  ownedProfileBanners: string[];
  ownedRingStyles: string[];
  // تطبيق مظهر من المتجر وإلغاء تفعيل أي لون افتراضي نشط
  selectStoreTheme: (theme: AppTheme | string) => void;
  // اختيار لون افتراضي: يُطبَّق لونه ويُلغى تفعيل أي مظهر من المتجر
  selectProfileTheme: (color: AccentColor) => void;
  // تطبيق نمط العداد المملوك
  selectRingStyle: (style: RingStyle | string) => void;
  // تطبيق خلفية بروفايل مملوكة (بدون خصم عملات)
  applyProfileBanner: (id: string) => void;
  // شراء مظهر/خلفية/نمط العداد: خصم العملات وإضافتها للمكتبة، وتُعيد true عند نجاح العملية
  purchaseTheme: (id: string, price: number) => boolean;
  purchaseProfileBanner: (id: string, price: number) => boolean;
  purchaseRingStyle: (id: string, price: number) => boolean;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      themeMode: 'dark',
      activeTheme: { kind: 'store', themeId: defaultThemeId },

      toggleTheme: () => {
        const next = get().themeMode === 'dark' ? 'light' : 'dark';
        colorScheme.set(next);
        set({ themeMode: next });
      },
      setTheme: (mode) => {
        colorScheme.set(mode);
        set({ themeMode: mode });
      },

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
      totalCoins: getStoredCoins(),
      addCoins: (amount) =>
        set((state) => {
          const baseBalance = getStoredCoins() ?? state.totalCoins;
          const nextCoins = baseBalance + amount;
          setStoredCoins(nextCoins);
          return {
            totalCoins: nextCoins,
          };
        }),

      lastActiveDate: getTodayKey(),
      lastResetDate: new Date().toISOString().split('T')[0],
      setLastActiveDate: (date) => set({ lastActiveDate: date }),
      resetDailyQuestProgress: () =>
        set((state) => {
          const currentDate = getTodayKey();
          if (state.lastResetDate === currentDate) return {};

          return { lastResetDate: currentDate };
        }),

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
          const totalSteps = state.history.reduce(
            (sum, log) => sum + log.steps,
            0
          );
          const userLevel = getUserLevel(totalSteps).level;
          const refreshed = refreshTasksForToday(
            state.dailyTasks,
            today,
            userLevel
          );

          return {
            lastResetDate: today,
            tasksDate: today,
            dailyTasks: refreshed,
          };
        }),
      updateTaskProgress: (taskId, newProgress, todayKey, todayValue) =>
        set((state) => ({
          dailyTasks: state.dailyTasks.map((task) => {
            if (task.id !== taskId) return task;
            const dailyProgress = { ...(task.dailyProgress || {}) };
            const oldToday = dailyProgress[todayKey] ?? 0;
            dailyProgress[todayKey] = Math.max(oldToday, todayValue);
            return {
              ...task,
              progress: newProgress,
              dailyProgress,
            };
          }),
        })),
      completeTask: (taskId) =>
        set((state) => {
          const task = state.dailyTasks.find((t) => t.id === taskId);
          if (!task || task.completed) return {};
          const previousCoins = getStoredCoins() ?? state.totalCoins;
          const newCoins = previousCoins + task.coins;
          setStoredCoins(newCoins);
          const today = getTodayKey();
          const totalSteps = state.history.reduce(
            (sum, log) => sum + log.steps,
            0
          );
          const userLevel = getUserLevel(totalSteps).level;
          const updatedTasks = state.dailyTasks.map((t) =>
            t.id === taskId ? { ...t, completed: true } : t
          );
          return {
            totalCoins: newCoins,
            dailyTasks: refreshTasksForToday(updatedTasks, today, userLevel),
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
      currentProfileBannerId: defaultBannerId,
      activeRingStyle: defaultRingStyleId,
      ownedThemes: [defaultThemeId],
      ownedProfileBanners: [defaultBannerId],
      ownedRingStyles: [defaultRingStyleId],
      // تطبيق مظهر من المتجر: يُثبّت المصدر النشط على مظهر المتجر،
      // فتُلغى تلقائياً أي علامة اختيار على الألوان الافتراضية في شاشة الملف.
      selectStoreTheme: (theme) => {
        const id = typeof theme === 'string' ? theme : theme.id;
        if (!appThemes.some((t) => t.id === id)) return;
        set({ activeTheme: { kind: 'store', themeId: id } });
      },
      // اختيار لون افتراضي: يُطبَّق لونه ويُطوى أي مظهر من المتجر (يُعتبر غير فعّال)
      selectProfileTheme: (color) => {
        // colorPalettes not defined in this file; just set the theme
        set({ activeTheme: { kind: 'profile', color } });
      },
      selectRingStyle: (style) => {
        const id = typeof style === 'string' ? style : style.id;
        if (!ringStyles.some((t) => t.id === id)) return;
        set({ activeRingStyle: id });
      },
      applyProfileBanner: (id) => set({ currentProfileBannerId: id }),
      purchaseTheme: (id, price) => {
        const state = get();
        if (state.ownedThemes.includes(id) || state.totalCoins < price) {
          return false;
        }
        const newCoins = getStoredCoins() - price;
        setStoredCoins(newCoins);
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
        const newCoins = getStoredCoins() - price;
        setStoredCoins(newCoins);
        set({
          totalCoins: newCoins,
          ownedProfileBanners: [...state.ownedProfileBanners, id],
        });
        return true;
      },
      purchaseRingStyle: (id, price) => {
        const state = get();
        if (state.ownedRingStyles.includes(id) || state.totalCoins < price) {
          return false;
        }
        const newCoins = getStoredCoins() - price;
        setStoredCoins(newCoins);
        set({
          totalCoins: newCoins,
          ownedRingStyles: [...state.ownedRingStyles, id],
        });
        return true;
      },
    }),
    {
      name: 'khuta-app-storage',
      storage: createJSONStorage(() => zustandStorage),
      version: 6,
      onRehydrateStorage: () => (state) => {
        state?.resetDailyQuestProgress();
        state?.refreshDailyTasks();
      },
      // التخفيف: نحفظ بيانات الحالة الضرورية فقط، ومنها رصيد العملات (totalCoins)
      // لضمان بقاء الرصيد المتراكم محفوظاً عبر إعادة فتح التطبيق وعبر الأيام.
      partialize: (state) => ({
        themeMode: state.themeMode,
        activeTheme: state.activeTheme,
        user: state.user,
        streakDays: state.streakDays,
        totalCoins: state.totalCoins,
        lastActiveDate: state.lastActiveDate,
        lastResetDate: state.lastResetDate,
        history: state.history,
        dailyTasks: state.dailyTasks,
        tasksDate: state.tasksDate,
        notificationsEnabled: state.notificationsEnabled,
        currentProfileBannerId: state.currentProfileBannerId,
        activeRingStyle: state.activeRingStyle,
        ownedThemes: state.ownedThemes,
        ownedProfileBanners: state.ownedProfileBanners,
        ownedRingStyles: state.ownedRingStyles,
      }),
      migrate: (persistedState, version) => {
        const persisted = (persistedState ?? {}) as Partial<AppState> & {
          currentThemeId?: string;
          accentColor?: AccentColor;
        };
        const fallback = {
          themeMode: 'dark' as ThemeMode,
          user: {
            name: 'عبدالرحمن',
            weight: 70,
            height: 160,
            dailyGoal: 5000,
          },
          streakDays: 0,
          totalCoins: 0,
          lastActiveDate: getTodayKey(),
          lastResetDate: new Date().toISOString().split('T')[0],
          history: [],
          dailyTasks: generateDailyTasks(getUserLevel(0).level, getTodayKey()),
          tasksDate: getTodayKey(),
          notificationsEnabled: true,
          activeTheme: {
            kind: 'store',
            themeId: defaultThemeId,
          } as ActiveTheme,
          currentProfileBannerId: defaultBannerId,
          activeRingStyle: defaultRingStyleId,
          ownedThemes: [defaultThemeId],
          ownedProfileBanners: [defaultBannerId],
          ownedRingStyles: [defaultRingStyleId],
        };
        // التوافق مع النسخ القديمة (التي خزّنت currentThemeId/accentColor منفصلين):
        // ننقل المظهر المطبّق إلى المصدر الموحّد activeTheme تلقائياً
        const legacyActiveTheme: ActiveTheme = persisted.activeTheme ?? {
          kind: 'store',
          themeId: persisted.currentThemeId ?? defaultThemeId,
        };
        // نستبعد الحقلين القديمين حتى لا يبقيا معلقين على حالة المتجر بعد الترحيل
        const {
          currentThemeId: _legacyThemeId,
          accentColor: _legacyAccentColor,
          ...rest
        } = persisted;
        const tasksDate = persisted.tasksDate ?? getTodayKey();
        const fallbackTitles: Record<Task['type'], string> = {
          steps: 'تحدي الخطوات',
          distance: 'تحدي المسافة',
          calories: 'تحدي السعرات',
          duration: 'وقت النشاط',
        };
        const fallbackUnits: Record<Task['type'], string> = {
          steps: 'خطوة',
          distance: 'كم',
          calories: 'سعرة',
          duration: 'دقيقة',
        };
        const migratedTasks: Task[] = (
          persisted.dailyTasks ?? fallback.dailyTasks
        ).map((task) => {
          const days = task.days ?? getTaskDays(task.type, task.target);
          const startDate = task.startDate ?? tasksDate;
          return {
            ...task,
            title: task.title ?? fallbackTitles[task.type],
            titleKey: task.titleKey ?? `tasks.types.${task.type}.title_0`,
            unit: task.unit ?? fallbackUnits[task.type],
            unitKey: task.unitKey ?? `tasks.types.${task.type}.unit`,
            days,
            coins: task.coins ?? getTaskCoins(task.type, task.target),
            startDate,
            expiresAt: task.expiresAt ?? shiftDate(startDate, days - 1),
            progress: version < 6 ? 0 : (task.progress ?? 0),
            dailyProgress: version < 6 ? {} : (task.dailyProgress ?? {}),
          };
        });
        // لا نطلب من fallback أن يغطي رصيد العملات: أي رصيد مخزّن مُسبقاً يُحفظ.
        return {
          ...fallback,
          ...rest,
          // الحقل الموحّد الجديد هو مصدر الحقيقة، ويحلّ مكان الحقلين القديمين
          activeTheme: legacyActiveTheme,
          dailyTasks: migratedTasks,
        } as AppState;
      },
    }
  )
);

export const colorPalettes: Record<
  AccentColor,
  { primary: string; secondary: string; glow: string }
> = {
  orange: {
    primary: '#FF7A2A',
    secondary: '#FF9B4A',
    glow: 'rgba(255,122,42,0.4)',
  },
  blue: {
    primary: '#4F9BFF',
    secondary: '#6BB3FF',
    glow: 'rgba(79,155,255,0.4)',
  },
  green: {
    primary: '#22C55E',
    secondary: '#4ADE80',
    glow: 'rgba(34,197,94,0.4)',
  },
  purple: {
    primary: '#A855F7',
    secondary: '#C084FC',
    glow: 'rgba(168,85,247,0.4)',
  },
  pink: {
    primary: '#EC4899',
    secondary: '#F472B6',
    glow: 'rgba(236,72,153,0.4)',
  },
};

export interface ResolvedTheme {
  mode: ThemeMode;
  accent: string;
  accentSecondary: string;
  accentGlow: string;
  card: string;
  background: string;
  border: string;
  text: string;
  subText: string;
  surface: string;
  isStoreTheme: boolean;
}

export const resolveActiveTheme = (
  activeTheme: ActiveTheme,
  mode: ThemeMode = 'dark'
): ResolvedTheme => {
  const isDark = mode === 'dark';
  if (activeTheme.kind === 'profile') {
    const palette = colorPalettes[activeTheme.color] || colorPalettes.orange;
    return {
      mode,
      accent: palette.primary,
      accentSecondary: palette.secondary,
      accentGlow: palette.glow,
      card: isDark ? '#1F1F1F' : '#FFFFFF',
      background: isDark ? '#121212' : '#F8F8F8',
      border: isDark ? '#2A2A2A' : '#E5E5E5',
      text: isDark ? '#FFFFFF' : '#111111',
      subText: isDark ? '#A1A1A1' : '#666666',
      surface: isDark ? '#1F1F1F' : '#FFFFFF',
      isStoreTheme: false,
    };
  }
  // For store themes, fall back to defaults
  return {
    mode,
    accent: '#FF7A2A',
    accentSecondary: '#FF9B4A',
    accentGlow: 'rgba(255,122,42,0.4)',
    card: isDark ? '#1F1F1F' : '#FFFFFF',
    background: isDark ? '#121212' : '#F8F8F8',
    border: isDark ? '#2A2A2A' : '#E5E5E5',
    text: isDark ? '#FFFFFF' : '#111111',
    subText: isDark ? '#A1A1A1' : '#666666',
    surface: isDark ? '#1F1F1F' : '#FFFFFF',
    isStoreTheme: true,
  };
};
