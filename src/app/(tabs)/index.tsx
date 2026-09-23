import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Text, View, ScrollView, StatusBar, TouchableOpacity, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';
import { Flame, MapPin, Clock, Footprints, Coins, Play, Pause } from 'lucide-react-native';
import { Pedometer } from 'expo-sensors';

import { useAppStore, getTodayKey } from '../../../store/useAppStore';
import { appThemes } from '../../data/storeCatalog';
import { storage, getStoredCoins, setStoredCoins } from '../../utils/storage';
import DailyTasksList from '../../components/DailyTasksList';

export default function HomeScreen() {
  const { themeMode, user, addCoins, totalCoins } = useAppStore();
  const currentThemeId = useAppStore((s) => s.currentThemeId);
  const currentTheme =
    appThemes.find((t) => t.id === currentThemeId) ?? appThemes[0];
  // لون التمييز الديناميكي من المظهر المطبّق (الخلفية والبطاقات ثابتة)
  const accent = currentTheme.accent;
  const isDark = themeMode === 'dark';

  const [steps, setSteps] = useState<number>(() => storage.getNumber('daily_steps') ?? 0);
  const goal = user?.dailyGoal ?? 5000;

  // حالة مؤقت الجلسة
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(() => storage.getNumber('workout_seconds') ?? 0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStart = useRef<number | null>(null);

  // مراجع للقيم الحية لتفادي الإغلاقات القديمة (stale closures)
  const stepsRef = useRef<number>(steps);
  const sessionBaseRef = useRef<number>(0);
  const sessionStepsRef = useRef<number>(0);
  const lastTotalRef = useRef<number | null>(null);
  const secondsElapsedRef = useRef<number>(storage.getNumber('workout_seconds') ?? 0);
  const ensureCurrentDayRef = useRef<() => void>(() => {});

  // احتساب المسافة والسعرات بناءً على طول القامة
  const stepLengthMeters = ((user?.height ?? 160) * 0.415) / 100;
  const distanceKm = ((steps * stepLengthMeters) / 1000).toFixed(2);
  const calories = Math.round(steps * 0.04);

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
    const finalDistance = parseFloat(((finalSteps * stepLengthMeters) / 1000).toFixed(2));
    const finalCalories = Math.round(finalSteps * 0.04);

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
  }, [stepLengthMeters]);

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
    useAppStore.getState().addOrUpdateDailyLog({
      date: getTodayKey(),
      steps: currentSteps,
      distance: parseFloat(((currentSteps * stepLengthMeters) / 1000).toFixed(2)),
      calories: Math.round(currentSteps * 0.04),
      durationSeconds: secondsElapsedRef.current,
    });
  };

  // إعادة التحقق من التاريخ عند كل عودة للتطبيق إلى المقدمة
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        ensureCurrentDayRef.current();
        if (sessionStart.current !== null) {
          const elapsed = Math.floor((Date.now() - sessionStart.current) / 1000);
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
    return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
  };

  // تتبع حساس الخطوات
  const [pedometerStatus, setPedometerStatus] = useState<string>('');
  const pedometerSubscription = useRef<Pedometer.Subscription | null>(null);

  const stopTracking = () => {
    if (pedometerSubscription.current) {
      pedometerSubscription.current.remove();
      pedometerSubscription.current = null;
    }
  };

  const startTracking = async () => {
    stopTracking(); // Always purge existing active listeners first
    setPedometerStatus('');

    try {
      const isAvailable = await Pedometer.isAvailableAsync();
      if (!isAvailable) {
        setPedometerStatus('غير متاح على هذا الجهاز');
        return;
      }

      const permission = await Pedometer.requestPermissionsAsync();
      if (!permission.granted) {
        setPedometerStatus('يرجى تفعيل إذن الحركة في الإعدادات');
        return;
      }

      ensureCurrentDay();
      sessionBaseRef.current = stepsRef.current;
      sessionStepsRef.current = 0;
      lastTotalRef.current = null;
      let pendingCoins = 0;

      pedometerSubscription.current = Pedometer.watchStepCount((result) => {
        ensureCurrentDay();

        const total = result.steps;
        const delta = lastTotalRef.current !== null && total > lastTotalRef.current ? total - lastTotalRef.current : 0;
        lastTotalRef.current = total;

        if (delta <= 0) return;

        sessionStepsRef.current += delta;
        const updatedSteps = sessionBaseRef.current + sessionStepsRef.current;
        stepsRef.current = updatedSteps;
        setSteps(updatedSteps);
        storage.set('daily_steps', updatedSteps);
        syncDailyLog(updatedSteps);

        pendingCoins += delta;
        const earnedCoins = Math.floor(pendingCoins / 100);
        if (earnedCoins > 0) {
          pendingCoins -= earnedCoins * 100;
          setStoredCoins(getStoredCoins() + earnedCoins);
          addCoins(earnedCoins);
        }
      });
    } catch (error) {
      console.log('Pedometer Error:', error);
      setPedometerStatus('خطأ في مستشعر الخطوات');
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

  const renderTicks = () => {
    const totalTicks = 60;
    const radius = 100;
    const center = 120;
    const progress = Math.min(steps / goal, 1);
    const activeTicksCount = Math.floor(progress * totalTicks);
    const inactiveTickColor = isDark ? '#21262D' : '#CBD5E1';

    return Array.from({ length: totalTicks }).map((_, index) => {
      const angle = (index * (360 / totalTicks) - 90) * (Math.PI / 180);
      const x1 = center + (radius - 10) * Math.cos(angle);
      const y1 = center + (radius - 10) * Math.sin(angle);
      const x2 = center + radius * Math.cos(angle);
      const y2 = center + radius * Math.sin(angle);

      const isActive = index < activeTicksCount;

      return (
        <Line
          key={index}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={isActive ? accent : inactiveTickColor}
          strokeWidth={isActive ? '3.5' : '2'}
          strokeLinecap="round"
        />
      );
    });
  };

  return (
    <SafeAreaView className="flex-1">
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* Header */}
        <View className="flex-row-reverse justify-between items-center mb-5">
          <Text className="text-2xl font-bold text-appText-light dark:text-appText-dark">
            خُطى <Text style={{ color: accent }}>.</Text>
          </Text>
          
          <View className="flex-row-reverse items-center bg-appCard-light dark:bg-appCard-dark px-3.5 py-2 rounded-full border border-appBorder-light dark:border-appBorder-dark gap-1.5">
            <Coins color={accent} size={18} />
            <Text className="text-appText-light dark:text-appText-dark text-sm font-bold">{totalCoins} عملة</Text>
          </View>
        </View>

        {/* Circular Gauge Card */}
        <View className="bg-appCard-light dark:bg-appCard-dark rounded-3xl p-5 items-center border border-appBorder-light dark:border-appBorder-dark mb-5">
          <View className="w-60 h-60 justify-center items-center relative">
            <Svg height="240" width="240">
              {renderTicks()}
            </Svg>
            
            <View className="absolute items-center">
              <Footprints color={accent} size={28} style={{ marginBottom: 4 }} />
              <Text className="text-sm text-appSubText-light dark:text-appSubText-dark">خطوات اليوم</Text>
              <Text className="text-4xl font-black text-appText-light dark:text-appText-dark my-0.5">
                {steps.toLocaleString('en-US')}
              </Text>
              {pedometerStatus ? (
                <Text className="text-xs font-semibold text-red-500 mt-1">{pedometerStatus}</Text>
              ) : (
                <Text style={{ color: accent }} className="text-xs font-semibold">
                  الهدف {goal.toLocaleString('en-US')}
                </Text>
              )}
            </View>

            {/* زر التحكم بالوقت */}
            <View className="absolute -bottom-3 flex-row items-center gap-3">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={toggleTracking}
                style={{ borderColor: accent }}
                className="w-14 h-14 rounded-full bg-appBg-light dark:bg-appBg-dark border-2 items-center justify-center shadow-lg"
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
          <View className="flex-row-reverse w-full justify-around items-center mt-8 pt-4 border-t border-appBorder-light dark:border-appBorder-dark">
            <View className="items-center">
              <MapPin color={accent} size={20} />
              <Text className="text-lg font-bold text-appText-light dark:text-appText-dark mt-1.5">{distanceKm}</Text>
              <Text className="text-xs text-appSubText-light dark:text-appSubText-dark mt-0.5">مسافة (كم)</Text>
            </View>

            <View className="w-px h-7 bg-appBorder-light dark:bg-appBorder-dark" />

            <View className="items-center">
              <Clock color={accent} size={20} />
              <Text className="text-lg font-bold text-appText-light dark:text-appText-dark mt-1.5">
                {formatTime(secondsElapsed)}
              </Text>
              <Text className="text-xs text-appSubText-light dark:text-appSubText-dark mt-0.5">
                {isTracking ? 'وقت نشط 🟢' : 'وقت'}
              </Text>
            </View>

            <View className="w-px h-7 bg-appBorder-light dark:bg-appBorder-dark" />

            <View className="items-center">
              <Flame color={accent} size={20} />
              <Text className="text-lg font-bold text-appText-light dark:text-appText-dark mt-1.5">{calories.toLocaleString('en-US')}</Text>
              <Text className="text-xs text-appSubText-light dark:text-appSubText-dark mt-0.5">سعرات</Text>
            </View>
          </View>
        </View>

        {/* مهام اليوم الديناميكية */}
        <DailyTasksList
          currentSteps={steps}
          currentDistanceKm={parseFloat(distanceKm)}
          currentCalories={calories}
          currentMinutes={secondsElapsed / 60}
        />

      </ScrollView>
    </SafeAreaView>
  );
}