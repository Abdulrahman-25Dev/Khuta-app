import React, { useState, useEffect, useRef } from 'react';
import { Text, View, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';
import { Flame, MapPin, Clock, Footprints, Coins, Award, Play, Pause, RotateCcw } from 'lucide-react-native';
import { Pedometer } from 'expo-sensors';

import { useAppStore, colorPalettes } from '../../../store/useAppStore';
import { storage, getStoredCoins, setStoredCoins } from '../../utils/storage';

export default function HomeScreen() {
  const { accentColor, themeMode, user, addCoins } = useAppStore();
  const currentPalette = colorPalettes[accentColor] ?? colorPalettes.sunset;
  const isDark = themeMode === 'dark';

  const [steps, setSteps] = useState<number>(() => storage.getNumber('daily_steps') ?? 0);
  const [coins, setCoins] = useState<number>(() => getStoredCoins());
  const goal = user?.dailyGoal ?? 5000;

  // حالة مؤقت الجلسة
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(() => storage.getNumber('workout_seconds') ?? 0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // احتساب المسافة والسعرات بناءً على طول القامة
  const stepLengthMeters = ((user?.height ?? 160) * 0.415) / 100;
  const distanceKm = ((steps * stepLengthMeters) / 1000).toFixed(2);
  const calories = Math.round(steps * 0.04);

  // إدارة مؤقت الثواني
  useEffect(() => {
    if (isTracking) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => {
          const nextVal = prev + 1;
          storage.set('workout_seconds', nextVal);
          return nextVal;
        });
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

  // تصفير جميع مقاييس اليوم (الخطوات، المسافة، السعرات، الوقت) وإعادة تثبيت حساس الخطوات
  const resetAll = () => {
    stopTracking();
    setIsTracking(false);
    setSecondsElapsed(0);
    storage.set('workout_seconds', 0);
    setSteps(0);
    storage.set('daily_steps', 0);
  };

  // تنسيق الوقت المباشر إلى (MM:SS)
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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

      const sessionBase = steps;
      let lastTotal: number | null = null;
      let sessionSteps = 0;
      let pendingCoins = 0;

      pedometerSubscription.current = Pedometer.watchStepCount((result) => {
        const total = result.steps;
        const delta = lastTotal !== null && total > lastTotal ? total - lastTotal : 0;
        lastTotal = total;

        if (delta <= 0) return;

        sessionSteps += delta;
        const updatedSteps = sessionBase + sessionSteps;
        setSteps(updatedSteps);
        storage.set('daily_steps', updatedSteps);

        pendingCoins += delta;
        const earnedCoins = Math.floor(pendingCoins / 100);
        if (earnedCoins > 0) {
          pendingCoins -= earnedCoins * 100;
          setCoins((prevCoins) => {
            const newTotalCoins = prevCoins + earnedCoins;
            setStoredCoins(newTotalCoins);
            addCoins(earnedCoins);
            return newTotalCoins;
          });
        }
      });
    } catch (error) {
      console.log('Pedometer Error:', error);
      setPedometerStatus('خطأ في مستشعر الخطوات');
    }
  };

  const toggleTracking = () => {
    if (isTracking) {
      stopTracking();
      setIsTracking(false);
    } else {
      setIsTracking(true);
      startTracking();
    }
  };

  // تنظيف الاشتراك عند إغلاق الشاشة
  useEffect(() => {
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
          stroke={isActive ? currentPalette.primary : inactiveTickColor}
          strokeWidth={isActive ? '3.5' : '2'}
          strokeLinecap="round"
        />
      );
    });
  };

  const showResetButton = secondsElapsed > 0 || steps > 0;

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'dark bg-appBg-dark' : 'bg-appBg-light'}`}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* Header */}
        <View className="flex-row-reverse justify-between items-center mb-5">
          <Text className="text-2xl font-bold text-appText-light dark:text-appText-dark">
            خُطى <Text style={{ color: currentPalette.primary }}>.</Text>
          </Text>
          
          <View className="flex-row-reverse items-center bg-appCard-light dark:bg-appCard-dark px-3.5 py-2 rounded-full border border-appBorder-light dark:border-appBorder-dark gap-1.5">
            <Coins color={currentPalette.primary} size={18} />
            <Text className="text-appText-light dark:text-appText-dark text-sm font-bold">{coins} نقطة</Text>
          </View>
        </View>

        {/* Circular Gauge Card */}
        <View className="bg-appCard-light dark:bg-appCard-dark rounded-3xl p-5 items-center border border-appBorder-light dark:border-appBorder-dark mb-5">
          <View className="w-60 h-60 justify-center items-center relative">
            <Svg height="240" width="240">
              {renderTicks()}
            </Svg>
            
            <View className="absolute items-center">
              <Footprints color={currentPalette.primary} size={28} style={{ marginBottom: 4 }} />
              <Text className="text-sm text-appSubText-light dark:text-appSubText-dark">خطوات اليوم</Text>
              <Text className="text-5xl font-black text-appText-light dark:text-appText-dark my-0.5">
                {steps.toLocaleString()}
              </Text>
              {pedometerStatus ? (
                <Text className="text-xs font-semibold text-red-500 mt-1">{pedometerStatus}</Text>
              ) : (
                <Text style={{ color: currentPalette.secondary }} className="text-xs font-semibold">
                  الهدف {goal.toLocaleString()}
                </Text>
              )}
            </View>

            {/* أزرار التحكم بالوقت */}
            <View className="absolute -bottom-3 flex-row items-center gap-3">
              {showResetButton && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={resetAll}
                  className="w-11 h-11 rounded-full bg-appBg-light dark:bg-appBg-dark border-2 border-appBorder-light dark:border-appBorder-dark items-center justify-center shadow-lg"
                >
                  <RotateCcw color="#8A8F9E" size={18} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={toggleTracking}
                style={{ borderColor: currentPalette.primary }}
                className="w-14 h-14 rounded-full bg-appBg-light dark:bg-appBg-dark border-2 items-center justify-center shadow-lg"
              >
                <View 
                  style={{ backgroundColor: `${currentPalette.primary}20` }}
                  className="w-10 h-10 rounded-full items-center justify-center"
                >
                  {isTracking ? (
                    <Pause color={currentPalette.primary} size={20} />
                  ) : (
                    <Play color={currentPalette.primary} size={20} style={{ marginLeft: 2 }} />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Metrics Row */}
          <View className="flex-row-reverse w-full justify-around items-center mt-8 pt-4 border-t border-appBorder-light dark:border-appBorder-dark">
            <View className="items-center">
              <MapPin color={currentPalette.secondary} size={20} />
              <Text className="text-lg font-bold text-appText-light dark:text-appText-dark mt-1.5">{distanceKm}</Text>
              <Text className="text-xs text-appSubText-light dark:text-appSubText-dark mt-0.5">مسافة (كم)</Text>
            </View>

            <View className="w-px h-7 bg-appBorder-light dark:bg-appBorder-dark" />

            <View className="items-center">
              <Clock color={currentPalette.primary} size={20} />
              <Text className="text-lg font-bold text-appText-light dark:text-appText-dark mt-1.5">
                {formatTime(secondsElapsed)}
              </Text>
              <Text className="text-xs text-appSubText-light dark:text-appSubText-dark mt-0.5">
                {isTracking ? 'وقت نشط 🟢' : 'وقت'}
              </Text>
            </View>

            <View className="w-px h-7 bg-appBorder-light dark:bg-appBorder-dark" />

            <View className="items-center">
              <Flame color={currentPalette.primary} size={20} />
              <Text className="text-lg font-bold text-appText-light dark:text-appText-dark mt-1.5">{calories}</Text>
              <Text className="text-xs text-appSubText-light dark:text-appSubText-dark mt-0.5">سعرات</Text>
            </View>
          </View>
        </View>

        {/* Rewards / Badges Card */}
        <View className="bg-appCard-light dark:bg-appCard-dark rounded-3xl p-5 border border-appBorder-light dark:border-appBorder-dark">
          <View className="flex-row-reverse items-center gap-2 mb-2">
            <Award color={currentPalette.primary} size={22} />
            <Text className="text-lg font-bold text-appText-light dark:text-appText-dark">إنجازات خُطى</Text>
          </View>
          <Text className="text-xs text-appSubText-light dark:text-appSubText-dark text-right leading-5">
            {steps >= goal 
              ? '🎉 مبروك! حققت هدف اليوم وكسبت وسام الإنجاز!' 
              : `تبقي ${(goal - steps).toLocaleString()} خطوة للحصول على وسام اليوم.`}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}