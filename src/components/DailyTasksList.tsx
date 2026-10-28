import React, { memo, useEffect } from 'react';
import { View, Text } from 'react-native';
import {
  Footprints,
  MapPin,
  Flame,
  Clock,
  ListChecks,
  CheckCircle2,
  Circle,
  Coins,
  LucideIcon,
} from 'lucide-react-native';

import { getTodayKey, useAppStore } from '../../store/useAppStore';
import { useTheme } from '../context/ThemeContext';
import { Task, TaskType, getTaskTimeframe } from '../utils/taskGenerator';

const taskIcons: Record<TaskType, LucideIcon> = {
  steps: Footprints,
  distance: MapPin,
  calories: Flame,
  duration: Clock,
};

interface DailyTasksListProps {
  currentSteps?: number;
  currentDistanceKm?: number;
  currentCalories?: number;
  currentMinutes?: number;
}

const getCurrentValue = (task: Task, props: DailyTasksListProps): number => {
  switch (task.type) {
    case 'steps':
      return props.currentSteps ?? 0;
    case 'distance':
      return props.currentDistanceKm ?? 0;
    case 'calories':
      return props.currentCalories ?? 0;
    case 'duration':
      return props.currentMinutes ?? 0;
  }
};

const getRemainingDays = (expiresAt: string, today: string): number => {
  const [expiresYear, expiresMonth, expiresDay] = expiresAt
    .split('-')
    .map(Number);
  const [todayYear, todayMonth, todayDay] = today.split('-').map(Number);
  const expiresDate = Date.UTC(expiresYear, expiresMonth - 1, expiresDay);
  const todayDate = Date.UTC(todayYear, todayMonth - 1, todayDay);
  const daysUntilExpiry = Math.ceil((expiresDate - todayDate) / 86_400_000);
  return Math.max(1, daysUntilExpiry + 1);
};

export default memo(function DailyTasksList({
  currentSteps = 0,
  currentDistanceKm = 0,
  currentCalories = 0,
  currentMinutes = 0,
}: DailyTasksListProps) {
  const { dailyTasks, completeTask, updateTaskProgress } = useAppStore();
  // ألوان الأسطح والنصوص من السياق الذرّي مباشرةً (لا useState/useEffect مؤجلة)
  const { accent, card, border, text, subText } = useTheme();
  const metrics: DailyTasksListProps = {
    currentSteps,
    currentDistanceKm,
    currentCalories,
    currentMinutes,
  };

  // اليوم يضيف فقط الزيادة فوق أعلى قراءة مسجلة لهذا اليوم إلى التقدم السابق.
  useEffect(() => {
    const todayKey = getTodayKey();
    dailyTasks.forEach((task) => {
      if (task.completed) return;
      const todayValue = getCurrentValue(task, metrics);
      const previousTodayValue = task.dailyProgress[todayKey] ?? 0;
      const todayMax = Math.max(previousTodayValue, todayValue);
      const cumulative = task.progress - previousTodayValue + todayMax;

      if (cumulative >= task.target) {
        completeTask(task.id);
      } else if (cumulative !== task.progress) {
        updateTaskProgress(task.id, cumulative, todayKey, todayMax);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dailyTasks,
    currentSteps,
    currentDistanceKm,
    currentCalories,
    currentMinutes,
    updateTaskProgress,
  ]);

  return (
    <View>
      <View className="flex-row-reverse items-center gap-2 px-1 mb-3">
        <ListChecks color={accent} size={22} />
        <Text className="text-lg font-bold" style={{ color: text }}>
          المهام اليومية
        </Text>
      </View>

      <View
        className="rounded-3xl p-5 border"
        style={{ backgroundColor: card, borderColor: border }}
      >
        {dailyTasks.map((task: Task, index: number) => {
          const TaskIcon = taskIcons[task.type];
          const isLast = index === dailyTasks.length - 1;
          const progress = Math.min(
            100,
            Math.floor((task.progress / task.target) * 100)
          );
          const done = task.completed || task.progress >= task.target;
          const remainingDays = getRemainingDays(task.expiresAt, getTodayKey());

          return (
            <View
              key={task.id}
              className={`py-3 ${isLast ? '' : 'border-b'}`}
              style={isLast ? undefined : { borderBottomColor: border }}
            >
              <View className="flex-row-reverse items-center justify-between gap-3">
                <View
                  style={{ backgroundColor: `${accent}20` }}
                  className="w-10 h-10 rounded-full items-center justify-center"
                >
                  <TaskIcon color={accent} size={20} />
                </View>

                <View className="flex-1">
                  <Text
                    className="text-sm font-bold text-right"
                    style={{ color: text }}
                  >
                    {task.title}
                  </Text>
                  <View className="flex-row-reverse items-center justify-end gap-1.5 mt-1">
                    <Text
                      className="text-xs text-right"
                      style={{ color: subText }}
                    >
                      {task.target.toLocaleString('en-US')} {task.unit}
                    </Text>
                    <View
                      style={{
                        backgroundColor: `${accent}20`,
                        borderColor: `${accent}40`,
                      }}
                      className="px-1.5 py-0.5 rounded-full border"
                    >
                      <Text
                        style={{ color: accent }}
                        className="text-[10px] font-bold"
                      >
                        {getTaskTimeframe(task.days)}
                      </Text>
                    </View>
                  </View>
                  {task.days > 1 && (
                    <Text
                      className="text-[10px] text-right mt-1"
                      style={{ color: subText }}
                    >
                      {remainingDays === 1
                        ? 'ينتهي اليوم'
                        : `ينتهي بعد ${remainingDays} أيام`}
                    </Text>
                  )}
                </View>

                {/* حالة الإكمال: تظهر تلقائياً عند الوصول إلى الهدف */}
                <View
                  style={{
                    borderColor: done ? accent : `${accent}66`,
                  }}
                  className={`w-9 h-9 rounded-full items-center justify-center border-2 ${
                    done ? '' : 'opacity-70'
                  }`}
                >
                  {done ? (
                    <CheckCircle2 color={accent} size={22} />
                  ) : (
                    <Circle color={`${accent}66`} size={20} />
                  )}
                </View>
              </View>

              {/* شريط التقدم */}
              <View className="mt-3">
                <View
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: border }}
                >
                  <View
                    style={{
                      width: `${progress}%`,
                      backgroundColor: accent,
                    }}
                    className="h-full rounded-full"
                  />
                </View>
              </View>

              {/* المكافأة ونسبة التقدم */}
              <View className="flex-row-reverse items-center justify-between mt-2.5">
                <View className="flex-row-reverse items-center gap-1">
                  <Coins color={accent} size={13} />
                  <Text style={{ color: accent }} className="text-xs font-bold">
                    +{task.coins} عملة
                  </Text>
                </View>
                <Text
                  className="text-[11px] font-bold"
                  style={{ color: subText }}
                >
                  {done ? 'اكتمل!' : `${progress}%`}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
});
