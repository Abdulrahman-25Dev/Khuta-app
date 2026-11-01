import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import { colorScheme } from 'nativewind';

import {
  generateDailyTasks,
  getTaskDays,
  getTaskCoins,
  type Task,
} from '../src/utils/taskGenerator';
import { refreshTasksForToday, shiftDate } from '../src/utils/taskLifecycle';
import { getUserLevel } from '../src/utils/levelUtils';
import {
  calculateCalories,
  calculateDistanceKm,
  calculateStepLengthMeters,
} from '../src/utils/stepUtils';
import {
  handleDailyGoalReached,
  syncEveningReminder,
  cancelEveningReminder,
} from '../src/services/notificationService';
import {
  appThemes,
  defaultThemeId,
  defaultBannerId,
  defaultRingStyleId,
  ringStyles,
  offers,
  type AppTheme,
  type Offer,
  type OfferKind,
  type RingStyle,
} from '../src/data/storeCatalog';

const storage = createMMKV();

const getStoredCoins = () => storage.getNumber('khuta_coins') ?? 0;
const setStoredCoins = (value: number) => {
  storage.set('khuta_coins', value);
  return value;
};

const zustandStorage = {
  setItem: (name: string, value: string) => storage.set(name, value),
  getItem: (name: string) => storage.getString(name) ?? null,
  removeItem: (name: string) => storage.remove(name),
};

export type ThemeMode = 'dark' | 'light';
export type AccentColor = 'sunset' | 'forest' | 'ocean' | 'violet' | 'maroon';

// المصدر النشط الموحّد للون التمييز: إمّا مظهر من المتجر أو لون افتراضي.
// هذه الحالة الواحدة تتحكّم في الاسم واللون الظاهرين في كل شاشات التطبيق.
export type ActiveTheme =
  { kind: 'store'; themeId: string } | { kind: 'profile'; color: AccentColor };

// نتيجة حَلّ المظهر النشط: اسم ولون المصدر الحالي (متجر أو لون افتراضي)
export interface ResolvedTheme {
  id: string;
  name: string;
  accent: string;
  kind: ActiveTheme['kind'];
  isStoreTheme: boolean;
}

// ذاكرة مؤقتة للكائنات المُحلَّلة: إعادة نفس المرجع لنفس كائن activeTheme تُبقي
// مقارنة useShallow المتساوية فعّالة، وتمنع الحلقات اللانهائية في إعادة الرسم.
const resolvedThemeCache = new WeakMap<ActiveTheme, ResolvedTheme>();

// حَلّ المصدر النشط إلى قيم قابلة للاستهلاك (الاسم/اللون/النوع) دفعة واحدة
export const resolveActiveTheme = (activeTheme: ActiveTheme): ResolvedTheme => {
  const cached = resolvedThemeCache.get(activeTheme);
  if (cached) return cached;

  let resolved: ResolvedTheme;
  if (activeTheme.kind === 'store') {
    const theme =
      appThemes.find((t) => t.id === activeTheme.themeId) ?? appThemes[0];
    resolved = {
      id: theme.id,
      name: theme.name,
      accent: theme.accent,
      kind: 'store',
      isStoreTheme: true,
    };
  } else {
    const palette = colorPalettes[activeTheme.color];
    resolved = {
      id: activeTheme.color,
      name: palette.name,
      accent: palette.primary,
      kind: 'profile',
      isStoreTheme: false,
    };
  }

  resolvedThemeCache.set(activeTheme, resolved);
  return resolved;
};

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
  gender: 'male' | 'female';
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

