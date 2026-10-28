import { generateDailyTasks, type Task } from './taskGenerator';
export function shiftDate(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function refreshTasksForToday(
  existingTasks: Task[],
  today: string,
  userLevel: number
): Task[] {
  const keptTasks = existingTasks.filter((task) => {
    if (task.completed) return false;
    return task.expiresAt >= today;
  });

  const needed = Math.max(0, 3 - keptTasks.length);

  if (needed === 0) {
    return keptTasks;
  }

  let replacements: Task[] = [];
  let attempts = 0;
  while (replacements.length < needed) {
    const generated = generateDailyTasks(userLevel, `${today}:${attempts}`);
    for (const g of generated) {
      if (replacements.length >= needed) break;
      if (
        !keptTasks.some((k) => k.id === g.id) &&
        !replacements.some((r) => r.id === g.id)
      ) {
        replacements.push(g);
      }
    }
    attempts++;
  }

  return [...keptTasks, ...replacements];
}
