export interface UserLevel {
  level: number;
  title: string;
  minSteps: number;
  maxSteps: number | null;
}

export const userLevels: UserLevel[] = [
  { level: 1, title: 'خُطوة بداية', minSteps: 0, maxSteps: 10000 },
  { level: 2, title: 'ماشي مبتدئ', minSteps: 10001, maxSteps: 50000 },
  { level: 3, title: 'عابر المسافات', minSteps: 50001, maxSteps: 150000 },
  { level: 4, title: 'عدّاء خُطى', minSteps: 150001, maxSteps: 300000 },
  { level: 5, title: 'خطى ذهبية', minSteps: 300001, maxSteps: 500000 },
  { level: 6, title: 'محرك الأجواء', minSteps: 500001, maxSteps: 1000000 },
  { level: 7, title: 'أسطورة المشي', minSteps: 1000001, maxSteps: null },
];

export const getUserLevel = (totalSteps: number): UserLevel => {
  for (const level of userLevels) {
    if (totalSteps >= level.minSteps && (level.maxSteps === null || totalSteps <= level.maxSteps)) {
      return level;
    }
  }
  return userLevels[userLevels.length - 1];
};