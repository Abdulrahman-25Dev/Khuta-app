import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart } from 'react-native-gifted-charts';
import { Footprints, ChevronDown } from 'lucide-react-native';
import { useAppStore, colorPalettes } from '../../../store/useAppStore';

const History = () => {
  const { accentColor, themeMode, streakDays } = useAppStore();
  const currentPalette = colorPalettes[accentColor] ?? colorPalettes.sunset;
  const isDark = themeMode === 'dark';

  // ألوان الرسم البياني والنصوص الديناميكية
  const labelTextColor = isDark ? '#F0F6FC' : '#0F172A';
  const subTextColor = isDark ? '#8B949E' : '#64748B';
  const gridBorderColor = isDark ? '#21262D' : '#E2E8F0';

  // بيانات الرسم البياني للخطوات الأسبوعية مع تطبيق ألوان الثيم
  const barData = [
    { value: 1500, label: 'سبت', frontColor: currentPalette.secondary },
    { value: 3200, label: 'أحد', frontColor: currentPalette.primary },
    { value: 1800, label: 'إثنين', frontColor: currentPalette.secondary },
    { value: 2200, label: 'ثلاثاء', frontColor: currentPalette.secondary },
    { value: 1400, label: 'أربعاء', frontColor: currentPalette.secondary },
    { value: 2800, label: 'خميس', frontColor: currentPalette.primary },
    { value: 1000, label: 'جمعة', frontColor: currentPalette.secondary },
  ];

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'dark bg-appBg-dark' : 'bg-appBg-light'}`}>
      <ScrollView 
        className="flex-1 p-4"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        
        {/* 1. كروت الإحصائيات العلوية */}
        <View className="flex-row-reverse justify-between mb-5 gap-2">
          <View className="flex-1 bg-appCard-light dark:bg-appCard-dark p-3 rounded-2xl items-center border border-appBorder-light dark:border-appBorder-dark">
            <Text className="text-appSubText-light dark:text-appSubText-dark text-xs">اليوم</Text>
            <Text style={{ color: currentPalette.primary }} className="text-lg font-bold my-1">12.5k</Text>
            <Text className="text-appSubText-light dark:text-appSubText-dark text-[10px]">خطوة</Text>
          </View>

          <View className="flex-1 bg-appCard-light dark:bg-appCard-dark p-3 rounded-2xl items-center border border-appBorder-light dark:border-appBorder-dark">
            <Text className="text-appSubText-light dark:text-appSubText-dark text-xs">المتوسط</Text>
            <Text style={{ color: currentPalette.primary }} className="text-lg font-bold my-1">8,300</Text>
            <Text className="text-appSubText-light dark:text-appSubText-dark text-[10px]">خطوة/يوم</Text>
          </View>

          <View className="flex-1 bg-appCard-light dark:bg-appCard-dark p-3 rounded-2xl items-center border border-appBorder-light dark:border-appBorder-dark">
            <Text className="text-appSubText-light dark:text-appSubText-dark text-xs">المجموع</Text>
            <Text style={{ color: currentPalette.primary }} className="text-lg font-bold my-1">58.1k</Text>
            <Text className="text-appSubText-light dark:text-appSubText-dark text-[10px]">الأسبوع</Text>
          </View>
        </View>

        {/* 2. كارت الرسم البياني */}
        <View className="bg-appCard-light dark:bg-appCard-dark p-4 rounded-3xl border border-appBorder-light dark:border-appBorder-dark mb-5">
          <Text className="text-appText-light dark:text-appText-dark text-base font-bold mb-5 text-right">
            الخطوات الأسبوعية
          </Text>

          <View className="items-center overflow-hidden">
            <BarChart
              data={barData}
              barWidth={18}
              spacing={18}
              initialSpacing={10}
              barBorderRadius={6}
              showGradient={false}
              yAxisTextStyle={{ color: subTextColor, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: labelTextColor, fontSize: 11, fontWeight: '600' }}
              yAxisColor="transparent"
              xAxisColor={gridBorderColor}
              noOfSections={4}
              maxValue={4000}
              height={180}
              rulesType="dashed"
              rulesColor={gridBorderColor}
            />
          </View>
        </View>

        {/* 3. قسم السلسلة (الستريك) */}
        <View className="bg-appCard-light dark:bg-appCard-dark p-5 rounded-3xl border border-appBorder-light dark:border-appBorder-dark mb-10">
          
          <View className="flex-row-reverse justify-between items-center mb-4">
            <Text className="text-appSubText-light dark:text-appSubText-dark text-sm font-bold">سلسلة</Text>
            
            <TouchableOpacity className="flex-row-reverse items-center bg-appBg-light dark:bg-appBg-dark px-3 py-1.5 rounded-full gap-1 border border-appBorder-light dark:border-appBorder-dark">
              <Text className="text-appText-light dark:text-appText-dark text-xs font-semibold">الخطوات</Text>
              <ChevronDown color={subTextColor} size={14} />
            </TouchableOpacity>
          </View>

          <View className="flex-row-reverse justify-between items-center my-2">
            <View className="items-end">
              <Text className="text-appSubText-light dark:text-appSubText-dark text-xs font-bold mb-1">السلسلة الحالية</Text>
              <View className="flex-row-reverse items-baseline gap-1">
                <Text className="text-appText-light dark:text-appText-dark text-4xl font-extrabold">{streakDays}</Text>
                <Text className="text-appText-light dark:text-appText-dark text-xl font-bold">أيام</Text>
              </View>
            </View>

            <View className="w-16 h-16 rounded-full bg-appBg-light dark:bg-appBg-dark justify-center items-center border border-appBorder-light dark:border-appBorder-dark">
              <Footprints color={currentPalette.primary} size={28} />
            </View>
          </View>

          <Text className="text-appSubText-light dark:text-appSubText-dark text-xs text-center leading-5 px-2">
            لقد حققت هدفك لمدة {streakDays} أيام متتالية. أطول سلسلة قمت بها كانت لمدة {streakDays} أيام.
          </Text>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default History;