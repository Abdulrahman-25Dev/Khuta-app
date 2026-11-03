import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart } from 'react-native-gifted-charts';
import { Footprints, Snowflake } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppStore, DailyLog } from '../../../store/useAppStore';
import { useTheme } from '../../context/ThemeContext';
import AppText from '../../components/AppText';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

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

const getCurrentStreak = (history: DailyLog[], frozenDays: string[]) => {
  const goalDays = new Set(
    history.filter((l) => l.goalReached).map((l) => l.date)
  );
  const frozenDaySet = new Set(frozenDays);
  let streak = 0;
  const cursor = new Date();
  if (!goalDays.has(toDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (true) {
    const date = toDateKey(cursor);
    if (goalDays.has(date)) {
      streak += 1;
    } else if (!frozenDaySet.has(date)) {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

const getLongestStreak = (history: DailyLog[], frozenDays: string[]) => {
  const goalDays = new Set(
    history.filter((l) => l.goalReached).map((l) => l.date)
  );
  const streakDays = [...new Set([...goalDays, ...frozenDays])].sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const date of streakDays) {
    if (prev === null || daysBetween(prev, date) !== 1) run = 0;
    if (goalDays.has(date)) run += 1;
    longest = Math.max(longest, run);
    prev = date;
  }
  return longest;
};

const History = () => {
  const { t, i18n } = useTranslation();
  const { history, frozenDays } = useAppStore();
  const rowDirection =
    i18n.dir() === 'rtl' ? 'flex-row-reverse' : 'flex-row';
  const textAlignment = i18n.dir() === 'rtl' ? 'text-right' : 'text-left';
  const contentAlignment = i18n.dir() === 'rtl' ? 'items-end' : 'items-start';
  const chartFontFamily = i18n.language.startsWith('ar')
    ? 'Tajawal'
    : 'Inter';
  const chartBoldFontFamily = i18n.language.startsWith('ar')
    ? 'Tajawal-Bold'
    : 'Inter-Bold';
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
    return {
      key: toDateKey(d),
      label: t(`history.weekdays.${DAY_KEYS[d.getDay()]}`),
    };
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
    const isFrozenDay = frozenDays.includes(day.key) && !log?.goalReached;
    return {
      value: log?.steps ?? 0,
      label: day.label,
      frontColor: log?.goalReached || frozenDays.includes(day.key)
          ? accent
          : `${accent}66`,
      topLabelComponent: isFrozenDay
        ? () => (
            <View style={{ alignItems: 'center', marginBottom: 4 }}>
              <Snowflake size={12} color={accent} />
            </View>
          )
        : undefined,
    };
  });

  const chartMax = Math.max(8000, ...barData.map((b) => b.value));

  const currentStreak = getCurrentStreak(history, frozenDays);
  const longestStreak = getLongestStreak(history, frozenDays);

  return (
    <SafeAreaView className="flex-1 px-5">
      {/* 1. كروت الإحصائيات العلوية */}
      <View className={`${rowDirection} justify-between mb-5 gap-2 mt-5`}>
        <View
          className="flex-1 p-3 rounded-2xl items-center border"
          style={{ backgroundColor: card, borderColor: border }}
        >
          <AppText className="text-xs" style={{ color: subText }}>
            {t('history.today')}
          </AppText>
          <AppText
            style={{ color: accent }}
            className="text-lg font-bold my-1"
          >
            {formatCompact(todaySteps)}
          </AppText>
          <AppText className="text-[10px]" style={{ color: subText }}>
            {t('history.steps')}
          </AppText>
        </View>

        <View
          className="flex-1 p-3 rounded-2xl items-center border"
          style={{ backgroundColor: card, borderColor: border }}
        >
          <AppText className="text-xs" style={{ color: subText }}>
            {t('history.average')}
          </AppText>
          <AppText
            style={{ color: accent }}
            className="text-lg font-bold my-1"
          >
            {formatCompact(weekAverage)}
          </AppText>
          <AppText className="text-[10px]" style={{ color: subText }}>
            {t('history.stepsPerDay')}
          </AppText>
        </View>

        <View
          className="flex-1 p-3 rounded-2xl items-center border"
          style={{ backgroundColor: card, borderColor: border }}
        >
          <AppText className="text-xs" style={{ color: subText }}>
            {t('history.total')}
          </AppText>
          <AppText
            style={{ color: accent }}
            className="text-lg font-bold my-1"
          >
            {formatCompact(weekTotal)}
          </AppText>
          <AppText className="text-[10px]" style={{ color: subText }}>
            {t('history.week')}
          </AppText>
        </View>
      </View>

      {/* 2. كارت الرسم البياني */}
      <View
        className="p-4 rounded-3xl border mb-5"
        style={{ backgroundColor: card, borderColor: border }}
      >
        <AppText
          className={`text-base font-bold mb-5 ${textAlignment}`}
          style={{ color: text }}
        >
          {t('history.weeklySteps')}
        </AppText>

        <View className="items-center overflow-hidden">
          <BarChart
            data={barData}
            barWidth={18}
            spacing={18}
            initialSpacing={10}
            barBorderRadius={6}
            showGradient={false}
            yAxisTextStyle={{
              color: subTextColor,
              fontSize: 10,
              fontFamily: chartFontFamily,
            }}
            xAxisLabelTextStyle={{
              color: labelTextColor,
              fontSize: 11,
              fontWeight: '600',
              fontFamily: chartBoldFontFamily,
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
        <View className={`${rowDirection} justify-between items-center my-2`}>
          <View className={contentAlignment}>
            <AppText
              className={`text-xs font-bold mb-1 ${textAlignment}`}
              style={{ color: subText }}
            >
              {t('history.currentStreak')}
            </AppText>
            <View className={`${rowDirection} items-baseline gap-1`}>
              <AppText className="text-4xl font-extrabold" style={{ color: text }}>
                {currentStreak}
              </AppText>
              <AppText className="text-xl font-bold" style={{ color: text }}>
                {t('history.days')}
              </AppText>
            </View>
          </View>

          <View
            className="w-16 h-16 rounded-full justify-center items-center border"
            style={{ backgroundColor: bg, borderColor: border }}
          >
            <Footprints color={accent} size={28} />
          </View>
        </View>

        <AppText className="text-xs text-center leading-5 px-2" style={{ color: subText }}>
          {t('history.streakMessage', { currentStreak, longestStreak })}
        </AppText>
      </View>
    </SafeAreaView>
  );
};

export default History;
