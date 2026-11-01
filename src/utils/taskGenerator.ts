import { i18n } from '../i18n/i18next';

export type TaskType = 'steps' | 'distance' | 'calories' | 'duration';

export interface Task {
  id: string;
  type: TaskType;
  title: string;
  titleKey: string;
  target: number;
  unit: string;
  unitKey: string;
  coins: number;
  completed: boolean;
  days: number;
  startDate: string;
  expiresAt: string;
  progress: number;
  dailyProgress: Record<string, number>;
}

export type TaskTimeframeKey =
  | 'tasks.today'
  | 'tasks.withinTwoDays'
  | 'tasks.withinDays';

export function getTaskTimeframeKey(
  days: number
): TaskTimeframeKey {
  const safeDays = Math.max(1, Math.floor(days || 1));
  if (safeDays === 1) return 'tasks.today';
  if (safeDays === 2) return 'tasks.withinTwoDays';
  return 'tasks.withinDays';
}

export function getTaskTimeframe(days: number): string {
  const safeDays = Math.max(1, Math.floor(days || 1));
  return i18n.t(getTaskTimeframeKey(safeDays), { count: safeDays });
}

interface TaskTemplate {
  type: TaskType;
  min: number;
  max: number;
  unitKey: string;
  titleKeys: string[];
}

const TASK_TEMPLATES: TaskTemplate[] = [
  {
    type: 'steps',
    min: 3000,
    max: 12000,
    unitKey: 'tasks.types.steps.unit',
    titleKeys: ['tasks.types.steps.title_0', 'tasks.types.steps.title_1'],
  },
  {
    type: 'distance',
    min: 2,
    max: 8,
    unitKey: 'tasks.types.distance.unit',
    titleKeys: ['tasks.types.distance.title_0', 'tasks.types.distance.title_1'],
  },
  {
    type: 'calories',
    min: 150,
    max: 500,
    unitKey: 'tasks.types.calories.unit',
    titleKeys: ['tasks.types.calories.title_0', 'tasks.types.calories.title_1'],
  },
  {
    type: 'duration',
    min: 20,
    max: 60,
    unitKey: 'tasks.types.duration.unit',
    titleKeys: ['tasks.types.duration.title_0', 'tasks.types.duration.title_1'],
  },
];

// حدود الإطار الزمني لكل نوع: targets below dailyMax → "اليوم"،
// up to twoDayMax → "خلال يومين"، وفوق ذلك → "خلال 3 أيام"
const TASK_THRESHOLDS: Record<
  TaskType,
  { dailyMax: number; twoDayMax: number }
> = {
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

function createTask(
  template: TaskTemplate,
  userLevel: number,
  dateString: string,
  rng: () => number
): Task {
  const level = Math.max(1, Math.floor(userLevel));
  const factor = 1 + levelFactor(level) * 0.12;
  const raw = randInt(rng, template.min, template.max);
  const target = Math.max(template.min, Math.round(raw * factor));
  const titleIndex = randInt(rng, 0, template.titleKeys.length - 1);
  const titleKey = template.titleKeys[titleIndex];
  const days = getTaskDays(template.type, target);
  const startDate = dateString.slice(0, 10);

  return {
    id: `${dateString}:${template.type}`,
    type: template.type,
    title: i18n.t(titleKey),
    titleKey,
    target,
    unit: i18n.t(template.unitKey),
    unitKey: template.unitKey,
    coins: getTaskCoins(template.type, target),
    completed: false,
    days,
    startDate,
    expiresAt: shiftDateKey(startDate, days - 1),
    progress: 0,
    dailyProgress: {},
  };
}

function shiftDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  const shiftedYear = date.getUTCFullYear();
  const shiftedMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
  const shiftedDay = String(date.getUTCDate()).padStart(2, '0');
  return `${shiftedYear}-${shiftedMonth}-${shiftedDay}`;
}

// مضاعِف الصعوبة: يرتفع مع مستوى المستخدم
const levelFactor = (level: number) => Math.max(1, Math.floor(level)) - 1;

export function generateDailyTasks(
  userLevel: number,
  dateString: string
): Task[] {
  const level = Math.max(1, Math.floor(userLevel));
  const rng = mulberry32(hashSeed(`${dateString}:khuta-daily-tasks`));

  const shuffled = [...TASK_TEMPLATES].sort(() => rng() - 0.5);
  const chosen = shuffled
    .slice(0, 3)
    .sort((a, b) => a.type.localeCompare(b.type));

  return chosen.map((template) => createTask(template, level, dateString, rng));
}
