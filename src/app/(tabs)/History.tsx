import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart } from 'react-native-gifted-charts';
import { Footprints, ChevronDown } from 'lucide-react-native';
import { useAppStore, colorPalettes, DailyLog } from '../../../store/useAppStore';

const DAYS_AR = ['أح', 'إث', 'ثلا', 'أرب', 'خم', 'جم', 'سب'];

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const formatCompact = (n: number) =>
  n >= 1000 ? `${Math.floor(n / 1000)}k` : `${n}`;

const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

const getCurrentStreak = (history: DailyLog[]) => {
  const goalDays = new Set(history.filter((l) => l.goalReached).map((l) => l.date));
  let streak = 0;
  const cursor = new Date();
  if (!goalDays.has(toDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (goalDays.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

const getLongestStreak = (history: DailyLog[]) => {
  const goalDays = history.filter((l) => l.goalReached).map((l) => l.date).sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const date of goalDays) {
    run = prev !== null && daysBetween(prev, date) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = date;
  }
  return longest;
};

const History = () => {
  const { accentColor, themeMode, history } = useAppStore();
  const currentPalette = colorPalettes[accentColor] ?? colorPalettes.sunset;
  const isDark = themeMode === 'dark';

  // ألوان الرسم البياني والنصوص الديناميكية
  const labelTextColor = isDark ? '#F0F6FC' : '#0F172A';
  const subTextColor = isDark ? '#8B949E' : '#64748B';
  const gridBorderColor = isDark ? '#21262D' : '#E2E8F0';

  // آخر 7 أيام من سجل المتجر
  const logsByDate = new Map(history.map((log) => [log.date, log]));
  const todayKey = toDateKey(new Date());

  // أسبوع الأسبوع: من السبت إلى الجمعة
  const saturday = new Date();
  saturday.setDate(new Date().getDate() - ((new Date().getDay() + 1) % 7));

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(saturday);
    d.setDate(saturday.getDate() + i);
    return { key: toDateKey(d), label: DAYS_AR[d.getDay()] };
  });

  const todaySteps = logsByDate.get(todayKey)?.steps ?? 0;
  const weekTotal = weekDays.reduce((sum, day) => sum + (logsByDate.get(day.key)?.steps ?? 0), 0);
  const weekAverage = Math.round(weekTotal / 7);

  // بيانات الرسم البياني من السجل مع تطبيق ألوان الثيم
  const barData = weekDays.map((day) => {
    const log = logsByDate.get(day.key);
    return {
      value: log?.steps ?? 0,
      label: day.label,
      frontColor: log?.goalReached ? currentPalette.primary : currentPalette.secondary,
    };
  });

  const chartMax = Math.max(8000, ...barData.map((b) => b.value));

  const currentStreak = getCurrentStreak(history);
  const longestStreak = getLongestStreak(history);

  return (
    <SafeAreaView className="flex-1 bg-appBg-light dark:bg-appBg-dark">
      <ScrollView 
        className="flex-1 p-4"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        
        {/* 1. كروت الإحصائيات العلوية */}
        <View className="flex-row-reverse justify-between mb-5 gap-2">
          <View className="flex-1 bg-appCard-light dark:bg-appCard-dark p-3 rounded-2xl items-center border border-appBorder-light dark:border-appBorder-dark">
            <Text className="text-appSubText-light dark:text-appSubText-dark text-xs">اليوم</Text>
            <Text style={{ color: currentPalette.primary }} className="text-lg font-bold my-1">{formatCompact(todaySteps)}</Text>
            <Text className="text-appSubText-light dark:text-appSubText-dark text-[10px]">خطوة</Text>
          </View>

          <View className="flex-1 bg-appCard-light dark:bg-appCard-dark p-3 rounded-2xl items-center border border-appBorder-light dark:border-appBorder-dark">
            <Text className="text-appSubText-light dark:text-appSubText-dark text-xs">المتوسط</Text>
            <Text style={{ color: currentPalette.primary }} className="text-lg font-bold my-1">{weekAverage.toLocaleString('en-US')}</Text>
            <Text className="text-appSubText-light dark:text-appSubText-dark text-[10px]">خطوة/يوم</Text>
          </View>

          <View className="flex-1 bg-appCard-light dark:bg-appCard-dark p-3 rounded-2xl items-center border border-appBorder-light dark:border-appBorder-dark">
            <Text className="text-appSubText-light dark:text-appSubText-dark text-xs">المجموع</Text>
            <Text style={{ color: currentPalette.primary }} className="text-lg font-bold my-1">{formatCompact(weekTotal)}</Text>
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
              maxValue={chartMax}
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
                <Text className="text-appText-light dark:text-appText-dark text-4xl font-extrabold">{currentStreak}</Text>
                <Text className="text-appText-light dark:text-appText-dark text-xl font-bold">أيام</Text>
              </View>
            </View>

            <View className="w-16 h-16 rounded-full bg-appBg-light dark:bg-appBg-dark justify-center items-center border border-appBorder-light dark:border-appBorder-dark">
              <Footprints color={currentPalette.primary} size={28} />
            </View>
          </View>

          <Text className="text-appSubText-light dark:text-appSubText-dark text-xs text-center leading-5 px-2">
            لقد حققت هدفك لمدة {currentStreak} أيام متتالية. أطول سلسلة قمت بها كانت لمدة {longestStreak} أيام.
          </Text>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default History;