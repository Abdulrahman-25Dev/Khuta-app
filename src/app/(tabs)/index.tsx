import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Text,
  View,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  AppState,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Flame,
  MapPin,
  Clock,
  Footprints,
  Coins,
  Play,
  Pause,
} from 'lucide-react-native';
import { Pedometer } from 'expo-sensors';

import { useAppStore, getTodayKey } from '../../../store/useAppStore';
import { useTheme } from '../../context/ThemeContext';
import { ringStyles } from '../../data/storeCatalog';
import { storage } from '../../utils/storage';
import { applyStepCoins } from '../../services/coinService';
import DailyTasksList from '../../components/DailyTasksList';
import ProgressRing from '../../components/ProgressRing';
import {
  calculateCalories,
  calculateDistanceKm,
  calculateStepLengthMeters,
} from '../../utils/stepUtils';

type PedometerStatusKey =
  | 'home.notAvailable'
  | 'home.permissionRequired'
  | 'home.sensorError';

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { user, addCoins, totalCoins, activeRingStyle } = useAppStore();
  const isMultiplierActive = useAppStore((state) =>
    state.hasActiveEffect('multiplier')
  );
  const isGoalReductionActive = useAppStore((state) =>
    state.hasActiveEffect('goal-reduce')
  );
  const rowDirection =
    i18n.dir() === 'rtl' ? 'flex-row-reverse' : 'flex-row';
  // كامل الألوان من السياق الذرّي في نفس إطار القراءة (لا انفصال بين الخلفية والكروت)
  const { isDarkMode, accent, bg, card, border, text, subText } = useTheme();
  const selectedRingStyle =
    ringStyles.find((style) => style.id === activeRingStyle) ?? ringStyles[0];

  const [steps, setSteps] = useState<number>(
    () => storage.getNumber('daily_steps') ?? 0
  );
  const baseGoal = user?.dailyGoal ?? 5000;
  const goal = isGoalReductionActive
    ? Math.ceil(baseGoal * 0.7)
    : baseGoal;

  // حالة مؤقت الجلسة
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(
    () => storage.getNumber('workout_seconds') ?? 0
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStart = useRef<number | null>(null);

  // مراجع للقيم الحية لتفادي الإغلاقات القديمة (stale closures)
  const stepsRef = useRef<number>(steps);
  const sessionBaseRef = useRef<number>(0);
  const sessionStepsRef = useRef<number>(0);
  const lastTotalRef = useRef<number | null>(null);
  const secondsElapsedRef = useRef<number>(
    storage.getNumber('workout_seconds') ?? 0
  );
  const ensureCurrentDayRef = useRef<() => void>(() => {});

  const stepLengthMeters = calculateStepLengthMeters(user.height, user.gender);
  const distanceKm = calculateDistanceKm(steps, stepLengthMeters);
  const calories = calculateCalories(steps, user.weight);

  // إدارة مؤقت الثواني
  useEffect(() => {
    if (isTracking) {
      timerRef.current = setInterval(() => {
        if (sessionStart.current === null) return;
        const elapsed = Math.floor((Date.now() - sessionStart.current) / 1000);
        secondsElapsedRef.current = elapsed;
        setSecondsElapsed(elapsed);
        storage.set('workout_seconds', elapsed);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isTracking]);

  // إنهاء يوم اليوم السابق: تثبيت سجله النهائي وتصفير عدادات اليوم الجديد
  const finalizeDay = useCallback(() => {
    const store = useAppStore.getState();
    const finalSteps = stepsRef.current;
    const finalStepLengthMeters = calculateStepLengthMeters(
      store.user.height,
      store.user.gender
    );
    const finalDistance = calculateDistanceKm(
      finalSteps,
      finalStepLengthMeters
    );
    const finalCalories = calculateCalories(finalSteps, store.user.weight);

    // إنهاء اليوم عبر دالة المتجر: تثبّت السجل وتُقدّم التاريخ، ولا تمسّ رصيد العملات أبداً
    store.finalizeDay({
      date: store.lastActiveDate,
      steps: finalSteps,
      distance: finalDistance,
      calories: finalCalories,
      durationSeconds: secondsElapsedRef.current,
    });

    sessionStart.current = sessionStart.current !== null ? Date.now() : null;
    secondsElapsedRef.current = 0;
    setSecondsElapsed(0);
    storage.set('workout_seconds', 0);

    stepsRef.current = 0;
    setSteps(0);
    storage.set('daily_steps', 0);

    sessionBaseRef.current = 0;
    sessionStepsRef.current = 0;
  }, []);

  // التحقق من تجاوز منتصف الليل وتشغيل تصفير اليوم عند تغيّر التاريخ
  const ensureCurrentDay = useCallback(() => {
    if (getTodayKey() !== useAppStore.getState().lastActiveDate) {
      finalizeDay();
    }
  }, [finalizeDay]);
  useEffect(() => {
    ensureCurrentDayRef.current = ensureCurrentDay;
  }, [ensureCurrentDay]);

  // مزامنة سجل اليوم مباشرة مع المتجر باستخدام مفتاح تاريخ اليوم الحالي
  const syncDailyLog = (currentSteps: number) => {
    const currentUser = useAppStore.getState().user;
    const currentStepLengthMeters = calculateStepLengthMeters(
      currentUser.height,
      currentUser.gender
    );
    useAppStore.getState().addOrUpdateDailyLog({
      date: getTodayKey(),
      steps: currentSteps,
      distance: calculateDistanceKm(currentSteps, currentStepLengthMeters),
      calories: calculateCalories(currentSteps, currentUser.weight),
      durationSeconds: secondsElapsedRef.current,
    });
  };

  // إعادة التحقق من التاريخ عند كل عودة للتطبيق إلى المقدمة
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        ensureCurrentDayRef.current();
        if (sessionStart.current !== null) {
          const elapsed = Math.floor(
            (Date.now() - sessionStart.current) / 1000
          );
          secondsElapsedRef.current = elapsed;
          setSecondsElapsed(elapsed);
          storage.set('workout_seconds', elapsed);
        }
      }
    });
    return () => subscription.remove();
  }, []);

  // تنسيق الوقت إلى (MM:SS) أو (HH:MM:SS) عند تجاوز الساعة
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return hrs > 0
      ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
      : `${pad(mins)}:${pad(secs)}`;
  };

  // تتبع حساس الخطوات
  const [pedometerStatus, setPedometerStatus] =
    useState<PedometerStatusKey | null>(null);
  const pedometerSubscription = useRef<Pedometer.Subscription | null>(null);

  const stopTracking = () => {
    if (pedometerSubscription.current) {
      pedometerSubscription.current.remove();
      pedometerSubscription.current = null;
    }
  };

  const startTracking = async () => {
    stopTracking(); // Always purge existing active listeners first
    setPedometerStatus(null);

    try {
      const isAvailable = await Pedometer.isAvailableAsync();
      if (!isAvailable) {
        setPedometerStatus('home.notAvailable');
        return;
      }

      const permission = await Pedometer.requestPermissionsAsync();
      if (!permission.granted) {
        setPedometerStatus('home.permissionRequired');
        return;
      }

      ensureCurrentDay();
      sessionBaseRef.current = stepsRef.current;
      sessionStepsRef.current = 0;
      lastTotalRef.current = null;
      pedometerSubscription.current = Pedometer.watchStepCount((result) => {
        ensureCurrentDay();

        const total = result.steps;
        const delta =
          lastTotalRef.current !== null && total > lastTotalRef.current
            ? total - lastTotalRef.current
            : 0;
        lastTotalRef.current = total;

        if (delta <= 0) return;

        sessionStepsRef.current += delta;
        const updatedSteps = sessionBaseRef.current + sessionStepsRef.current;
        stepsRef.current = updatedSteps;
        setSteps(updatedSteps);
        storage.set('daily_steps', updatedSteps);
        syncDailyLog(updatedSteps);

        const { earnedCoins } = applyStepCoins(updatedSteps, totalCoins);
        if (earnedCoins > 0) {
          addCoins(earnedCoins);
        }
      });
    } catch (error) {
      console.log('Pedometer Error:', error);
      setPedometerStatus('home.sensorError');
    }
  };

  const toggleTracking = () => {
    if (isTracking) {
      if (sessionStart.current !== null) {
        const elapsed = Math.floor((Date.now() - sessionStart.current) / 1000);
        secondsElapsedRef.current = elapsed;
        setSecondsElapsed(elapsed);
        storage.set('workout_seconds', elapsed);
        sessionStart.current = null;
      }
      stopTracking();
      setIsTracking(false);
    } else {
      sessionStart.current = Date.now() - secondsElapsedRef.current * 1000;
      setIsTracking(true);
      startTracking();
    }
  };

  // تنظيف الاشتراك عند إغلاق الشاشة
  useEffect(() => {
    ensureCurrentDayRef.current();
    return () => stopTracking();
  }, []);

  return (
    <SafeAreaView className="flex-1">
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className={`${rowDirection} justify-between items-center mb-5`}>
          <Text className="text-2xl font-bold" style={{ color: text }}>
            {t('app.name')} <Text style={{ color: accent }}>.</Text>
          </Text>

          <View
            className={`${rowDirection} items-center px-3.5 py-2 rounded-full border gap-1.5`}
            style={{ backgroundColor: card, borderColor: border }}
          >
            <Coins color={accent} size={18} />
            <Text className="text-sm font-bold" style={{ color: text }}>
              {totalCoins.toLocaleString('en-US')} {t('home.coins')}
            </Text>
            {isMultiplierActive && (
              <View
                className={`${rowDirection} items-center gap-0.5 rounded-full px-1.5 py-0.5`}
                style={{ backgroundColor: `${accent}20` }}
              >
                <Flame color={accent} size={12} />
                <Text className="text-[10px] font-black" style={{ color: accent }}>
                  x2
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Circular Gauge Card */}
        <View
          className="rounded-3xl p-5 items-center border mb-5"
          style={{ backgroundColor: card, borderColor: border }}
        >
          <View className="w-60 h-60 justify-center items-center relative">
            <ProgressRing
              progress={Math.min(steps / goal, 1)}
              style={selectedRingStyle}
              isDarkMode={isDarkMode}
              accent={accent}
            />

            <View className="absolute items-center" style={{ marginTop: -10 }}>
              <Footprints
                color={accent}
                size={28}
                style={{ marginBottom: 8 }}
              />
              <Text className="text-sm" style={{ color: subText }}>
                {t('home.todaySteps')}
              </Text>
              <Text
                className="text-4xl font-black my-0.5"
                style={{ color: text }}
              >
                {steps.toLocaleString('en-US')}
              </Text>
              {pedometerStatus ? (
                <Text className="text-xs font-semibold text-red-500 mt-1">
                  {t(pedometerStatus)}
                </Text>
              ) : (
                <Text
                  style={{ color: accent }}
                  className="text-xs font-semibold"
                >
                  {t('home.goal')} {goal.toLocaleString('en-US')}
                </Text>
              )}
            </View>

            {/* زر التحكم بالوقت */}
            <View className="absolute -bottom-3 flex-row items-center gap-3">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={toggleTracking}
                style={{ borderColor: accent, backgroundColor: bg }}
                className="w-14 h-14 rounded-full border-2 items-center justify-center shadow-lg"
              >
                <View
                  style={{ backgroundColor: `${accent}20` }}
                  className="w-10 h-10 rounded-full items-center justify-center"
                >
                  {isTracking ? (
                    <Pause color={accent} size={20} />
                  ) : (
                    <Play color={accent} size={20} style={{ marginLeft: 2 }} />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Metrics Row */}
          <View
            className={`${rowDirection} w-full justify-around items-center mt-8 pt-4 border-t`}
            style={{ borderTopColor: border }}
          >
            <View className="items-center">
              <MapPin color={accent} size={20} />
              <Text
                className="text-lg font-bold mt-1.5"
                style={{ color: text }}
              >
                {distanceKm.toFixed(2)}
              </Text>
              <Text className="text-xs mt-0.5" style={{ color: subText }}>
                {t('home.distanceKm')}
              </Text>
            </View>

            <View className="w-px h-7" style={{ backgroundColor: border }} />

            <View className="items-center">
              <Clock color={accent} size={20} />
              <Text
                className="text-lg font-bold mt-1.5"
                style={{ color: text }}
              >
                {formatTime(secondsElapsed)}
              </Text>
              <Text className="text-xs mt-0.5" style={{ color: subText }}>
                {isTracking ? `${t('home.activeTime')} 🟢` : t('home.time')}
              </Text>
            </View>

            <View className="w-px h-7" style={{ backgroundColor: border }} />

            <View className="items-center">
              <Flame color={accent} size={20} />
              <Text
                className="text-lg font-bold mt-1.5"
                style={{ color: text }}
              >
                {calories.toLocaleString('en-US')}
              </Text>
              <Text className="text-xs mt-0.5" style={{ color: subText }}>
                {t('home.calories')}
              </Text>
            </View>
          </View>
        </View>

        {/* مهام اليوم الديناميكية */}
        <DailyTasksList
          currentSteps={steps}
          currentDistanceKm={distanceKm}
          currentCalories={calories}
          currentMinutes={secondsElapsed / 60}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
