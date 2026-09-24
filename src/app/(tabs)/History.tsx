import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart } from 'react-native-gifted-charts';
import { Footprints } from 'lucide-react-native';
import { useAppStore, DailyLog } from '../../../store/useAppStore';
import { useTheme } from '../../context/ThemeContext';

const DAYS_AR = ['أح', 'إث', 'ثلا', 'أرب', 'خم', 'جم', 'سب'];

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// صياغة مضغوطة للأعداد الكبيرة مثل 5.5k أو 1.2M
const formatCompact = (n: number) => {
  if (n >= 1000000) {
    return `${(n / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (n >= 1000) {
    const value = n / 1000;
    return `${value >= 100 ? Math.round(value) : value.toFixed(1).replace(/\.0$/, '')}k`;
  }
  return `${n}`;
};

const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

const getCurrentStreak = (history: DailyLog[]) => {
  const goalDays = new Set(
    history.filter((l) => l.goalReached).map((l) => l.date)
  );
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
  const goalDays = history
    .filter((l) => l.goalReached)
    .map((l) => l.date)
    .sort();
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
  const { history } = useAppStore();
  // الألوان من السياق الذرّي: لون التمييز + أسطح الكروت والنصوص في نفس الإطار
  const { accent, bg, card, border, text, subText } = useTheme();

  // ألوان الرسم البياني الشعاعية متزامنة مع لوحة السياق نفسها
  const labelTextColor = text;
  const subTextColor = subText;
  const gridBorderColor = border;

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
  const weekTotal = weekDays.reduce(
    (sum, day) => sum + (logsByDate.get(day.key)?.steps ?? 0),
    0
  );
  const weekAverage = Math.round(weekTotal / 7);

  // بيانات الرسم البياني من السجل مع تطبيق ألوان الثيم
  const barData = weekDays.map((day) => {
    const log = logsByDate.get(day.key);
    return {
      value: log?.steps ?? 0,
      label: day.label,
      frontColor: log?.goalReached
          ? accent
          : `${accent}66`,
    };
  });

  const chartMax = Math.max(8000, ...barData.map((b) => b.value));

  const currentStreak = getCurrentStreak(history);
  const longestStreak = getLongestStreak(history);

  return (
    <SafeAreaView className="flex-1 px-5">
      {/* 1. كروت الإحصائيات العلوية */}
      <View className="flex-row-reverse justify-between mb-5 gap-2 mt-5 ">
        <View
          className="flex-1 p-3 rounded-2xl items-center border"
          style={{ backgroundColor: card, borderColor: border }}
        >
          <Text className="text-xs" style={{ color: subText }}>
            اليوم
          </Text>
          <Text
            style={{ color: accent }}
            className="text-lg font-bold my-1"
          >
            {formatCompact(todaySteps)}
          </Text>
          <Text className="text-[10px]" style={{ color: subText }}>
            خطوة
          </Text>
        </View>

        <View
          className="flex-1 p-3 rounded-2xl items-center border"
          style={{ backgroundColor: card, borderColor: border }}
        >
          <Text className="text-xs" style={{ color: subText }}>
            المتوسط
          </Text>
          <Text
            style={{ color: accent }}
            className="text-lg font-bold my-1"
          >
            {formatCompact(weekAverage)}
          </Text>
          <Text className="text-[10px]" style={{ color: subText }}>
            خطوة/يوم
          </Text>
        </View>

        <View
          className="flex-1 p-3 rounded-2xl items-center border"
          style={{ backgroundColor: card, borderColor: border }}
        >
          <Text className="text-xs" style={{ color: subText }}>
            المجموع
          </Text>
          <Text
            style={{ color: accent }}
            className="text-lg font-bold my-1"
          >
            {formatCompact(weekTotal)}
          </Text>
          <Text className="text-[10px]" style={{ color: subText }}>
            الأسبوع
          </Text>
        </View>
      </View>

      {/* 2. كارت الرسم البياني */}
      <View
        className="p-4 rounded-3xl border mb-5"
        style={{ backgroundColor: card, borderColor: border }}
      >
        <Text className="text-base font-bold mb-5 text-right" style={{ color: text }}>
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
            xAxisLabelTextStyle={{
              color: labelTextColor,
              fontSize: 11,
              fontWeight: '600',
            }}
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
      <View
        className="p-5 rounded-3xl border mb-10"
        style={{ backgroundColor: card, borderColor: border }}
      >
        <View className="flex-row-reverse justify-between items-center my-2">
          <View className="items-end">
            <Text className="text-xs font-bold mb-1" style={{ color: subText }}>
              السلسلة الحالية
            </Text>
            <View className="flex-row-reverse items-baseline gap-1">
              <Text className="text-4xl font-extrabold" style={{ color: text }}>
                {currentStreak}
              </Text>
              <Text className="text-xl font-bold" style={{ color: text }}>
                أيام
              </Text>
            </View>
          </View>

          <View
            className="w-16 h-16 rounded-full justify-center items-center border"
            style={{ backgroundColor: bg, borderColor: border }}
          >
            <Footprints color={accent} size={28} />
          </View>
        </View>

        <Text className="text-xs text-center leading-5 px-2" style={{ color: subText }}>
          لقد حققت هدفك لمدة {currentStreak} أيام متتالية. أطول سلسلة قمت بها
          كانت لمدة {longestStreak} أيام.
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default History;