export interface ActiveEffect {
  id: string;
  kind: OfferKind;
  expiresAt: number;
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
  activeEffects: ActiveEffect[];
  streakFreezes: number;
  frozenDays: string[];
  lastFreeClaimDate: string | null;
  ownedOffers: string[];
  applyEffect: (offer: Offer) => boolean;
  purchaseOffer: (offerId: string, price: number) => boolean;
  claimDailyFree: () => boolean;
  hasActiveEffect: (kind: string) => boolean;
  consumeStreakFreeze: (date?: string) => boolean;

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
        gender: 'male',
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
          const baseBalance = Math.max(getStoredCoins(), state.totalCoins);
          const multiplierActive = state.activeEffects.some(
            (effect) =>
              effect.kind === 'multiplier' && effect.expiresAt > Date.now()
          );
          const nextCoins =
            baseBalance + amount * (multiplierActive ? 2 : 1);
          setStoredCoins(nextCoins);
          return {
            totalCoins: nextCoins,
          };
        }),
      activeEffects: [],
      streakFreezes: 0,
      frozenDays: [],
      lastFreeClaimDate: null,
      ownedOffers: [],
      hasActiveEffect: (kind) =>
        get().activeEffects.some(
          (effect) => effect.kind === kind && effect.expiresAt > Date.now()
        ),
      applyEffect: (offer) => {
        const catalogOffer = offers.find((item) => item.id === offer.id);
        if (
          !catalogOffer ||
          (catalogOffer.kind !== 'multiplier' &&
            catalogOffer.kind !== 'goal-reduce')
        ) {
          return false;
        }

        const state = get();
        const now = Date.now();
        if (
          Math.max(getStoredCoins(), state.totalCoins) < catalogOffer.price ||
          state.activeEffects.some(
            (effect) =>
              effect.kind === catalogOffer.kind && effect.expiresAt > now
          )
        ) {
          return false;
        }

        const duration =
          catalogOffer.id === 'multiplier-7d'
            ? 7 * 24 * 60 * 60 * 1000
            : 24 * 60 * 60 * 1000;
        const newCoins =
          Math.max(getStoredCoins(), state.totalCoins) - catalogOffer.price;
        setStoredCoins(newCoins);
        set({
          totalCoins: newCoins,
          ownedOffers: [...state.ownedOffers, catalogOffer.id],
          activeEffects: [
            ...state.activeEffects.filter((effect) => effect.expiresAt > now),
            {
              id: catalogOffer.id,
              kind: catalogOffer.kind,
              expiresAt: now + duration,
            },
          ],
        });
        return true;
      },
      purchaseOffer: (offerId, price) => {
        const catalogOffer = offers.find((item) => item.id === offerId);
        if (
          !catalogOffer ||
          catalogOffer.price !== price ||
          (catalogOffer.kind !== 'coin-box' &&
            catalogOffer.kind !== 'streak-freeze')
        ) {
          return false;
        }

        const state = get();
        const balance = Math.max(getStoredCoins(), state.totalCoins);
        if (balance < catalogOffer.price) return false;

        const newCoins =
          balance -
          catalogOffer.price +
          (catalogOffer.kind === 'coin-box' ? catalogOffer.value : 0);
        setStoredCoins(newCoins);
        set({
          totalCoins: newCoins,
          ownedOffers: [
            ...state.ownedOffers,
            ...(catalogOffer.kind === 'streak-freeze'
              ? Array.from({ length: catalogOffer.value }, () => catalogOffer.id)
              : [catalogOffer.id]),
          ],
          streakFreezes:
            state.streakFreezes +
            (catalogOffer.kind === 'streak-freeze' ? catalogOffer.value : 0),
        });
        return true;
      },
      claimDailyFree: () => {
        const state = get();
        const today = getTodayKey();
        if (state.lastFreeClaimDate === today) return false;

        const reward = offers.find((offer) => offer.kind === 'daily-free');
        if (!reward) return false;

        const newCoins =
          Math.max(getStoredCoins(), state.totalCoins) + reward.value;
        setStoredCoins(newCoins);
        set({ totalCoins: newCoins, lastFreeClaimDate: today });
        return true;
      },
      consumeStreakFreeze: (date = getTodayKey()) => {
        const state = get();
        if (state.streakFreezes <= 0 || state.frozenDays.includes(date)) {
          return false;
        }

        const freezeIndex = state.ownedOffers.findIndex(
          (id) =>
            offers.find((offer) => offer.id === id)?.kind === 'streak-freeze'
        );
        const ownedOffers = [...state.ownedOffers];
        if (freezeIndex !== -1) ownedOffers.splice(freezeIndex, 1);
        set({
          streakFreezes: state.streakFreezes - 1,
          ownedOffers,
          frozenDays: [...state.frozenDays, date],
        });
        return true;
      },

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
          const stepLengthMeters = calculateStepLengthMeters(
            state.user.height,
            state.user.gender
          );
          const calculatedLog = {
            ...newLog,
            distance: calculateDistanceKm(newLog.steps, stepLengthMeters),
            calories: calculateCalories(newLog.steps, state.user.weight),
          };
          const userGoal = state.user.dailyGoal;
          const existingIndex = state.history.findIndex(
            (item) => item.date === calculatedLog.date
          );
          const existingLog =
            existingIndex >= 0 ? state.history[existingIndex] : undefined;
          const isCurrentDay = calculatedLog.date === getTodayKey();
          const goalReductionActive =
            isCurrentDay &&
            state.activeEffects.some(
              (effect) =>
                effect.kind === 'goal-reduce' &&
                effect.expiresAt > Date.now()
            );
          const effectiveGoal = goalReductionActive
            ? userGoal * 0.7
            : userGoal;
          const isGoalMet =
            calculatedLog.steps >= effectiveGoal ||
            (!isCurrentDay && (existingLog?.goalReached ?? false));
          const wasGoalMet =
            existingLog?.goalReached ?? false;

          let updatedHistory = [...state.history];

          if (existingIndex >= 0) {
            // تحديث سجّل اليوم الحالي
            updatedHistory[existingIndex] = {
              ...calculatedLog,
              goalReached: isGoalMet,
            };
          } else {
            // إضافة سجل ليوم جديد
            updatedHistory.push({
              ...calculatedLog,
              goalReached: isGoalMet,
            });
          }

          // Trigger 1: لحظة انتقال تقدم اليوم إلى 100% نُطلق إشعاراً عالياً فورياً
          // (مرة واحدة في اليوم) ونُلغي تذكير مساء نفس اليوم.
          if (
            !wasGoalMet &&
            isGoalMet &&
            calculatedLog.date === getTodayKey()
          ) {
            void handleDailyGoalReached({
              notificationsEnabled: state.notificationsEnabled,
              todayKey: calculatedLog.date,
            });
          }

          return { history: updatedHistory };
        }),

      // إغلاق اليوم: تثبيت سجل اليوم ثم تقدم التاريخ. رصيد العملات (totalCoins)
      // يبقى كما هو ولا يُعدَّل نهائياً هنا.
      finalizeDay: (newLog) => {
        const user = get().user;
        const stepLengthMeters = calculateStepLengthMeters(
          user.height,
          user.gender
        );
        get().addOrUpdateDailyLog({
          ...newLog,
          distance: calculateDistanceKm(newLog.steps, stepLengthMeters),
          calories: calculateCalories(newLog.steps, user.weight),
        });
        const finalizedLog = get().history.find(
          (log) => log.date === newLog.date
        );
        if (!finalizedLog?.goalReached) {
          get().consumeStreakFreeze(newLog.date);
        }
        let missedDate = shiftDate(newLog.date, 1);
        const today = getTodayKey();
        while (missedDate < today && get().streakFreezes > 0) {
          get().consumeStreakFreeze(missedDate);
          missedDate = shiftDate(missedDate, 1);
        }
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
          const nextTasks = refreshTasksForToday(
            state.dailyTasks,
            today,
            userLevel
          );

          return {
            lastResetDate: today,
            tasksDate: today,
            dailyTasks: nextTasks,
          };
        }),
      updateTaskProgress: (taskId, newProgress, todayKey, todayValue) =>
        set((state) => ({
          dailyTasks: state.dailyTasks.map((task) => {
            if (task.id !== taskId) return task;
            const dailyProgress = { ...task.dailyProgress };
            dailyProgress[todayKey] = Math.max(
              dailyProgress[todayKey] ?? 0,
              todayValue
            );
            return { ...task, progress: newProgress, dailyProgress };
          }),
        })),
      completeTask: (taskId) =>
        set((state) => {
          const task = state.dailyTasks.find((t) => t.id === taskId);
          if (!task || task.completed) return {};
          const previousCoins = Math.max(getStoredCoins(), state.totalCoins);
          const multiplierActive = state.activeEffects.some(
            (effect) =>
              effect.kind === 'multiplier' && effect.expiresAt > Date.now()
          );
          const newCoins =
            previousCoins + task.coins * (multiplierActive ? 2 : 1);
          setStoredCoins(newCoins);
          const today = getTodayKey();
          const totalSteps = state.history.reduce(
            (sum, log) => sum + log.steps,
            0
          );
          const userLevel = getUserLevel(totalSteps).level;
          const completedTasks = state.dailyTasks.map((currentTask) =>
            currentTask.id === taskId
              ? { ...currentTask, completed: true }
              : currentTask
          );
          return {
            totalCoins: newCoins,
            dailyTasks: refreshTasksForToday(completedTasks, today, userLevel),
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
        if (!colorPalettes[color]) return;
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
      version: 10,
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
        activeEffects: state.activeEffects,
        streakFreezes: state.streakFreezes,
        frozenDays: state.frozenDays,
        lastFreeClaimDate: state.lastFreeClaimDate,
        ownedOffers: state.ownedOffers,
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
            gender: 'male',
            dailyGoal: 5000,
          },
          streakDays: 0,
          totalCoins: 0,
          activeEffects: [],
          streakFreezes: 0,
          frozenDays: [],
          lastFreeClaimDate: null,
          ownedOffers: [],
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
        const migrateRingStyleId = (id: string) =>
          id === 'hourglass-ring' ? 'spiral-ring' : id;
        // لا نطلب من fallback أن يغطي رصيد العملات: أي رصيد مخزّن مُسبقاً يُحفظ.
        return {
          ...fallback,
          ...rest,
          user: {
            ...fallback.user,
            ...(persisted.user ?? {}),
            gender: persisted.user?.gender ?? 'male',
          },
          // الحقل الموحّد الجديد هو مصدر الحقيقة، ويحلّ مكان الحقلين القديمين
          activeTheme: legacyActiveTheme,
          activeRingStyle: migrateRingStyleId(
            persisted.activeRingStyle ?? defaultRingStyleId
          ),
          ownedRingStyles: (
            persisted.ownedRingStyles ?? fallback.ownedRingStyles
          ).map(migrateRingStyleId),
          activeEffects: persisted.activeEffects ?? [],
          streakFreezes:
            persisted.streakFreezes ??
            (persisted.ownedOffers ?? []).filter(
              (id) =>
                offers.find((offer) => offer.id === id)?.kind ===
                'streak-freeze'
            ).length,
          frozenDays: persisted.frozenDays ?? [],
          lastFreeClaimDate: persisted.lastFreeClaimDate ?? null,
          ownedOffers: persisted.ownedOffers ?? [],
          // ضمان مطابقة الإطار الزمني والمكافآت للمهام المحفوظة مع القواعد الحالية
          dailyTasks: migratedTasks,
        } as AppState;
      },
    }
  )
);
