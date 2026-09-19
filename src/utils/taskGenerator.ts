export type TaskType = 'steps' | 'distance' | 'calories' | 'duration';

export interface Task {
  id: string;
  type: TaskType;
  title: string;
  target: number;
  unit: string;
  coins: number;
  completed: boolean;
  days: number;
}

export function getTaskTimeframe(days: number): string {
  const safeDays = Math.max(1, Math.floor(days || 1));
  switch (safeDays) {
    case 1:
      return 'اليوم';
    case 2:
      return 'خلال يومين';
    default:
      return `خلال ${safeDays} أيام`;
  }
}

interface TaskTemplate {
  type: TaskType;
  min: number;
  max: number;
  unit: string;
  titles: string[];
}

const TASK_TEMPLATES: TaskTemplate[] = [
  {
    type: 'steps',
    min: 3000,
    max: 12000,
    unit: 'خطوة',
    titles: ['تحدي الخطوات', 'خطوات اليوم'],
  },
  {
    type: 'distance',
    min: 2,
    max: 8,
    unit: 'كم',
    titles: ['تحدي المسافة', 'مسافة المشي'],
  },
  {
    type: 'calories',
    min: 150,
    max: 500,
    unit: 'سعرة',
    titles: ['تحدي السعرات', 'حارق السعرات'],
  },
  {
    type: 'duration',
    min: 20,
    max: 60,
    unit: 'دقيقة',
    titles: ['وقت النشاط', 'حركية الجلسة'],
  },
];

// حدود الإطار الزمني لكل نوع: targets below dailyMax → "اليوم"،
// up to twoDayMax → "خلال يومين"، وفوق ذلك → "خلال 3 أيام"
const TASK_THRESHOLDS: Record<TaskType, { dailyMax: number; twoDayMax: number }> = {
  steps: { dailyMax: 8000, twoDayMax: 12000 },
  distance: { dailyMax: 3, twoDayMax: 5 },
  calories: { dailyMax: 300, twoDayMax: 450 },
  duration: { dailyMax: 30, twoDayMax: 45 },
};

export const getTaskDays = (type: TaskType, target: number): number => {
  const { dailyMax, twoDayMax } = TASK_THRESHOLDS[type];
  if (target <= dailyMax) return 1;
  if (target <= twoDayMax) return 2;
  return 3;
};

// مكافآت ثابتة بمبالغ نظيفة حسب صعوبة المهمة:
// يوم واحد → 10 عملات، يومان → 25 أو 50، 3 أيام فأكثر → 100
export const getTaskCoins = (type: TaskType, target: number): number => {
  const days = getTaskDays(type, target);
  if (days >= 3) return 100;
  if (days === 2) {
    const { dailyMax, twoDayMax } = TASK_THRESHOLDS[type];
    const midpoint = (dailyMax + twoDayMax) / 2;
    return target <= midpoint ? 25 : 50;
  }
  return 10;
};

// بذرة حتمية من التاريخ حتى تبقى المهام متطابقة طوال اليوم
const hashSeed = (str: string): number => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const randInt = (rng: () => number, min: number, max: number) =>
  min + Math.floor(rng() * (max - min + 1));

// مضاعِف الصعوبة: يرتفع مع مستوى المستخدم
const levelFactor = (level: number) => Math.max(1, Math.floor(level)) - 1;

export function generateDailyTasks(userLevel: number, dateString: string): Task[] {
  const level = Math.max(1, Math.floor(userLevel));
  const factor = 1 + levelFactor(level) * 0.12;
  const rng = mulberry32(hashSeed(`${dateString}:khuta-daily-tasks`));

  const shuffled = [...TASK_TEMPLATES].sort(() => rng() - 0.5);
  const chosen = shuffled
    .slice(0, 3)
    .sort((a, b) => a.type.localeCompare(b.type));

  return chosen.map((template) => {
    const raw = randInt(rng, template.min, template.max);
    const target = Math.max(template.min, Math.round(raw * factor));
    const title = template.titles[randInt(rng, 0, template.titles.length - 1)];
    const days = getTaskDays(template.type, target);

    return {
      id: `${dateString}:${template.type}`,
      type: template.type,
      title,
      target,
      unit: template.unit,
      coins: getTaskCoins(template.type, target),
      completed: false,
      days,
    };
  });
}