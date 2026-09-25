import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Text,
  View,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  AppState,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  Line,
  Polygon,
  RadialGradient,
  Stop,
} from 'react-native-svg';
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

const PulseRing = ({
  progress,
  activeColor,
  inactiveColor,
}: {
  progress: number;
  activeColor: string;
  inactiveColor: string;
}) => {
  const scale = useSharedValue(0.98);
  const opacity = useSharedValue(0.85);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.04, {
        duration: 1300,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
    opacity.value = withRepeat(
      withTiming(1, {
        duration: 1300,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const pulseRadius = 80;
  const circumference = 2 * Math.PI * pulseRadius;
  const dashOffset = circumference * (1 - progress);

  return (
    <Animated.View style={animatedStyle}>
      <Svg height="240" width="240" viewBox="0 0 200 200">
        <Defs>
          <RadialGradient id="pulseGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#00F0FF" stopOpacity={1} />
            <Stop offset="55%" stopColor="#00F0FF" stopOpacity={0.8} />
            <Stop offset="100%" stopColor="#00F0FF" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle
          cx={100}
          cy={100}
          r={pulseRadius + 12}
          fill="none"
          stroke="url(#pulseGlow)"
          strokeWidth="12"
          opacity={0.5}
        />
        <Circle
          cx={100}
          cy={100}
          r={pulseRadius}
          fill="none"
          stroke={inactiveColor}
          strokeWidth="8"
          strokeDasharray="16 12"
          strokeLinecap="round"
          opacity={0.7}
        />
        <Circle
          cx={100}
          cy={100}
          r={pulseRadius}
          fill="none"
          stroke={activeColor}
          strokeWidth="8"
          strokeDasharray="16 12"
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(-90 100 100)"
          opacity={0.95}
        />
      </Svg>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const { user, addCoins, totalCoins, activeRingStyle } = useAppStore();
  // كامل الألوان من السياق الذرّي في نفس إطار القراءة (لا انفصال بين الخلفية والكروت)
  const { isDarkMode, accent, bg, card, border, text, subText } = useTheme();
  const selectedRingStyle =
    ringStyles.find((style) => style.id === activeRingStyle) ?? ringStyles[0];

  const [steps, setSteps] = useState<number>(
    () => storage.getNumber('daily_steps') ?? 0
  );
  const goal = user?.dailyGoal ?? 5000;

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
    const finalDistance = parseFloat(
      ((finalSteps * stepLengthMeters) / 1000).toFixed(2)
    );
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
      distance: parseFloat(
        ((currentSteps * stepLengthMeters) / 1000).toFixed(2)
      ),
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

  const renderProgressRing = () => {
    const radius = 100;
    const center = 120;
    const progress = Math.min(steps / goal, 1);
    const inactiveColor = isDarkMode ? '#334155' : '#CBD5E1';
    const activeColor = accent;

    switch (selectedRingStyle.kind) {
      case 'wave': {
        const totalBars = 34;
        const activeBars = Math.floor(progress * totalBars);

        return (
          <Svg height="240" width="240">
            {Array.from({ length: totalBars }).map((_, index) => {
              const angle = (index * 360) / totalBars - 90;
              const rad = (angle * Math.PI) / 180;
              const baseRadius = 92;
              const gapFromCenter = 14;
              const waveLength = [
                9, 14, 18, 13, 15, 11, 17, 13, 20, 12, 15, 10, 18, 12, 16, 11,
                19, 13, 14, 10, 17, 15, 12, 9, 18, 12, 16, 10, 15, 11, 13, 9,
                17, 11,
              ][index];
              const x1 = center + (baseRadius - gapFromCenter) * Math.cos(rad);
              const y1 = center + (baseRadius - gapFromCenter) * Math.sin(rad);
              const x2 = center + (baseRadius + waveLength - 8) * Math.cos(rad);
              const y2 = center + (baseRadius + waveLength - 8) * Math.sin(rad);
              const isActive = index < activeBars;

              return (
                <Line
                  key={index}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isActive ? activeColor : inactiveColor}
                  strokeWidth={isActive ? '4' : '2.2'}
                  strokeLinecap="round"
                  opacity={isActive ? 1 : 0.7}
                />
              );
            })}
          </Svg>
        );
      }
      case 'solid': {
        const ringRadius = radius - 4;
        const circumference = 2 * Math.PI * ringRadius;
        const offset = circumference * (1 - progress);

        return (
          <Svg height="240" width="240">
            <Circle
              cx={center}
              cy={center}
              r={ringRadius}
              fill="none"
              stroke={inactiveColor}
              strokeWidth="16"
              opacity={0.75}
            />
            <Circle
              cx={center}
              cy={center}
              r={ringRadius}
              fill="none"
              stroke={activeColor}
              strokeWidth="16"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
            />
          </Svg>
        );
      }
      case 'dots': {
        const totalDots = 26;
        const activeDots = Math.round(progress * totalDots);

        return (
          <Svg height="240" width="240">
            {Array.from({ length: totalDots }).map((_, index) => {
              const angle = (index * 360) / totalDots - 90;
              const rad = (angle * Math.PI) / 180;
              const x = center + (radius - 8) * Math.cos(rad);
              const y = center + (radius - 8) * Math.sin(rad);
              const isActive = index < activeDots;

              return (
                <Circle
                  key={index}
                  cx={x}
                  cy={y}
                  r={isActive ? 4.5 : 2.8}
                  fill={isActive ? activeColor : inactiveColor}
                />
              );
            })}
          </Svg>
        );
      }
      case 'double': {
        const outerRadius = 84;
        const innerRadius = 72;
        const outerCircumference = 2 * Math.PI * outerRadius;
        const innerCircumference = 2 * Math.PI * innerRadius;
        const outerOffset = outerCircumference * (1 - progress);
        const innerOffset = innerCircumference * (1 - progress);

        return (
          <Svg height="240" width="240" viewBox="0 0 200 200">
            <Circle
              cx={100}
              cy={100}
              r={outerRadius}
              fill="none"
              stroke={inactiveColor}
              strokeWidth="4"
              strokeDasharray="12 10"
              strokeLinecap="round"
              strokeOpacity={1}
            />
            <Circle
              cx={100}
              cy={100}
              r={innerRadius}
              fill="none"
              stroke={inactiveColor}
              strokeWidth="3"
              strokeDasharray="12 10"
              strokeLinecap="round"
              strokeOpacity={0.6}
            />
            <Circle
              cx={100}
              cy={100}
              r={outerRadius}
              fill="none"
              stroke={activeColor}
              strokeWidth="4"
              strokeDasharray="12 10"
              strokeDashoffset={outerOffset}
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
              strokeOpacity={1}
            />
            <Circle
              cx={100}
              cy={100}
              r={innerRadius}
              fill="none"
              stroke={activeColor}
              strokeWidth="3"
              strokeDasharray="12 10"
              strokeDashoffset={innerOffset}
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
              strokeOpacity={0.8}
            />
          </Svg>
        );
      }
      case 'dash': {
        const dashRadius = 80;
        const circumference = 2 * Math.PI * dashRadius;
        const dashOffset = circumference * (1 - progress);

        return (
          <Svg height="240" width="240" viewBox="0 0 200 200">
            <Circle
              cx={100}
              cy={100}
              r={dashRadius}
              fill="none"
              stroke={inactiveColor}
              strokeWidth="10"
              strokeDasharray="16 12"
              strokeLinecap="round"
            />
            <Circle
              cx={100}
              cy={100}
              r={dashRadius}
              fill="none"
              stroke={activeColor}
              strokeWidth="10"
              strokeDasharray="16 12"
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
            />
          </Svg>
        );
      }
      case 'pulse': {
        return (
          <PulseRing
            progress={progress}
            activeColor={activeColor}
            inactiveColor={inactiveColor}
          />
        );
      }
      case 'arc': {
        const arcRadius = 88;
        const strokeLength = progress * 220;

        return (
          <Svg height="240" width="240">
            <Circle
              cx={center}
              cy={center}
              r={arcRadius}
              fill="none"
              stroke={inactiveColor}
              strokeWidth="8"
              strokeDasharray="12 16"
              opacity={0.85}
            />
            <Circle
              cx={center}
              cy={center}
              r={arcRadius}
              fill="none"
              stroke={activeColor}
              strokeWidth="8"
              strokeDasharray={`${strokeLength} 300`}
              strokeLinecap="round"
              transform={`rotate(-115 ${center} ${center})`}
            />
          </Svg>
        );
      }
      case 'infinity': {
        const outerRadius = 84;
        const innerRadius = 74;
        const outerCircumference = 2 * Math.PI * outerRadius;
        const innerCircumference = 2 * Math.PI * innerRadius;

        return (
          <Svg height="240" width="240" viewBox="0 0 200 200">
            <Circle
              cx={100}
              cy={100}
              r={outerRadius}
              fill="none"
              stroke={inactiveColor}
              strokeWidth="3"
              strokeDasharray="20 12"
              opacity={0.7}
            />
            <Circle
              cx={100}
              cy={100}
              r={innerRadius}
              fill="none"
              stroke={inactiveColor}
              strokeWidth="3"
              strokeDasharray="20 12"
              opacity={0.7}
            />
            <Circle
              cx={100}
              cy={100}
              r={outerRadius}
              fill="none"
              stroke={activeColor}
              strokeWidth="3"
              strokeDasharray={`${Math.max(20, progress * outerCircumference)} ${outerCircumference}`}
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
            />
            <Circle
              cx={100}
              cy={100}
              r={innerRadius}
              fill="none"
              stroke={activeColor}
              strokeWidth="3"
              strokeDasharray={`${Math.max(20, progress * innerCircumference)} ${innerCircumference}`}
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
            />
          </Svg>
        );
      }
      case 'dotted-flow': {
        const totalDiamonds = 28;

        return (
          <Svg height="240" width="240" viewBox="0 0 200 200">
            {Array.from({ length: totalDiamonds }).map((_, index) => {
              const angle = (index / totalDiamonds) * Math.PI * 2 - Math.PI / 2;
              const cx = 100 + 80 * Math.cos(angle);
              const cy = 100 + 80 * Math.sin(angle);
              const isActive = index / totalDiamonds <= progress;
              const points = [
                `${cx},${cy - 4}`,
                `${cx + 4},${cy}`,
                `${cx},${cy + 4}`,
                `${cx - 4},${cy}`,
              ].join(' ');

              return (
                <Polygon
                  key={index}
                  points={points}
                  fill={isActive ? '#00F0FF' : '#1E293B'}
                  fillOpacity={isActive ? 1 : 0.3}
                  stroke={isActive ? '#00E5FF' : '#334155'}
                  strokeWidth={isActive ? 1 : 1}
                />
              );
            })}
          </Svg>
        );
      }
      case 'ticks':
      default: {
        const totalTicks = 60;
        const activeTicksCount = Math.floor(progress * totalTicks);

        return (
          <Svg height="240" width="240">
            {Array.from({ length: totalTicks }).map((_, index) => {
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
                  stroke={isActive ? activeColor : inactiveColor}
                  strokeWidth={isActive ? '3.5' : '2'}
                  strokeLinecap="round"
                />
              );
            })}
          </Svg>
        );
      }
    }
  };

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
        <View className="flex-row-reverse justify-between items-center mb-5">
          <Text className="text-2xl font-bold" style={{ color: text }}>
            خُطى <Text style={{ color: accent }}>.</Text>
          </Text>

          <View
            className="flex-row-reverse items-center px-3.5 py-2 rounded-full border gap-1.5"
            style={{ backgroundColor: card, borderColor: border }}
          >
            <Coins color={accent} size={18} />
            <Text className="text-sm font-bold" style={{ color: text }}>
              {totalCoins} عملة
            </Text>
          </View>
        </View>

        {/* Circular Gauge Card */}
        <View
          className="rounded-3xl p-5 items-center border mb-5"
          style={{ backgroundColor: card, borderColor: border }}
        >
          <View className="w-60 h-60 justify-center items-center relative">
            {renderProgressRing()}

            <View className="absolute items-center" style={{ marginTop: -10 }}>
              <Footprints
                color={accent}
                size={28}
                style={{ marginBottom: 8 }}
              />
              <Text className="text-sm" style={{ color: subText }}>
                خطوات اليوم
              </Text>
              <Text
                className="text-4xl font-black my-0.5"
                style={{ color: text }}
              >
                {steps.toLocaleString('en-US')}
              </Text>
              {pedometerStatus ? (
                <Text className="text-xs font-semibold text-red-500 mt-1">
                  {pedometerStatus}
                </Text>
              ) : (
                <Text
                  style={{ color: accent }}
                  className="text-xs font-semibold"
                >
                  الهدف {goal.toLocaleString('en-US')}
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
            className="flex-row-reverse w-full justify-around items-center mt-8 pt-4 border-t"
            style={{ borderTopColor: border }}
          >
            <View className="items-center">
              <MapPin color={accent} size={20} />
              <Text
                className="text-lg font-bold mt-1.5"
                style={{ color: text }}
              >
                {distanceKm}
              </Text>
              <Text className="text-xs mt-0.5" style={{ color: subText }}>
                مسافة (كم)
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
                {isTracking ? 'وقت نشط 🟢' : 'وقت'}
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
                سعرات
              </Text>
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
