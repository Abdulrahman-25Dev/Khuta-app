import React, { useEffect } from 'react';
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

import { useAppStore, colorPalettes } from '../../store/useAppStore';
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

const isTaskComplete = (task: Task, current: number) =>
  task.completed || current >= task.target;

export default function DailyTasksList({
  currentSteps = 0,
  currentDistanceKm = 0,
  currentCalories = 0,
  currentMinutes = 0,
}: DailyTasksListProps) {
  const { accentColor, dailyTasks, completeTask } = useAppStore();
  const currentPalette = colorPalettes[accentColor] ?? colorPalettes.sunset;
  const metrics: DailyTasksListProps = {
    currentSteps,
    currentDistanceKm,
    currentCalories,
    currentMinutes,
  };

  // إكمال تلقائي: تُمنح المهمة فور بلوغ قيمتها الحالية الهدف، بلا أي تفاعل يدوي
  useEffect(() => {
    dailyTasks.forEach((task) => {
      if (!task.completed && getCurrentValue(task, metrics) >= task.target) {
        completeTask(task.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyTasks, currentSteps, currentDistanceKm, currentCalories, currentMinutes]);

  return (
    <View className="bg-appCard-light dark:bg-appCard-dark rounded-3xl p-5 border border-appBorder-light dark:border-appBorder-dark">
      <View className="flex-row-reverse items-center gap-2 mb-2">
        <ListChecks color={currentPalette.primary} size={22} />
        <Text className="text-lg font-bold text-appText-light dark:text-appText-dark">
          مهام اليوم
        </Text>
      </View>

      {dailyTasks.map((task: Task, index: number) => {
        const TaskIcon = taskIcons[task.type];
        const isLast = index === dailyTasks.length - 1;
        const current = getCurrentValue(task, metrics);
        const done = isTaskComplete(task, current);
        const progress = done
          ? 100
          : Math.min(100, Math.max(0, Math.round((current / task.target) * 100)));

        return (
          <View
            key={task.id}
            className={`py-3 ${isLast ? '' : 'border-b border-appBorder-light dark:border-appBorder-dark'}`}
          >
            <View className="flex-row-reverse items-center justify-between gap-3">
              <View
                style={{ backgroundColor: `${currentPalette.primary}20` }}
                className="w-10 h-10 rounded-full items-center justify-center"
              >
                <TaskIcon color={currentPalette.secondary} size={20} />
              </View>

              <View className="flex-1">
                <Text className="text-appText-light dark:text-appText-dark text-sm font-bold text-right">
                  {task.title}
                </Text>
                <View className="flex-row-reverse items-center justify-end gap-1.5 mt-1">
                  <Text className="text-appSubText-light dark:text-appSubText-dark text-xs text-right">
                    {task.target.toLocaleString('en-US')} {task.unit}
                  </Text>
                  <View
                    style={{
                      backgroundColor: `${currentPalette.primary}20`,
                      borderColor: `${currentPalette.primary}40`,
                    }}
                    className="px-1.5 py-0.5 rounded-full border"
                  >
                    <Text style={{ color: currentPalette.primary }} className="text-[10px] font-bold">
                      {getTaskTimeframe(task.days)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* حالة الإكمال: تظهر تلقائياً عند الوصول إلى الهدف */}
              <View
                style={{
                  borderColor: done ? currentPalette.primary : currentPalette.secondary,
                }}
                className={`w-9 h-9 rounded-full items-center justify-center border-2 ${
                  done ? '' : 'opacity-70'
                }`}
              >
                {done ? (
                  <CheckCircle2 color={currentPalette.primary} size={22} />
                ) : (
                  <Circle color={currentPalette.secondary} size={20} />
                )}
              </View>
            </View>

            {/* شريط التقدم */}
            <View className="mt-3" style={{ direction: 'rtl' }}>
              <View className="h-1.5 rounded-full bg-appBorder-light dark:bg-appBorder-dark overflow-hidden">
                <View
                  style={{ width: `${progress}%`, backgroundColor: currentPalette.primary }}
                  className="h-full rounded-full"
                />
              </View>
            </View>

            {/* المكافأة ونسبة التقدم */}
            <View className="flex-row-reverse items-center justify-between mt-2.5">
              <View className="flex-row-reverse items-center gap-1">
                <Coins color={currentPalette.primary} size={13} />
                <Text style={{ color: currentPalette.primary }} className="text-xs font-bold">
                  +{task.coins}
                </Text>
              </View>
              <Text className="text-appSubText-light dark:text-appSubText-dark text-[11px] font-bold">
                {done ? 'اكتمل!' : `${progress}%`}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}