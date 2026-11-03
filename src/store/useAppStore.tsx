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
  offers,
  type AppTheme,
  type Offer,
  type OfferKind,
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

export interface ActiveEffect {
  id: string;
  kind: OfferKind;
  value: number;
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

  lastActiveDate: string;
  setLastActiveDate: (date: string) => void;

  // 2. حالة السجل ودوال التحديث
  history: DailyLog[];
  addOrUpdateDailyLog: (log: Omit<DailyLog, 'goalReached'>) => void;
  // إغلاق اليوم عند منتصف الليل: يثبّت سجل اليوم ويدفع التاريخ، دون أي مساس برصيد العملات
  finalizeDay: (log: Omit<DailyLog, 'goalReached'>) => void;

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
  activeEffects: ActiveEffect[];
  lastFreeClaimDate: string | null;
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
  hasActiveEffect: (kind: OfferKind) => boolean;
  applyEffect: (offer: Offer) => boolean;
  purchaseOffer: (offerId: string, price: number) => boolean;
  claimDailyFree: () => boolean;
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
      activeEffects: [],
      lastFreeClaimDate: null,
      hasActiveEffect: (kind) =>
        get().activeEffects.some(
          (effect) => effect.kind === kind && effect.expiresAt > Date.now()
        ),
      applyEffect: (offer) => {
        const catalogOffer = offers.find((item) => item.id === offer.id);
        if (
          !catalogOffer ||
          !['streak-freeze', 'multiplier', 'goal-reduce'].includes(
            catalogOffer.kind
          )
        ) {
          return false;
        }

        const state = get();
        const now = Date.now();
        if (
          state.totalCoins < catalogOffer.price ||
          state.activeEffects.some(
            (effect) =>
              effect.kind === catalogOffer.kind && effect.expiresAt > now
          )
        ) {
          return false;
        }

        const day = 24 * 60 * 60 * 1000;
        const duration =
          catalogOffer.kind === 'streak-freeze'
            ? catalogOffer.value * day
            : catalogOffer.kind === 'multiplier' &&
                catalogOffer.id === 'multiplier-7d'
              ? 7 * day
              : day;
        const newCoins = state.totalCoins - catalogOffer.price;
        setStoredCoins(newCoins);
        set({
          totalCoins: newCoins,
          activeEffects: [
            ...state.activeEffects.filter((effect) => effect.expiresAt > now),
            {
              id: catalogOffer.id,
              kind: catalogOffer.kind,
              value: catalogOffer.value,
              expiresAt: now + duration,
            },
          ],
        });
        return true;
      },
      purchaseOffer: (offerId, price) => {
        const catalogOffer = offers.find((item) => item.id === offerId);
        const state = get();
        if (
          !catalogOffer ||
          catalogOffer.kind === 'daily-free' ||
          catalogOffer.kind === 'streak-freeze' ||
          catalogOffer.kind === 'multiplier' ||
          catalogOffer.kind === 'goal-reduce' ||
          catalogOffer.price !== price ||
          state.totalCoins < price
        ) {
          return false;
        }

        const newCoins = state.totalCoins - price;
        setStoredCoins(newCoins);
        set({ totalCoins: newCoins });
        return true;
      },
      claimDailyFree: () => {
        const state = get();
        const today = getTodayKey();
        const dailyOffer = offers.find((offer) => offer.kind === 'daily-free');
        if (!dailyOffer || state.lastFreeClaimDate === today) return false;

        const newCoins = state.totalCoins + dailyOffer.value;
        setStoredCoins(newCoins);
        set({ totalCoins: newCoins, lastFreeClaimDate: today });
        return true;
      },
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
      version: 7,
      // التخفيف: نحفظ بيانات الحالة الضرورية فقط، ومنها رصيد العملات (totalCoins)
      // لضمان بقاء الرصيد المتراكم محفوظاً عبر إعادة فتح التطبيق وعبر الأيام.
      partialize: (state) => ({
        themeMode: state.themeMode,
        activeTheme: state.activeTheme,
        user: state.user,
        streakDays: state.streakDays,
        totalCoins: state.totalCoins,
        lastActiveDate: state.lastActiveDate,
        history: state.history,
        notificationsEnabled: state.notificationsEnabled,
        currentProfileBannerId: state.currentProfileBannerId,
        activeRingStyle: state.activeRingStyle,
        ownedThemes: state.ownedThemes,
        ownedProfileBanners: state.ownedProfileBanners,
        ownedRingStyles: state.ownedRingStyles,
        activeEffects: state.activeEffects,
        lastFreeClaimDate: state.lastFreeClaimDate,
      }),
      migrate: (persistedState) => {
        const persisted = (persistedState ?? {}) as Partial<AppState> & {
          currentThemeId?: string;
          accentColor?: AccentColor;
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
            dailyGoal: 5000,
          },
          streakDays: 0,
          totalCoins: 0,
          lastActiveDate: getTodayKey(),
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
          activeEffects: [],
          lastFreeClaimDate: null,
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
          dailyTasks: _legacyDailyTasks,
          tasksDate: _legacyTasksDate,
          lastResetDate: _legacyLastResetDate,
          ...rest
        } = persisted;
        // لا نطلب من fallback أن يغطي رصيد العملات: أي رصيد مخزّن مُسبقاً يُحفظ.
        return {
          ...fallback,
          ...rest,
          // الحقل الموحّد الجديد هو مصدر الحقيقة، ويحلّ مكان الحقلين القديمين
          activeTheme: legacyActiveTheme,
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
