import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, SafeAreaView, StatusBar, Alert } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { storage } from '../../utils/storage';

export default function Index() {
  const [steps, setSteps] = useState<number>(() => storage.getNumber('daily_steps') ?? 0);
  const [isSensorActive, setIsSensorActive] = useState<boolean>(false);
  const goal = 6000;

  useEffect(() => {
    let subscription: Pedometer.Subscription | null = null;

    const initPedometer = async () => {
      const isAvailable = await Pedometer.isAvailableAsync();
      setIsSensorActive(isAvailable);

      if (isAvailable) {
        subscription = Pedometer.watchStepCount((result) => {
          setSteps((prevSteps) => {
            const updated = prevSteps + result.steps;
            storage.set('daily_steps', updated);
            return updated;
          });
        });
      }
    };

    initPedometer();
    return () => { subscription && subscription.remove(); };
  }, []);

  const progress = Math.min((steps / goal) * 100, 100).toFixed(0);

  return (
    <SafeAreaView className="flex-1 bg-[#0B0F19] px-5 pt-10">
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />

      {/* Header */}
      <View className="mb-6">
        <Text className="text-3xl font-bold text-[#FFE3B3]">
          خُطى <Text className="text-[#EA6113]">.</Text>
        </Text>
        <Text className="text-xs text-[#8A8F9E] mt-1">
          حالة الحساس: {isSensorActive ? 'متصل ومفعل 🟢' : 'غير متاح 🔴'}
        </Text>
      </View>

      {/* Main Step Card */}
      <View className="bg-[#1A1A2E] rounded-3xl p-6 border border-[#27293D] mb-5 shadow-lg">
        <Text className="text-sm text-[#8A8F9E] mb-2 font-medium">مجموع الخطوات</Text>
        <Text className="text-5xl font-extrabold text-[#FB8931] mb-5">
          {steps.toLocaleString()}
        </Text>

        {/* Progress Bar */}
        <View className="h-3 bg-[#0B0F19] rounded-full overflow-hidden mb-3">
          <View 
            className="h-full bg-[#EA6113] rounded-full"  
          />
        </View>

        <View className="flex-row-reverse justify-between items-center">
          <Text className="text-xs text-[#FFE3B3]">الهدف: {goal.toLocaleString()} خطوة</Text>
          <Text className="text-xs font-bold text-[#F88F22]">{progress}%</Text>
        </View>
      </View>

      {/* Quick Test Controls */}
      <View className="bg-[#1A1A2E] rounded-2xl p-5 border border-[#27293D]">
        <Text className="text-sm text-[#FFE3B3] mb-4 text-center font-semibold">
          اختبار التخزين السريع (MMKV)
        </Text>

        <TouchableOpacity 
          className="bg-[#EA6113] py-3.5 rounded-xl items-center mb-3 active:opacity-80"
          onPress={() => {
            const next = steps + 500;
            setSteps(next);
            storage.set('daily_steps', next);
          }}
        >
          <Text className="text-white font-bold text-base">+ 500 خطوة</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="py-3 rounded-xl items-center border border-[#27293D] active:opacity-60"
          onPress={() => {
            setSteps(0);
            storage.remove('daily_steps');
          }}
        >
          <Text className="text-[#8A8F9E] text-lg">إعادة ضبط</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}