import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import { colorScheme } from 'nativewind';

import {
  calculateCalories,
  calculateDistanceKm,
  calculateStepLengthMeters,
} from '../src/utils/stepUtils';
import {
  handleDailyGoalReached,
  sendWaterGoalCompleteNotification,
  scheduleWaterReminders,
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

const shiftDate = (dateKey: string, days: number) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
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

export interface UserProfile {
  name: string;
  weight: number;
  height: number;
  gender: 'male' | 'female';
  dailyGoal: number;
  waterGoalCups: number;
  waterCupSizeMl: number;
  waterReminderStart: string;
  waterReminderEnd: string;
  waterReminderInterval: number;
  waterNotificationsEnabled: boolean;
  image?: string;
}

const getDefaultWaterGoalCups = (weight: number) =>
  Math.max(1, Math.round((weight * 35) / 250));

// 1. تعريف بنية السجل اليومي
export interface DailyLog {
  date: string; // صيغة YYYY-MM-DD
  steps: number;
  distance: number;
  calories: number;
  durationSeconds: number;
  goalReached: boolean;
  waterCups: number;
}

export interface ActiveEffect {
  id: string;
  kind: OfferKind;
  startedAt?: number;
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
  frozenDays: string[];
  lastFreeClaimDate: string | null;
  applyEffect: (offer: Offer) => boolean;
  claimDailyFree: () => boolean;
  hasActiveEffect: (kind: string) => boolean;
  consumeStreakFreeze: (date?: string) => boolean;

  lastActiveDate: string;
  lastGoalRewardDate: string | null;
  setLastActiveDate: (date: string) => void;

  // 2. حالة السجل ودوال التحديث
  history: DailyLog[];
  addOrUpdateDailyLog: (
    log: Omit<DailyLog, 'goalReached' | 'waterCups'> &
      Partial<Pick<DailyLog, 'waterCups'>>
  ) => void;
  // إغلاق اليوم عند منتصف الليل: يثبّت سجل اليوم ويدفع التاريخ، دون أي مساس برصيد العملات
  finalizeDay: (
    log: Omit<DailyLog, 'goalReached' | 'waterCups'> &
      Partial<Pick<DailyLog, 'waterCups'>>
  ) => void;
  addWaterCup: () => void;
  setWaterCups: (count: number) => void;

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
        waterGoalCups: getDefaultWaterGoalCups(70),
        waterCupSizeMl: 250,
        waterReminderStart: '08:00',
        waterReminderEnd: '22:00',
        waterReminderInterval: 60,
        waterNotificationsEnabled: true,
      },
      updateUser: (newData) => {
        const nextUser = { ...get().user, ...newData };
        set({ user: nextUser });
        if (
          newData.waterGoalCups !== undefined ||
          newData.waterCupSizeMl !== undefined ||
          newData.waterReminderStart !== undefined ||
          newData.waterReminderEnd !== undefined ||
          newData.waterReminderInterval !== undefined ||
          newData.waterNotificationsEnabled !== undefined
        ) {
          const todayLog = get().history.find(
            (log) => log.date === getTodayKey()
          );
          void scheduleWaterReminders({
            start: nextUser.waterReminderStart,
            end: nextUser.waterReminderEnd,
            interval: nextUser.waterReminderInterval,
            enabled: nextUser.waterNotificationsEnabled,
            goalReached: (todayLog?.waterCups ?? 0) >= nextUser.waterGoalCups,
          }).catch((error) => {
            console.error('Failed to reschedule water reminders:', error);
          });
        }
      },

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
      frozenDays: [],
      lastFreeClaimDate: null,
      hasActiveEffect: (kind) =>
        get().activeEffects.some(
          (effect) => effect.kind === kind && effect.expiresAt > Date.now()
        ),
      applyEffect: (offer) => {
        const catalogOffer = offers.find((item) => item.id === offer.id);
        if (
          !catalogOffer ||
          (catalogOffer.kind !== 'streak-freeze' &&
            catalogOffer.kind !== 'multiplier' &&
            catalogOffer.kind !== 'goal-reduce')
        ) {
          return false;
        }

        const state = get();
        const now = Date.now();
        const activeKindEffect = state.activeEffects.find(
          (effect) =>
            effect.kind === catalogOffer.kind && effect.expiresAt > now
        );
        if (
          Math.max(getStoredCoins(), state.totalCoins) < catalogOffer.price ||
          activeKindEffect
        ) {
          return false;
        }

        const day = 24 * 60 * 60 * 1000;
        const duration =
          catalogOffer.kind === 'streak-freeze'
            ? catalogOffer.value * day
            : catalogOffer.id === 'multiplier-7d'
              ? 7 * day
              : day;
        const newCoins =
          Math.max(getStoredCoins(), state.totalCoins) - catalogOffer.price;
        setStoredCoins(newCoins);
        set({
          totalCoins: newCoins,
          activeEffects: [
            ...state.activeEffects.filter((effect) => effect.expiresAt > now),
            {
              id: catalogOffer.id,
              kind: catalogOffer.kind,
              startedAt: now,
              expiresAt: now + duration,
            },
          ],
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
        if (state.frozenDays.includes(date)) return false;

        const dayStart = new Date(`${date}T00:00:00`).getTime();
        if (!Number.isFinite(dayStart)) return false;
        const dayEnd = dayStart + 24 * 60 * 60 * 1000;
        const freezeIndex = state.activeEffects.findIndex((effect) => {
          if (effect.kind !== 'streak-freeze') return false;
          const offer = offers.find((item) => item.id === effect.id);
          const startedAt =
            effect.startedAt ??
            effect.expiresAt - (offer?.value ?? 1) * 24 * 60 * 60 * 1000;
          return startedAt < dayEnd && effect.expiresAt > dayStart;
        });
        if (freezeIndex === -1) return false;

        const activeEffects = [...state.activeEffects];
        activeEffects.splice(freezeIndex, 1);
        set({
          activeEffects,
          frozenDays: [...state.frozenDays, date],
        });
        return true;
      },

      lastActiveDate: getTodayKey(),
      lastGoalRewardDate: null,
      setLastActiveDate: (date) => set({ lastActiveDate: date }),

      // 3. القيمة الافتراضية ودالة تحديث السجل
      history: [],
      addOrUpdateDailyLog: (newLog) =>
        set((state) => {
          const existingIndex = state.history.findIndex(
            (item) => item.date === newLog.date
          );
          const existingLog =
            existingIndex >= 0 ? state.history[existingIndex] : undefined;
          const stepLengthMeters = calculateStepLengthMeters(
            state.user.height,
            state.user.gender
          );
          const calculatedLog = {
            ...newLog,
            distance: calculateDistanceKm(newLog.steps, stepLengthMeters),
            calories: calculateCalories(newLog.steps, state.user.weight),
            waterCups: newLog.waterCups ?? existingLog?.waterCups ?? 0,
          };
          const userGoal = state.user.dailyGoal;
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
          const wasGoalMet = existingLog?.goalReached ?? false;

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

          if (
            !isCurrentDay ||
            !isGoalMet ||
            state.lastGoalRewardDate === calculatedLog.date
          ) {
            return { history: updatedHistory };
          }

          const totalCoins =
            Math.max(getStoredCoins(), state.totalCoins) + 100;
          setStoredCoins(totalCoins);
          return {
            history: updatedHistory,
            totalCoins,
            lastGoalRewardDate: calculatedLog.date,
          };
        }),

      addWaterCup: () => {
        const todayLog = get().history.find(
          (log) => log.date === getTodayKey()
        );
        get().setWaterCups((todayLog?.waterCups ?? 0) + 1);
      },
      setWaterCups: (count) => {
        if (!Number.isFinite(count)) {
          throw new RangeError('Water cup count must be a finite number.');
        }

        const state = get();
        const today = getTodayKey();
        const todayIndex = state.history.findIndex((log) => log.date === today);
        const existingLog =
          todayIndex >= 0 ? state.history[todayIndex] : undefined;
        const previousCount = existingLog?.waterCups ?? 0;
        const waterCups = Math.max(0, Math.floor(count));
        const wasGoalReached = previousCount >= state.user.waterGoalCups;
        const isGoalReached = waterCups >= state.user.waterGoalCups;
        const todayLog: DailyLog = {
          date: today,
          steps: existingLog?.steps ?? 0,
          distance: existingLog?.distance ?? 0,
          calories: existingLog?.calories ?? 0,
          durationSeconds: existingLog?.durationSeconds ?? 0,
          goalReached: existingLog?.goalReached ?? false,
          waterCups,
        };
        const history = [...state.history];
        if (todayIndex >= 0) history[todayIndex] = todayLog;
        else history.push(todayLog);
        set({ history });

        if (!wasGoalReached && isGoalReached) {
          void sendWaterGoalCompleteNotification().catch((error) => {
            console.error('Failed to send water goal notification:', error);
          });
        }
        if (wasGoalReached !== isGoalReached) {
          void scheduleWaterReminders({
            start: state.user.waterReminderStart,
            end: state.user.waterReminderEnd,
            interval: state.user.waterReminderInterval,
            enabled: state.user.waterNotificationsEnabled,
            goalReached: isGoalReached,
          }).catch((error) => {
            console.error('Failed to update water reminder message:', error);
          });
        }
      },

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
        while (missedDate < today) {
          get().consumeStreakFreeze(missedDate);
          missedDate = shiftDate(missedDate, 1);
        }
        set({ lastActiveDate: getTodayKey() });
        // Trigger 2: بعد انقلاب التاريخ نُبقي جدولة تذكير المساء متزامنة (اليوم غير مكتمل بعد)
        void syncEveningReminder({
          goalMetToday: false,
          notificationsEnabled: get().notificationsEnabled,
          todayKey: getTodayKey(),
        });
      },

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
      version: 12,
      // التخفيف: نحفظ بيانات الحالة الضرورية فقط، ومنها رصيد العملات (totalCoins)
      // لضمان بقاء الرصيد المتراكم محفوظاً عبر إعادة فتح التطبيق وعبر الأيام.
      partialize: (state) => ({
        themeMode: state.themeMode,
        activeTheme: state.activeTheme,
        user: state.user,
        streakDays: state.streakDays,
        totalCoins: state.totalCoins,
        activeEffects: state.activeEffects,
        frozenDays: state.frozenDays,
        lastFreeClaimDate: state.lastFreeClaimDate,
        lastActiveDate: state.lastActiveDate,
        lastGoalRewardDate: state.lastGoalRewardDate,
        history: state.history,
        notificationsEnabled: state.notificationsEnabled,
        currentProfileBannerId: state.currentProfileBannerId,
        activeRingStyle: state.activeRingStyle,
        ownedThemes: state.ownedThemes,
        ownedProfileBanners: state.ownedProfileBanners,
        ownedRingStyles: state.ownedRingStyles,
      }),
      migrate: (persistedState) => {
        const persisted = (persistedState ?? {}) as Partial<AppState> & {
          currentThemeId?: string;
          accentColor?: AccentColor;
          streakFreezes?: number;
          ownedOffers?: string[];
          dailyTasks?: unknown;
          tasksDate?: string;
          lastResetDate?: string;
        };
        const fallback = {
          themeMode: 'dark' as ThemeMode,
          user: {
            name: 'عبدالرحمن',
            weight: 70,
            height: 160,
            gender: 'male',
            dailyGoal: 5000,
            waterGoalCups: getDefaultWaterGoalCups(70),
            waterCupSizeMl: 250,
            waterReminderStart: '08:00',
            waterReminderEnd: '22:00',
            waterReminderInterval: 60,
            waterNotificationsEnabled: true,
          },
          streakDays: 0,
          totalCoins: 0,
          activeEffects: [],
          frozenDays: [],
          lastFreeClaimDate: null,
          lastActiveDate: getTodayKey(),
          lastGoalRewardDate: null,
          history: [],
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
          streakFreezes: _legacyStreakFreezes,
          ownedOffers: _legacyOwnedOffers,
          dailyTasks: _legacyDailyTasks,
          tasksDate: _legacyTasksDate,
          lastResetDate: _legacyLastResetDate,
          ...rest
        } = persisted;
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
            waterGoalCups:
              persisted.user?.waterGoalCups ??
              getDefaultWaterGoalCups(persisted.user?.weight ?? fallback.user.weight),
            waterCupSizeMl: persisted.user?.waterCupSizeMl ?? 250,
            waterReminderStart: persisted.user?.waterReminderStart ?? '08:00',
            waterReminderEnd: persisted.user?.waterReminderEnd ?? '22:00',
            waterReminderInterval:
              persisted.user?.waterReminderInterval ?? 60,
            waterNotificationsEnabled:
              persisted.user?.waterNotificationsEnabled ?? true,
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
          frozenDays: persisted.frozenDays ?? [],
          lastFreeClaimDate: persisted.lastFreeClaimDate ?? null,
          lastGoalRewardDate: persisted.lastGoalRewardDate ?? null,
          history: (persisted.history ?? []).map((log) => ({
            ...log,
            waterCups: log.waterCups ?? 0,
          })),
        } as AppState;
      },
    }
  )
);
