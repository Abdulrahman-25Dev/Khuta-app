export const STEP_LENGTH_FACTORS = {
  male: 0.415,
  female: 0.413,
} as const;

export type Gender = keyof typeof STEP_LENGTH_FACTORS;

export function calculateStepLengthMeters(
  heightCm: number,
  gender: Gender = 'male'
): number {
  return (heightCm * STEP_LENGTH_FACTORS[gender]) / 100;
}

export function calculateDistanceKm(
  steps: number,
  stepLengthMeters: number
): number {
  return Math.round(((steps * stepLengthMeters) / 1000) * 100) / 100;
}

export function calculateCalories(steps: number, weightKg: number): number {
  return Math.round(steps * weightKg * 0.0005);
}
